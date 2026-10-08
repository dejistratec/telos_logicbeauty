#!/usr/bin/env python3
"""Excel（.xlsx）に人が書き込んだ営業先リストを、targets.mjs pull に渡す JSON に変換する。

  python3 -I sales/scripts/xlsx_rows.py <編集済み.xlsx> > rows.json
  node sales/scripts/targets.mjs pull rows.json

すべてのタブ（凡例を除く）を読み、id ごとに 1 行にまとめる。
同じ id が複数のタブにあって値が違う場合は、ほかのタブの値を "_alt" に入れて渡す。
pull は、原本と違う（＝人が変えた）方の値を採る。
必要: openpyxl（無ければ pip install openpyxl）
"""
import json
import sys

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl がありません。pip install openpyxl を実行してください")


def cell_text(v):
    if v is None:
        return ""
    if hasattr(v, "strftime"):
        return v.strftime("%Y-%m-%d %H:%M") if getattr(v, "hour", 0) or getattr(v, "minute", 0) else v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = {}
    # 「一覧」は最後に読む（値がぶつかった時は分類別タブの値が先頭になる）
    for ws in sorted(wb.worksheets, key=lambda w: w.title == "一覧"):
        if ws.title == "凡例":
            continue
        it = ws.iter_rows(values_only=True)
        header = [cell_text(h) for h in next(it, [])]
        if "id" not in header:
            continue
        for values in it:
            rec = {h: cell_text(v) for h, v in zip(header, values) if h}
            rid = rec.get("id", "").strip()
            if not rid:
                if any(rec.values()):
                    rows.setdefault(f"__new_{len(rows)}", rec)
                continue
            cur = rows.setdefault(rid, {})
            for k, v in rec.items():
                if k not in cur:
                    cur[k] = v
                elif cur[k] != v:
                    alt = cur.setdefault("_alt", {}).setdefault(k, [])
                    if v not in alt:
                        alt.append(v)
    out = []
    for key, rec in rows.items():
        if key.startswith("__new_"):
            rec.pop("id", None)
        out.append(rec)
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
