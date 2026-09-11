// Synthetic content to exercise the contract, not a sample of live model quality.
export function readingFixture(prepared) {
  const topic=prepared.context.topics[0],focus=topic.focus,day=focus.roles[0].palace,anchor=topic.anchors[0].palace;
  const firstRef=topic.anchors[0].evidenceId;
  const text=(label,id)=>`${label} — dữ liệu giả lập kiểm thử, không phải lời luận hoặc dự báo thật. Căn cứ cần đối chiếu: ${prepared.facts[id]} Khi đọc tình huống đã nêu, phải tách thông tin người hỏi cung cấp với khả năng diễn giải từ tượng, đồng thời xem lại những điều kiện còn thiếu trước khi kết luận. Chỉ tiến sang bước tiếp theo khi có thông tin thực tế tương ứng; không coi sự liên hệ giữa hai cung là lịch sự việc chắc chắn sẽ xảy ra.`;
  const condition='Chỉ dùng cách hiểu này nếu thông tin thực tế do người hỏi kiểm tra xác nhận đúng giai đoạn và điều kiện đang xét.';
  return {
    status:'reading',topic_id:topic.id,summary:'Nội dung giả lập kiểm thử giao thức. Bản này chỉ kiểm tra cấu trúc liên kết, không đánh giá khả năng diễn giải của model hoặc kết quả thực tế.',
    scope:{subject:'Người hỏi',objective:prepared.context.question,stage:'Đang tìm thông tin',timeframe:'Theo câu hỏi đã nhập'},assumptions:[],
    assessments:[
      {aspect:'overview',title:'Thế toàn cục',interpretation:text('Toàn cục','patterns'),evidence_ids:['patterns',`p${day}`,`mix${day}`]},
      {aspect:'people',title:'Người và việc',interpretation:text('Đại diện','relation'),evidence_ids:['day','hour','relation',`p${day}`,focus.links[0].id]},
      {aspect:'opportunity',title:'Khâu cần phối hợp',interpretation:text('Dụng thần',firstRef),evidence_ids:[firstRef,`p${anchor}`,`mix${anchor}`]},
      {aspect:'obstacle',title:'Điều kiện còn vướng',interpretation:text('Điều kiện',`c${day}`),evidence_ids:[`p${day}`,`c${day}`]},
    ],
    development:[
      {stage:'current',title:'Tình huống xuất phát',description:text('Chặng hiện tại','day'),condition,based_on:['people'],evidence_ids:[`p${day}`]},
      {stage:'next',title:'Chuyển biến cần xác nhận',description:text('Chặng tiếp theo',firstRef),condition,based_on:['opportunity'],evidence_ids:[firstRef,`p${anchor}`]},
      {stage:'outcome',title:'Kết quả có điều kiện',description:text('Chặng kết quả',`c${day}`),condition,based_on:['opportunity','obstacle'],evidence_ids:[`p${day}`,`c${day}`]},
    ],
    alternatives:[{description:text('Khả năng thay thế',`c${day}`),condition,evidence_ids:[`p${day}`,`c${day}`]}],
    questions:[],next_steps:['Kiểm tra thông tin thứ nhất từ nguồn thực tế.','Xác minh điều kiện chuyển sang bước tiếp theo.'],
  };
}

export const clarificationFixture=()=>({status:'needs_clarification',topic_id:'contract',summary:'Bạn đang hỏi việc của mình hay hỏi thay người khác?',scope:{subject:'Chưa rõ người đại diện',objective:'Làm rõ chủ thể',stage:'Chưa rõ giai đoạn',timeframe:'Chưa nêu'},assumptions:[],assessments:[],development:[],alternatives:[],questions:['Bạn hỏi cho ai?'],next_steps:[]});
