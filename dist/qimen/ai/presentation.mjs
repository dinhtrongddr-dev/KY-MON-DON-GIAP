const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();

export function buildPresentationProfile(context) {
  const c=context.allInOne,q=c.questionContext,g=c.reasoning,mode=c.classification.mode;
  const text=normalized(q.question);
  const asksDevelopment=/\b(dien bien|chuyen bien|tiep theo|qua trinh|se ra sao|sau do)\b/.test(text);
  const hasRealTiming=Boolean(g.timing?.allowedPredictions?.length);
  const deep=q.depth==='deep';
  const profile={
    mode,
    layout:'full',
    showDevelopment:true,
    showTiming:true,
    showAlternative:true,
    minActions:2,
    minClaimGroups:3,
    tabs:[],
    labels:{situation:'Căn cứ quyết định',bottleneck:'Điểm mấu chốt',alternative:'Khi nào cần đổi cách hiểu?',actions:'Bước tiếp theo',timing:'Điều kiện thời gian'},
    reasoningGoal:'Tổng hợp đúng mục tiêu người dùng hỏi, không ép mọi chế độ vào cùng một khuôn diễn biến.'
  };

  if(mode==='prediction'){
    profile.layout=!deep&&!asksDevelopment?'focused':'full';
    profile.showDevelopment=deep||asksDevelopment;
    profile.showTiming=deep||hasRealTiming;
    profile.showAlternative=deep||profile.showDevelopment;
    profile.minActions=1;
    profile.minClaimGroups=deep?3:2;
    const timingTab=profile.showTiming?[['timing',hasRealTiming?'Ứng kỳ':'Thời gian & giới hạn']]:[];
    profile.tabs=[['quick','Kết quả'],...(profile.showDevelopment?[['story','Diễn biến']]:[]),['actions','Điều cần làm'],['technical','Căn cứ Kỳ Môn'],...timingTab];
    profile.labels={situation:'Cụm tượng quyết định',bottleneck:'Điều kiện làm thay đổi kết quả',alternative:'Nhánh kết quả khác',actions:'Điều cần làm',timing:hasRealTiming?'Ứng kỳ':'Phạm vi thời gian & giới hạn'};
    profile.reasoningGoal='Trả lời kết quả đang hỏi trước; tách dấu hiệu, điều kiện chuyển và kết quả cuối. Chỉ dựng diễn biến khi câu hỏi thực sự cần hoặc người dùng chọn Luận sâu. Ở Luận trọng tâm, không tạo tab ứng kỳ nếu engine chưa có mốc được phép.';
  } else if(mode==='strategy'){
    profile.tabs=[['quick','Thế cục'],['story','Lộ trình'],['actions','Hành động'],['timing','Điểm dừng / kích hoạt'],['technical','Căn cứ Kỳ Môn']];
    profile.labels={situation:'Thế và nguồn lực',bottleneck:'Nút cần phá',alternative:'Phương án B',actions:'Thứ tự hành động',timing:'Điều kiện kích hoạt / điểm dừng'};
    profile.reasoningGoal='Biến tượng thành chuỗi quyết định có thứ tự: thế hiện tại → bước thử → phản hồi cần đo → điều kiện mở rộng hoặc dừng. Không biến chiến lược thành câu trả lời có/không.';
  } else if(mode==='business'){
    profile.tabs=[['quick','Thương vụ'],['story','Pipeline'],['actions','Bước chốt'],['timing','Rủi ro & điều kiện'],['technical','Căn cứ Kỳ Môn']];
    profile.labels={situation:'Vị thế thương vụ',bottleneck:'Khâu đang nghẽn',alternative:'Kịch bản thương vụ khác',actions:'Bước chốt tiếp theo',timing:'Điều kiện thương mại cần xác nhận'};
    profile.reasoningGoal='Luận theo pipeline thương vụ và giai đoạn người dùng đang hỏi: nhu cầu/phản hồi → phạm vi & báo giá → quyền duyệt → thỏa thuận/ký → thực hiện → tiền về. Không nhập nhằng các mốc này.';
  } else if(mode==='negotiation'){
    profile.tabs=[['quick','Thế đàm phán'],['story','Nhịp trao đổi'],['actions','Đòn bẩy & bước tiếp'],['timing','Giới hạn / điểm dừng'],['technical','Căn cứ Kỳ Môn']];
    profile.labels={situation:'Thế hai bên',bottleneck:'Điểm khó nhượng',alternative:'Phương án nếu không đạt điều kiện',actions:'Đòn bẩy và bước tiếp',timing:'Giới hạn / điểm dừng'};
    profile.reasoningGoal='Tập trung điều kiện có thể đổi, đòn bẩy, mức nhượng và điểm dừng. Không suy động cơ đối phương khi chưa có đại diện được xác định.';
  } else if(mode==='timing'){
    profile.layout='focused';
    profile.showDevelopment=false;
    profile.showTiming=true;
    profile.showAlternative=false;
    profile.minActions=1;
    profile.minClaimGroups=2;
    profile.tabs=[['quick','Kết luận'],['timing','So sánh thời điểm'],['actions','Cách áp dụng'],['technical','Căn cứ Kỳ Môn']];
    profile.labels={situation:'Căn cứ chọn thời điểm',bottleneck:'Điều kiện loại trừ',alternative:'',actions:'Cách áp dụng',timing:'So sánh thời điểm'};
    profile.reasoningGoal='So sánh đúng các thời điểm người dùng nhập; không dựng chuỗi sự kiện và không biến thời điểm phù hợp tương đối thành ngày chắc chắn có kết quả.';
  } else if(mode==='direction'){
    profile.layout='focused';
    profile.showDevelopment=false;
    profile.showTiming=true;
    profile.showAlternative=false;
    profile.minActions=1;
    profile.minClaimGroups=2;
    profile.tabs=[['quick','Kết luận'],['timing','So sánh hướng'],['actions','Cách áp dụng'],['technical','Căn cứ Kỳ Môn']];
    profile.labels={situation:'Căn cứ chọn hướng',bottleneck:'Điều kiện thực địa',alternative:'',actions:'Cách áp dụng',timing:'So sánh hướng'};
    profile.reasoningGoal='So sánh phương vị từ đúng điểm quy chiếu và mục tiêu hành động; không dựng diễn biến thời gian hoặc suy tọa độ ngoài dữ liệu.';
  }

  return Object.freeze(profile);
}
