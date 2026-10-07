#!/usr/bin/env node
// After Effects テンプレートのテキスト差し替え → aerender でのレンダリングを一括で行うランナー。
// 依存パッケージなし (Node 18+)。使い方は README.md を参照。
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JSX = path.join(HERE, "ae_replace_text.jsx");
const RESERVED = new Set(["id", "comp", "output"]);

const HELP = `使い方:
  node tools/ae-render/run.mjs --template <file.aep> --data <rows.csv|rows.json> [options]

必須:
  --template <path>     テンプレートの .aep
  --data <path>         差し替えデータ (CSV または JSON)

オプション:
  --comp <name>         レンダリングするコンポ名 (既定: Main)。行ごとに comp 列で上書き可
  --out <dir>           出力先 (既定: ./ae-out)
  --om <name>           aerender の出力モジュールテンプレート名 (例: "H.264 - Match Render Settings - 15 Mbps")
  --rs <name>           aerender のレンダリング設定テンプレート名 (既定: AE 側の既定)
  --ext <ext>           出力ファイルの拡張子 (既定: mov。--om に合わせて変更)
  --parallel <n>        aerender の同時実行数 (既定: 1)
  --ae-version <year>   使う After Effects の年版 (例: 2025)。省略時はインストール済みの最新
  --afterfx <path>      AfterFX.exe (Windows) / AE アプリ (mac) のパスを直接指定
  --aerender <path>     aerender のパスを直接指定
  --timeout <sec>       AE 側の差し替え完了を待つ秒数 (既定: 600)
  --keep-ae-open        差し替え後に AE を終了しない
  --skip-render         .aep の書き出しまでで止める
  --render-only         差し替えを飛ばし、既存の out/projects/*.aep をレンダリングする
  --dry-run             データを読んで job.json を作るだけ (AE を起動しない)
`;

function parseArgs(argv) {
  const flags = new Set(["keep-ae-open", "skip-render", "render-only", "dry-run", "help"]);
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`不明な引数: ${a}`);
    const key = a.slice(2);
    if (flags.has(key)) opts[key] = true;
    else if (i + 1 < argv.length) opts[key] = argv[++i];
    else throw new Error(`${a} に値がありません`);
  }
  return opts;
}

// RFC 4180 程度の CSV パーサ (クォート内のカンマ・改行・"" に対応)
export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((f) => f !== ""));
  if (nonEmpty.length === 0) return [];
  const [header, ...body] = nonEmpty;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

function sanitizeId(s) {
  return String(s).replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^\.+/, "") || "row";
}

// 1 行 = { id, comp?, output?, その他の列 = テキストレイヤー名 } を job 用の形に正規化する。
// JSON の場合は { id, comp?, output?, texts: { レイヤー名: 文字 } } の形も受け付ける。
export function normalizeRows(records) {
  const seen = new Set();
  return records.map((rec, i) => {
    const texts = {};
    if (rec.texts && typeof rec.texts === "object") Object.assign(texts, rec.texts);
    for (const [k, v] of Object.entries(rec)) {
      if (!RESERVED.has(k) && k !== "texts") texts[k] = String(v);
    }
    let id = sanitizeId(rec.output || rec.id || String(i + 1).padStart(3, "0"));
    if (seen.has(id)) throw new Error(`id/output が重複しています: ${id}`);
    seen.add(id);
    const row = { id, texts };
    if (rec.comp) row.comp = rec.comp;
    return row;
  });
}

function loadRows(file) {
  const text = fs.readFileSync(file, "utf8");
  const records = file.toLowerCase().endsWith(".json")
    ? JSON.parse(text.replace(/^\uFEFF/, ""))
    : parseCsv(text);
  if (!Array.isArray(records)) throw new Error("JSON は配列である必要があります");
  return normalizeRows(records);
}

// ---- After Effects / aerender の場所 ----

