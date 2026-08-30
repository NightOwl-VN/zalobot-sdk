# Hướng dẫn Đóng góp cho Zalo Bot SDK

> Ngôn ngữ: [English 🇺🇸](../../CONTRIBUTING.md) | [Tiếng Việt 🇻🇳](./contributing.md)

Cảm ơn bạn đã quan tâm đến việc đóng góp cho **Zalo Bot SDK**! Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng lập trình viên, từ việc báo lỗi, cải thiện tài liệu đến việc bổ sung các tính năng mới.

---

## 📜 Quy tắc Ứng xử (Code of Conduct)

Chúng tôi cam kết tạo ra một môi trường mở, hòa đồng và tôn trọng lẫn nhau. Vui lòng giao tiếp văn minh, tôn trọng ý kiến của người khác trong mọi trao đổi qua Issues, Pull Requests và thảo luận.

---

## 🛠️ Cách thức Đóng góp

### 1. Báo cáo Lỗi (Reporting Bugs)
- Tìm kiếm trong danh sách [GitHub Issues](https://github.com/NightOwl-VN/zalobot-sdk/issues) trước để tránh tạo trùng lặp.
- Nếu lỗi chưa được báo cáo, tạo một issue mới sử dụng mẫu **Bug Report**.
- Cung cấp tiêu đề rõ ràng, các bước tái hiện lỗi, kết quả mong đợi và kết quả thực tế, cùng thông tin môi trường (Node.js version, OS, SDK version).
- Đính kèm log lỗi hoặc đoạn mã mẫu tối giản (tuyệt đối không để lộ token hay secret key thật).

### 2. Đề xuất Tính năng (Suggesting Enhancements)
- Mở issue sử dụng mẫu **Feature Request**.
- Mô tả chi tiết về tính năng đề xuất, lý do cần thiết và thiết kế API dự kiến.
- Thảo luận trước với maintainer nếu tính năng có thể làm thay đổi kiến trúc hiện tại.

### 3. Gửi Pull Request (PR)
- Mỗi PR nên tập trung giải quyết một vấn đề hoặc một tính năng cụ thể.
- Đảm bảo toàn bộ mã nguồn tuân thủ quy chuẩn viết code và vượt qua các bài kiểm tra nội bộ.

---

## 💻 Thiết lập Môi trường Phát triển Cục bộ

Các bước thiết lập môi trường để phát triển và test:

```bash
# 1. Clone repository
git clone https://github.com/NightOwl-VN/zalobot-sdk.git
cd zalobot-sdk

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình biến môi trường
cp .env.example .env

# 4. Điền các thông số test vào .env (không bao giờ commit file này)
# ZALO_BOT_ACCESS_TOKEN=your_test_token

# 5. Link package cục bộ để test trên các project khác (tùy chọn)
npm link
```

### Chạy thử các ví dụ:
```bash
# Test gửi tin nhắn mẫu
npm run example:send

# Chạy server nhận webhook local
npm run example:webhook
```

---

## 🎨 Quy chuẩn Viết mã nguồn (Coding & Style Guidelines)

Để duy trì mã nguồn sạch và nhất quán, vui lòng tuân thủ các quy tắc sau:

1. **Modern JavaScript (ES6+)**:
   - Sử dụng `async/await` cho toàn bộ các thao tác bất đồng bộ.
   - Sử dụng các tính năng hiện đại của ES (destructuring, arrow functions, template literals).
   - Thiết kế các hàm đơn nhiệm, module hóa rõ ràng.

2. **Tài liệu hóa bằng JSDoc**:
   - Mọi class, method, function public **bắt buộc** phải có chú thích JSDoc đầy đủ.
   - Định nghĩa rõ kiểu dữ liệu của tham số và giá trị trả về để tối ưu IntelliSense / Autocomplete trên VS Code.

3. **Bảo mật — Không Hardcode**:
   - Tuyệt đối không commit token, secret key, IP nội bộ hay localhost vào mã nguồn.
   - Tất cả cấu hình URL và thông số kết nối phải được đọc từ `src/config.js` hoặc file `.env`.

4. **Xử lý Lỗi (Error Handling)**:
   - Sử dụng các lớp lỗi tùy chỉnh từ `src/errors/` (`ZaloApiError`, `ZaloAuthError`, `ZaloValidationError`).
   - Mọi thông báo lỗi và log nội bộ phải được viết bằng Tiếng Anh kỹ thuật rõ ràng.

---

## 🔀 Quy chuẩn Đặt tên Commit (Git Commit Conventions)

Dự án áp dụng quy chuẩn [Conventional Commits](https://www.conventionalcommits.org/):

| Tiền tố | Mục đích sử dụng | Ví dụ |
|---|---|---|
| `feat:` | Tính năng mới | `feat: add support for interactive carousel templates` |
| `fix:` | Sửa lỗi | `fix: handle edge case in webhook signature parser` |
| `docs:` | Cập nhật tài liệu | `docs: add webhook troubleshooting guide` |
| `refactor:` | Tái cấu trúc code (không đổi tính năng) | `refactor: optimize token refresh helper` |
| `test:` | Thêm hoặc sửa tests | `test: add unit tests for message module` |
| `chore:` | Cập nhật công cụ build, dependencies | `chore: update dependencies` |

---

## 🚀 Quy trình Gửi Pull Request

1. **Tạo nhánh (Branch)**:
   Tạo nhánh mới từ nhánh `main`:
   ```bash
   git checkout -b feat/ten-tinh-nang
   # hoặc
   git checkout -b fix/mo-ta-loi
   ```

2. **Phát triển & Kiểm thử**:
   - Viết code theo đúng quy chuẩn.
   - Cập nhật JSDoc tương ứng.
   - Kiểm tra hoạt động bằng các file trong thư mục `examples/`.

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: mo ta ngan gon ve thay doi"
   git push origin feat/ten-tinh-nang
   ```

4. **Mở Pull Request**:
   - Tạo PR vào nhánh `main` của repository `NightOwl-VN/zalobot-sdk`.
   - Mô tả ngắn gọn những gì đã thay đổi và đính kèm link issue liên quan (VD: `Closes #12`).
   - Maintainer sẽ review và phản hồi sớm nhất có thể.

---

## 📄 Giấy phép Bản quyền

Bằng việc đóng góp mã nguồn cho Zalo Bot SDK, bạn đồng ý rằng các đóng góp của bạn sẽ được phát hành theo điều khoản của [Giấy phép MIT](./LICENSE).
