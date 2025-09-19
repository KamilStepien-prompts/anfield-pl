#!/usr/bin/env python3
# embed_events.py
import json, html, sys, os

IN = 'exports/anfield_live_events.json'
TEMPLATE = 'index_template.html'
OUT = 'index_published.html'
MARKER_START = '<!-- LIVE_EVENTS_MARKER_START -->'
MARKER_END = '<!-- LIVE_EVENTS_MARKER_END -->'

if not os.path.exists(IN):
    print('Place exported JSON from localStorage as', IN)
    sys.exit(1)

with open(IN,'r',encoding='utf-8') as f:
    raw = json.load(f)

events = raw.get('events', raw)

nodes = []
for e in events:
    t = e.get('type','moment')
    minute = (str(e.get('minute')) + "'") if e.get('minute') else (e.get('tstamp') or '')
    author = f"<div class='evt__author'><em>{html.escape(e.get('author') or '')}</em></div>" if e.get('author') else ''
    text = html.escape(e.get('text') or '').replace('\n','<br/>')
    nodes.append(f"<article class='evt evt--{html.escape(t)}'>\n  <div class='evt__meta'><time>{html.escape(minute)}</time> <span class='evt__type'>{html.escape(t.upper())}</span></div>\n  <div class='evt__body'>{author}<div class='evt__text'>{text}</div></div>\n</article>")

snippet = '\n'.join(nodes)

with open(TEMPLATE,'r',encoding='utf-8') as f:
    template = f.read()

if MARKER_START not in template or MARKER_END not in template:
    print('Markers missing in template. Add markers:', MARKER_START, MARKER_END)
    sys.exit(1)

start = template.find(MARKER_START) + len(MARKER_START)
end = template.find(MARKER_END)
newdoc = template[:start] + '\n' + snippet + '\n' + template[end:]
with open(OUT,'w',encoding='utf-8') as f:
    f.write(newdoc)

print('Generated', OUT)