function aeInstallDirs() {
  const roots = process.platform === "win32"
    ? [path.join(process.env.ProgramFiles || "C:\\Program Files", "Adobe")]
    : ["/Applications"];
  const dirs = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const m = name.match(/^Adobe After Effects (?:CC )?(\d{4})/);
      if (m) dirs.push({ year: m[1], dir: path.join(root, name) });
    }
  }
  return dirs.sort((a, b) => b.year.localeCompare(a.year));
}

function locateAe(opts) {
  const dirs = aeInstallDirs().filter((d) => !opts["ae-version"] || d.year === String(opts["ae-version"]));
  const install = dirs[0];
  const win = process.platform === "win32";
  const afterfx = opts.afterfx
    || (install && (win ? path.join(install.dir, "Support Files", "AfterFX.exe")
                        : path.join(install.dir, `${path.basename(install.dir)}.app`)));
  const aerender = opts.aerender
    || (install && (win ? path.join(install.dir, "Support Files", "aerender.exe")
                        : path.join(install.dir, "aerender")));
  return { afterfx, aerender, appName: install && path.basename(install.dir) };
}

// ---- 実行 ----

function run(cmd, args, { onLine } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let tail = "";
    const feed = (buf) => {
      const s = buf.toString();
      tail = (tail + s).slice(-4000);
      if (onLine) s.split(/\r?\n/).filter(Boolean).forEach(onLine);
    };
    p.stdout.on("data", feed);
    p.stderr.on("data", feed);
    p.on("error", reject);
    p.on("close", (code) => resolve({ code, tail }));
  });
}

function jsString(s) {
  return JSON.stringify(s.replace(/\\/g, "/"));
}

