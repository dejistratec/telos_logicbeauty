#!/usr/bin/env node
// sales/scripts/targets.mjs — 営業代行クライアントごとの営業先リスト操作ツール（依存パッケージなし）
//   原本: sales/clients/<slug>/list/targets.csv
//   出力: タブ分けしたスプレッドシート (xlsx) / Excel 用 CSV
//
//   node sales/scripts/targets.mjs --help
//
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SALES_DIR = path.resolve(HERE, '..');
const REPO_DIR = path.resolve(SALES_DIR, '..');
const CLIENTS_DIR = path.join(SALES_DIR, 'clients');
const ACTIVE_FILE = path.join(CLIENTS_DIR, 'ACTIVE');
const CLIENT_TEMPLATE_DIR = path.join(SALES_DIR, '_templates', 'client');

// ---------- 列定義（CSV とスプレッドシートの列順は同じ） ----------
const CAND_FIELDS = ['企業名', '確度', 'URL', '根拠'];
const CAND_COLS = [1, 2, 3].flatMap((n) => CAND_FIELDS.map((f) => `候補${n}_${f}`));
const GROUPS = [
  { key: '管理', color: '3C4043', cols: ['id', 'ランク', 'ICPスコア'] },
  { key: '進行（人が編集）', color: 'F9AB00', dark: true, cols: ['ステータス', '次アクション', '期限', '担当者', '送付日', '接触チャネル', '企業名'] },
  { key: '企業特定（候補）', color: '1A73E8', cols: CAND_COLS },
  { key: '送付', color: '188038', cols: ['問い合わせ先', 'WebサイトURL', 'SNS', '件名', '提案文_直接', '提案文_プラットフォーム'] },
  { key: '掲載情報', color: '5F6368', cols: ['掲載URL', '案件タイトル', '依頼内容', '予算', '納期・期間', '依頼条件', '掲載企業情報'] },
  { key: '企業・評価', color: '9334E6', cols: ['業種', '所在地', '規模', 'ニーズ要約', '推奨サービス', '属性タグ'] },
  { key: '記録', color: '80868B', cols: ['反応メモ', '備考', '登録日', 'プラットフォーム', '調査メモ', '提案文ファイル', '原文ファイル'] },
];
const COLUMNS = GROUPS.flatMap((g) => g.cols);
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.cols.map((c) => [c, g])));
// 人がスプレッドシートで編集してよい列（再出力の前に取り込む）
const HUMAN_COLS = ['ステータス', '次アクション', '期限', '担当者', '送付日', '接触チャネル', '企業名', '反応メモ', '備考'];
const REQUIRED = ['プラットフォーム', '企業名', 'ニーズ要約', '推奨サービス', '接触チャネル', 'ステータス'];
const MULTI = { '推奨サービス': '|', '属性タグ': '|', 'SNS': '|' };
const COMMON_ALLOWED = {
  'プラットフォーム': ['ランサーズ', 'クラウドワークス', '発注ナビ', 'その他マッチング', 'Web検索', 'SNS', '紹介', '展示会・イベント', 'その他'],
  'ランク': ['A', 'B', 'C', '除外', ''],
  '規模': ['個人', '小規模(〜10名)', '中小(〜30名)', '中堅(31〜300名)', '大手(301名〜)', '不明', ''],
  '接触チャネル': ['プラットフォーム応募', '問い合わせフォーム', 'メール', 'SNS DM', 'LINE', '電話', '紹介', '未定'],
  'ステータス': ['未着手', '調査中', '提案作成済', '送付済', '返信あり', '商談中', '受注', '失注', '保留', '除外'],
};
const DATE_COLS = ['登録日', '期限', '送付日'];
const FILE_COLS = ['調査メモ', '提案文ファイル', '原文ファイル'];

// スプレッドシートのタブ（プラットフォーム → タブ）
const TABS = [
  { name: 'ランサーズ', kind: 'platform', color: '1A73E8', match: ['ランサーズ'] },
  { name: 'クラウドワークス', kind: 'platform', color: '12B5CB', match: ['クラウドワークス'] },
  { name: '発注ナビ', kind: 'platform', color: 'E8710A', match: ['発注ナビ'] },
  { name: 'Web検索', kind: 'direct', color: '188038', match: ['Web検索'] },
  { name: 'SNS', kind: 'direct', color: 'D01884', match: ['SNS'] },
  { name: 'その他', kind: 'platform', color: '80868B', match: ['その他マッチング', '紹介', '展示会・イベント', 'その他'] },
];
const PLATFORM_ONLY_COLS = new Set([...CAND_COLS, '提案文_プラットフォーム', '案件タイトル', '依頼内容', '予算', '納期・期間', '依頼条件', '掲載企業情報']);
const SUMMARY_COLS = ['id', 'プラットフォーム', 'ランク', 'ICPスコア', 'ステータス', '次アクション', '期限', '担当者', '送付日', '接触チャネル', '企業名', '候補1_確度', '推奨サービス', 'ニーズ要約', '問い合わせ先'];

