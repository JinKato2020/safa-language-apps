"""Apply artifact-authored cells while retaining the existing workbook package.

The artifact exporter also rewrites unrelated styles. Only candidate cell values
are transferred to the original sheet; all other workbook parts remain byte-identical.
"""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from copy import deepcopy
import xml.etree.ElementTree as E
import json,re

root=Path(__file__).resolve().parents[2]
w=root/'.work-grammar-redesign'
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
M='{'+ns['m']+'}'
E.register_namespace('',ns['m'])
E.register_namespace('r',ns['r'])
def contents(file):
 with ZipFile(file) as z:return {n:z.read(n) for n in z.namelist()}
def target(parts):
 wb=E.fromstring(parts['xl/workbook.xml'])
 rid=next(x.attrib[ns['r'].join(['{','}id'])] for x in wb.find(M+'sheets') if x.attrib['name']=='v2文法例文')
 rel=E.fromstring(parts['xl/_rels/workbook.xml.rels'])
 name=next(x.attrib['Target'] for x in rel if x.attrib['Id']==rid)
 return name.lstrip('/') if name.startswith('/') else 'xl/'+name
def value(cell,parts):
 t=cell.attrib.get('t');v=cell.find(M+'v')
 if t=='inlineStr':return ''.join(x.text or '' for x in cell.findall('.//'+M+'t'))
 if t=='s' and v is not None:
  si=list(E.fromstring(parts['xl/sharedStrings.xml']))[int(v.text)]
  return ''.join(x.text or '' for x in si.iter(M+'t'))
 return v.text if v is not None else None
original=contents(w/'examples-before.xlsx');candidate=contents(w/'examples-candidate.xlsx')
op=target(original);cp=target(candidate)
tree=E.fromstring(original[op]);newtree=E.fromstring(candidate[cp])
newcells={c.attrib['r']:c for c in newtree.iter(M+'c')}
rows=json.loads((w/'xlsx-rows.json').read_text('utf-8'))
style_before={c.attrib['r']:c.attrib.get('s') for c in tree.iter(M+'c')}
for row in tree.find(M+'sheetData'):
 n=int(row.attrib['r'])
 if n<2:continue
 for cell in list(row):
  address=cell.attrib.get('r','')
  if not re.fullmatch('[A-G][0-9]+',address):continue
  for ch in list(cell):
   if ch.tag in [M+'v',M+'is',M+'f']:cell.remove(ch)
  cell.attrib.pop('t',None)
  v=value(newcells[address],candidate) if address in newcells and n<=len(rows)+1 else None
  if v is not None:
   src=newcells[address]
   if src.attrib.get('t') in ['s','inlineStr']:
    cell.attrib['t']='inlineStr';inline=E.SubElement(cell,M+'is');E.SubElement(inline,M+'t').text=v
   else:E.SubElement(cell,M+'v').text=v
style_after={c.attrib['r']:c.attrib.get('s') for c in tree.iter(M+'c')}
assert style_before==style_after
original[op]=E.tostring(tree,encoding='utf-8',xml_declaration=True)
out=root/'聞いて話せるネパール語/コンテンツ/例文一覧.xlsx'
with ZipFile(out,'w',ZIP_DEFLATED) as z:
 for name,data in original.items():z.writestr(name,data)
actual=contents(out);prior=contents(w/'examples-before.xlsx')
assert all(actual[k]==v for k,v in prior.items() if k!=op),'Unrelated workbook part changed'
ar=E.fromstring(actual[op]);cells={c.attrib['r']:c for c in ar.iter(M+'c')}
for i,row in enumerate(rows,2):
 for j,v in enumerate(row):assert value(cells[f'{chr(65+j)}{i}'],actual)==str(v),(i,j)
for i in range(len(rows)+2,716):
 assert all(value(cells[f'{c}{i}'],actual) in [None,''] for c in 'ABCDEFG')
print(f'PASS workbook: {len(rows)} rows match CSV; every cell style retained; all unrelated ZIP parts byte-identical')
