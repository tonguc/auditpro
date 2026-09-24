"""Read-only bounded public-site capture; independent stdlib parser baseline."""
import json, hashlib, pathlib, urllib.request, time
from html.parser import HTMLParser
class Reference(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.head=False;self.title=False;self.inert=0;self.titles=[];self.descriptions=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='template':self.inert+=1
  if self.inert:return
  if tag=='head':self.head=True
  if tag=='title' and self.head:self.title=True;self.titles.append('')
  if tag=='meta' and self.head and (a.get('name') or '').strip().lower()=='description':self.descriptions.append(a.get('content') or '')
 def handle_endtag(self,tag):
  if tag=='template':self.inert=max(0,self.inert-1)
  if self.inert:return
  if tag=='title':self.title=False
  if tag=='head':self.head=False
 def handle_data(self,data):
  if self.title and not self.inert:self.titles[-1]+=data
folder=pathlib.Path('design/validation-matrix/real-snapshots');folder.mkdir(parents=True,exist_ok=True)
urls=['https://tonguckaracay.com/en','https://tonguckaracay.com/about','https://tonguckaracay.com/contact','https://drkemaltuskan.com/','https://drkemaltuskan.com/blog/burun-tikanikligi-nedenleri/']
rows=[]
for i,url in enumerate(urls):
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Povlex/1.0 read-only validation'}),timeout=20) as r:
   data=r.read(2000001)
   if len(data)>2000000:raise ValueError('body exceeds 2MB limit')
   content_type=r.headers.get('content-type','');final=r.url;status=r.status
   if 'text/html' not in content_type.lower():raise ValueError('non-HTML '+content_type)
   html=data.decode(r.headers.get_content_charset() or 'utf-8',errors='replace')
  parser=Reference();parser.feed(html)
  path=folder/f'{i}.html';path.write_text(html,encoding='utf-8')
  norm=lambda values:[' '.join(value.split()) for value in values]
  rows.append(dict(requested=url,url=final,status=status,file=str(path),sha256=hashlib.sha256(html.encode()).hexdigest(),titles=norm(parser.titles),descriptions=norm(parser.descriptions)))
 except Exception as error:rows.append(dict(requested=url,error=str(error)))
 time.sleep(.5)
(folder/'reference.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'url':r.get('url',r['requested']),'status':r.get('status'),'error':r.get('error')} for r in rows]))
