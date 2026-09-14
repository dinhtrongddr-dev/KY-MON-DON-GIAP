const MECHANISMS={generate:'resource_commitment',generated_by:'received_support',control:'implementation_pressure',controlled_by:'external_condition',same:'aligned_resources'};
const CHECKS={resource_commitment:'Kiểm tra nguồn lực bên cho ra và dấu hiệu bên nhận thực sự sử dụng; bỏ công chưa đồng nghĩa đạt mục tiêu.',received_support:'Xác nhận nguồn hỗ trợ có thực và có điều kiện đi kèm trước khi dựa vào nó.',implementation_pressure:'Kiểm tra bên tác động có đủ điều kiện thực hiện hay chỉ đang muốn thúc ép bước tiếp.',external_condition:'Làm rõ yêu cầu hoặc điều kiện từ phía tác động trước khi mở rộng cam kết.',aligned_resources:'Đối chiếu mục tiêu hai vai; tương đồng nguồn lực không tự chứng minh đồng ý.'};
export function analyzeInteractions(graph,selected) {
  const palaces=new Set(selected.map(b=>b.palace));
  return graph.relations.filter(e=>palaces.has(e.fromPalace)&&palaces.has(e.toPalace)).map(e=>{
    const mechanism=e.samePalace?'interdependence':MECHANISMS[e.type];
    return {edgeId:e.id,from:e.from,to:e.to,mechanism,
      agency:e.samePalace?'linked_conditions':e.type==='controlled_by'?'from_depends_on_to':e.type==='control'?'from_applies_pressure':e.type==='generate'?'from_invests_resources':e.type==='generated_by'?'from_receives_resources':'no_directional_advantage',
      check:e.samePalace?'Các vai cùng chịu điều kiện của một cung; không coi đó là hai nguồn chứng cứ độc lập.':CHECKS[mechanism],
      opposite:e.opposite,oppositionCheck:e.opposite?'Hai cung đối nhau: cần kiểm tra khả năng đi ngược hướng; không suy ra thù địch thực tế.':null,
      evidenceIds:[e.id,...e.evidenceIds]};
  });
}
