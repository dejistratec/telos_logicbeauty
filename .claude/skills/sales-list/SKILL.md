---
name: sales-list
description: 営業先リストを、クライアントごとに決めた共有先（Google スプレッドシート／Notion／Excel／CSV）へ、決めた分類（タブ・ビュー）で書き出し、チームやクライアントが共有先で編集したステータス・送付日などを原本に取り込む。Slack などへの更新通知、集計・検証・分類・ステータス更新・クライアントの切り替えも行う。「共有先を更新」「スプレッドシートを更新」「Notion に反映」「シートの変更を取り込んで」「チームに通知」「集計して」「送付済にして」「期限切れを見せて」などで使う。
argument-hint: [共有先を更新 ／ 取り込み ／ 通知 ／ 集計 ／ 検証 ／ 分類 <軸> ／ 更新 <id> 列=値 ／ 出力 ／ クライアント一覧 ／ 切替 <slug>] [--client <slug>]
---

# /sales-list — 共有先への書き出し・取り込み・通知／集計・検証・切替

入力: `$ARGUMENTS`（省略時は `集計`）

ツール: `node sales/scripts/targets.mjs --help`（以下 `T`）／ 列・分類・共有の設定: `sales/_shared/schema.md`
クライアントの決め方は `/sales-intake` と同じ。`<C>` = `sales/clients/<slug>`。

- 原本は `<C>/list/targets.csv`。共有先は原本からの書き出しで、**人が編集してよい列**（ステータス・次アクション・期限・担当者・送付日・接触チャネル・企業名・反応メモ・備考と、`editable` の独自項目）だけを取り込む。
- 共有先・メンバー・クライアントの見え方・通知は `<C>/config.json` の `share`（`T share` で確認）。分類は `sheet`（`T config` で確認）。どちらも `/sales-hearing` で決める。

## 共有先を更新（/sales-intake・/sales-proposal・/sales-prospect・/sales-qualify の最後にも実行）

### 0. 準備
- `T share` で共有先（`platform`）と更新のタイミング（`update_timing`）を確認する。
  - `each_intake` 以外（1 日 1 回・週 1 回・依頼時）で、ほかのスキルの最後に呼ばれた時は、書き出さずに「次回の更新でまとめて反映」と報告して終える。ユーザーが直接頼んだ時は必ず実行する。
- 共有先のツールを ToolSearch で読み込む（`google sheets` / `google drive` / `notion` / `slack`）。Google のファイルを作る・変える前は `google-workspace` スキルを読む。
- 必要なコネクタが無ければ、`read_documentation`（topic `connectors.add`）でつなぎ方を確認してユーザーに伝え、下の「コネクタが無い時」の手順で進める。

### 1. 取り込む（共有先に前回の書き出しがある時は必ず先に）
1. 共有先を読む（下の表）。各行を `{"id": "T-0001", "列名": "値", ...}` にする。同じ id が複数のタブ・ビューにあれば、2 つ目以降の値を `"_alt": {"列名": ["値", ...]}` に入れる。
2. `T pull <rows.json>`（人が編集する列だけ取り込む。複数の場所で違う値に変えられていれば警告が出るので、報告に含める）。
3. 人が共有先に直接足した行（id が空）がある時は、その行だけを `T pull <rows.json> --all` で追加し、`/sales-intake` の手順 3〜7 で調査と提案文を補う。
4. `企業名` が別の候補に変わった行は `/sales-proposal <id> 候補N` で提案文_直接を作り直す。

| 共有先 | 読み方 |
|--------|--------|
| Google スプレッドシート（Sheets コネクタ） | `get_values` で各タブの見出し行から最終列まで |
| Google スプレッドシート（Drive コネクタのみ） | `read_file_content`（`spreadsheet.current_id`） |
| Notion | データベースの行を検索・取得（`share.notion` の id）。ページ id も `page_id` として行に入れる |
| Excel | ユーザーが添付した編集済みファイルを `python3 -I sales/scripts/xlsx_rows.py <file.xlsx>` で JSON に |
| CSV（kintone など） | 取り込み先のツールから書き出した CSV をそのまま `T pull <file.csv>` |

### 2. 書き出す

**Google スプレッドシート**（`platform: google_sheets`）
- Sheets コネクタあり:
  - 初回（`spreadsheet.current_id` が無い）: `T sheet` → `base64 -w0 <C>/list/targets.xlsx` を Drive `create_file`（`contentMimeType` = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`）。色・固定・フィルター・プルダウン付きのシートができる。
  - 2 回目以降: `T payload --format google_sheets --out <f>` の各タブ（`header` + `rows`）を `update_values` で A1 から書き直す。前回より行が減ったタブは、余った行を空文字で上書きする。タブが増えた・消えた時は `update_spreadsheet` で追加・削除する。値は数字・日付に見える文字列に `'` が付いた状態で出力されるのでそのまま書く。
- Drive コネクタのみ: `T sheet --active-only` → `create_file` で新しいシートを作り、古いシートは `update_file` で名前の先頭に `（旧）`。**削除・ゴミ箱へは移さない。**
- 記録: `config.json` の `spreadsheet.current_id` / `current_url` / `previous_ids`。

