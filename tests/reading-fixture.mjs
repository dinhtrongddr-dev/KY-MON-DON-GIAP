// Handwritten synthetic prose for contract/integration tests, NOT output from a live model.
export function readingFixture(prepared) {
  const c=prepared.context.allInOne,g=c.reasoning,s=g.likelyScenario,ids=g.claims.map(x=>x.id),primary=s.primaryJudgment.claimIds;
  const section=(text,claim_ids=primary)=>({text,claim_ids});
  return {status:'reading',topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:c.questionContext.questionType,
    summary:section('Chưa đủ căn cứ để đồng nhất một tín hiệu thuận với việc đã đạt mục tiêu. Điểm cần chú ý là điều kiện khiến sự việc chuyển được sang bước tiếp theo. Nếu xác nhận được điều kiện đó, bạn mới có cơ sở tăng mức cam kết; nếu chưa, nên giữ nhận định ở dạng có điều kiện.'),
    situation:section('Bạn đang hỏi: '+prepared.context.question+' Trong phạm vi này, cần tách phần mình có thể làm với phần còn phụ thuộc vào phía liên quan. Một lời trao đổi, sự quan tâm hoặc mong muốn đi tiếp chỉ phản ánh một giai đoạn. Nó chưa xác nhận người có trách nhiệm đã đồng ý hoặc nguồn lực đã sẵn sàng. Đây là những điểm cần đối chiếu từ thông tin bạn đang có, không phải sự kiện đã được bàn chứng minh.',ids.slice(0,3)),
    development:s.stages.map((stage,i)=>({...section([
      'Điểm xuất phát là làm rõ việc đang dừng ở khâu nào. Bạn có thể đã nắm một phần thông tin, nhưng chưa nên lấy phần đó thay cho toàn bộ quá trình. Hãy xác định điều gì đã được xác nhận trực tiếp, điều gì mới là dự định và điều gì còn phải hỏi lại người có liên quan.',
      'Từ trạng thái trên, bước chuyển cần được nhận biết bằng một phản hồi cụ thể. Nếu phía liên quan đưa ra yêu cầu rõ hơn, hãy đối chiếu yêu cầu đó với khả năng thực hiện trước khi trả lời. Nếu họ vẫn chưa xác nhận, sự việc có thể quay lại khâu làm rõ; khi ấy tăng lời hứa chưa chắc giúp tiến nhanh hơn.',
      'Sau bước làm rõ, hướng kết quả phụ thuộc vào việc các điều kiện đã thật sự được đáp ứng hay chưa. Có xác nhận nhất quán thì mới nâng mức kỳ vọng; thông tin trái chiều thì cần điều chỉnh cách hiểu. Tiến thêm một khâu và đạt mục tiêu cuối là hai mốc khác nhau, nên kiểm tra từng mốc trước khi quyết định.'
    ][i],stage.claimIds),stage:stage.stage,interaction_ids:stage.relationshipIds,condition:i===0?'Đối chiếu giai đoạn thực tế trước khi diễn giải tiếp.':stage.condition})),
    bottleneck:{...section('Nút thắt nằm ở khoảng cách giữa khả năng được gợi ra và điều kiện để khả năng ấy thành việc. Cần kiểm tra ai có trách nhiệm xác nhận, phần việc nào còn vướng và dấu hiệu nào chứng tỏ vướng mắc đã được gỡ. Khi dữ kiện chưa rõ, không nên kết luận phía bên kia đã đổi ý hoặc cố gây khó.',[s.mainConflict?.claimId||primary[0]]),resolution:s.turningPoint},
    actions:g.recommendations.slice(0,3).map((r,i)=>({recommendation_id:r.id,text:[
      'Ghi lại bước đang chờ và người có thể xác nhận bước đó. Trao đổi một câu hỏi cụ thể để biết điều kiện còn thiếu, rồi giữ lại phản hồi làm mốc đối chiếu.',
      'Chuẩn bị phần thông tin phục vụ trực tiếp yêu cầu vừa xác nhận. Chỉ cam kết trong phạm vi mình kiểm soát được; nếu có thay đổi thì làm rõ trước khi chuyển sang bước sau.',
      'Theo dõi kết quả của hành động đã thực hiện. Nếu không có phản hồi như dự kiến, quay lại kiểm tra giả định ban đầu và điều chỉnh cách tiếp cận trước khi đầu tư thêm nguồn lực.'
    ][i]})),
    alternative:{...section('Nếu điều kiện chuyển vẫn chưa được xác nhận, khả năng khác là sự việc tiếp tục ở khâu chuẩn bị hoặc phải sửa phương án. Khi đó nên giảm mức kỳ vọng và xác minh lại thông tin, thay vì xem tiến độ chậm là một quyết định cuối cùng.'),id:s.alternative.id},
    timing:section('Thời hạn người hỏi nêu là phạm vi quan sát. Chưa có cơ sở trong dữ liệu này để ấn định một ngày xảy ra kết quả; cần theo dõi dấu hiệu chuyển bước thực tế.'),
    comparisons:(c.comparison?.ranking||c.plan.computed.ranking||[]).map(row=>({id:row.id,reason:'Đối chiếu ứng viên này theo các điều kiện cản và mức phù hợp đã tính. Thứ hạng chỉ giúp so sánh tương đối trong danh sách, cần xác nhận điều kiện thực tế trước khi lựa chọn.'})),questions:[]};
}
export function clarificationFixture(prepared) {
  const c=prepared?.context?.allInOne,empty=()=>({text:'',claim_ids:[]});
  return {status:'needs_clarification',topic_id:c?.resolvedTopic||'contract',mode:c?.classification.mode||'prediction',questionType:c?.questionContext.questionType||'prediction',
    summary:{text:'Bạn đang hỏi việc của mình hay hỏi thay người khác?',claim_ids:[]},situation:empty(),development:[],bottleneck:{...empty(),resolution:''},actions:[],
    alternative:{...empty(),id:''},timing:empty(),comparisons:[],questions:['Bạn hỏi cho ai?']};
}
