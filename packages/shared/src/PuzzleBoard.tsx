import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useI18n } from './i18n';
import { useScaleStyle } from './SettingsContext';
import { insidePuzzleRect, insertPuzzleToken, puzzleInsertion, type PuzzlePoint, type PuzzleRect } from './puzzleDrag';

type Token = { id: string; text: string; roman: string };
type Drag = { id: string; point: PuzzlePoint; root: PuzzleRect; answer: PuzzleRect; bank: PuzzleRect; cards: PuzzleRect[]; index: number | null; remove: boolean };
const measure = (view: View | null) => new Promise<PuzzleRect | null>(resolve => { if (!view) return resolve(null); view.measureInWindow((x,y,width,height)=>resolve({x,y,width,height})); });

function DraggableWord({ token, selected, disabled, testID, register, tap, start, move, finish, cancel, earlier, later }: {
  token: Token; selected: boolean; disabled: boolean; testID: string; register?: (node: View | null) => void; tap: () => void;
  start: (id: string, point: PuzzlePoint) => void; move: (point: PuzzlePoint) => void; finish: (point: PuzzlePoint) => void; cancel: () => void;
  earlier?: () => void; later?: () => void;
}) {
  const ss=useScaleStyle(),{lang, copy: trCopy }=useI18n(),en=lang==='en',active=useRef(false),suppressTap=useRef(false);
  const callbacks=useRef({start,move,finish,cancel,disabled});callbacks.current={start,move,finish,cancel,disabled};
  const begin=(point: PuzzlePoint)=>{if(active.current||callbacks.current.disabled)return;active.current=true;suppressTap.current=true;callbacks.current.start(token.id,point);};
  const end=(point: PuzzlePoint)=>{if(!active.current)return;active.current=false;callbacks.current.finish(point);};
  const abort=()=>{if(!active.current)return;active.current=false;callbacks.current.cancel();};
  const responder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>false,
    onMoveShouldSetPanResponderCapture:(_e,g)=>!callbacks.current.disabled&&(active.current||(Math.abs(g.dx)>10&&Math.abs(g.dx)>Math.abs(g.dy)*1.2)),
    onPanResponderGrant:(_e,g)=>begin({x:g.x0,y:g.y0}),
    onPanResponderMove:(_e,g)=>{if(g.numberActiveTouches>1){abort();return;}if(active.current)callbacks.current.move({x:g.moveX,y:g.moveY});},
    onPanResponderRelease:(e)=>end({x:e.nativeEvent.pageX,y:e.nativeEvent.pageY}),
    onPanResponderTerminate:abort,
    onPanResponderTerminationRequest:()=>!active.current,
    onShouldBlockNativeResponder:()=>active.current,
  }),[token.id]);
  return <View ref={register} collapsable={false} style={styles.tileWrap} {...responder.panHandlers} onTouchEnd={e=>end({x:e.nativeEvent.pageX,y:e.nativeEvent.pageY})} onTouchCancel={abort}>
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={selected?`${trCopy('c_498f3bd78d67', '取り消す', 'Remove')}: ${token.text}`:token.text} accessibilityHint={trCopy('c_49dc3b3897f7', 'タップで追加・取り消し。長押ししてドラッグで移動。', 'Tap to add or remove. Hold and drag to move.')} accessibilityState={{disabled}} disabled={disabled}
      accessibilityActions={[{name:'activate'},...(earlier?[{name:'earlier',label:trCopy('c_da9485c9a6f6', '前へ移動', 'Move earlier')}]:[]),...(later?[{name:'later',label:trCopy('c_edc691a67452', '後ろへ移動', 'Move later')}]:[])]}
      onAccessibilityAction={e=>{if(e.nativeEvent.actionName==='earlier')earlier?.();else if(e.nativeEvent.actionName==='later')later?.();else if(e.nativeEvent.actionName==='activate')tap();}}
      onPressIn={()=>{suppressTap.current=false;}} onLongPress={e=>begin({x:e.nativeEvent.pageX,y:e.nativeEvent.pageY})} delayLongPress={180} onPress={()=>{if(!suppressTap.current)tap();}}
      style={[styles.tile,selected&&styles.chosen,disabled&&styles.used]}><Text style={[styles.nepali,ss(24,36)]}>{token.text}</Text>{!selected&&!!token.roman&&<Text style={[styles.muted,ss(13,21)]}>{token.roman}</Text>}</Pressable>
  </View>;
}

