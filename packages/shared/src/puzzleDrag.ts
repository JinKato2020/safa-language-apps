export type PuzzleRect = { x: number; y: number; width: number; height: number };
export type PuzzlePoint = { x: number; y: number };
export const insidePuzzleRect = (p: PuzzlePoint, r: PuzzleRect) => p.x >= r.x && p.x <= r.x+r.width && p.y >= r.y && p.y <= r.y+r.height;

/** Insertion in a wrapping row layout, after removing the dragged token. */
export function puzzleInsertion(p: PuzzlePoint, area: PuzzleRect, cards: PuzzleRect[]): number | null {
  if (!insidePuzzleRect(p, area)) return null;
  if (!cards.length) return 0;
  let nearest=0, distance=Infinity;
  cards.forEach((r,i)=>{const d=Math.max(r.y-p.y,0,p.y-r.y-r.height);if(d<distance){nearest=i;distance=d;}});
  const row=cards.map((r,i)=>({r,i})).filter(({r})=>Math.abs(r.y-cards[nearest].y)<8);
  if(p.y<cards[0].y)return 0;
  if(p.y>cards.at(-1)!.y+cards.at(-1)!.height)return cards.length;
  return row.find(({r})=>p.x<r.x+r.width/2)?.i ?? row.at(-1)!.i+1;
}

export function insertPuzzleToken(order: string[], id: string, index: number, limit: number) {
  const next=order.filter(value=>value!==id);
  if(next.length>=limit)return order;
  next.splice(Math.max(0,Math.min(index,next.length)),0,id);
  return next;
}
