# v17.2.1 · TG-CB-6.2 — hoàn thiện Prism fallback

- Luận sâu duy nhất; mọi route ở xhigh.
- Route: 9router Astra → 9router Gemini 3.6 Flash → Prism local GPT-6 Astra.
- Prism proxy chỉ nghe 127.0.0.1:8787 và dùng khóa riêng trong env mode 600.
- START-VPS giám sát Prism cùng bridge và Named Tunnel; không thay đổi cấu hình Cloudflare Tunnel.
- UI tiếp tục hiển thị model/route/effort thực tế tạo bài cuối.
- Prism upstream có thể báo maintenance; trường hợp đó app fail-closed nếu hai route trước cũng lỗi.
