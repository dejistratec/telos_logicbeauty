# ae-render: AE テンプレートの文字差し替え → 一括レンダリング

CSV / JSON の 1 行ごとに、After Effects テンプレート (.aep) のテキストレイヤーを差し替え、`aerender` で書き出します。

```
rows.csv ──▶ run.mjs ──▶ After Effects (ae_replace_text.jsx)  ──▶ ae-out/projects/001.aep, 002.aep …
                    └──▶ aerender (行ごと・並列可)            ──▶ ae-out/001.mov, 002.mov …
```

文字の差し替えは AE 本体で行い (aerender はスクリプトを実行できないため)、レンダリングは aerender に任せます。行ごとの .aep が残るので、気になる 1 本だけ AE で開いて確認・修正することもできます。

## 必要なもの

- Windows または macOS の After Effects (2022 以降を想定)
- Node.js 18 以上 (追加パッケージ不要)
- AE の **環境設定 > スクリプトとエクスプレッション > 「スクリプトによるファイルへの書き込みとネットワークへのアクセスを許可」を ON**
- macOS のみ: 初回に「ターミナルが After Effects を操作する」許可を求められたら許可

## テンプレートの準備

- レンダリングするコンポの名前を決めておく (既定は `Main`)
- 差し替えたいテキストレイヤーには、データの列名と同じ名前を付ける (例: `Title`, `Subtitle`)
- フォントはテンプレート側で設定しておく。差し替えるのは文字だけで、フォント・サイズ・色などのスタイルは保たれます
- Source Text にキーフレームがある場合は、各キーの文字を同じ内容に差し替えます

## データの書き方

### CSV (UTF-8、BOM あり/なしどちらも可)

```csv
id,Title,Subtitle,Main/Caption
001,テロス,静かな建築,"カンマ, を含む文字も OK"
002,LOGIC BEAUTY,論理の美しさ,"改行も
入れられます"
```

- `id`: 出力ファイル名 (`001.mov`)。省略すると行番号
- `comp`: その行だけ別のコンポをレンダリングしたいときに指定 (省略時は `--comp`)
- `output`: `id` の代わりに出力ファイル名を指定したいとき
- それ以外の列: テキストレイヤー名
  - `Title` のように名前だけ書くと、**全コンポ**の同名テキストレイヤーを差し替えます (プリコンプ内の文字もまとめて変えられる)
  - `Main/Caption` のように `コンポ名/レイヤー名` と書くと、そのコンポ内のレイヤーだけ
- 空のセルは「空文字に差し替え」になります

### JSON

```json
[
  { "id": "001", "Title": "テロス", "Subtitle": "静かな建築" },
  { "id": "002", "comp": "Main_Vertical", "texts": { "Title": "LOGIC BEAUTY", "Main_Vertical/Caption": "縦型用" } }
]
```

CSV と同じ平らな形でも、`texts` にまとめた形でも書けます。サンプルは `examples/` にあります。

## 実行

リポジトリのルートで:

```bash
# まずは AE を起動せずにデータの読み込みだけ確認
node tools/ae-render/run.mjs --template ./template.aep --data tools/ae-render/examples/rows.csv --dry-run

# 本番 (H.264 で書き出す例)
node tools/ae-render/run.mjs \
  --template ./template.aep \
  --data ./rows.csv \
  --comp Main \
  --out ./ae-out \
  --om "H.264 - Match Render Settings - 15 Mbps" --ext mp4 \
  --parallel 2
```

Windows の PowerShell では行末の `\` を `` ` `` に置き換えるか、1 行で書いてください。

流れ:
1. AE が起動 (起動済みならそのまま使用) し、行ごとに `ae-out/projects/<id>.aep` を保存
2. 終わると AE を終了 (`--keep-ae-open` で残せます)。作業中のプロジェクトがあれば保存確認が出ます
3. `aerender` で行ごとに `ae-out/<id>.<ext>` を書き出し

### 主なオプション

| オプション | 内容 |
|---|---|
| `--om <名前>` | 出力モジュールのテンプレート名。AE の「編集 > テンプレート > 出力モジュール」に表示される名前をそのまま書く。省略時は AE の既定 (多くは非圧縮で巨大) |
| `--ext <拡張子>` | 出力ファイルの拡張子。`--om` に合わせる (H.264 なら `mp4`) |
| `--rs <名前>` | レンダリング設定のテンプレート名 |
| `--parallel <n>` | aerender の同時実行数。メモリに余裕があるときだけ 2〜3 に |
| `--ae-version <年>` | 複数バージョンが入っているときに指定 (例: `2025`) |
| `--afterfx` / `--aerender` | 自動検出できないときにパスを直接指定。mac の `--afterfx` は `.app` のパス |
| `--skip-render` | .aep の書き出しまでで止める (中身を AE で確認したいとき) |
| `--render-only` | 差し替えを飛ばし、`ae-out/projects/*.aep` をレンダリングだけする |
| `--timeout <秒>` | AE 側の処理待ちの上限 (既定 600) |

`node tools/ae-render/run.mjs --help` で一覧が出ます。

## うまくいかないとき

- **「AE の処理が … 秒以内に終わりませんでした」**: AE 側にダイアログ (スクリプトのファイルアクセス許可、フォント不足、保存確認など) が出て止まっていることが多いです。AE の画面を確認してください
- **警告「テキストレイヤーが見つかりません」**: 列名とレイヤー名 (大文字小文字・全角半角) が一致しているか、そのレイヤーがテキストレイヤーかを確認
- **レンダリング失敗**: `ae-out/_job/<id>.render.log` に aerender の出力の末尾が残ります。`--om` のテンプレート名の綴りミスがよくある原因です
- **AE で直接試したい**: AE の「ファイル > スクリプト > スクリプトファイルを実行」で `ae_replace_text.jsx` を選ぶと、`job.json` を選ぶダイアログが出ます (`--dry-run` で作った `ae-out/_job/job.json` が使えます)

## ファイル構成

- `run.mjs`: ランナー。データ読み込み、AE の起動、aerender の実行
- `ae_replace_text.jsx`: AE 内で動く ExtendScript。テンプレートを開いて文字を差し替え、行ごとの .aep を保存
- `examples/`: サンプルデータ

## 未検証の点

この試作は実機の After Effects ではまだ動かしていません (AE オブジェクトを模したモックでの動作確認と、データ読み込み部分の確認のみ)。特に次の点は初回の実行で確認が必要です。

- macOS で `osascript` 経由の `DoScriptFile` に POSIX パスを渡す部分
- Windows で AE 起動済みのときに `AfterFX.exe -r` がスクリプトを既存ウィンドウに渡す挙動