// 旧形式の CSV を読み込んだ時の変換
const LEGACY_RENAME = { 'ソースURL': '掲載URL', '提案文': '提案文ファイル' };
const LEGACY_SNS = { 'Instagram': 'ig', 'LINE公式': 'line', 'その他SNS': '' };
const VALUE_MAP = {
  'プラットフォーム': { '発注なび': '発注ナビ', 'Web': 'Web検索', 'Instagram': 'SNS', 'X': 'SNS', 'その他クラウドソーシング': 'その他マッチング' },
  '接触チャネル': { 'Instagram DM': 'SNS DM' },
  '規模': { '中堅(31名〜)': '中堅(31〜300名)' },
};

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

// ---------- 共通 ----------
function fail(msg) { console.error(`エラー: ${msg}`); process.exit(1); }
function today(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}
function rel(p) { return path.relative(process.cwd(), p) || '.'; }
function splitMulti(v, sep = '|') { return String(v ?? '').split(sep).map((s) => s.trim()).filter(Boolean); }

// ---------- クライアント ----------
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
  return {
    slug, dir, config: readConfig(dir),
    csvPath: path.join(dir, 'list', 'targets.csv'),
    exportPath: path.join(dir, 'list', 'targets.export.csv'),
    xlsxPath: path.join(dir, 'list', 'targets.xlsx'),
  };
}
function serviceIds(client) {
  return (client.config.services ?? []).map((s) => (typeof s === 'string' ? s : s.id)).filter(Boolean);
}
function allowedFor(client) {
  const a = { ...COMMON_ALLOWED, '推奨サービス': serviceIds(client) };
  const industries = client.config.industries ?? [];
  if (industries.length) a['業種'] = [...industries, ''];
  return a;
}

