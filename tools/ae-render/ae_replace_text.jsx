// @ts-nocheck
/*
 * ae_replace_text.jsx
 *
 * After Effects 用 ExtendScript (ES3)。run.mjs から生成されるラッパー経由で実行される。
 *
 * 1. ジョブファイル (job.json) を読む
 * 2. 行ごとにテンプレート .aep を開き、テキストレイヤーの Source Text を差し替える
 * 3. 行ごとの .aep として保存する (レンダリングは aerender 側で行う)
 * 4. 結果を result.json に書き出す
 *
 * 前提: AE の「環境設定 > スクリプトとエクスプレッション >
 *       スクリプトによるファイルへの書き込みとネットワークへのアクセスを許可」が ON。
 *
 * ラッパーは $.global.AE_RENDER_JOB_PATH にジョブファイルのパスを入れてからこのファイルを評価する。
 * 結果はジョブファイルと同じフォルダの result.json に書かれる。
 * 単体で実行した場合はファイル選択ダイアログでジョブファイルを選ぶ。
 */
(function () {
    function readText(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) throw new Error("ファイルを開けません: " + file.fsName);
        var s = file.read();
        file.close();
        return s;
    }

    function writeText(file, text) {
        file.encoding = "UTF-8";
        file.lineFeed = "Unix";
        if (!file.open("w")) throw new Error("ファイルに書き込めません: " + file.fsName);
        file.write(text);
        file.close();
    }

    // ExtendScript には JSON がない。ジョブファイルは run.mjs が生成したものだけを想定している。
    function parseJson(text) {
        return eval("(" + text + ")");
    }

    function quote(s) {
        return '"' + String(s)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t") + '"';
    }

    function toJson(v) {
        if (v === null || v === undefined) return "null";
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (typeof v === "string") return quote(v);
        var parts = [], k, i;
        if (v instanceof Array) {
            for (i = 0; i < v.length; i++) parts.push(toJson(v[i]));
            return "[" + parts.join(",") + "]";
        }
        for (k in v) if (v.hasOwnProperty(k)) parts.push(quote(k) + ":" + toJson(v[k]));
        return "{" + parts.join(",") + "}";
    }

    function findComp(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem && it.name === name) return it;
        }
        return null;
    }

    // key は "レイヤー名" (全コンポを検索) か "コンポ名/レイヤー名" (そのコンポ内のみ)。
    function findTextLayers(key) {
        var compName = null, layerName = key, slash = key.indexOf("/");
        if (slash > 0) {
            compName = key.substring(0, slash);
            layerName = key.substring(slash + 1);
        }
        var found = [];
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (!(it instanceof CompItem)) continue;
            if (compName !== null && it.name !== compName) continue;
            for (var j = 1; j <= it.numLayers; j++) {
                var layer = it.layer(j);
                if (layer.name === layerName && layer instanceof TextLayer) found.push(layer);
            }
        }
        return found;
    }

    function setSourceText(layer, text) {
        text = String(text).replace(/\r\n|\n/g, "\r"); // AE のテキストの改行は \r
        var prop = layer.property("ADBE Text Properties").property("ADBE Text Document");
        if (prop.numKeys > 0) {
            // キーフレーム付きの場合は全キーの文字だけ差し替え、スタイルは各キーのものを保つ
            for (var k = 1; k <= prop.numKeys; k++) {
                var kd = prop.keyValue(k);
                kd.text = text;
                prop.setValueAtKey(k, kd);
            }
        } else {
            var doc = prop.value;
            doc.text = text;
            prop.setValue(doc);
        }
    }

    function processRow(job, row) {
        var res = { id: row.id, ok: false, project: null, warnings: [] };
        var tmpl = new File(job.template);
        if (!tmpl.exists) throw new Error("テンプレートが見つかりません: " + job.template);
        app.open(tmpl);

        var compName = row.comp || job.comp;
        if (!findComp(compName)) throw new Error("コンポが見つかりません: " + compName);

        for (var key in row.texts) {
            if (!row.texts.hasOwnProperty(key)) continue;
            var layers = findTextLayers(key);
            if (layers.length === 0) {
                res.warnings.push("テキストレイヤーが見つかりません: " + key);
                continue;
            }
            for (var i = 0; i < layers.length; i++) setSourceText(layers[i], row.texts[key]);
        }

        var out = new File(job.projectDir + "/" + row.id + ".aep");
        app.project.save(out);
        res.project = out.fsName;
        res.comp = compName;
        res.ok = true;
        return res;
    }

    var jobPath = $.global.AE_RENDER_JOB_PATH;
    var jobFile = jobPath ? new File(jobPath) : File.openDialog("job.json を選択", "*.json");
    if (!jobFile) return;
    // ジョブの読み込みに失敗してもランナーが待ち続けないよう、結果ファイルの場所はジョブと同じフォルダに固定する
    var resultFile = new File(jobFile.parent.fsName + "/result.json");
    var job = null, results = [];

    try {
        job = parseJson(readText(jobFile));
        var projectDir = new Folder(job.projectDir);
        if (!projectDir.exists) projectDir.create();

        // 開いている作業中のプロジェクトがあれば保存確認を出してから閉じる
        app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
        app.beginSuppressDialogs();
        for (var r = 0; r < job.rows.length; r++) {
            var row = job.rows[r];
            try {
                results.push(processRow(job, row));
            } catch (e) {
                results.push({ id: row.id, ok: false, error: String(e.message || e), warnings: [] });
            }
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        }
        app.endSuppressDialogs(false);
        writeText(resultFile, toJson({ done: true, results: results }));
    } catch (e) {
        writeText(resultFile, toJson({ done: false, error: String(e.message || e), results: results }));
    }

    if (job && job.quitWhenDone) app.quit();
})();
