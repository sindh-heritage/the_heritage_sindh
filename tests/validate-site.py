from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
class Structure(HTMLParser):
 def __init__(self):
  super().__init__();self.stack=[];self.ids=[];self.refs=[];self.assets=[];self.scenes=[];self.chapters=[];self.classes=Counter()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if 'data-scene' in a:self.scenes.append(a['data-scene'])
  if 'data-chapter' in a:self.chapters.append(a['data-chapter'])
  self.classes.update(a.get('class','').split())
  for key in ['href','src','aria-controls','aria-labelledby']:
   v=a.get(key,'')
   if v.startswith('./'):self.assets.append(v)
   if v.startswith('#'):self.refs.append(v[1:])
   if key.startswith('aria-'):self.refs.extend(v.split())
  if tag not in {'meta','link','img','br','hr','input','source','area','wbr','embed'}:self.stack.append(tag)
 def handle_endtag(self,tag):
  assert self.stack and self.stack[-1]==tag,f'Misnested {tag}: {self.stack[-5:]}'
  self.stack.pop()
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if self.stack and self.stack[-1]==tag:self.stack.pop()
s=(ROOT/'index.html').read_text();c=Structure();c.feed(s)
assert not c.stack,c.stack
assert len(c.ids)==len(set(c.ids)), 'Duplicate SVG or HTML IDs'
assert c.chapters==[f'{i:02d}' for i in range(1,14)]
assert c.scenes==['city','river','cloth']
assert c.classes['story-beat']==9
assert c.classes['city-building']==16
assert c.classes['cloth-motif']==24
assert all(x in c.ids for x in c.refs),set(c.refs)-set(c.ids)
assert all((ROOT/x).is_file() for x in c.assets),'Broken local asset'
for svg in re.findall(r'<svg\b.*?</svg>',s,re.S):ET.fromstring(svg)
for svg in (ROOT/'assets').rglob('*.svg'):ET.parse(svg)
for css in (ROOT/'css').glob('*.css'):
 text=css.read_text();assert text.count('{')==text.count('}'),css
 for item in re.findall(r"url\(['\"]?([^)'\"]+)",text):
  if not item.startswith('http'):assert (css.parent/item).exists(),item
print('PASS: balanced HTML; SVG parsing and unique IDs; 13 chapters; 3 scenes; 9 beats; 16 buildings; 24 motifs; local assets and references.')