// ---------- 読み書き（旧形式は自動変換） ----------
function normalizeRecord(o, rawHeader) {
  const r = {};
  for (const c of COLUMNS) r[c] = o[c] ?? '';
  for (const [oldK, newK] of Object.entries(LEGACY_RENAME)) if (!r[newK] && o[oldK]) r[newK] = o[oldK];
  if (!r['SNS']) {
    const parts = [];
    for (const [k, prefix] of Object.entries(LEGACY_SNS)) {
      for (const v of splitMulti(o[k])) if (!['なし', '不明'].includes(v)) parts.push(prefix ? `${prefix}:${v}` : v);
    }
    r['SNS'] = parts.join(' | ');
  }
  for (const [k, map] of Object.entries(VALUE_MAP)) if (map[r[k]]) r[k] = map[r[k]];
  const known = new Set([...COLUMNS, ...Object.keys(LEGACY_RENAME), ...Object.keys(LEGACY_SNS)]);
  const extra = rawHeader.filter((h) => h && !known.has(h) && String(o[h] ?? '').trim());
  if (extra.length) r['備考'] = [r['備考'], ...extra.map((h) => `${h}: ${o[h]}`)].filter(Boolean).join(' / ');
  return r;
}
function load(client) {
  if (!fs.existsSync(client.csvPath)) fail(`見つかりません: ${rel(client.csvPath)}（init で作成されます）`);
  const rows = parseCSV(fs.readFileSync(client.csvPath, 'utf8'));
  const rawHeader = rows[0] ?? [];
  const records = rows.slice(1)
    .filter((r) => r.some((x) => x !== ''))
    .map((r) => normalizeRecord(Object.fromEntries(rawHeader.map((h, i) => [h, r[i] ?? ''])), rawHeader));
  const migrated = rawHeader.join(',') !== COLUMNS.join(',');
  return { records, migrated };
}
function save(client, records) {
  fs.writeFileSync(client.csvPath, toCSV(COLUMNS, records), 'utf8');
}
function nextId(records) {
  let max = 0;
  for (const r of records) {
    const m = /^T-(\d+)$/.exec(r.id ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `T-${String(max + 1).padStart(4, '0')}`;
}

// ---------- 検証 ----------
function isIntIn(v, lo, hi) { return /^\d+$/.test(String(v)) && Number(v) >= lo && Number(v) <= hi; }
function validateRecord(client, r, idx) {
  const errs = [];
  const allowed = allowedFor(client);
  const where = `${r.id || `行${idx + 2}`}（${r['企業名'] || '企業名なし'}）`;
  for (const k of REQUIRED) if (!String(r[k] ?? '').trim()) errs.push(`${where}: 必須列「${k}」が空`);
  for (const [k, list] of Object.entries(allowed)) {
    const raw = String(r[k] ?? '');
    const values = MULTI[k] ? splitMulti(raw, MULTI[k]) : [raw.trim()];
    if (k === '推奨サービス' && !list.length && values.length) {
      errs.push(`${where}: クライアント「${client.slug}」の config.json に services が未定義です。/sales-setup で設定してください`);
      continue;
    }
    for (const v of values) if (!list.includes(v)) errs.push(`${where}: 「${k}」の値「${v}」は未定義（許可: ${list.filter(Boolean).join(' / ')}）`);
  }
  const score = String(r['ICPスコア'] ?? '').trim();
  if (score && !isIntIn(score, 0, 100)) errs.push(`${where}: ICPスコアは 0〜100 の整数`);
  for (const k of DATE_COLS) {
    const v = String(r[k] ?? '').trim();
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errs.push(`${where}: 「${k}」は YYYY-MM-DD 形式`);
  }
  // 候補 1〜3
  let sum = 0, prev = Infinity, gap = false;
  for (const n of [1, 2, 3]) {
    const name = String(r[`候補${n}_企業名`] ?? '').trim();
    const conf = String(r[`候補${n}_確度`] ?? '').trim();
    const others = ['URL', '根拠'].some((f) => String(r[`候補${n}_${f}`] ?? '').trim()) || conf;
    if (!name) { if (others) errs.push(`${where}: 候補${n} は企業名が空なのに他の項目がある`); gap = true; continue; }
    if (gap) errs.push(`${where}: 候補${n} の前の候補が空（候補は 1 から詰めて入れる）`);
    if (!isIntIn(conf, 0, 100)) { errs.push(`${where}: 候補${n}_確度 は 0〜100 の整数（%）`); continue; }
    const c = Number(conf);
    if (c > prev) errs.push(`${where}: 候補は確度の高い順に並べる（候補${n} が前より高い）`);
    prev = c; sum += c;
  }
  if (sum > 100) errs.push(`${where}: 候補の確度の合計が ${sum}%（100% 以下。残りは「どれでもない」可能性）`);
  for (const k of FILE_COLS) {
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
  const byName = new Map(), byUrl = new Map(), byId = new Map(), bySrc = new Map();
  for (const r of records) {
    const id = r.id?.trim();
    if (id) { if (byId.has(id)) dups.push(`id 重複: ${id}`); byId.set(id, r); }
    const name = normalizeName(r['企業名']);
    if (name && !name.startsWith('（')) {
      if (byName.has(name)) dups.push(`企業名 重複: ${r['企業名']}（${byName.get(name).id} と ${r.id}）`);
      byName.set(name, r);
    }
    const url = normalizeUrl(r['WebサイトURL']);
    if (url) {
      if (byUrl.has(url)) dups.push(`WebサイトURL 重複: ${url}（${byUrl.get(url).id} と ${r.id}）`);
      byUrl.set(url, r);
    }
    const src = normalizeUrl(r['掲載URL']);
    if (src && r['プラットフォーム'] !== 'Web検索' && r['プラットフォーム'] !== 'SNS') {
      if (bySrc.has(src)) dups.push(`掲載URL 重複（同じ案件の二重登録）: ${src}（${bySrc.get(src).id} と ${r.id}）`);
      bySrc.set(src, r);
    }
  }
  return dups;
}

// 値の読み込み: "@file:<path>" はファイルの中身（末尾の改行は除去）
function readValue(v) {
  if (typeof v === 'string' && v.startsWith('@file:')) {
    const p = v.slice('@file:'.length);
    if (!fs.existsSync(p)) fail(`ファイルがありません: ${p}`);
    return fs.readFileSync(p, 'utf8').replace(/\s+$/, '');
  }
  return v;
}
function fromInput(item, base = {}) {
  const r = { ...base };
  const unknown = [];
  for (const [k, v0] of Object.entries(item)) {
    if (k === '候補') continue;
    if (!COLUMNS.includes(k)) { unknown.push(k); continue; }
    let v = readValue(v0);
    if (Array.isArray(v)) v = v.join(k === 'SNS' ? ' | ' : (MULTI[k] ?? '|'));
    if (typeof v === 'number') v = String(Math.round(v));
    r[k] = v == null ? '' : String(v);
  }
  if (Array.isArray(item['候補'])) {
    for (const n of [1, 2, 3]) for (const f of CAND_FIELDS) r[`候補${n}_${f}`] = '';
    item['候補'].slice(0, 3).forEach((c, i) => {
      for (const f of CAND_FIELDS) {
        const v = c[f] ?? c[{ '企業名': 'name', '確度': 'confidence', 'URL': 'url', '根拠': 'reason' }[f]] ?? '';
        r[`候補${i + 1}_${f}`] = typeof v === 'number' ? String(Math.round(v)) : String(v);
      }
    });
    if (item['候補'].length > 3) console.error('注意: 候補は上位 3 件のみ保存します');
  }
  if (unknown.length) console.error(`注意: 未定義の列を無視しました: ${unknown.join(', ')}`);
  return r;
}

// ---------- 表示 ----------
function printTable(cols, rows) {
  const width = (s) => [...String(s)].reduce((n, ch) => n + (/[^\x00-\x7F]/.test(ch) ? 2 : 1), 0);
  const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - width(s)));
  const clip = (s) => { s = String(s ?? '').replace(/\s+/g, ' '); return [...s].length > 40 ? [...s].slice(0, 39).join('') + '…' : s; };
  rows = rows.map((r) => r.map(clip));
  const widths = cols.map((c, i) => Math.max(width(c), ...rows.map((r) => width(r[i] ?? ''))));
  console.log(cols.map((c, i) => pad(c, widths[i])).join('  '));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) console.log(cols.map((_, i) => pad(r[i] ?? '', widths[i])).join('  '));
}
const RANK_ORDER = { A: 0, B: 1, C: 2, '': 3, '除外': 4 };
function sortRecords(records) {
  return [...records].sort((a, b) =>
    (RANK_ORDER[a['ランク']] ?? 3) - (RANK_ORDER[b['ランク']] ?? 3)
    || (Number(b['ICPスコア'] || 0) - Number(a['ICPスコア'] || 0))
    || String(a.id).localeCompare(String(b.id)));
}
function tabOf(r) { return TABS.find((t) => t.match.includes(r['プラットフォーム'])) ?? TABS[TABS.length - 1]; }

