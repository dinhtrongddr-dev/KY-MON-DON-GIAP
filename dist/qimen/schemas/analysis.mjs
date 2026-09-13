export function validateAnalysis(a) {
  if(a?.schemaVersion!=='QimenAnalysis/1'||a.palaces?.length!==8||!Array.isArray(a.roles)||!Array.isArray(a.relations)||!Array.isArray(a.contradictions))throw new Error('QimenAnalysis không hợp lệ.');
  const ids=new Set(a.roles.map(r=>r.id));
  if(ids.size!==a.roles.length||a.roles.some(r=>r.palace!==null&&!a.palaces.some(p=>p.number===r.palace)))throw new Error('Đại diện không khớp cung.');
  return a;
}
