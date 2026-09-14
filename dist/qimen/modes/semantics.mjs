// Interpretation conventions, not additional rules for calculating a board.
// Terms are possibilities to test against the question, never facts about a person.
const entry=(label,opportunity,agreement,value,movement,vocabulary,roles)=>({label,opportunity,agreement,value,movement,vocabulary,roles});
export const MODE_SEMANTICS={
  business:entry('Kinh doanh / thương chiến','mở cửa giao dịch','thỏa thuận có thể xác nhận','lợi ích và dòng tiền','gặp khách / khảo sát / thay kênh tiếp cận',['khách hàng','người duyệt','phạm vi','báo giá','điều khoản','hợp đồng'],['self','event','opportunity','contract','quote','authority','money','customer','competitor']),
  project:entry('Dự án','mở hoặc chuyển giai đoạn','bàn giao và phối hợp','nguồn lực triển khai','khảo sát / triển khai thực địa',['phạm vi','tiến độ','nghiệm thu','phụ thuộc','người phê duyệt'],['self','event','service','execution','contract','authority']),
  relationship:entry('Tình cảm','cơ hội đối thoại','sự gắn kết và cam kết','khả năng nuôi dưỡng quan hệ','gặp gỡ / khoảng cách / thay đổi trạng thái',['đối thoại','ranh giới','mức độ cam kết','nhu cầu hai phía'],['self','event','customer','contract','opportunity']),
  family:entry('Gia đình','khả năng trao đổi trong nhà','sự phối hợp giữa người thân','nguồn lực chăm sóc','gặp nhau / thay đổi sinh hoạt',['người thân','trách nhiệm','sinh hoạt','điều cần thống nhất'],['self','event','customer','contract','execution']),
  career:entry('Công việc / sự nghiệp','vai trò và cơ hội công việc','thỏa thuận làm việc','nguồn lực và sự phát triển','chuyển việc / công tác / thay môi trường',['vị trí','cấp quản lý','nhiệm vụ','năng lực','quy trình xét duyệt'],['self','event','opportunity','authority','service','execution']),
  recruitment:entry('Nhân sự / tuyển dụng','cơ hội gặp ứng viên hoặc nhà tuyển dụng','cam kết tuyển dụng','nguồn lực và khả năng đáp ứng','đổi vị trí / lịch gặp / nhận việc',['tiêu chí','ứng viên','phỏng vấn','người quyết định','thử việc'],['self','event','customer','authority','contract','opportunity']),
  study:entry('Học tập','đầu mối học và tiếp cận cơ hội','phối hợp học tập','khả năng tiến bộ','thay cách học / thực hành / đi thi',['kiến thức','bài tập','tiêu chí chấm','thực hành','lịch ôn'],['self','event','service','quote','execution','opportunity']),
  search:entry('Tìm người / tìm đồ','đầu mối thông tin để tìm kiếm','kênh phối hợp tìm kiếm','nguồn lực hỗ trợ tìm','khả năng đã di chuyển; cần kiểm chứng',['vị trí cuối được xác nhận','người chứng kiến','thông tin nhận diện','đầu mối liên hệ'],['self','event','opportunity','quote','movement','customer']),
  health:entry('Sức khỏe','khả năng tiếp cận trợ giúp','phối hợp chăm sóc','nguồn lực hồi phục','thay sinh hoạt / tiếp cận cơ sở chăm sóc',['triệu chứng đã kể','hồ sơ','nhân viên y tế','thời điểm cần trợ giúp'],['self','event','service','execution','opportunity']),
  legal:entry('Pháp lý / tranh chấp','kênh làm rõ thủ tục','nội dung thỏa thuận','nguồn lực xử lý','thay bước thủ tục / tiếp xúc đầu mối',['hồ sơ','chứng cứ thực tế','thẩm quyền','thời hạn','người tư vấn'],['self','event','customer','quote','authority','contract']),
  finance:entry('Tài chính','kênh trao đổi và xác minh','cam kết và điều kiện thanh toán','vốn, lợi ích và tiền thực thu','thay phương án / luân chuyển nguồn lực',['dòng tiền','điều kiện thanh toán','chi phí','mức chịu rủi ro','thông tin cần xác minh'],['self','event','capital','money','contract','customer']),
  property:entry('Bất động sản','khả năng tiếp cận giao dịch','điều khoản và hồ sơ giao dịch','chi phí và nguồn vốn','đi xem / khảo sát / thay vị trí',['hiện trạng','pháp lý cần kiểm tra','ngân sách','hồ sơ','điều kiện bàn giao'],['self','event','contract','quote','capital','opportunity']),
  travel:entry('Di chuyển','lối tiếp cận và hành trình','phối hợp trong chuyến đi','nguồn lực chuyến đi','di chuyển / thay lộ trình',['lộ trình','điểm xuất phát','lịch trình','điều kiện thực địa'],['self','event','movement','execution','opportunity']),
  social:entry('Quan hệ xã hội','cơ hội liên hệ','khả năng phối hợp','nguồn lực qua lại','gặp gỡ / đổi nhóm tiếp xúc',['người liên hệ','mục đích gặp','mức độ tin cậy','ranh giới'],['self','event','customer','contract','opportunity']),
};
export const TOPIC_DOMAINS={contract:'business',money:'finance',investment:'finance',debt:'finance',work:'career',study:'study',love:'relationship',family:'family',property:'property',lost:'search',travel:'travel',launch:'business',social:'social',health:'health',dispute:'legal',general:'career'};
export const domainSemantics=id=>MODE_SEMANTICS[id]||MODE_SEMANTICS.career;
export function semanticRoles(domain) {
  const d=domainSemantics(domain);
  return {self:'chủ thể người hỏi',event:'mục tiêu sự việc',opportunity:d.opportunity,contract:d.agreement,money:d.value,
    capital:'nguồn lực đã hoặc dự kiến bỏ ra',quote:domain==='business'?'hồ sơ / phạm vi / báo giá':'thông tin được bộc lộ hoặc trình bày',
    authority:'vai trò thẩm quyền cần kiểm chứng',service:domain==='business'?'sản phẩm / dịch vụ đang hỏi':'nội dung công việc hoặc nhu cầu đang hỏi',
    execution:'cách thực hiện / khâu xử lý',movement:d.movement,customer:domain==='business'?'khách hàng':'phía liên quan',competitor:'bên cạnh tranh nếu có',decisionMaker:'người có thẩm quyền nếu đã xác định'};
}
export const SECTOR_VOCABULARY=[
  {match:/\b(ve sinh cong nghiep|tap vu)\b/,terms:['khảo sát','định biên nhân sự','vật tư','tiêu chuẩn dịch vụ','nghiệm thu']},
  {match:/\b(sua chua|thi cong|xay dung|toilet)\b/,terms:['khối lượng','hiện trạng','vật tư','phạm vi thi công','nghiệm thu']},
  {match:/\b(phan mem|cong nghe|website)\b/,terms:['yêu cầu','bản thử','tích hợp','nghiệm thu','vận hành']},
  {match:/\b(ban le|cua hang|hang hoa)\b/,terms:['nhu cầu','sản phẩm','tồn kho','kênh bán','khách quay lại']},
  {match:/\b(nha may|doanh nghiep|b2b)\b/,terms:['bộ phận sử dụng','bộ phận mua hàng','đầu mối phê duyệt']},
];
