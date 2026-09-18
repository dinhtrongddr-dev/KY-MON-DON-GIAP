import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wealthInnerOuterTendency,wealthRelationSemantics,wealthResolverContract} from '../dist/qimen/menh/domains/wealth.mjs';
const c=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const f=id=>c.fixtures.find(x=>x.id===id);

test('P5 wealth: Sheng-vs-self five-element relations stay descriptive and context-sensitive',()=>{
  const x=f('F-WEALTH-RELATION-SEMANTICS');
  const cases={
    SHENG_GENERATES_SELF:{shengElement:'Mộc',selfElement:'Hỏa'},
    SHENG_SAME_SELF:{shengElement:'Thổ',selfElement:'Thổ'},
    SELF_GENERATES_SHENG:{shengElement:'Hỏa',selfElement:'Mộc'},
    SHENG_CONTROLS_SELF:{shengElement:'Kim',selfElement:'Mộc'},
    SELF_CONTROLS_SHENG:{shengElement:'Mộc',selfElement:'Kim'},
  };
  for(const [name,input] of Object.entries(cases))assert.equal(wealthRelationSemantics(input).semantic,x.cases[name]);
  assert.equal(wealthRelationSemantics(cases.SELF_CONTROLS_SHENG).forcePositive,x.expect.forcePositiveForSelfControlsSheng);
});
test('P5 wealth: Yang-Dun inner/outer combinations map to frozen natal tendencies',()=>{
  const x=f('F-WEALTH-INNER-OUTER');
  const cases={
    SHENG_OUTER_SELF_INNER:{selfPalace:'XUN_4',shengPalace:'LI_9'},
    SELF_OUTER_SHENG_INNER:{selfPalace:'QIAN_6',shengPalace:'XUN_4'},
    BOTH_INNER:{selfPalace:'KAN_1',shengPalace:'GEN_8'},
    BOTH_OUTER:{selfPalace:'LI_9',shengPalace:'QIAN_6'},
  };
  for(const [name,input] of Object.entries(cases)){
    const r=wealthInnerOuterTendency({dun:'YANG_DUN',...input});
    assert.equal(r.tendency,x.cases[name]);
    assert.equal(r.claimType,x.expect.claimType);
    assert.equal(r.guaranteedMigrationEvent,x.expect.guaranteedMigrationEvent);
  }
});
test('P5 wealth: contract keeps Sheng primary and Wu/Jia-Zi-Wu only as capital corroborator',()=>{
  const r=wealthResolverContract();
  assert.equal(r.primary,'SHENG_MEN_VS_SELF');
  assert.equal(r.capitalCorroborator,'WU_OR_JIA_ZI_WU');
  assert.equal(r.numericWealthScore,false);
});
