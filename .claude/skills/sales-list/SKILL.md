---
name: sales-list
description: 営業先リストをタブ分けしたスプレッドシート（一覧／ランサーズ／クラウドワークス／発注ナビ／Web検索／SNS／その他／凡例）として Google スプレッドシートや Excel に出力し、人がシートで編集したステータス・送付日などを原本に取り込む。集計・検証・分類・ステータス更新・クライアントの切り替えも行う。「スプレッドシートを更新」「シートの変更を取り込んで」「集計して」「送付済にして」「期限切れを見せて」「クライアントを切り替えて」などで使う。
argument-hint: [スプレッドシートを更新 ／ 取り込み ／ 集計 ／ 検証 ／ 分類 <軸> ／ 更新 <id> 列=値 ／ 出力 ／ クライアント一覧 ／ 切替 <slug>] [--client <slug>]
---

# /sales-list — スプレッドシート出力・同期／集計・検証・切替

入力: `$ARGUMENTS`（省略時は `集計`）

ツール: `node sales/scripts/targets.mjs --help`（以下 `T`）／ 列とタブ: `sales/_shared/schema.md`
クライアントの決め方は `/sales-intake` と同じ。`<C>` = `sales/clients/<slug>`。

## スプレッドシートを更新（/sales-intake・/sales-proposal の最後にも実行）

原本は `<C>/list/targets.csv`。スプレッドシートは原本からの出力で、人が編集してよいのはオレンジ見出しの列（ステータス・次アクション・期限・担当者・送付日・接触チャネル・企業名・反応メモ・備考）だけ。

### 0. どの経路で出すか決める
Google のツールを先に確認する（遅延ツールは ToolSearch で `google sheets` `google drive` を検索して読み込む）。Google のファイルを作る・変える前に `google-workspace` スキルを読む。

| 使えるツール | 経路 | リンク |
|-------------|------|--------|
| Google Sheets コネクタ（`get_values` / `update_values` / `update_spreadsheet`） | **A. 同じシートを直接更新**（推奨） | 変わらない |
| Google Drive コネクタのみ | **B. xlsx をアップロードして新しいシートを作る** | 出力のたびに変わる |
| どちらも無い／`spreadsheet.auto_publish` が false | **C. ローカルの xlsx を渡す** | – |

### 1. 人の編集を取り込む（A・B で `spreadsheet.current_id` がある時。必ず出力の前に）
1. 現在のシートを読む（A: `get_values` で各タブの `A:AV`、B: Drive `read_file_content`）。
2. 行ごとに id で原本と突き合わせ、**オレンジ列だけ**差分を拾う。同じ id が「一覧」と各タブの両方にあれば、原本と違う方の値を採る。両方とも違う値に変わっていたら、プラットフォーム別タブの値を採り、報告で知らせる。
3. 差分を JSON（`[{"id":"T-0001","ステータス":"送付済","送付日":"2026-10-08"}, ...]`）にして `T apply <file>`。検証エラー（許可外の値など）は、近い許可値に直せるものは直し、直せないものは報告する。
4. `企業名` が別の候補に変わった行は、`/sales-proposal <id> 候補N` で提案文_直接を作り直す。
5. 原本に無い行（人がシートに直接足した行）は取り込まず、報告に列挙する（`/sales-intake` で登録し直すよう案内）。

### 2. 出力する
- 経路 A（Sheets コネクタ）:
  - `current_id` が無ければ: `T sheet` で xlsx を作り、Drive `create_file`（`contentMimeType` = `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`、`base64Content` = xlsx の base64）で作成。以降はこのファイルを使い続ける。
  - `current_id` があれば: 新しい行は該当タブの最終行の下に `update_values` で追記し、既存行はエージェントが書く列（オレンジ以外）だけを `update_values` で上書きする。「一覧」も同様。日付や数字のように見える文字列（`2026-10-08`、先頭 0 の番号など）は先頭に `'` を付けて文字列のまま書く。並び替えや書式は `update_spreadsheet` で。
- 経路 B（Drive のみ）:
  1. `T sheet --active-only` で xlsx を作る（出力されるサイズを見る。300KB 超えなら経路 C を案内）。
  2. `base64 -w0 <C>/list/targets.xlsx` を Drive `create_file` の `base64Content` に渡す。`title` は `T sheet` が出す推奨タイトル、`parentId` は `spreadsheet.folder_id`（無ければ最初に Drive でフォルダ `営業リスト_<クライアント名>` を作って記録）。
  3. 古いシートは `update_file` で名前の先頭に `（旧）` を付ける。**削除・ゴミ箱へは移さない。**
- 経路 C: `T sheet` を実行し、`<C>/list/targets.xlsx` を `SendUserFile` で渡す。Google スプレッドシートで使う場合は「ファイル → インポート → アップロード → スプレッドシートを置換」で同じ URL のまま差し替えられると伝える。

### 3. 確認と記録
- A・B は作ったシートを `read_file_content`（または `get_values`）で読み、タブ名と行数が `T sheet` の出力と一致するか確認する。
- `<C>/config.json` の `spreadsheet` に `current_id` `current_url` を書き、古い id は `previous_ids` に足す。
- 報告: シートのリンク（タイトルをリンクにして文中に）、タブ別件数、取り込んだ人の編集の要約、確認が要る行（確度 50% 未満・営業 NG）。

## その他の操作
| 入力の意図 | やること |
|-----------|---------|
| 集計・全体像 | `T stats`（タブ別・サービス別・ランク・ステータス・特定確度・提案文の作成状況・期限切れ）を要約し、所見を 3 行 |
| 検証 | `T validate`。明らかな表記ゆれは `T update` で直し、判断が要るものは列挙 |
| 分類 <軸> | `T list <列>=<値>` を値ごとに。タブ × サービスのクロス表は `T stats` にある |
| 更新 <id> 列=値 | `T update`。ステータス変更時は `次アクション` `期限` も合わせて更新し、最後にスプレッドシートを更新 |
| 今週やること | `T stats` の期限切れ表 ＋ `T list ランク=A ステータス=提案作成済` など |
| 出力・Excel | `T sheet`（タブ分け xlsx）または `T export`（1 枚の CSV）を作って `SendUserFile` |
| クライアント一覧／切替 | `T clients` ／ `T use <slug>` |

## 原則
- 原本は常に `targets.csv`。CSV を手で直接書き換えない（`add` / `update` / `apply` を通す）。
- 行は削除しない。不要な行は `ステータス=除外`＋備考に理由。
- Google のファイルはユーザーの指示なく削除・ゴミ箱移動しない。
- 別クライアントのリストと混ぜない。
