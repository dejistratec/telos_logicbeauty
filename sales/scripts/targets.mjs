#!/usr/bin/env node
// sales/scripts/targets.mjs — 営業代行クライアントごとの営業先リスト (sales/clients/<slug>/list/targets.csv) 操作ツール。依存なし。
//
//   node sales/scripts/targets.mjs --help
//
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SALES_DIR = path.resolve(HERE, '..');
const REPO_DIR = path.resolve(SALES_DIR, '..');
const CLIENTS_DIR = path.join(SALES_DIR, 'clients');
const ACTIVE_FILE = path.join(CLIENTS_DIR, 'ACTIVE');
const CLIENT_TEMPLATE_DIR = path.join(SALES_DIR, '_templates', 'client');

const COLUMNS = [
  'id', '登録日', 'プラットフォーム', 'ソースURL', '企業名', '業種', '所在地', '規模',
  'WebサイトURL', 'Instagram', 'LINE公式', 'その他SNS', 'ニーズ要約', '推奨サービス',
  '属性タグ', 'ICPスコア', 'ランク', '接触チャネル', 'ステータス', '次アクション', '期限',
  '調査メモ', '提案文', '備考',
];
const REQUIRED = ['企業名', 'プラットフォーム', 'ニーズ要約', '推奨サービス', '接触チャネル', 'ステータス'];
const MULTI = { '推奨サービス': '|', '属性タグ': '|', 'Instagram': '|', 'その他SNS': '|' };
const COMMON_ALLOWED = {
  'プラットフォーム': ['発注なび', 'ランサーズ', 'クラウドワークス', 'その他クラウドソーシング', 'Web', 'Instagram', 'X', '紹介', '展示会・イベント', 'その他'],
  'ランク': ['A', 'B', 'C', '除外', ''],
  'LINE公式': ['あり', 'なし', '不明', ''],
  '規模': ['個人', '小規模(〜10名)', '中小(〜30名)', '中堅(31〜300名)', '大手(301名〜)', '不明', ''],
  '接触チャネル': ['プラットフォーム応募', 'メール', '問い合わせフォーム', 'Instagram DM', 'LINE', '紹介', '電話', '未定'],
  'ステータス': ['未着手', '調査中', '提案作成済', '送付済', '返信あり', '商談中', '受注', '失注', '保留', '除外'],
};
const PLATFORM_ONLY = new Set(['発注なび', 'ランサーズ', 'クラウドワークス', 'その他クラウドソーシング']);

// ---------- CSV ----------
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQ = false; }
      } else field += c;
      continue;
    }
    if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function csvField(v) {
  v = v == null ? '' : String(v);
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function toCSV(header, records, eol = '\n') {
  const lines = [header.map(csvField).join(',')];
  for (const r of records) lines.push(header.map((h) => csvField(r[h])).join(','));
  return lines.join(eol) + eol;
}

// ---------- client ----------
function fail(msg) { console.error(`エラー: ${msg}`); process.exit(1); }
function today() { return new Date().toISOString().slice(0, 10); }
function rel(p) { return path.relative(process.cwd(), p) || '.'; }

function listClientSlugs() {
  if (!fs.existsSync(CLIENTS_DIR)) return [];
  return fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name).sort();
}
function activeSlug() {
  return fs.existsSync(ACTIVE_FILE) ? fs.readFileSync(ACTIVE_FILE, 'utf8').trim() : '';
}
function readConfig(dir) {
  const p = path.join(dir, 'config.json');
  if (!fs.existsSync(p)) return { name: path.basename(dir), services: [], industries: [] };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`${rel(p)} を読めません: ${e.message}`); }
}
function resolveClient(explicit) {
  const slug = explicit || process.env.SALES_CLIENT || activeSlug();
  const available = listClientSlugs();
  if (!slug) fail(`対象クライアントが未指定です。--client <slug> を付けるか、use <slug> で既定を設定してください。登録済み: ${available.join(', ') || '（なし。init <slug> --name "名称" で作成）'}`);
  const dir = path.join(CLIENTS_DIR, slug);
  if (!fs.existsSync(dir)) fail(`クライアント「${slug}」がありません。登録済み: ${available.join(', ') || '（なし）'}`);
  const config = readConfig(dir);
  return {
    slug, dir, config,
    csvPath: path.join(dir, 'list', 'targets.csv'),
    exportPath: path.join(dir, 'list', 'targets.export.csv'),
  };
}
function allowedFor(client) {
  const a = { ...COMMON_ALLOWED };
  const services = (client.config.services ?? []).map((s) => (typeof s === 'string' ? s : s.id)).filter(Boolean);
  a['推奨サービス'] = services; // 空なら未設定扱い
  const industries = client.config.industries ?? [];
  if (industries.length) a['業種'] = [...industries, ''];
  return a;
}

