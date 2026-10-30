"""Scannable learning cards using the existing native reader, without UI changes."""
import copy
import re

def emphasis(text):
    if '**' in text:
        return text
    # Emphasize only a few learning anchors, never whole paragraphs.
    for token in ['3系統','6人称','हो','छ','हुन्छ']:
        if token in text:
            if token in ['हो','छ','हुन्छ']:
                pattern=r'(?<![\u0900-\u097f])'+token+r'(?![\u0900-\u097f])'
                text,n=re.subn(pattern,'**'+token+'**',text,count=1)
                if n:return text
            else:return text.replace(token,'**'+token+'**',1)
    return text

def short_paragraphs(text,lang):
    if not text:return []
    # Preserve explicit steps, sentence order and every word of the explanation.
    lines=text.split('\n')
    out=[]
    for line in lines:
        sentences=re.findall(r'.+?(?:。|$)',line) if lang=='ja' else re.split(r'(?<=[.!?])\s+(?=[A-Z])',line)
        for sentence in sentences:
            if sentence.strip():out.append({'type':'p','text':emphasis(sentence.strip())})
    return out

def detail_blocks(blocks,lang):
    result=[]
    for old in blocks:
        b=copy.deepcopy(old)
        if b.get('type')=='note':
            b['type']='p';b['text']=('**ここもチェック**\n' if lang=='ja' else '**Also check**\n')+b.get('text','').replace('⚠️','').replace('⚠','').strip()
        if b.get('type')=='p' and not b.get('beginnerIntroEnd'):
            text=b.get('text','')
            # Full construction rules are already taught above. Keep only the
            # sentence-specific comments instead of repeating the same rule.
            prefix='しくみ：' if lang=='ja' else 'How it works: '
            if text.startswith(prefix):
                from revise_grammar_curriculum import RULES
                for rule in RULES.values():
                    base=prefix+rule[2 if lang=='ja' else 3]
                    if text.startswith(base):
                        text=text[len(base):].strip()
                        if text:text=('**この文のポイント**\n' if lang=='ja' else '**In this sentence**\n')+text
                        break
            result.extend(short_paragraphs(text,lang))
        elif b.get('type')=='table':
            b['headers']=[emphasis(x) for x in b['headers']]
            b['rows']=[[emphasis(x) for x in row] for row in b['rows']]
            result.append(b)
        else:
            if b.get('text'):b['text']=emphasis(b['text'])
            result.append(b)
    return result

def color_blocks(blocks,lang):
    """Optional semantic presentation; older readers safely ignore metadata."""
    result=copy.deepcopy(blocks)
    section='details'
    for b in result:
        text=b.get('text','')
        if b.get('beginnerIntroEnd'):continue
        if b['type']=='goal':
            b['presentation']={'tone':'blue','role':'body'};continue
        if b['type']=='h':
            if text.startswith('① '):section='example'
            elif text.startswith('② '):section='steps'
            elif text in ['まちがい注意','Watch out']:section='caution'
            elif text.startswith('③ '):section='check'
            elif text.startswith(('हुनुの地図','Your हुनु map')):section='map'
            else:section='details'
            tone={'example':'green','steps':'violet','caution':'rose','check':'teal','map':'blue','details':'blue'}[section]
            if 'छ系：' in text or 'छ set:' in text:tone='green'
            if 'हुन्छ系：' in text or 'हुन्छ set:' in text:tone='violet'
            b['presentation']={'tone':tone,'role':'plain'}
        elif b['type']=='table':
            b['presentation']={'tone':'blue'}
            first=[str(r[0]).replace('**','') for r in b['rows']]
            if len(first)==3 and all(any(s.startswith(form) for s in first) for form in ['हो','छ','हुन्छ']):
                b['presentation']['rowTones']=['blue','green','violet']
        elif b['type']=='p' and text:
            tone={'example':'green','steps':'violet','caution':'rose','check':'teal','map':'blue','details':'blue'}[section]
            role='body' if section in ['example','caution','check','map'] else 'plain'
            if section=='example':role='example' if text.startswith('**') else 'reading'
            if section=='steps' and re.match(r'^\*\*\d+\*\*\s',text):role='step'
            b['presentation']={'tone':tone,'role':role}
    # Connect consecutive example lines and check answers into one visual card.
    i=0
    while i<len(result):
        b=result[i];pres=b.get('presentation',{})
        if b['type']=='p' and pres.get('tone') in ['green','teal'] and pres.get('role')!='plain':
            j=i+1
            while j<len(result) and result[j]['type']=='p' and result[j].get('presentation',{}).get('tone')==pres['tone'] and result[j].get('presentation',{}).get('role')!='plain':j+=1
            if j-i>1:
                for n in range(i,j):result[n]['presentation']['join']='start' if n==i else 'end' if n==j-1 else 'middle'
                if pres['tone']=='green':result[j-1]['presentation']['role']='translation'
            i=j
        else:i+=1
    return result