// ---------- xlsx 書き出し（最小実装: sharedStrings / styles / freeze / filter / 入力規則） ----------
function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = zlib.deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
function xmlEsc(s) {
  return String(s ?? '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function colName(i) {
  let s = ''; i += 1;
  while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
class SharedStrings {
  constructor() { this.map = new Map(); this.list = []; }
  idx(v) { v = String(v); let i = this.map.get(v); if (i === undefined) { i = this.list.length; this.list.push(v); this.map.set(v, i); } return i; }
  xml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.list.length}" uniqueCount="${this.list.length}">`
      + this.list.map((v) => `<si><t xml:space="preserve">${xmlEsc(v)}</t></si>`).join('') + '</sst>';
  }
}
class StyleBook {
  constructor() {
    this.fonts = []; this.fills = []; this.xfs = []; this.keys = new Map();
    this.font({}); this.fills.push('<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>');
    this.xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
  }
  font({ bold = false, color = '' }) {
    const x = `<font>${bold ? '<b/>' : ''}<sz val="10"/>${color ? `<color rgb="FF${color}"/>` : ''}<name val="Arial"/></font>`;
    let i = this.fonts.indexOf(x); if (i < 0) { this.fonts.push(x); i = this.fonts.length - 1; } return i;
  }
  fill(color) {
    if (!color) return 0;
    const x = `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`;
    let i = this.fills.indexOf(x); if (i < 0) { this.fills.push(x); i = this.fills.length - 1; } return i;
  }
  get(opt = {}) {
    const key = JSON.stringify(opt);
    if (this.keys.has(key)) return this.keys.get(key);
    const { bold, color, fill, wrap, center } = opt;
    const fontId = this.font({ bold, color }), fillId = this.fill(fill);
    const align = `<alignment vertical="top"${wrap ? ' wrapText="1"' : ''}${center ? ' horizontal="center"' : ''}/>`;
    this.xfs.push(`<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${align}</xf>`);
    const idx = this.xfs.length - 1; this.keys.set(key, idx); return idx;
  }
  xml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + `<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts>`
      + `<fills count="${this.fills.length}">${this.fills.join('')}</fills>`
      + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'
      + '<border><left style="thin"><color rgb="FFDADCE0"/></left><right style="thin"><color rgb="FFDADCE0"/></right><top style="thin"><color rgb="FFDADCE0"/></top><bottom style="thin"><color rgb="FFDADCE0"/></bottom><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + `<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs>`
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '</styleSheet>';
  }
}
const WIDTH = {
  'id': 8, 'ランク': 6, 'ICPスコア': 8, 'ステータス': 11, '次アクション': 20, '期限': 11, '担当者': 9, '送付日': 11, '接触チャネル': 15, '企業名': 26,
  '問い合わせ先': 32, 'WebサイトURL': 28, 'SNS': 24, '件名': 30, '提案文_直接': 64, '提案文_プラットフォーム': 64,
  '掲載URL': 26, '案件タイトル': 30, '依頼内容': 50, '予算': 16, '納期・期間': 16, '依頼条件': 36, '掲載企業情報': 36,
  '業種': 16, '所在地': 14, '規模': 14, 'ニーズ要約': 40, '推奨サービス': 18, '属性タグ': 26,
  '反応メモ': 36, '備考': 32, '登録日': 11, 'プラットフォーム': 13, '調査メモ': 30, '提案文ファイル': 30, '原文ファイル': 30,
};
for (const n of [1, 2, 3]) Object.assign(WIDTH, { [`候補${n}_企業名`]: 24, [`候補${n}_確度`]: 8, [`候補${n}_URL`]: 26, [`候補${n}_根拠`]: 40 });
const WRAP_COLS = new Set(['提案文_直接', '提案文_プラットフォーム', '依頼内容', '依頼条件', '掲載企業情報', 'ニーズ要約', '反応メモ', '備考', '案件タイトル', '候補1_根拠', '候補2_根拠', '候補3_根拠']);
const NUM_COLS = new Set(['ICPスコア', '候補1_確度', '候補2_確度', '候補3_確度']);
const LIST_VALIDATIONS = ['ステータス', '接触チャネル', 'ランク'];
const RANK_FILL = { A: 'CEEAD6', B: 'FEEFC3', C: 'E8EAED' };
function confFill(v) { if (v === '' || v == null) return ''; const n = Number(v); return n >= 70 ? 'CEEAD6' : n >= 40 ? 'FEEFC3' : 'FAD2CF'; }
const STATUS_FILL = { '送付済': 'D2E3FC', '返信あり': 'D2E3FC', '商談中': 'D2E3FC', '受注': 'CEEAD6', '失注': 'E8EAED', '除外': 'E8EAED' };

