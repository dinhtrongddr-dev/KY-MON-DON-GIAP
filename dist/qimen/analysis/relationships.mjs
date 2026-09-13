import {elementLink} from '../../reading-focus.mjs';
export {elementLink};
export function palaceRelationships(board) {
  const out=[];
  for(const from of board.palaces) for(const to of board.palaces) if(from.number!==5 && to.number!==5) {
    out.push({from:from.number,to:to.number,...elementLink(from.element,to.element),samePalace:from.number===to.number,
      opposite:from.number+to.number===10 && from.number!==to.number});
  }
  return out;
}
