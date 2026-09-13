export const BOARD_SCHEMA_VERSION='QimenBoard/1';
export function validateBoard(board) {
  if(board?.schemaVersion!==BOARD_SCHEMA_VERSION || !['yin','yang'].includes(board.dun) ||
    !Number.isInteger(board.ju) || board.ju<1 || board.ju>9 || !Number.isFinite(board.utcMs) ||
    !Array.isArray(board.palaces) || board.palaces.length!==9 ||
    new Set(board.palaces.map(p=>p.number)).size!==9 ||
    board.palaces.some(p=>!Number.isInteger(p.number)||p.number<1||p.number>9||!p.earthStem||!Array.isArray(p.heavenStems)||
      (p.number!==5&&(!p.door||!p.star||!p.spirit))) ||
    !board.pillars?.day?.han || !board.pillars?.hour?.han) throw new Error('QimenBoard không hợp lệ.');
  return board;
}
export function freezeData(value) {
  if(value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeData);Object.freeze(value);
  }
  return value;
}
