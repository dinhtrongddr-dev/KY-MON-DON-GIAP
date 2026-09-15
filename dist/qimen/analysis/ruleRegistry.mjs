export const RULE_REGISTRY=Object.freeze({
  rule_board:{id:'rule_board',source:'docs/releases/RULE-COVERAGE.md',verification:'tested_implementation',conditions:'Thời Gia Chuyển Bàn, cùng pháp và giờ dân dụng; dữ kiện từ core, không phải bằng chứng dự báo.'},
  rule_actor:{id:'rule_actor',source:'dist/qimen/analysis/usefulGod.mjs',verification:'app_convention_unverified',conditions:'Nhật can chỉ đại diện người hỏi việc của mình; hỏi thay dùng Can Chi được người dùng xác nhận. Thời can là bối cảnh sự việc, không tự là khách hàng.'},
  rule_proxy:{id:'rule_proxy',source:'dist/qimen/modes/semantics.mjs',verification:'app_convention_unverified',conditions:'Ánh xạ vai hiện đại là quy ước của ứng dụng, chưa xác minh nguồn truyền thống cho từng trường hợp; không chứng minh danh tính, doanh thu hay lợi nhuận.'},
  rule_user_mapping:{id:'rule_user_mapping',source:'user_input',verification:'user_confirmed_mapping',conditions:'Người dùng xác nhận Can Chi đại diện; code định vị can, không xác thực căn cứ chọn Can Chi của người dùng.'},
  rule_elements:{id:'rule_elements',source:'docs/releases/RULE-COVERAGE.md',verification:'declared_convention',conditions:'Sinh/khắc xét hành cung theo đúng chiều, không phải quan hệ nhân quả hay xác suất.'},
  rule_conditions:{id:'rule_conditions',source:'docs/releases/RULE-COVERAGE.md',verification:'tested_declared_scope',conditions:'Không/Mã theo chi giờ; Môn bức đúng chiều; hình/mộ xét từng can kể cả can ký; mộ chỉ bao gồm Tam kỳ.'},
  rule_strength:{id:'rule_strength',source:'https://zh.wikisource.org/wiki/煙波釣叟歌',verification:'source_cited_scope_limited',conditions:'Quy ước vượng suy Cửu Tinh theo tháng tiết khí; không áp sang Can, Môn hay hành cung. Nguồn trích dẫn không tự xác minh mọi quy tắc của app.'},
  rule_synthesis:{id:'rule_synthesis',source:'dist/qimen/ai/reasoningPlanner.mjs',verification:'app_convention_unverified',conditions:'Tổng hợp tượng thành giả thuyết có điều kiện; điểm ưu tiên chỉ là tiêu chí nội bộ, không phải công thức cổ truyền hoặc xác suất.'},
});
export function selectionProvenance(role) {
  const id=role.status==='user_supplied'?'rule_user_mapping':['self','event'].includes(role.id)?'rule_actor':'rule_proxy';
  return {selectionRule:RULE_REGISTRY[id],limitations:[RULE_REGISTRY[id].conditions,...(role.status==='unresolved'?['Chưa xác định đại diện; không gán cung của một biểu tượng cho người này.']:[])]};
}