function sheetXml(styles, sst, { cols, rows, tabColor, rowHeight, freezeCols = 2, header = true, validations = true, widths = WIDTH, wrapAll = false }) {
  const lastCol = colName(cols.length - 1);
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  if (tabColor) parts.push(`<sheetPr><tabColor rgb="FF${tabColor}"/></sheetPr>`);
  parts.push(`<dimension ref="A1:${lastCol}${Math.max(1, rows.length + 1)}"/>`);
  const topLeft = `${colName(freezeCols)}2`;
  parts.push(`<sheetViews><sheetView workbookViewId="0"><pane${freezeCols ? ` xSplit="${freezeCols}"` : ''} ySplit="1" topLeftCell="${topLeft}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>`);
  parts.push('<sheetFormatPr defaultRowHeight="18"/>');
  parts.push('<cols>' + cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths[c] ?? 18}" customWidth="1"/>`).join('') + '</cols>');
  parts.push('<sheetData>');
  if (header) {
    parts.push('<row r="1" ht="30" customHeight="1">' + cols.map((c, i) => {
      const g = GROUP_OF[c];
      const s = styles.get({ bold: true, color: g?.dark ? '202124' : 'FFFFFF', fill: g?.color ?? '3C4043', wrap: true });
      return `<c r="${colName(i)}1" s="${s}" t="s"><v>${sst.idx(c)}</v></c>`;
    }).join('') + '</row>');
  }
  rows.forEach((r, ri) => {
    const rn = ri + 2;
    const cells = cols.map((c, ci) => {
      const v = r[c] ?? '';
      let fill = '';
      if (c === 'ランク') fill = RANK_FILL[v] ?? '';
      else if (/^候補\d_確度$/.test(c)) fill = confFill(v);
      else if (c === 'ステータス') fill = STATUS_FILL[v] ?? '';
      const s = styles.get({ wrap: wrapAll || WRAP_COLS.has(c), fill, color: r['ランク'] === '除外' ? '9AA0A6' : '', center: c === 'ランク' || NUM_COLS.has(c) });
      const ref = `${colName(ci)}${rn}`;
      if (v === '') return `<c r="${ref}" s="${s}"/>`;
      if (NUM_COLS.has(c) && /^\d+$/.test(v)) return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
      return `<c r="${ref}" s="${s}" t="s"><v>${sst.idx(v)}</v></c>`;
    });
    parts.push(`<row r="${rn}"${rowHeight ? ` ht="${rowHeight}" customHeight="1"` : ''}>${cells.join('')}</row>`);
  });
  parts.push('</sheetData>');
  if (header) parts.push(`<autoFilter ref="A1:${lastCol}${Math.max(1, rows.length + 1)}"/>`);
  if (validations) {
    const dv = LIST_VALIDATIONS.filter((c) => cols.includes(c)).map((c) => {
      const L = colName(cols.indexOf(c));
      const values = COMMON_ALLOWED[c].filter(Boolean).join(',');
      return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${L}2:${L}2000"><formula1>"${xmlEsc(values)}"</formula1></dataValidation>`;
    });
    if (dv.length) parts.push(`<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>`);
  }
  parts.push('<pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>');
  parts.push('</worksheet>');
  return parts.join('');
}
function legendRows(client) {
  const g = (k) => GROUPS.find((x) => x.key === k);
  return [
    ['クライアント', `${client.config.name ?? client.slug}（${client.slug}）`],
    ['出力日時', new Date(Date.now() + 9 * 3600000).toISOString().replace('T', ' ').slice(0, 16) + '（日本時間）'],
    ['このファイルについて', 'エージェントが原本（sales/clients/<slug>/list/targets.csv）から出力したものです。Google Drive 経由の出力では再出力のたびに新しいファイルになり、古いファイルの名前の先頭に（旧）が付きます。必ず最新版で作業してください。'],
    ['人が編集してよい列（オレンジの見出し）', `${HUMAN_COLS.join(' / ')}。再出力の前にエージェントがこれらの列を読み取り、原本に取り込みます。他の列は再出力で上書きされます。`],
    ['見出しの色', GROUPS.map((x) => `${x.key}: ${x.cols.length > 6 ? x.cols.slice(0, 3).join('・') + '…' : x.cols.join('・')}`).join('\n')],
    ['タブ', `一覧: 全件の進行管理 / ${TABS.map((t) => `${t.name}: ${t.match.join('・')}`).join(' / ')}`],
    ['候補1〜3_確度', '掲載情報から推定した「この企業が掲載者である」確率（%）。確度の高い順。合計は 100% 以下で、残りは「どれでもない」可能性。緑 70%以上 / 黄 40〜69% / 赤 40%未満。'],
    ['企業名', '送付先として確定した企業。既定は候補1。別の候補に送る場合は企業名を書き換え、エージェントに「T-0001 候補2で提案文を作り直して」と依頼してください。'],
    ['提案文_直接', '特定した企業へ直接送る文面（問い合わせフォーム・メール・SNS DM）。掲載情報にしか書かれていない内容（予算・締切・募集文の引用・プラットフォーム名）は含めていません。'],
    ['提案文_プラットフォーム', 'ランサーズ・クラウドワークス・発注ナビ等の応募欄に貼る文面。募集要件への回答を冒頭に置いています。'],
    ['ランク', 'A: 48時間以内に送付 / B: 1週間以内 / C: 保留 / 除外: 対象外（備考に理由）。ICPスコアはクライアントの選定基準（icp.md）による 100 点満点。'],
    ['ステータス', '未着手 → 調査中 → 提案作成済 → 送付済 → 返信あり → 商談中 → 受注。途中で終わる場合は 失注 / 保留 / 除外。'],
    ['送付時のコピー', '複数行のセルは、セルを選択してコピーすると前後に " が付くことがあります（Excel）。セル内をダブルクリック（または F2）→ 全選択 → コピーしてください。'],
    ['送付前の確認', '候補1_確度が低い（赤）行は、企業名と送付先が正しいかを必ず確認してください。メール・フォームは署名と法令表記のプレースホルダー（【】）を埋めてから送ってください。'],
  ];
}
function buildWorkbook(client, records) {
  const styles = new StyleBook();
  const sst = new SharedStrings();
  const sorted = sortRecords(records);
  const sheets = [];
  const add = (name, cols, rows, opt) => sheets.push({ name, cols, count: rows.length, xml: sheetXml(styles, sst, { cols, rows, ...opt }) });
  add('一覧', SUMMARY_COLS, sorted, { tabColor: '3C4043', freezeCols: 2 });
  for (const t of TABS) {
    const cols = t.kind === 'platform' ? COLUMNS : COLUMNS.filter((c) => !PLATFORM_ONLY_COLS.has(c));
    add(t.name, cols, sorted.filter((r) => tabOf(r) === t), { tabColor: t.color, rowHeight: 60, freezeCols: 2 });
  }
  const legend = legendRows(client).map(([k, v]) => ({ 項目: k, 説明: v }));
  add('凡例', ['項目', '説明'], legend, { tabColor: 'BDC1C6', freezeCols: 0, validations: false, wrapAll: true, widths: { '項目': 30, '説明': 110 } });
  const definedNames = sheets.map((s, i) =>
    `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlEsc(s.name)}'!$A$1:$${colName(s.cols.length - 1)}$${Math.max(1, s.count + 1)}</definedName>`).join('');
  const files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>'
      + sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
      + `</sheets><definedNames>${definedNames}</definedNames></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
      + `<Relationship Id="rId${sheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>` },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })),
    { name: 'xl/styles.xml', data: styles.xml() },
    { name: 'xl/sharedStrings.xml', data: sst.xml() },
  ];
  return { buffer: zip(files), sheets };
}

