from pathlib import Path
from PIL import Image,ImageDraw
import json,math
root=Path('reference/captures');routes=json.load(open('reference/routes.json'))
for view in ['desktop','mobile']:
 for start in range(0,len(routes),5):
  group=routes[start:start+5];cols=[]
  for r in group:
   key='home' if r=='/' else r[1:].replace('/','__');p=root/key/view/'full.png'
   if not p.exists():continue
   im=Image.open(p).convert('RGB');w=300;im=im.resize((w,round(im.height*w/im.width)))
   col=Image.new('RGB',(w,max(im.height+60,400)),'#eee');col.paste(im,(0,60));ImageDraw.Draw(col).text((5,5),r[:42],fill='black');cols.append(col)
  if not cols:continue
  sheet=Image.new('RGB',(sum(c.width for c in cols),max(c.height for c in cols)),'white');x=0
  for c in cols:sheet.paste(c,(x,0));x+=c.width
  sheet.save(f'reference/contact-sheet-{view}-{start//5+1}.png')