async function runAeScript(jobPath, opts, ae) {
  // ジョブのパスを埋め込んだラッパーを作り、本体の jsx を評価させる
  const wrapper = path.join(path.dirname(jobPath), "run_job.jsx");
  fs.writeFileSync(wrapper,
    `$.global.AE_RENDER_JOB_PATH = ${jsString(jobPath)};\n$.evalFile(new File(${jsString(JSX)}));\n`, "utf8");

  if (process.platform === "win32") {
    if (!ae.afterfx || !fs.existsSync(ae.afterfx)) throw new Error(`AfterFX.exe が見つかりません。--afterfx で指定してください (${ae.afterfx})`);
    // AE が起動済みならスクリプトを渡してすぐ返るので、終了は result.json で判定する
    spawn(ae.afterfx, ["-r", wrapper], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    const app = opts.afterfx ? path.basename(opts.afterfx, ".app") : ae.appName;
    if (!app) throw new Error("After Effects が見つかりません。--afterfx で .app のパスを指定してください");
    const script = `tell application ${JSON.stringify(app)} to DoScriptFile ${JSON.stringify(wrapper)}`;
    spawn("osascript", ["-e", script], { detached: true, stdio: "ignore" }).unref();
  } else {
    throw new Error("After Effects は Windows / macOS でのみ動作します (--dry-run は使えます)");
  }

  const resultPath = path.join(path.dirname(jobPath), "result.json");
  const deadline = Date.now() + Number(opts.timeout || 600) * 1000;
  while (Date.now() < deadline) {
    if (fs.existsSync(resultPath)) {
      await new Promise((r) => setTimeout(r, 500)); // 書き込み完了待ち
      return JSON.parse(fs.readFileSync(resultPath, "utf8"));
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`AE の処理が ${opts.timeout || 600} 秒以内に終わりませんでした。AE 側にダイアログが出ていないか確認してください`);
}

async function renderAll(items, opts, ae) {
  if (!ae.aerender || !fs.existsSync(ae.aerender)) throw new Error(`aerender が見つかりません。--aerender で指定してください (${ae.aerender})`);
  const outDir = path.resolve(opts.out || "ae-out");
  const ext = (opts.ext || "mov").replace(/^\./, "");
  const parallel = Math.max(1, Number(opts.parallel || 1));
  const queue = [...items];
  const results = [];

  async function worker() {
    while (queue.length) {
      const it = queue.shift();
      const output = path.join(outDir, `${it.id}.${ext}`);
      const args = ["-project", it.project, "-comp", it.comp, "-output", output];
      if (opts.rs) args.push("-RStemplate", opts.rs);
      if (opts.om) args.push("-OMtemplate", opts.om);
      console.log(`[render] ${it.id} 開始`);
      const t0 = Date.now();
      const { code, tail } = await run(ae.aerender, args, {
        onLine: (l) => { if (/error/i.test(l)) console.log(`  [${it.id}] ${l}`); },
      });
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      const ok = code === 0 && fs.existsSync(output);
      console.log(`[render] ${it.id} ${ok ? "完了" : "失敗"} (${sec}s)${ok ? ` → ${output}` : ""}`);
      if (!ok) fs.writeFileSync(path.join(outDir, "_job", `${it.id}.render.log`), tail, "utf8");
      results.push({ id: it.id, ok, output: ok ? output : null });
    }
  }
  await Promise.all(Array.from({ length: parallel }, worker));
  return results;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || (!opts.template && !opts["render-only"]) || (!opts.data && !opts["render-only"])) {
    console.log(HELP);
    process.exit(opts.help ? 0 : 1);
  }

  const outDir = path.resolve(opts.out || "ae-out");
  const jobDir = path.join(outDir, "_job");
  const projectDir = path.join(outDir, "projects");
  fs.mkdirSync(jobDir, { recursive: true });
  const ae = locateAe(opts);
  const comp = opts.comp || "Main";

  let toRender;
  if (opts["render-only"]) {
    toRender = fs.readdirSync(projectDir).filter((f) => f.endsWith(".aep"))
      .map((f) => ({ id: path.basename(f, ".aep"), project: path.join(projectDir, f), comp }));
  } else {
    const rows = loadRows(path.resolve(opts.data));
    const job = {
      template: path.resolve(opts.template).replace(/\\/g, "/"),
      comp,
      projectDir: projectDir.replace(/\\/g, "/"),
      quitWhenDone: !opts["keep-ae-open"],
      rows,
    };
    const jobPath = path.join(jobDir, "job.json");
    fs.writeFileSync(jobPath, JSON.stringify(job, null, 2), "utf8");
    fs.rmSync(path.join(jobDir, "result.json"), { force: true });
    console.log(`${rows.length} 行を読み込みました → ${jobPath}`);

    if (opts["dry-run"]) {
      for (const r of rows) console.log(`  ${r.id}: ${r.comp || comp} ${JSON.stringify(r.texts)}`);
      console.log(`AfterFX: ${ae.afterfx ?? "(未検出)"}\naerender: ${ae.aerender ?? "(未検出)"}`);
      return;
    }
    if (!fs.existsSync(job.template)) throw new Error(`テンプレートが見つかりません: ${job.template}`);

    console.log("After Effects でテキストを差し替えています…");
    const result = await runAeScript(jobPath, opts, ae);
    if (!result.done) throw new Error(`AE 側でエラー: ${result.error}`);
    for (const r of result.results) {
      console.log(`[aep] ${r.id} ${r.ok ? "OK" : `失敗: ${r.error}`}`);
      for (const w of r.warnings || []) console.log(`  警告: ${w}`);
    }
    toRender = result.results.filter((r) => r.ok);
  }

  if (opts["skip-render"]) return;
  const rendered = await renderAll(toRender, opts, ae);
  const failed = rendered.filter((r) => !r.ok);
  console.log(`\nレンダリング完了: ${rendered.length - failed.length}/${rendered.length}`);
  if (failed.length) {
    console.log(`失敗: ${failed.map((f) => f.id).join(", ")} (ログ: ${jobDir})`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`エラー: ${e.message}`); process.exit(1); });
}
