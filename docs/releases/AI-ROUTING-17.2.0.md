# v17.2.0 · TG-CB-6.2 — Luận sâu và fallback model có truy vết

- Mọi request được chuẩn hóa thành depth deep; website không còn Luận trọng tâm.
- Mọi route AI dùng mức suy luận xhigh.
- Thứ tự route: cx/gpt-6-astra → gemini/gemini-3.6-flash → Prism local gpt-6-astra.
- /api/read trả modelUsed; UI hiển thị model, route và effort thực tế đã tạo bài cuối.
- Dự đoán không tự sinh diễn biến/ứng kỳ chỉ vì đang ở Luận sâu.
- Core TG-ROTATING-2.0 và protocol 5 giữ nguyên.
