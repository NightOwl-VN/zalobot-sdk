# Changelog

Toàn bộ các thay đổi đáng chú ý của dự án **Zalo Bot SDK** sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-30

### Added
- **Core Architecture**:
  - `ZaloBot`: Entry point chính hỗ trợ cả 2 cách khởi tạo (qua Object params hoặc tự động đọc `.env`).
  - `ZaloClient`: HTTP Client bọc Axios với cơ chế tự động Retry khi gặp Rate Limit (mã 429) và tự động bắt lỗi API.
  - `ZaloConfig`: Quản lý và validate cấu hình chặt chẽ trước khi gửi request.
- **Modules**:
  - `message`: Hỗ trợ gửi tin nhắn văn bản (`sendText`), hình ảnh (`sendImage`), tập tin (`sendFile`), nhãn dán (`sendSticker`), mẫu nút tương tác (`sendTemplate`), tin nhắn phản hồi nhanh (`sendQuickReply`), xem chi tiết tin nhắn (`getMessage`), lịch sử hội thoại (`getConversation`).
  - `user`: Lấy thông tin cá nhân người dùng (`getProfile`), danh sách người quan tâm (`getFollowers`), kiểm tra trạng thái quan tâm (`isFollowing`), bộ nhớ đệm profile (`getProfileCached`).
  - `webhook`: Xác thực chữ ký HMAC-SHA256 (`verifySignature`), phân tích sự kiện (`parseEvent`), tích hợp Express middleware (`middleware`), hàm xử lý nhanh (`handle`).
  - `media`: Tải lên ảnh (`uploadImage`), tải lên file (`uploadFile`), lấy link media (`getMediaUrl`), tải file về máy chủ (`downloadMedia`).
- **Error Handling**:
  - `ZaloApiError`: Map toàn bộ mã lỗi Zalo API sang thông báo tiếng Việt chi tiết.
  - `ZaloAuthError`: Lỗi xác thực token / secret key.
  - `ZaloValidationError`: Lỗi validate dữ liệu payload trước khi gọi API.
- **Open Source Infrastructure**:
  - Tích hợp `.env.example`, `.gitignore` tiêu chuẩn Node.js.
  - Mẫu báo lỗi và đề xuất tính năng (`.github/ISSUE_TEMPLATE/`).
  - Giấy phép mã nguồn mở MIT License (`LICENSE`), tài liệu đóng góp (`CONTRIBUTING.md`).
