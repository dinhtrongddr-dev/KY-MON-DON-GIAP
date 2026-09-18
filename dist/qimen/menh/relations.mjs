import {elementLink} from '../analysis/relationships.mjs';
export {elementLink};

export function palaceElementRelation(fromPalace,toPalace){
  if(!fromPalace?.element||!toPalace?.element)throw new Error('KM-MENH: thiếu Ngũ hành cung để lập quan hệ.');
  const link=elementLink(fromPalace.element,toPalace.element);
  return Object.freeze({
    fromPalace:fromPalace.number??fromPalace.palace??null,
    toPalace:toPalace.number??toPalace.palace??null,
    fromElement:fromPalace.element,
    toElement:toPalace.element,
    samePalace:(fromPalace.number??fromPalace.palace)===(toPalace.number??toPalace.palace),
    kind:link.kind,
    text:link.text,
  });
}