// ---------- load / save ----------
function load(client) {
  if (!fs.existsSync(client.csvPath)) fail(`見つかりません: ${rel(client.csvPath)}（init で作成されます）`);
  const rows = parseCSV(fs.readFileSync(client.csvPath, 'utf8'));
  const header = rows[0] ?? [];
  const records = rows.slice(1)
    .filter((r) => r.some((x) => x !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
  return { header, records };
}
function save(client, header, records) {
  fs.writeFileSync(client.csvPath, toCSV(header, records), 'utf8');
}
function nextId(records) {
  let max = 0;
  for (const r of records) {
    const m = /^T-(\d+)$/.exec(r.id ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `T-${String(max + 1).padStart(4, '0')}`;
}

// ---------- validate ----------
function validateRecord(client, r, idx) {
  const errs = [];
  const allowed = allowedFor(client);
  const where = `${r.id || `行${idx + 2}`}（${r['企業名'] || '企業名なし'}）`;
  for (const k of REQUIRED) if (!String(r[k] ?? '').trim()) errs.push(`${where}: 必須列「${k}」が空`);
  for (const [k, list] of Object.entries(allowed)) {
    const raw = String(r[k] ?? '');
    const values = MULTI[k] ? raw.split(MULTI[k]).map((s) => s.trim()).filter(Boolean) : [raw.trim()];
    if (k === '推奨サービス' && !list.length && values.length) {
      errs.push(`${where}: クライアント「${client.slug}」の config.json に services が未定義です。/sales-setup で設定してください`);
      continue;
    }
    for (const v of values) if (!list.includes(v)) errs.push(`${where}: 「${k}」の値「${v}」は未定義（許可: ${list.filter(Boolean).join(' / ')}）`);
  }
  const score = String(r['ICPスコア'] ?? '').trim();
  if (score && !(/^\d+$/.test(score) && Number(score) <= 100)) errs.push(`${where}: ICPスコアは 0〜100 の整数`);
  for (const k of ['登録日', '期限']) {
    const v = String(r[k] ?? '').trim();
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errs.push(`${where}: 「${k}」は YYYY-MM-DD 形式`);
  }
  if (PLATFORM_ONLY.has(r['プラットフォーム']) && r['接触チャネル'] && r['接触チャネル'] !== 'プラットフォーム応募') {
    errs.push(`${where}: プラットフォーム「${r['プラットフォーム']}」経由の案件は接触チャネルを「プラットフォーム応募」にする（規約上の直接取引禁止）。意図的な場合は備考に理由を書く`);
  }
  for (const k of ['調査メモ', '提案文']) {
    const v = String(r[k] ?? '').trim();
    if (v && !fs.existsSync(path.resolve(REPO_DIR, v))) errs.push(`${where}: 「${k}」のファイルが存在しない: ${v}`);
  }
  return errs;
}
function normalizeName(s) {
  return String(s ?? '').replace(/\s+/g, '').replace(/株式会社|有限会社|合同会社|\(株\)|（株）|\(有\)|（有）/g, '').toLowerCase();
}
function normalizeUrl(s) {
  return String(s ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}
function findDuplicates(records) {
  const dups = [];
  const byName = new Map(), byUrl = new Map(), byId = new Map();
  for (const r of records) {
    const id = r.id?.trim();
    if (id) { if (byId.has(id)) dups.push(`id 重複: ${id}`); byId.set(id, r); }
    const name = normalizeName(r['企業名']);
    if (name && !name.startsWith('（特定不能）')) {
      if (byName.has(name)) dups.push(`企業名 重複: ${r['企業名']}（${byName.get(name).id} と ${r.id}）`);
      byName.set(name, r);
    }
    const url = normalizeUrl(r['WebサイトURL']);
    if (url) {
      if (byUrl.has(url)) dups.push(`WebサイトURL 重複: ${url}（${byUrl.get(url).id} と ${r.id}）`);
      byUrl.set(url, r);
    }
  }
  return dups;
}

// ---------- output ----------
function printTable(cols, rows) {
  const width = (s) => [...String(s)].reduce((n, ch) => n + (/[^\x00-\x7F]/.test(ch) ? 2 : 1), 0);
  const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - width(s)));
  const widths = cols.map((c, i) => Math.max(width(c), ...rows.map((r) => width(r[i] ?? ''))));
  console.log(cols.map((c, i) => pad(c, widths[i])).join('  '));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) console.log(cols.map((_, i) => pad(r[i] ?? '', widths[i])).join('  '));
}

// ---------- client commands ----------
function copyTemplate(src, dst, vars) {
  let text = fs.readFileSync(src, 'utf8');
  for (const [k, v] of Object.entries(vars)) text = text.split(`{{${k}}}`).join(v);
  fs.writeFileSync(dst, text, 'utf8');
}
const clientCmds = {
  clients() {
    const active = activeSlug();
    const slugs = listClientSlugs();
    if (!slugs.length) { console.log('クライアントは未登録です。init <slug> --name "名称" で作成してください。'); return; }
    const rows = slugs.map((slug) => {
      const dir = path.join(CLIENTS_DIR, slug);
      const cfg = readConfig(dir);
      const csv = path.join(dir, 'list', 'targets.csv');
      const n = fs.existsSync(csv) ? Math.max(0, parseCSV(fs.readFileSync(csv, 'utf8')).filter((r) => r.some((x) => x !== '')).length - 1) : 0;
      const services = (cfg.services ?? []).map((s) => (typeof s === 'string' ? s : s.id)).join('|') || '（未設定）';
      return [slug === active ? '*' : '', slug, cfg.name ?? '', services, String(n)];
    });
    printTable(['', 'slug', '名称', 'サービス id', '営業先数'], rows);
    console.log(active ? `\n* = 既定（sales/clients/ACTIVE）` : '\n既定クライアントは未設定です。use <slug> で設定してください。');
  },
  use(args) {
    const [slug] = args;
    if (!slug) fail('使い方: use <slug>');
    if (!fs.existsSync(path.join(CLIENTS_DIR, slug))) fail(`クライアント「${slug}」がありません。登録済み: ${listClientSlugs().join(', ') || '（なし）'}`);
    fs.writeFileSync(ACTIVE_FILE, slug + '\n', 'utf8');
    console.log(`既定クライアントを「${slug}」にしました（${rel(ACTIVE_FILE)}）`);
  },
  init(args) {
    const slug = args.find((a) => !a.startsWith('--'));
    const nameIdx = args.indexOf('--name');
    const name = nameIdx >= 0 ? args[nameIdx + 1] : slug;
    if (!slug) fail('使い方: init <slug> --name "クライアント名" [--use]');
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail('slug は英小文字・数字・ハイフンのみ（例: acme-inc）');
    const dir = path.join(CLIENTS_DIR, slug);
    if (fs.existsSync(dir)) fail(`既に存在します: ${rel(dir)}`);
    for (const d of ['intake', 'research', 'proposals', 'list']) fs.mkdirSync(path.join(dir, d), { recursive: true });
    for (const d of ['intake', 'research', 'proposals']) fs.writeFileSync(path.join(dir, d, '.gitkeep'), '');
    const vars = { CLIENT_NAME: name, CLIENT_SLUG: slug, TODAY: today() };
    for (const f of fs.readdirSync(CLIENT_TEMPLATE_DIR)) copyTemplate(path.join(CLIENT_TEMPLATE_DIR, f), path.join(dir, f), vars);
    fs.writeFileSync(path.join(dir, 'list', 'targets.csv'), COLUMNS.join(',') + '\n', 'utf8');
    console.log(`作成: ${rel(dir)}/`);
    for (const f of fs.readdirSync(dir)) console.log(`  - ${f}`);
    if (args.includes('--use') || !activeSlug()) { fs.writeFileSync(ACTIVE_FILE, slug + '\n', 'utf8'); console.log(`既定クライアントを「${slug}」にしました`); }
    console.log(`\n次: /sales-setup ${slug} <クライアントのサイト URL や資料> で offering.md / icp.md / config.json / outreach.md を埋めてください。`);
  },
};

// ---------- list commands (client-scoped) ----------
const cmds = {
  'next-id'(client) {
    const { records } = load(client);
    console.log(nextId(records));
  },

  add(client, args) {
    const force = args.includes('--force');
    const src = args.find((a) => !a.startsWith('--'));
    if (!src) fail('使い方: add <json ファイル | -> [--force]   ※ - は標準入力');
    const text = src === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(src, 'utf8');
    let input;
    try { input = JSON.parse(text); } catch (e) { fail(`JSON を読めません: ${e.message}`); }
    const items = Array.isArray(input) ? input : [input];
    const { header, records } = load(client);
    const added = [];
    for (const item of items) {
      const r = {};
      for (const h of header) r[h] = item[h] ?? '';
      const unknown = Object.keys(item).filter((k) => !header.includes(k));
      if (unknown.length) console.error(`注意: 未定義の列を無視しました: ${unknown.join(', ')}`);
      for (const [k, sep] of Object.entries(MULTI)) if (Array.isArray(item[k])) r[k] = item[k].join(sep);
      if (typeof item['ICPスコア'] === 'number') r['ICPスコア'] = String(Math.round(item['ICPスコア']));
      if (!r.id) r.id = nextId([...records, ...added]);
      if (!r['登録日']) r['登録日'] = today();
      if (!r['ステータス']) r['ステータス'] = '未着手';
      if (!r['接触チャネル']) r['接触チャネル'] = PLATFORM_ONLY.has(r['プラットフォーム']) ? 'プラットフォーム応募' : '未定';

      const errs = validateRecord(client, r, records.length + added.length);
      if (errs.length) { errs.forEach((e) => console.error(e)); if (!force) fail('検証エラーのため追加しません（--force で強制）'); }
      const dup = findDuplicates([...records, ...added, r]);
      if (dup.length) { dup.forEach((d) => console.error(`重複: ${d}`)); if (!force) fail('重複のため追加しません（--force で強制）'); }
      added.push(r);
    }
    save(client, header, [...records, ...added]);
    for (const r of added) console.log(`追加 [${client.slug}]: ${r.id}  ${r['企業名']}  [${r['プラットフォーム']} / ${r['推奨サービス']} / ${r['ランク'] || '-'}]`);
  },

  update(client, args) {
    const [id, ...pairs] = args.filter((a) => a !== '--force');
    if (!id || !pairs.length) fail('使い方: update <id> 列名=値 [列名=値 ...]');
    const { header, records } = load(client);
    const r = records.find((x) => x.id === id);
    if (!r) fail(`id が見つかりません: ${id}（クライアント: ${client.slug}）`);
    for (const p of pairs) {
      const eq = p.indexOf('=');
      if (eq < 0) fail(`形式が不正: ${p}（列名=値）`);
      const k = p.slice(0, eq), v = p.slice(eq + 1);
      if (!header.includes(k)) fail(`未定義の列: ${k}`);
      r[k] = v;
    }
    const errs = validateRecord(client, r, records.indexOf(r));
    if (errs.length && !args.includes('--force')) { errs.forEach((e) => console.error(e)); fail('検証エラーのため更新しません（--force で強制）'); }
    save(client, header, records);
    console.log(`更新 [${client.slug}]: ${id}  ${pairs.join('  ')}`);
  },

  get(client, args) {
    const [id] = args;
    const { records } = load(client);
    const r = records.find((x) => x.id === id);
    if (!r) fail(`id が見つかりません: ${id}（クライアント: ${client.slug}）`);
    console.log(JSON.stringify(r, null, 2));
  },

  list(client, args) {
    const { records } = load(client);
    const filters = args.filter((a) => a.includes('=')).map((a) => { const i = a.indexOf('='); return [a.slice(0, i), a.slice(i + 1)]; });
    const rows = records.filter((r) => filters.every(([k, v]) => String(r[k] ?? '').split('|').map((s) => s.trim()).includes(v) || r[k] === v));
    const cols = ['id', 'ランク', 'ICPスコア', 'ステータス', 'プラットフォーム', '推奨サービス', '企業名', '次アクション', '期限'];
    printTable(cols, rows.map((r) => cols.map((c) => r[c] ?? '')));
    console.log(`${rows.length} 件（クライアント: ${client.slug}）`);
  },

  validate(client) {
    const { header, records } = load(client);
    const errs = [];
    const missing = COLUMNS.filter((c) => !header.includes(c));
    const extra = header.filter((c) => !COLUMNS.includes(c));
    if (missing.length) errs.push(`ヘッダーに無い列: ${missing.join(', ')}`);
    if (extra.length) console.error(`注意: schema.md に無い列があります: ${extra.join(', ')}`);
    if (!(client.config.services ?? []).length) console.error(`注意: ${client.slug}/config.json に services が未設定です（/sales-setup で設定）`);
    records.forEach((r, i) => errs.push(...validateRecord(client, r, i)));
    errs.push(...findDuplicates(records));
    if (errs.length) { errs.forEach((e) => console.error(e)); fail(`${errs.length} 件の問題`); }
    console.log(`OK [${client.slug}]: ${records.length} 件、問題なし`);
  },

  stats(client) {
    const { records } = load(client);
    console.log(`# ${client.config.name ?? client.slug} 営業先リスト 集計（${records.length} 件 / ${today()}）`);
    if (!records.length) { console.log('まだ 0 件です。/sales-intake か /sales-prospect で追加してください。'); return; }
    const count = (key, split) => {
      const m = new Map();
      for (const r of records) {
        const raw = String(r[key] ?? '').trim() || '（未設定）';
        const vals = split ? raw.split(split).map((s) => s.trim()).filter(Boolean) : [raw];
        for (const v of vals) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const section = (title, entries) => {
      console.log(`\n## ${title}`);
      printTable(['値', '件数'], entries.map(([k, v]) => [k, String(v)]));
    };
    section('プラットフォーム別', count('プラットフォーム'));
    section('推奨サービス別（複数カウント）', count('推奨サービス', '|'));
    section('ランク別', count('ランク'));
    section('ステータス別', count('ステータス'));
    section('業種別', count('業種'));
    section('属性タグ 上位（複数カウント）', count('属性タグ', '|').slice(0, 15));

    const platforms = count('プラットフォーム').map(([k]) => k);
    const configured = allowedFor(client)['推奨サービス'];
    const services = configured.length ? configured : count('推奨サービス', '|').map(([k]) => k);
    const matrix = platforms.map((p) => [p, ...services.map((s) => String(records.filter((r) => r['プラットフォーム'] === p && String(r['推奨サービス']).split('|').map((x) => x.trim()).includes(s)).length))]);
    console.log('\n## プラットフォーム × 推奨サービス');
    printTable(['プラットフォーム', ...services], matrix);

    const due = records.filter((r) => r['期限'] && r['期限'] <= today() && !['受注', '失注', '除外'].includes(r['ステータス']));
    if (due.length) {
      console.log('\n## 期限切れ・本日期限の次アクション');
      printTable(['id', '企業名', '次アクション', '期限'], due.map((r) => [r.id, r['企業名'], r['次アクション'], r['期限']]));
    }
  },

  export(client) {
    const { header, records } = load(client);
    fs.writeFileSync(client.exportPath, '﻿' + toCSV(header, records, '\r\n'), 'utf8');
    console.log(`書き出し: ${rel(client.exportPath)}（UTF-8 BOM / CRLF、Excel・Google スプレッドシート取り込み用、${records.length} 件）`);
  },
};

function help() {
  console.log(`営業先リスト操作ツール（クライアント単位: sales/clients/<slug>/list/targets.csv）

  node sales/scripts/targets.mjs [--client <slug>] <コマンド> [引数]

クライアント管理
  clients                          登録済みクライアントの一覧（* が既定）
  init <slug> --name "名称" [--use]  新しいクライアントを _templates/client から作成（slug は英小文字・数字・ハイフン）
  use <slug>                       既定クライアントを設定（sales/clients/ACTIVE）。環境変数 SALES_CLIENT でも上書き可

営業先リスト（既定 or --client のクライアントが対象）
  next-id                          次の id（T-0001 形式）
  add <json ファイル | ->          1 件または配列を追加。id / 登録日 / ステータス / 接触チャネル は未指定なら自動
                                   配列で渡せる列: 推奨サービス, 属性タグ, Instagram, その他SNS（| 区切りに変換）
                                   検証エラー・重複（企業名 / WebサイトURL）は追加しない（--force で強制）
  update <id> 列名=値 ...          既存行を更新（例: update T-0001 ステータス=送付済 次アクション=返信待ち 期限=2026-10-20）
  get <id>                         1 行を JSON で表示
  list [列名=値 ...]               一覧（例: list ランク=A ステータス=未着手 / list 推奨サービス=<id>）
  validate                         必須列・許可値（推奨サービスは config.json の services）・日付・重複・ファイル存在を検証
  stats                            プラットフォーム / サービス / ランク / ステータス / 業種 / タグ 別の集計と期限切れ
  export                           Excel / Google スプレッドシート向け BOM 付き CSV（list/targets.export.csv）

列定義と許可値: sales/_shared/schema.md`);
}

// ---------- main ----------
const argv = process.argv.slice(2);
let explicitClient = '';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--client') { explicitClient = argv[i + 1] ?? ''; argv.splice(i, 2); break; }
  if (argv[i].startsWith('--client=')) { explicitClient = argv[i].slice('--client='.length); argv.splice(i, 1); break; }
}
const [cmd = 'help', ...rest] = argv;
if (cmd === 'help' || cmd === '--help' || cmd === '-h') { help(); process.exit(0); }
if (clientCmds[cmd]) { clientCmds[cmd](rest); process.exit(0); }
if (!cmds[cmd]) { console.error(`不明なコマンド: ${cmd}\n`); help(); process.exit(1); }
cmds[cmd](resolveClient(explicitClient), rest);
