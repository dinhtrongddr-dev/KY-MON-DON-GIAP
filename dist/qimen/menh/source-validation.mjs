const SOURCE_KINDS=new Set(['SOURCE_GOLDEN','SOURCE_NEGATIVE']);

const fail=message=>{throw new Error(`KM-MENH source validation: ${message}`);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

function assertSubset(actual,expected,path='payload'){
  if(actual===null||typeof actual!=='object'){
    if(!same(actual,expected))fail(`${path} differs from frozen fixture`);
    return;
  }
  if(Array.isArray(actual)){
    if(!Array.isArray(expected)||!same(actual,expected))fail(`${path} differs from frozen fixture`);
    return;
  }
  if(!expected||typeof expected!=='object'||Array.isArray(expected))fail(`${path} is not present in frozen fixture`);
  for(const [key,value] of Object.entries(actual)){
    if(!Object.hasOwn(expected,key))fail(`${path}.${key} was not present in frozen fixture`);
    assertSubset(value,expected[key],`${path}.${key}`);
  }
}
export function validateCompiledFixtureCorpus(corpus){
  if(corpus?.schema!=='KMMenhGoldenCompiled/1')fail('compiled corpus schema mismatch');
  if(corpus?.metadata?.specVersion!=='KM-MENH-1.0')fail('spec version mismatch');
  if(corpus?.suite?.id!=='KM-MENH-1.0-GOLDEN')fail('golden suite id mismatch');
  if(!Array.isArray(corpus.fixtures)||corpus.fixtures.length!==41)fail('expected exactly 41 frozen fixtures');
  if(corpus.metadata.fixtureCount!==41||corpus.suite.fixtureCount!==41)fail('fixture count metadata mismatch');
  const ids=corpus.fixtures.map(f=>f.id);
  if(new Set(ids).size!==ids.length)fail('fixture ids must be unique');
  if(corpus.fixtures.some(f=>f.mandatory!==true))fail('every frozen fixture must remain mandatory');
  const sourceCount=corpus.fixtures.filter(f=>SOURCE_KINDS.has(f.kind)).length;
  if(sourceCount!==15||corpus.metadata.sourceFixtureCount!==15)fail('source fixture count mismatch');
  return corpus;
}

function validateKnownSourceRule(fixture){
  if(fixture.id==='F-Z19-SOURCE-CONFLICT'){
    if(fixture.expect?.fixtureStatus!=='SOURCE_CONFLICT'||fixture.expect?.eligibleAsGolden!==false||
       fixture.expect?.chartGenerationScoreAllowed!==false)fail('Z19 must remain a non-golden source conflict');
  }
  if(fixture.id==='F-S5-SHENQI-LEGACY-CENTER5'){
    if(fixture.profile!=='ZHANG_SHENQI_GENERAL_NATAL_LEGACY'||fixture.expect?.center5LodgePalace!=='KUN_2'||
       !fixture.negativeAssertions?.some?.(x=>x?.mustNotNormalizeTo==='GEN_8'))fail('S5 legacy Center-5 isolation changed');
  }
  if(fixture.id==='F-LWF02-PROFILE-CONFLICT-ISOLATION'){
    if(fixture.expect?.requireExplicitProfile!==true||fixture.expect?.silentCrossProfileComparison!=='REJECT'||
       fixture.expect?.compatibleWithAdvancedClassFixture!==false)fail('LWF-02 profile-conflict isolation changed');
  }
  if(['F-LWF03-ANNUAL-TIANPAN-DING-HAI','F-LWF04-ANNUAL-TIANPAN-BING-CHEN','F-LWF08-ANNUAL-TIANPAN-BING-ZI'].includes(fixture.id)){
    if(fixture.fixtureScope!=='ANNUAL_LAYER_RESOLVER_ONLY'||
       fixture.chartConstructionProfile!=='SOURCE_NATIVE_NOT_ASSERTED'||
       fixture.expect?.mustNotAssertWholeChartProfile!==true)fail(`${fixture.id} must remain annual-layer-only`);
  }
}

export function validateSourceSnapshots(document,corpus){
  validateCompiledFixtureCorpus(corpus);
  if(document?.schema!=='KMMenhSourceSnapshots/1'||document?.specVersion!=='KM-MENH-1.0')fail('source snapshot schema mismatch');
  if(document?.policy?.noInventedMissingData!==true||document?.policy?.snapshotsAreFullBirthCharts!==false)
    fail('source snapshot policy changed');
  const sourceFixtures=corpus.fixtures.filter(f=>SOURCE_KINDS.has(f.kind));
  if(document.count!==sourceFixtures.length||document.snapshots?.length!==sourceFixtures.length)
    fail('source snapshot count mismatch');
  const byId=new Map(sourceFixtures.map(f=>[f.id,f]));
  const seen=new Set();
  for(const snapshot of document.snapshots){
    if(seen.has(snapshot.fixtureId))fail(`duplicate source snapshot ${snapshot.fixtureId}`);
    seen.add(snapshot.fixtureId);
    const fixture=byId.get(snapshot.fixtureId);
    if(!fixture)fail(`unknown source fixture ${snapshot.fixtureId}`);
    if(snapshot.sourceRef!==fixture.sourceRef||snapshot.sourceCase!==fixture.sourceCase||
       snapshot.provenance!==fixture.provenance)fail(`${snapshot.fixtureId} source identity mismatch`);
    if(snapshot.completeness!=='PARTIAL_RULE_SNAPSHOT')fail(`${snapshot.fixtureId} must not claim a full source chart`);
    validateKnownSourceRule(fixture);
    assertSubset(snapshot.payload,fixture,`${snapshot.fixtureId}.payload`);
  }
  if(seen.size!==sourceFixtures.length)fail('not every source fixture has a snapshot');
  return document;
}
