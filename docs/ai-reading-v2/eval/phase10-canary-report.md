# Phase 10 — Báo cáo canary

- Từ: 2026-09-25T10:50:00.000Z
- Lượt reading quan sát: 2
- Hoàn tất tổng: 2
- Smoke có kiểm soát: 2
- Lượt đủ điều kiện observation: 0/20
- Fallback: 0 (0.0%)
- Lỗi/gián đoạn: 0
- Hủy: 0
- Latency p50/p95: 20537 / 147120 ms

## Telemetry

- Critical errors: 0
- Repair signals: 0
- Style signals: 1
- Error codes: {"SURFACE_STYLE":1,"AI_REQUEST_ERROR":6}
- Routes: {"chatgpt2api · local":2}
- Models: {"ChatGPT Web":2}

## Quyết định

- Gate: **NO-GO**
- Blockers: INSUFFICIENT_SAMPLES
- Báo cáo không chứa câu hỏi thô hoặc message lỗi.