**Notion**（`platform: notion`）
1. 初回（`share.notion` に id が無い）:
   - `T notion-schema` のプロパティでデータベースを作る（親ページは `share.notion.parent_page_id`。無ければ「営業代行_<クライアント名>」ページを作ってその中に）。`select` / `multi_select` は `options` を設定する。
   - ビュー（一覧・分類ごと・進捗ボード・自分の担当）は `notion-schema` の `views` のとおりに作る。ツールでビューを作れない場合は、ユーザーに作り方を一覧で伝える（「分類」でフィルターまたはグループ化）。
   - `share.notion` の `database_id` / `data_source_id` / `url` を `config.json` に記録。
2. `T payload --format notion --changed --out <f>`（初回は `--changed` を付けない）。
3. 各ページ: `page_id` が無ければ作成（プロパティ＋本文 `body`）し、`T map notion <id>=<作成したページ id>`。`page_id` があればプロパティを更新し、本文は提案文が変わった時だけ置き換える（ツールが置き換えに対応していなければ、末尾に「更新（日時）」の節を足す）。
4. プロパティの書き方は Notion ツールのスキーマに合わせる（`payload` はプロパティ名 → 値の素の形で出力する）。

**Excel**（`platform: excel`）
- `T sheet` → `<C>/list/targets.xlsx` を `SendUserFile` で渡す。チームの共有フォルダに置く場合は Drive `create_file` に `disableConversionToGoogleType: true` で xlsx のまま保存できる。
- 編集後のファイルを添付してもらい、手順 1 で取り込む。同時に複数人で編集すると上書きが起きるので、編集は 1 人ずつにする。

**CSV**（`platform: csv`。kintone など、コネクタの無いツールへ）
- `T export` → `<C>/list/targets.export.csv`（Excel で文字化けしない UTF-8 BOM 付き。末尾の「分類」列でツール側の一覧を絞り込める）を `SendUserFile`。取り込み先で編集した内容は、そのツールから CSV を書き出して手順 1 で戻す。

**コネクタが無い時**: 共有先が Google スプレッドシートなら Excel と同じ手順（xlsx を渡し、「ファイル → インポート → スプレッドシートを置換」で同じ URL のまま差し替えられると伝える）。Notion なら `T export` の CSV を渡す（Notion の「インポート → CSV」でデータベースになる）。

### 3. 記録・確認
- 書き出したら `T pushed`（`share.last_push` に日時が入り、次回の `--changed` の基準になる）。
- 書き出し先を読み直し、行数・タブ（ビュー）が `T sheet` / `T payload` の出力と一致するか確認する。

### 4. 通知（`share.notify.channel` が none 以外で、`notify.frequency` に当たる時）
- `T digest` で要約を作る（前回の通知以降の新規・更新・期限切れ・未送付の A ランク・候補の確認待ち）。
- Slack コネクタがあれば `share.notify.target` のチャンネルに投稿する。Chatwork・LINE WORKS・Teams・メールなどコネクタが無い先は、要約の本文をユーザーに渡して貼り付けてもらう。
- 送ったら `T pushed --notify`。

### 5. 報告
共有先のリンク（タイトルをリンクにして文中に）、タブ・ビュー別の件数、取り込んだ人の編集の要約と警告、確認が要る行（確度 50% 未満・営業 NG）、通知したか。

## チームで使う時の決まり（複数人が別々のセッションでエージェントを動かす場合）
1. **作業の最初に取り込む。** 取り込み（手順 1）をしてから、案件の取り込みや提案文の作成に入る。
2. **作業の最後に書き出して、すぐコミット・プッシュする。** 原本・調査メモ・提案文を溜め込まない。
3. **id が重なったら付け直す。** 書き出し時に、共有先に同じ id で別の企業の行があれば `T renumber <id>` で自分の行の id を変えてから書き出す。
4. **原本（CSV）の変更がぶつかったら、共有先を正とする。** Git の衝突は、共有先から `T pull --all` で取り込み直して解消する。
5. **共有先への共有（招待）は、ユーザーが頼んだ時だけ。** `share.members` / `client_contacts` に書かれていても、招待は宛先を確認してから `share_file` などで行う。

## その他の操作
| 入力の意図 | やること |
|-----------|---------|
| 集計・全体像 | `T stats` を要約し、所見を 3 行 |
| 通知だけ | `T digest` → 手順 4 |
| 検証 | `T validate`。明らかな表記ゆれは `T update` で直し、判断が要るものは列挙 |
| 分類 <軸> | `T list <列>=<値>` または `T list タブ=<タブ名>` |
| 更新 <id> 列=値 | `T update`。ステータス変更時は `次アクション` `期限` も合わせて更新し、最後に共有先を更新 |
| 今週やること | `T stats` の期限切れ表 ＋ `T list ランク=A ステータス=提案作成済` など |
| 出力・Excel・CSV | `T sheet`（タブ分け xlsx）／ `T export`（CSV）を `SendUserFile` |
| 共有の設定を見る・変える | `T share`。変える時は `/sales-hearing`（F 章）か `config.json` の `share` を直して `T share` |
| 分類を見る・変える・プレビュー | `T config` ／ `/sales-hearing` ／ `T sheet --demo` |
| クライアント一覧／切替 | `T clients` ／ `T use <slug>` |

## 原則
- 原本の CSV を手で直接書き換えない（`add` / `update` / `apply` / `pull` を通す）。行は削除せず `ステータス=除外`。
- 共有先のファイル・ページは、ユーザーの指示なく削除・ゴミ箱移動しない。
- 別クライアントのリストと混ぜない。