export function PuzzleBoard({tokens,order,limit,onChange,onDragging,disabled=false}:{tokens:Token[];order:string[];limit:number;onChange:(order:string[])=>void;onDragging:(active:boolean)=>void;disabled?:boolean}) {
  const {lang, copy: trCopy }=useI18n(),en=lang==='en',ss=useScaleStyle();
  const root=useRef<View>(null),answer=useRef<View>(null),bank=useRef<View>(null),nodes=useRef(new Map<string,View>());
  const [drag,setDrag]=useState<Drag|null>(null),live=useRef<Drag|null>(null),generation=useRef(0),latestPoint=useRef<PuzzlePoint>({x:0,y:0});
  const byId=new Map(tokens.map(t=>[t.id,t]));
  const cancel=()=>{generation.current++;live.current=null;setDrag(null);onDragging(false);};
  useEffect(()=>()=>{generation.current++;onDragging(false);},[onDragging]);
  const move=(point:PuzzlePoint)=>{latestPoint.current=point;const d=live.current;if(!d)return;const next={...d,point,index:puzzleInsertion(point,d.answer,d.cards),remove:order.includes(d.id)&&insidePuzzleRect(point,d.bank)};live.current=next;setDrag(next);};
  const start=async(id:string,point:PuzzlePoint)=>{
    const run=++generation.current;latestPoint.current=point;onDragging(true);
    const remaining=order.filter(value=>value!==id);
    const [r,a,b,...cards]=await Promise.all([measure(root.current),measure(answer.current),measure(bank.current),...remaining.map(value=>measure(nodes.current.get(value)??null))]);
    if(run!==generation.current)return;
    if(!r||!a||!b||cards.some(c=>!c)){cancel();return;}
    live.current={id,point:latestPoint.current,root:r,answer:a,bank:b,cards:cards as PuzzleRect[],index:null,remove:false};move(latestPoint.current);
  };
  const finish=(point:PuzzlePoint)=>{move(point);const d=live.current;if(d){if(d.remove)onChange(order.filter(id=>id!==d.id));else if(d.index!==null)onChange(insertPuzzleToken(order,d.id,d.index,limit));}cancel();};
  const marker=drag?.index==null?null:drag.cards[drag.index]??drag.cards.at(-1);
  const markerX=drag&&marker?(drag.index===drag.cards.length?marker.x+marker.width+3:marker.x-5):drag?drag.answer.x+15:0;
  const markerY=drag&&marker?marker.y:drag?drag.answer.y+44:0;
  return <View ref={root} collapsable={false} style={styles.board}>
    <View ref={answer} collapsable={false} testID="free-answer" style={[styles.answer,drag?.index!=null&&styles.dropActive]}>
      {/* Localize the UI row; keep Nepali tiles and drag coordinates LTR. */}
      <View style={[styles.answerHeading,{direction:lang==='ar'?'rtl':'ltr'}]}><Text testID="puzzle-answer-label" style={[styles.answerLabel,ss(14,23)]}>{trCopy('c_bd2e3d2922bd', '組み立てる文', 'YOUR SENTENCE')}</Text><Text testID="puzzle-answer-count" style={[styles.muted,{writingDirection:'ltr'},ss(13,22)]}>{order.length} / {limit}</Text></View>
      <View style={styles.cards}>{order.length?order.map((id,i)=><DraggableWord key={id} token={byId.get(id)!} selected disabled={disabled} testID={`free-remove-${i}`} register={node=>{if(node)nodes.current.set(id,node);else nodes.current.delete(id);}} tap={()=>onChange(order.filter(value=>value!==id))} start={start} move={move} finish={finish} cancel={cancel} earlier={i>0?()=>onChange(insertPuzzleToken(order,id,i-1,limit)):undefined} later={i<order.length-1?()=>onChange(insertPuzzleToken(order,id,i+1,limit)):undefined}/>):<Text testID="puzzle-answer-placeholder" style={[styles.placeholder,{width:'100%'},ss(18,29)]}>{trCopy('c_11c0ed797c03', '語句をタップ、またはここへドラッグ', 'Tap or drag words here')}</Text>}</View>
    </View>
    <View ref={bank} collapsable={false} testID="free-bank" style={[styles.cards,styles.bank,drag?.remove&&styles.returnActive]}>{tokens.map(token=><DraggableWord key={token.id} token={token} selected={false} disabled={disabled||order.includes(token.id)||order.length>=limit} testID={`free-token-${token.id}`} tap={()=>onChange(insertPuzzleToken(order,token.id,order.length,limit))} start={start} move={move} finish={finish} cancel={cancel}/>)}</View>
    {drag&&<>
      {drag.index!==null&&<View pointerEvents="none" testID="puzzle-insertion" style={[styles.marker,{left:markerX-drag.root.x,top:markerY-drag.root.y,height:marker?.height??42}]}/>}
      <View pointerEvents="none" testID="puzzle-drag-preview" style={[styles.ghost,{left:drag.point.x-drag.root.x-36,top:drag.point.y-drag.root.y-60}]}><Text style={[styles.ghostText,ss(25,38)]}>{byId.get(drag.id)?.text}</Text></View>
    </>}
  </View>;
}

const styles=StyleSheet.create({
  board:{gap:14,position:'relative',direction:'ltr'},answer:{backgroundColor:'#f0fdfa',borderWidth:2,borderColor:'#86bdb4',padding:14,borderRadius:18,minHeight:122,gap:12},answerHeading:{flexDirection:'row',justifyContent:'space-between',gap:10},answerLabel:{color:'#126b60',fontWeight:'700'},placeholder:{color:'#62827b',paddingVertical:9},
  cards:{flexDirection:'row',flexWrap:'wrap',gap:8},bank:{paddingVertical:8,minHeight:70},tileWrap:{maxWidth:'100%'},tile:{minHeight:48,paddingHorizontal:13,paddingVertical:8,borderWidth:1,borderColor:'#b9c6d8',backgroundColor:'#fff',borderRadius:12},chosen:{backgroundColor:'#fff',borderColor:'#126b60',borderBottomWidth:3},nepali:{color:'#153f3b',fontWeight:'600'},muted:{color:'#64748b'},used:{opacity:.28},dropActive:{borderColor:'#0f766e',backgroundColor:'#dff7ef'},returnActive:{backgroundColor:'#ede9fe',borderRadius:14},marker:{position:'absolute',width:4,borderRadius:2,backgroundColor:'#0f766e',zIndex:9},ghost:{position:'absolute',paddingHorizontal:14,paddingVertical:7,borderRadius:12,backgroundColor:'#0f766e',elevation:12,shadowColor:'#153f3b',shadowOpacity:.25,shadowRadius:8,zIndex:10},ghostText:{color:'#fff',fontWeight:'700'},
});
