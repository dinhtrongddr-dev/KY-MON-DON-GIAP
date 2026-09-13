import {generateQimen, ENGINE_VERSION} from '../../qimen.mjs';
import {BOARD_SCHEMA_VERSION, validateBoard, freezeData} from '../schemas/board.mjs';
export {generateQimen, ENGINE_VERSION};

// Adapt an already computed chart: no calendar call, rotation or AI in this layer.
export function toQimenBoard(chart) {
  const board={schemaVersion:BOARD_SCHEMA_VERSION,engineVersion:chart.engineVersion,
    dateTime:new Date(chart.utcMs).toISOString(),utcMs:chart.utcMs,input:chart.input,
    method:chart.method,pillars:chart.pillars,dayGan:chart.pillars.day.stem.han,hourGan:chart.pillars.hour.stem.han,
    term:chart.term,nextTerm:chart.nextTerm,dun:chart.dun.isYang?'yang':'yin',ju:chart.dun.ju,
    yuan:chart.dun.yuan,fuHead:chart.fuHead,xun:chart.xun,
    zhiFu:{star:chart.duty.star,palace:chart.duty.starPalace,rawPalace:chart.duty.rawStarPalace},
    zhiShi:{door:chart.duty.door,palace:chart.duty.doorPalace,rawPalace:chart.duty.rawDoorPalace},
    fanYin:chart.patterns.starFanYin||chart.patterns.doorFanYin,
    fuYin:chart.patterns.starFuYin||chart.patterns.doorFuYin,
    patterns:chart.patterns,voidBranches:chart.voidBranchData,horseBranch:chart.horseBranchData,
    spiritSystem:'rotating-eight',palaces:chart.palaces};
  // Copy before freezing: never freeze or mutate the legacy chart/shared tables.
  return freezeData(validateBoard(JSON.parse(JSON.stringify(board))));
}
export function createQimenBoard(input,method='chaibu') {return toQimenBoard(generateQimen(input,method));}
