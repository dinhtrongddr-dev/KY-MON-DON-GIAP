const MECHANISMS={generate:'resource_commitment',generated_by:'received_support',control:'implementation_pressure',controlled_by:'external_condition',same:'aligned_resources'};
const CHECKS={resource_commitment:'Kiểm tra nguồn lực bên cho ra và dấu hiệu bên nhận thực sự sử dụng; bỏ công chưa đồng nghĩa đạt mục tiêu.',received_support:'Xác nhận nguồn hỗ trợ có thực và có điều kiện đi kèm trước khi dựa vào nó.',implementation_pressure:'Kiểm tra bên tác động có đủ điều kiện thực hiện hay chỉ đang muốn thúc ép bước tiếp.',external_condition:'Làm rõ yêu cầu hoặc điều kiện từ phía tác động trước khi mở rộng cam kết.',aligned_resources:'Đối chiếu mục tiêu hai vai; tương đồng nguồn lực không tự chứng minh đồng ý.'};
export function analyzeInteractions(graph,selected) {
  const palaces=new Set(selected.map(b=>b.palace)),node=id=>graph.nodes.find(n=>n.id===id);
  return graph.relations.filter(e=>palaces.has(e.fromPalace)&&palaces.has(e.toPalace)).map(e=>{
    const mechanism=e.samePalace?'interdependence':MECHANISMS[e.type];
    const subject=e.to==='self'?(e.type==='control'?'matter_pressures_self':e.type==='generate'?'matter_supports_self':null):e.from==='self'?(e.type==='controlled_by'?'matter_pressures_self':e.type==='generated_by'?'matter_supports_self':null):null;
    const effect=e.samePalace?'dependency':subject==='matter_pressures_self'?'pressure':subject==='matter_supports_self'?'support':['generate','generated_by'].includes(e.type)?'support':['control','controlled_by'].includes(e.type)?'pressure':'alignment';
    const connected=selected.filter(b=>[e.fromPalace,e.toPalace].includes(b.palace));
    const activation=connected.some(b=>b.states.some(s=>s.code==='horse')&&!b.states.some(s=>['void','fu_yin'].includes(s.code)));
    const obstruction=connected.some(b=>b.conflicts.some(c=>c.effect==='obstruction'));
    const effects=[effect,...(activation?['activation']:[]),...(obstruction?['obstruction']:[])];
    const implication=subject==='matter_pressures_self'?'Sự việc tạo yêu cầu lên người hỏi; ưu tiên phần đáp ứng trực tiếp trước khi tăng nguồn lực.':subject==='matter_supports_self'?'Nguồn hỗ trợ từ sự việc có thể giúp người hỏi tiến bước; chọn phần có thể tiếp nhận và sử dụng.':e.samePalace?'Các vai cùng phụ thuộc một cụm điều kiện.':CHECKS[mechanism];
    const fromNode=node(e.from),toNode=node(e.to);
    let driver=e.from,target=e.to,directionalEffect=effect;
    if(e.type==='generated_by'||e.type==='controlled_by'){driver=e.to;target=e.from;}
    if(e.samePalace){driver=null;target=null;directionalEffect='interdependence';}
    const driverNode=driver?node(driver):null,targetNode=target?node(target):null;
    const capacityRelation=driverNode?.agencyBand==='strong'&&targetNode?.agencyBand==='constrained'?'driver_capacity_advantage':
      driverNode?.agencyBand==='constrained'&&targetNode?.agencyBand==='strong'?'driver_capacity_limited':'no_clear_capacity_asymmetry';
    return {edgeId:e.id,from:e.from,to:e.to,mechanism,effect,effects,implication,samePalace:e.samePalace,
      fromParty:fromNode?.party||null,toParty:toNode?.party||null,fromZone:fromNode?.zone||null,toZone:toNode?.zone||null,
      driver,target,directionalEffect,driverAgency:driverNode?.agencyBand||null,targetAgency:targetNode?.agencyBand||null,capacityRelation,
      affectsGoal:[e.from,e.to].includes('self')&&[e.from,e.to].some(id=>['event','money','contract','customer','authority','decisionMaker','execution','payment'].includes(id))||
        [fromNode,toNode].some(n=>n?.yongshenTier==='primary')&&[fromNode,toNode].some(n=>n?.party==='self'||n?.party==='counterpart'),
      agency:e.samePalace?'linked_conditions':e.type==='controlled_by'?'from_depends_on_to':e.type==='control'?'from_applies_pressure':e.type==='generate'?'from_invests_resources':e.type==='generated_by'?'from_receives_resources':'no_directional_advantage',
      check:e.samePalace?'Các vai cùng chịu điều kiện của một cung; không coi đó là hai nguồn chứng cứ độc lập.':CHECKS[mechanism],
      opposite:e.opposite,oppositionCheck:e.opposite?'Hai cung đối nhau: cần kiểm tra khả năng đi ngược hướng; không suy ra thù địch thực tế.':null,
      evidenceIds:[e.id,...e.evidenceIds,...(activation||obstruction?connected.map(b=>`c${b.palace}`):[])]};
  });
}
