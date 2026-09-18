import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertCenter5Compatible,center5Lodging,getMenhProfile} from '../dist/qimen/menh/profiles.mjs';
import {createNatalView} from '../dist/qimen/menh/natal-adapter.mjs';

const corpus=JSON.parse(readFileSync(new URL('./fixtures/km-menh-1.0-golden.json',import.meta.url),'utf8'));
const fixture=id=>corpus.fixtures.find(f=>f.id===id);
const syntheticBoard=()=>{
  const stem={han:'丁',vi:'Đinh',element:'Hỏa'};
  const palaces=Array.from({length:9},(_,i)=>{
    const number=i+1,base={number,element:number===1?'Thủy':'Thổ',earthStem:stem,heavenStems:[stem]};
    return number===5?base:{...base,door:{id:'xiu',vi:'Hưu',element:'Thủy'},star:{id:'ren',vi:'Thiên Nhậm',element:'Thổ'},spirit:{id:'chief',vi:'Trực Phù'}};
  });
  return {schemaVersion:'QimenBoard/1',engineVersion:'TG-ROTATING-2.0',utcMs:0,dun:'yang',ju:1,
    pillars:{day:{han:'丁酉'},hour:{han:'甲辰'}},palaces};
};

test('P2: Advanced-Class Center-5 profile is frozen separately for Yang and Yin',()=>{
  for(const id of ['F-CENTER5-ADV-YANG','F-CENTER5-ADV-YIN']){
    const f=fixture(id),actual=center5Lodging(f.profile,f.input.dun);
    assert.equal(actual.lodgePalace,f.expect.lodgePalace);
    assert.equal(actual.associatedDoor,f.expect.associatedDoor);
  }
});
test('P2: ShenQi legacy Center-5 remains Kun-2 and is not normalized to Gen-8',()=>{
  const f=fixture('F-S5-SHENQI-LEGACY-CENTER5');
  const actual=center5Lodging(f.profile,f.input.dun);
  assert.equal(actual.lodgePalace,f.expect.center5LodgePalace);
  assert.notEqual(actual.lodgePalace,f.negativeAssertions[0].mustNotNormalizeTo);
});
test('P2: LWF-02 cannot silently pass as Advanced-Class Yang Center-5',()=>{
  const f=fixture('F-LWF02-PROFILE-CONFLICT-ISOLATION');
  assert.equal(f.expect.silentCrossProfileComparison,'REJECT');
  assert.throws(()=>assertCenter5Compatible('ZHANG_ADVANCED_CLASS_LIFETIME',f.observedSource.dun,f.observedSource.center5LodgePalace),/không tương thích profile/);
});
test('P2: NatalView is an immutable semantic adapter and never mutates the source QimenBoard',()=>{
  const board=syntheticBoard(),before=JSON.stringify(board);
  const natal=createNatalView(board);
  assert.equal(JSON.stringify(board),before);
  assert.equal(natal.sourceEngineVersion,'TG-ROTATING-2.0');
  assert.equal(natal.profileId,'ZHANG_ADVANCED_CLASS_LIFETIME');
  assert.equal(natal.center5Lodging.policy,'SEMANTIC_LODGING_ONLY');
  assert.notEqual(natal.baseBoard,board);
  assert.ok(Object.isFrozen(natal));
  assert.ok(Object.isFrozen(natal.baseBoard));
  assert.equal(getMenhProfile(natal.profileId).status,'DEFAULT_FROZEN');
});
