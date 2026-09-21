export const CASE_LIBRARY_VERSION='KM-CASE-LIBRARY-1.0';

export const CASE_LIBRARY=Object.freeze([
  Object.freeze({
    caseId:'case_event_finance_emergence_20260916',
    product:'event',priority:100,
    provenance:Object.freeze({
      kind:'DETERMINISTIC_GOLDEN',
      verification:'REGRESSION_LOCKED',
      sourceRef:'tests/fixtures/income-emergence-2026-09-16.json',
      observedOutcome:false,
      note:'Khóa cách phân biệt phát sinh tiền với thực nhận; không phải ca outcome ngoài đời.'
    }),
    match:Object.freeze({
      domains:Object.freeze(['finance']),
      modes:Object.freeze(['prediction']),
      stages:Object.freeze(['emergence']),
      requiredRoles:Object.freeze(['money']),
      preferredRoles:Object.freeze(['self','capital']),
      preferredAnswerClasses:Object.freeze(['conditional_positive'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['stage_separation','primary_useful_god_strength','no_invented_counterparty']),
      assembly:Object.freeze([
        'Phân biệt rõ phát sinh/cơ hội thu với tiền thực nhận; không nhảy tầng kết quả.',
        'Lực của Dụng Thần tiền là căn cứ chính cho tầng phát sinh; can nguồn vốn hoặc người hỏi chỉ là điều kiện bổ sung nếu resolver xếp thấp hơn.',
        'Một Tuần Không hoặc cấu trúc cản ở tầng thực nhận không tự xóa tín hiệu thuận ở tầng phát sinh.'
      ]),
      adaptation:Object.freeze([
        'Nếu answerClass hiện tại không còn thuận, giữ nguyên cách tách tầng nhưng không mượn kết luận của case cũ.',
        'Nếu câu hỏi hỏi payment/realization thay vì emergence, chuyển trọng tâm sang đúng tầng đang hỏi.'
      ]),
      avoid:Object.freeze([
        'Không tự thêm người trả tiền, khách hàng hoặc người duyệt.',
        'Không dùng case này làm xác suất tiền về.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_event_family_finance_capacity',
    product:'event',priority:90,
    provenance:Object.freeze({
      kind:'DERIVED_REGRESSION',
      verification:'TEST_LOCKED',
      sourceRef:'tests/yongshen-v2.test.mjs',
      observedOutcome:false,
      note:'Khóa mixed-domain family + finance và thứ bậc Dụng Thần.'
    }),
    match:Object.freeze({
      domains:Object.freeze(['family']),
      requiredSecondaryDomains:Object.freeze(['finance']),
      requiredRoles:Object.freeze(['family_child','money']),
      preferredRoles:Object.freeze(['capital','self'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['mixed_domain_precedence','family_role_first','finance_secondary']),
      assembly:Object.freeze([
        'Giữ domain gia đình làm trục chính; tài chính chỉ trả lời năng lực hỗ trợ quyết định gia đình.',
        'Con cái/Thời trụ đã được resolver chọn phải đi trước money/capital nếu đang là primary.',
        'Tách câu hỏi “có nên” khỏi câu hỏi “có đủ khả năng”; không để một kết luận tài chính thay toàn bộ quyết định gia đình.'
      ]),
      adaptation:Object.freeze([
        'Nếu không có family_child mà là cha mẹ/người thân khác, giữ nguyên nguyên tắc mixed-domain nhưng dùng đúng vai family đã kích hoạt.'
      ]),
      avoid:Object.freeze([
        'Không tự gán người phối ngẫu vào một cung nếu resolver còn unresolved.',
        'Không biến nguồn lực biểu tượng thành số tiền hoặc ngân sách thực.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_event_relationship_unresolved_counterpart',
    product:'event',priority:80,
    provenance:Object.freeze({
      kind:'DERIVED_REGRESSION',
      verification:'TEST_LOCKED',
      sourceRef:'tests/yongshen-v2.test.mjs',
      observedOutcome:false,
      note:'Khóa counterpart unresolved trong câu hỏi tình cảm.'
    }),
    match:Object.freeze({
      domains:Object.freeze(['relationship']),
      requiredUnresolvedRoles:Object.freeze(['customer']),
      requiredRoles:Object.freeze(['self'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['unresolved_counterpart','no_mind_reading']),
      assembly:Object.freeze([
        'Nếu counterpart chưa có đại diện cung hợp lệ, chỉ luận phần người hỏi và trục quan hệ đã xác định.',
        'Có thể nêu điều kiện cần quan sát ở phía còn lại nhưng không dựng cung, tâm ý hoặc động cơ cho họ.'
      ]),
      adaptation:Object.freeze([
        'Nếu người dùng đã cung cấp đại diện counterpart thì case này chỉ còn nhắc guardrail, không được giữ trạng thái unresolved.'
      ]),
      avoid:Object.freeze([
        'Không gán đối phương = Thời can theo mặc định.',
        'Không suy “người ấy nghĩ gì” từ một vai chưa resolve.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_event_health_symbolic_boundary',
    product:'event',priority:85,
    provenance:Object.freeze({
      kind:'DERIVED_REGRESSION',
      verification:'TEST_LOCKED',
      sourceRef:'tests/yongshen-v2.test.mjs',
      observedOutcome:false,
      note:'Khóa biên symbolic health; không phải case y khoa.'
    }),
    match:Object.freeze({
      domains:Object.freeze(['health']),
      requiredRoles:Object.freeze(['health_issue']),
      preferredRoles:Object.freeze(['health_support'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['health_symbolic_only','support_vs_issue']),
      assembly:Object.freeze([
        'Tách biểu tượng vấn đề sức khỏe khỏi lớp hỗ trợ/chăm sóc; chỉ mô tả xu hướng Kỳ Môn.',
        'Dùng cấu trúc và strength để mô tả mức cần chú ý, không biến thành chẩn đoán.'
      ]),
      adaptation:Object.freeze([
        'Nếu câu hỏi có dấu hiệu nguy hiểm thực tế, ưu tiên khuyến nghị trợ giúp y tế thực tế trước mọi diễn giải biểu tượng.'
      ]),
      avoid:Object.freeze([
        'Không chẩn đoán bệnh, kê thuốc hoặc khẳng định mức độ bệnh từ case.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_event_timing_trigger_precedence',
    product:'event',priority:100,
    provenance:Object.freeze({
      kind:'DERIVED_REGRESSION',
      verification:'TEST_LOCKED',
      sourceRef:'tests/timing-engine-v2.test.mjs',
      observedOutcome:false,
      note:'Khóa thứ tự trigger KM-YINGQI-2.0; không phải outcome history.'
    }),
    match:Object.freeze({
      modes:Object.freeze(['timing']),
      requiredTiming:true
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['timing_trigger_precedence','no_fabricated_date']),
      assembly:Object.freeze([
        'Khi có nhiều trigger hợp lệ, giữ đúng thứ tự Void fill/clash → Horse arrival/clash → Three-Wonder Tomb arrival/clash.',
        'Nhịp nhanh/chậm từ Nội/Ngoại và Phục/Phản Ngâm không được tự tạo ngày.'
      ]),
      adaptation:Object.freeze([
        'Nếu target không có trigger được Timing Engine cho phép, case này chỉ nhắc phải abstain khỏi ngày cụ thể.'
      ]),
      avoid:Object.freeze([
        'Không dùng punishment, stem/door timing hoặc Phục/Phản Ngâm một mình để bịa ngày.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_menh_z18_global_precedence',
    product:'natal',priority:100,
    provenance:Object.freeze({
      kind:'SOURCE_GOLDEN',
      verification:'SOURCE_LOCKED',
      sourceRef:'F-Z18-GLOBAL-HARD-PRECEDENCE',
      sourceCase:'Z18',
      observedOutcome:false,
      note:'Direct Zhang fixture về global hard precedence; không phải dữ liệu outcome đời thực.'
    }),
    match:Object.freeze({
      requiredGlobalPatterns:Object.freeze(['FU_YIN'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['global_structure_precedence','cap_not_veto']),
      assembly:Object.freeze([
        'Đọc Phục Ngâm toàn cục trước các tín hiệu thuận cục bộ.',
        'Global structure có quyền cap mức phát huy nhưng không trở thành veto xấu tuyệt đối.',
        'Không cộng tín hiệu thuận theo kiểu bỏ phiếu để vượt qua global hard structure.'
      ]),
      adaptation:Object.freeze([
        'Nếu target là Phản Ngâm thay vì Phục Ngâm, giữ nguyên nguyên tắc precedence/cap nhưng diễn đạt theo cơ chế biến động/đảo chiều.'
      ]),
      avoid:Object.freeze([
        'Không gọi một Mệnh bàn là xấu tuyệt đối chỉ vì Phục Ngâm.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_menh_z17_hour_day_baseline',
    product:'natal',priority:70,
    provenance:Object.freeze({
      kind:'SOURCE_GOLDEN',
      verification:'SOURCE_LOCKED',
      sourceRef:'F-Z17-HOUR-DAY-BASELINE',
      sourceCase:'Z17',
      observedOutcome:false,
      note:'Direct Zhang fixture về Day/Hour baseline và chống double-count.'
    }),
    match:Object.freeze({
      requiredClaims:Object.freeze(['SELF_CORE','CHILDREN_CORE'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['day_hour_distinct_roles','no_duplicate_vote']),
      assembly:Object.freeze([
        'Nhật can và Thời can có thể cùng tham gia nhưng phải giữ vai riêng: Self và Children/process baseline.',
        'Nếu cùng một cung hoặc cùng một bằng chứng phục vụ nhiều resolver, không cộng thành nhiều phiếu độc lập.'
      ]),
      adaptation:Object.freeze([
        'Nếu không có CHILDREN_CORE, chỉ giữ nguyên tắc chống double-count cho các vai đồng cung.'
      ]),
      avoid:Object.freeze([
        'Không biến số lượng resolver trùng nhau thành confidence.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_menh_lwf06_marriage_multi_resolver',
    product:'natal',priority:85,
    provenance:Object.freeze({
      kind:'SOURCE_GOLDEN',
      verification:'SOURCE_LOCKED',
      sourceRef:'F-LWF06-MARRIAGE-MULTI-RESOLVER',
      sourceCase:'LWF-06',
      observedOutcome:false,
      note:'Transmission Zhang-line fixture về hôn nhân multi-resolver.'
    }),
    match:Object.freeze({
      requiredClaims:Object.freeze(['MARRIAGE_CORE'])
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['marriage_multi_resolver','no_single_symbol_truth']),
      assembly:Object.freeze([
        'Hôn nhân phải tổng hợp Self + Hưu Môn + Lục Hợp + Ất/Canh + can ngũ hợp theo đúng resolver đang có.',
        'Một ký hiệu thuận hoặc nghịch không được đứng một mình làm kết luận.'
      ]),
      adaptation:Object.freeze([
        'Nếu một resolver không resolve được trong target, nêu rõ thiếu lớp đó thay vì bù bằng resolver khác.'
      ]),
      avoid:Object.freeze([
        'Không suy số lần kết hôn hoặc định danh người phối ngẫu từ một ký hiệu.'
      ])
    })
  }),
  Object.freeze({
    caseId:'case_menh_lwf08_annual_tianpan',
    product:'natal',priority:80,
    provenance:Object.freeze({
      kind:'SOURCE_GOLDEN',
      verification:'SOURCE_LOCKED',
      sourceRef:'F-LWF08-ANNUAL-TIANPAN-BING-ZI',
      sourceCase:'LWF-08',
      observedOutcome:false,
      note:'Transmission Zhang-line fixture chỉ khóa annual-layer resolver.'
    }),
    match:Object.freeze({
      requiredClaims:Object.freeze(['ANNUAL_CURRENT']),
      requiredAnnual:true
    }),
    guidance:Object.freeze({
      principleIds:Object.freeze(['annual_stem_primary','annual_scope_bound']),
      assembly:Object.freeze([
        'Can lưu niên là locator chính trên Thiên bàn; Chi là lớp phụ theo runtime hiện hành.',
        'Chỉ luận activation của Mệnh bàn cố định; không từ một annual locator suy ra toàn bộ chart profile hay sự kiện chắc chắn.'
      ]),
      adaptation:Object.freeze([
        'Nếu annual overlay không có, case này không được dùng.'
      ]),
      avoid:Object.freeze([
        'Không biến annual activation thành OBSERVED_EVENT.'
      ])
    })
  })
]);

export const CASE_RETENTION_POLICY=Object.freeze({
  version:'KM-CASE-RETENTION-1.0',
  mode:'manual_verified_only',
  autoRetainUserSessions:false,
  storesQuestionText:false,
  requiresHumanReview:true,
  requiresProvenance:true,
  outcomeCalibrationRequiresObservedOutcome:true,
  note:'Runtime không tự học từ lượt luận. Ca mới chỉ được đưa vào thư viện sau review và provenance riêng; dữ liệu câu hỏi người dùng không tự được giữ làm case.'
});
