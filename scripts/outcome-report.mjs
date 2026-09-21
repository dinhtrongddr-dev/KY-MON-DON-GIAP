import {createOutcomeRegistry,defaultOutcomeRegistryPath} from '../local/outcome-registry.mjs';

const filePath=defaultOutcomeRegistryPath();
try{
  const registry=createOutcomeRegistry({filePath});
  console.log(JSON.stringify({filePath,report:registry.report()},null,2));
}catch(error){
  console.error(error?.message||String(error));
  process.exitCode=1;
}
