#!/usr/bin/env python3
import json, html, sys, os, argparse
from pathlib import Path

MARKER_START = "<!-- LIVE_EVENTS_MARKER_START -->"
MARKER_END   = "<!-- LIVE_EVENTS_MARKER_END -->"

def build_events_html(events):
    nodes = []
    for e in events:
        t = e.get('type','moment')
        minute = (str(e.get('minute')) + "'") if e.get('minute') else (e.get('tstamp') or '')
        author = f"<div class='evt__author'><em>{html.escape(e.get('author') or '')}</em></div>" if e.get('author') else ''
        text = html.escape(e.get('text') or '').replace('\n','<br/>')
        nodes.append(
            f"<article class='evt evt--{html.escape(t)}'>\n"
            f"  <div class='evt__meta'><time>{html.escape(minute)}</time> "
            f"<span class='evt__type'>{html.escape(t.upper())}</span></div>\n"
            f"  <div class='evt__body'>{author}<div class='evt__text'>{text}</div></div>\n"
            f"</article>"
        )
    return "\n".join(nodes)

def inject_into_file(html_path: Path, events_html: str):
    src = html_path.read_text(encoding="utf-8")
    if MARKER_START not in src or MARKER_END not in src:
        print(f"❌ Brak markerów w {html_path}. Dodaj:\n{MARKER_START}\n{MARKER_END}")
        sys.exit(1)
    pre, rest = src.split(MARKER_START, 1)
    _, post = rest.split(MARKER_END, 1)
    out = pre + MARKER_START + "\n" + events_html + "\n" + MARKER_END + post
    html_path.write_text(out, encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(description="Embed live events JSON into target HTML between markers.")
    ap.add_argument("--in", dest="json_in", default="exports/anfield_live_events.json", help="Input JSON (default: exports/anfield_live_events.json)")
    ap.add_argument("--target", dest="target_html", required=True, help="Target HTML to inject (e.g. felieton/.../index.html)")
    args = ap.parse_args()

    json_path = Path(args.json_in)
    target = Path(args.target_html)

    if not json_path.exists():
        print("❌ Nie znaleziono JSON:", json_path)
        sys.exit(1)
    if not target.exists():
        print("❌ Nie znaleziono pliku docelowego HTML:", target)
        sys.exit(1)

    raw = json.loads(json_path.read_text(encoding="utf-8"))
    events = raw.get("events", raw)
    html_snippet = build_events_html(events)
    inject_into_file(target, html_snippet)
    print(f"✅ Wstrzyknięto {len(events)} wydarzeń do {target}")

if __name__ == "__main__":
    main()
