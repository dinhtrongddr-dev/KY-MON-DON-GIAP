import {steps,finish,roleState,relationOf} from './shared.mjs';
export function prediction(a) {
  const self=roleState(a,'self'),event=roleState(a,'event'),link=relationOf(a,'self','event');
  const blockers=[...self.friction,...event.friction];
  const volatile=a.patterns.layers.starFanYin||a.patterns.layers.doorFanYin;
  const anchors=a.roles.filter(r=>r.id.startsWith('topic_')).map(r=>r.id);
  const chain=steps('prediction',[
    ['current','Hiện trạng',['event'],'Phân biệt điều người hỏi kể với điều chưa biết.'],
    ['subject','Chủ thể',['self'],'Nguồn lực và mức tham gia của người hỏi.'],
    ['event','Sự việc',['event',...anchors],'Trả lời đúng kết quả đang hỏi, không đổi sang lời khuyên chung.'],
    ['obstacle','Trở ngại',['self','event',...anchors],blockers.length?'Xem điều kiện cản trước khi suy kết quả.':'Không tự tạo trở ngại nếu chưa có căn cứ.'],
    ['development','Diễn biến',['self','event'],volatile?'Phải có nhánh xem xét lại / đổi hướng, nhưng không khẳng định sẽ xảy ra.':'Nối thay đổi với dấu hiệu thực tế cần xác nhận.'],
    ['turn','Điểm chuyển',['event',...anchors],'Điều gì phải được xác nhận để đi từ phản hồi sang kết quả?'],
    ['outcome','Kết quả',['event',...anchors],'Tách tin tức, tiến triển và quyết định cuối; nêu nhánh phản bác.'],
    ['timing','Ứng kỳ',['event'],'Không suy ngày chắc chắn từ Mã hoặc đồng cung; đối chiếu hạn người hỏi nêu.'],
  ]);
  return finish('prediction',a,chain,{selfEvent:link,blockers,volatile,
    path:volatile?'review_loop':blockers.length?'conditions_before_outcome':'observe_progress',
    outcomeStatus:'conditional_not_verified',calendarPrediction:null});
}