// ---------- クライアント管理コマンド ----------
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
      return [slug === active ? '*' : '', slug, cfg.name ?? '', services, String(n), cfg.spreadsheet?.current_url ? 'あり' : '-'];
    });
    printTable(['', 'slug', '名称', 'サービス id', '営業先数', 'シート'], rows);
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
    const slug = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--name');
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

// ---------- リスト操作コマンド ----------
const cmds = {
  'next-id'(client) {
    console.log(nextId(load(client).records));
  },

  add(client, args) {
    const force = args.includes('--force');
    const src = args.find((a) => !a.startsWith('--'));
    if (!src) fail('使い方: add <json ファイル | -> [--force]   ※ - は標準入力');
    const text = src === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(src, 'utf8');
    let input;
    try { input = JSON.parse(text); } catch (e) { fail(`JSON を読めません: ${e.message}`); }
    const items = Array.isArray(input) ? input : [input];
    const { records } = load(client);
    const added = [];
    for (const item of items) {
      const r = fromInput(item, Object.fromEntries(COLUMNS.map((c) => [c, ''])));
      if (!r.id) r.id = nextId([...records, ...added]);
      if (!r['登録日']) r['登録日'] = today();
      if (!r['ステータス']) r['ステータス'] = '未着手';
      if (!r['接触チャネル']) r['接触チャネル'] = '未定';
      if (!r['企業名'] && r['候補1_企業名']) r['企業名'] = r['候補1_企業名'];
      const errs = validateRecord(client, r, records.length + added.length);
      if (errs.length) { errs.forEach((e) => console.error(e)); if (!force) fail('検証エラーのため追加しません（--force で強制）'); }
      const dup = findDuplicates([...records, ...added, r]);
      if (dup.length) { dup.forEach((d) => console.error(`重複: ${d}`)); if (!force) fail('重複のため追加しません（既存行を get で確認し update / apply で更新。--force で強制）'); }
      added.push(r);
    }
    save(client, [...records, ...added]);
    for (const r of added) console.log(`追加 [${client.slug}]: ${r.id}  ${r['企業名']}  [${r['プラットフォーム']} / ${r['推奨サービス']} / ${r['ランク'] || '-'} / 候補1確度 ${r['候補1_確度'] || '-'}]`);
  },

  update(client, args) {
    const force = args.includes('--force');
    const [id, ...pairs] = args.filter((a) => a !== '--force');
    if (!id || !pairs.length) fail('使い方: update <id> 列名=値 [列名=@file:パス ...]');
    const item = {};
    for (const p of pairs) {
      const eq = p.indexOf('=');
      if (eq < 0) fail(`形式が不正: ${p}（列名=値）`);
      const k = p.slice(0, eq);
      if (!COLUMNS.includes(k)) fail(`未定義の列: ${k}`);
      item[k] = p.slice(eq + 1);
    }
    cmds.apply(client, [JSON.stringify([{ id, ...item }]), '--inline', ...(force ? ['--force'] : [])]);
  },

  apply(client, args) {
    const force = args.includes('--force');
    const src = args.find((a) => !a.startsWith('--'));
    if (!src) fail('使い方: apply <json ファイル | ->  （[{"id":"T-0001","ステータス":"送付済", ...}, ...]）');
    const text = args.includes('--inline') ? src : (src === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(src, 'utf8'));
    let input;
    try { input = JSON.parse(text); } catch (e) { fail(`JSON を読めません: ${e.message}`); }
    const items = Array.isArray(input) ? input : [input];
    const { records } = load(client);
    const errs = [], diffs = [];
    for (const item of items) {
      const r = records.find((x) => x.id === item.id);
      if (!r) { errs.push(`id が見つかりません: ${item.id}（クライアント: ${client.slug}）`); continue; }
      const { id, ...rest } = item;
      const next = fromInput(rest, r);
      for (const c of COLUMNS) if ((next[c] ?? '') !== (r[c] ?? '')) diffs.push([id, c, r[c], next[c]]);
      Object.assign(r, next);
      errs.push(...validateRecord(client, r, records.indexOf(r)));
    }
    if (errs.length) { errs.forEach((e) => console.error(e)); if (!force) fail('検証エラーのため反映しません（--force で強制）'); }
    save(client, records);
    if (!diffs.length) { console.log(`変更なし [${client.slug}]`); return; }
    const short = (v) => { const s = String(v ?? '').replace(/\s+/g, ' '); return s.length > 30 ? s.slice(0, 29) + '…' : (s || '（空）'); };
    for (const [id, c, a, b] of diffs) console.log(`更新 [${client.slug}] ${id} ${c}: ${short(a)} → ${short(b)}`);
  },

  get(client, args) {
    const [id] = args;
    const r = load(client).records.find((x) => x.id === id);
    if (!r) fail(`id が見つかりません: ${id}（クライアント: ${client.slug}）`);
    console.log(JSON.stringify(Object.fromEntries(Object.entries(r).filter(([, v]) => v !== '')), null, 2));
  },

  list(client, args) {
    const { records } = load(client);
    const filters = args.filter((a) => a.includes('=')).map((a) => { const i = a.indexOf('='); return [a.slice(0, i), a.slice(i + 1)]; });
    const rows = sortRecords(records).filter((r) => filters.every(([k, v]) => splitMulti(r[k]).includes(v) || r[k] === v));
    const cols = ['id', 'ランク', 'ICPスコア', 'ステータス', 'プラットフォーム', '企業名', '候補1_確度', '推奨サービス', '次アクション', '期限'];
    printTable(cols, rows.map((r) => cols.map((c) => r[c] ?? '')));
    console.log(`${rows.length} 件（クライアント: ${client.slug}）`);
  },

  validate(client) {
    const { records, migrated } = load(client);
    const errs = [];
    if (migrated) console.error('注意: CSV の列構成が旧形式です。次の書き込み（add / update / apply / migrate）で新形式に変換されます');
    if (!serviceIds(client).length) console.error(`注意: ${client.slug}/config.json に services が未設定です（/sales-setup で設定）`);
    records.forEach((r, i) => errs.push(...validateRecord(client, r, i)));
    errs.push(...findDuplicates(records));
    if (errs.length) { errs.forEach((e) => console.error(e)); fail(`${errs.length} 件の問題`); }
    console.log(`OK [${client.slug}]: ${records.length} 件、問題なし`);
  },

  migrate(client) {
    const { records, migrated } = load(client);
    save(client, records);
    console.log(migrated ? `変換しました [${client.slug}]: ${records.length} 件を新しい列構成で保存` : `変換不要 [${client.slug}]`);
  },

  stats(client) {
    const { records } = load(client);
    console.log(`# ${client.config.name ?? client.slug} 営業先リスト 集計（${records.length} 件 / ${today()}）`);
    if (!records.length) { console.log('まだ 0 件です。/sales-intake か /sales-prospect で追加してください。'); return; }
    const count = (key, split, fn) => {
      const m = new Map();
      for (const r of records) {
        const raw = fn ? fn(r) : (String(r[key] ?? '').trim() || '（未設定）');
        const vals = split ? splitMulti(raw, split) : [raw];
        for (const v of vals) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const section = (title, entries) => { console.log(`\n## ${title}`); printTable(['値', '件数'], entries.map(([k, v]) => [k, String(v)])); };
    section('タブ（プラットフォーム分類）別', count(null, null, (r) => tabOf(r).name));
    section('推奨サービス別（複数カウント）', count('推奨サービス', '|'));
    section('ランク別', count('ランク'));
    section('ステータス別', count('ステータス'));
    section('企業特定の確度（候補1）', count(null, null, (r) => {
      if (r['プラットフォーム'] === 'Web検索' || r['プラットフォーム'] === 'SNS') return '直接発見（特定不要）';
      const c = r['候補1_確度']; if (c === '') return '未特定';
      return Number(c) >= 70 ? '高（70%以上）' : Number(c) >= 40 ? '中（40〜69%）' : '低（40%未満）';
    }));
    section('提案文の作成状況', count(null, null, (r) => [r['提案文_直接'] ? '直接' : '', r['提案文_プラットフォーム'] ? 'プラットフォーム' : ''].filter(Boolean).join('+') || '未作成'));
    section('業種別', count('業種'));
    const configured = serviceIds(client);
    const services = configured.length ? configured : count('推奨サービス', '|').map(([k]) => k);
    console.log('\n## タブ × 推奨サービス');
    printTable(['タブ', ...services], TABS.map((t) => [t.name, ...services.map((s) => String(records.filter((r) => tabOf(r) === t && splitMulti(r['推奨サービス']).includes(s)).length))]));
    const due = records.filter((r) => r['期限'] && r['期限'] <= today() && !['受注', '失注', '除外'].includes(r['ステータス']));
    if (due.length) {
      console.log('\n## 期限切れ・本日期限の次アクション');
      printTable(['id', '企業名', '次アクション', '期限'], due.map((r) => [r.id, r['企業名'], r['次アクション'], r['期限']]));
    }
  },

  export(client) {
    const { records } = load(client);
    fs.writeFileSync(client.exportPath, '﻿' + toCSV(COLUMNS, sortRecords(records), '\r\n'), 'utf8');
    console.log(`書き出し: ${rel(client.exportPath)}（UTF-8 BOM / CRLF、${records.length} 件）`);
  },

  sheet(client, args) {
    const outIdx = args.indexOf('--out');
    const out = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : client.xlsxPath;
    let { records } = load(client);
    if (args.includes('--active-only')) records = records.filter((r) => !['失注', '除外'].includes(r['ステータス']));
    const { buffer, sheets } = buildWorkbook(client, records);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buffer);
    const stamp = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ');
    console.log(`書き出し: ${rel(out)}`);
    console.log(`  サイズ: ${buffer.length.toLocaleString()} bytes（base64 ${Math.ceil(buffer.length / 3) * 4} 文字）`);
    console.log(`  タブ: ${sheets.map((s) => `${s.name}(${s.count})`).join(' / ')}`);
    console.log(`  推奨タイトル: 営業リスト_${client.config.name ?? client.slug}_${stamp}`);
    if (buffer.length > 300000) console.error('注意: 300KB を超えています。Google Drive へのアップロードは --active-only で絞るか、手動インポートを推奨');
  },
};

function help() {
  console.log(`営業先リスト操作ツール（クライアント単位: sales/clients/<slug>/list/targets.csv）

  node sales/scripts/targets.mjs [--client <slug>] <コマンド> [引数]

クライアント管理
  clients                            登録済みクライアントの一覧（* が既定）
  init <slug> --name "名称" [--use]  新しいクライアントを _templates/client から作成
  use <slug>                         既定クライアントを設定（sales/clients/ACTIVE）。環境変数 SALES_CLIENT でも可

営業先リスト（既定 or --client のクライアントが対象）
  next-id                            次の id（T-0001 形式）
  add <json | ->                     1 件または配列を追加。"候補": [{企業名,確度,URL,根拠}, ...] は候補1〜3 に展開
                                     値に "@file:<パス>" を書くとファイルの中身を入れる（提案文など複数行向け）
  update <id> 列=値 ...              既存行を更新（値に @file:<パス> 可）
  apply <json | ->                   [{"id":"T-0001","ステータス":"送付済",...}] を一括反映し、差分を表示
                                     （スプレッドシートで人が編集した列の取り込みに使う）
  get <id>                           1 行を JSON で表示（空の列は省略）
  list [列=値 ...]                   一覧（例: list ランク=A ステータス=未着手）
  validate                           必須列・許可値・候補の確度・日付・重複・ファイル存在を検証
  migrate                            旧形式の CSV を新しい列構成に変換して保存
  stats                              タブ / サービス / ランク / ステータス / 特定確度 / 提案文 の集計と期限切れ
  export                             Excel 向け BOM 付き CSV（list/targets.export.csv）
  sheet [--active-only] [--out パス] タブ分けしたスプレッドシート（list/targets.xlsx）
                                     タブ: 一覧 / ${TABS.map((t) => t.name).join(' / ')} / 凡例

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
