// Handwritten synthetic prose for contract/integration tests, NOT output from a live model.
// This fixture exercises the v2 contract; it is not an evaluation of writing quality.
export function readingFixture(prepared) {
  const c=prepared.context.allInOne,g=c.reasoning,s=g.likelyScenario,ids=g.claims.map(x=>x.id),primary=s.primaryJudgment.claimIds;
  const section=(text,claim_ids=primary)=>({text,claim_ids});
  return {status:'reading',topic_id:c.resolvedTopic,mode:c.classification.mode,questionType:c.questionContext.questionType,
    summary:section(g.primaryJudgment.main+' '+g.primaryJudgment.distinction+' Đây là nhận định theo cụm tượng của mục tiêu đang hỏi; điều kiện chuyển bước nằm trong phần diễn biến.'),
    situation:section('Người hỏi và sự việc là hai vai riêng. Cụm tượng ở mỗi vai mô tả phần năng lực, cách tiến hành và mức chủ động tương ứng. Ghép các vai qua chiều sinh khắc giúp thấy phần nào hỗ trợ, phần nào tạo yêu cầu. Các vai cùng cung chia sẻ một căn cứ, không được cộng thành nhiều tín hiệu độc lập.',ids.slice(0,3)),
    development:s.stages.map((stage,i)=>({...section([
      'Ở đầu chuỗi, cơ hội và dấu hiệu xuất hiện giúp nhận ra khả năng mở việc. Mức hỗ trợ này cần được đọc theo đúng mục tiêu, chưa thay cho trạng thái đã xảy ra ngoài thực tế. Phần người dùng đã kể là nguồn mô tả hiện trạng riêng, không được suy ngược từ các ký hiệu.',
      'Chặng giữa cần biến khả năng thành một nội dung có thể xử lý. Quan hệ giữa người hỏi và sự việc quyết định phía nào cho nguồn lực, phía nào chịu yêu cầu. Phạm vi thực hiện và năng lực đáp ứng cần đi cùng nhau để bước thử không trở thành cam kết vượt khả năng.',
      'Ở chặng cuối, thực hiện và thu được kết quả là hai mốc khác nhau. Dấu hiệu thuận ở đầu chuỗi giữ vai trò hỗ trợ; điều kiện chưa được tháo gỡ giữ vai trò hạn chế thực hóa. Nếu tiến triển dừng lại, quay về đúng khâu còn thiếu thay vì xem toàn bộ cơ hội đã biến mất.'
    ][i],stage.claimIds),stage:stage.stage,interaction_ids:stage.relationshipIds,condition:[
      'Nhận diện dấu hiệu xuất hiện riêng trước khi nói tới thành hình.',
      'Phần năng lực đáp ứng được yêu cầu thì mới mở rộng bước xử lý.',
      'Kết quả thực tế cần một dấu hiệu riêng, không đồng nhất với bước chuẩn bị.'
    ][i]})),
    bottleneck:{...section('Điểm mấu chốt là tác động của điều kiện cản lên đúng giai đoạn đang xét. Một giới hạn ở tầng nhận kết quả không xóa hỗ trợ của tầng trước. Phân biệt hai tầng này giúp giữ mức nhận định phù hợp với cả căn cứ thuận và căn cứ hạn chế.',[s.mainConflict?.claimId||primary[0]]),resolution:s.turningPoint},
    actions:g.recommendations.slice(0,3).map((r,i)=>({recommendation_id:r.id,text:[
      'Ghi riêng mục tiêu đang hỏi và phần nguồn lực bạn có thể sử dụng. Chọn một bước trong khả năng hiện tại, với dấu hiệu kết thúc rõ ràng để biết khi nào nên chuyển tiếp.',
      'Chia phần thực hiện thành việc nhỏ gắn trực tiếp với yêu cầu của sự việc. Giữ phạm vi phù hợp năng lực; khi yêu cầu đổi, sửa phần việc tương ứng trước khi tăng cam kết.',
      'Theo dõi tác dụng của bước đã thử và ghi lại phần thực tế khác với dự kiến. Dùng sự khác biệt đó để điều chỉnh cách tiếp cận, thay vì mở rộng nguồn lực ngay.'
    ][i]})),
    alternative:{...section('Nếu bước chuyển không tạo dấu hiệu mới hoặc có thông tin thực tế trái chiều, kịch bản cần quay về khâu chuẩn bị. Nhánh này giữ lại cơ hội có căn cứ nhưng hạ kỳ vọng về tốc độ thực hiện. Nó không mặc định ai đã đổi ý hay mục tiêu đã thất bại.'),id:s.alternative.id},
    timing:section('Chưa có mốc ứng kỳ đủ rõ. Thời hạn trong câu hỏi là phạm vi quan sát; phép định ngày từ các điều kiện trên bàn chưa được triển khai.'),
    comparisons:(c.comparison?.ranking||c.plan.computed.ranking||[]).map(row=>({id:row.id,reason:'Ứng viên này được so theo các điều kiện cản và mức phù hợp đã tính riêng. Thứ hạng mô tả tương quan trong danh sách, không phải ngày chắc chắn có kết quả hoặc bảo đảm hành động thành công.'})),questions:[]};
}
export function clarificationFixture(prepared) {
  const c=prepared?.context?.allInOne,empty=()=>({text:'',claim_ids:[]});
  return {status:'needs_clarification',topic_id:c?.resolvedTopic||'contract',mode:c?.classification.mode||'prediction',questionType:c?.questionContext.questionType||'prediction',
    summary:{text:'Bạn đang hỏi việc của mình hay hỏi thay người khác?',claim_ids:[]},situation:empty(),development:[],bottleneck:{...empty(),resolution:''},actions:[],
    alternative:{...empty(),id:''},timing:empty(),comparisons:[],questions:['Bạn hỏi cho ai?']};
}
