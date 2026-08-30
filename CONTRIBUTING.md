# Contributing to Zalo Bot SDK

Cảm ơn bạn đã quan tâm và đóng góp cho dự án **Zalo Bot SDK**! Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng lập trình viên.

---

## 🛠️ Quy trình Đóng góp (Workflow)

1. **Fork** repository về tài khoản GitHub của bạn.
2. Tạo nhánh mới từ nhánh `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. Cài đặt dependencies:
   ```bash
   npm install
   ```
4. Thực hiện thay đổi, thêm tính năng hoặc sửa lỗi.
5. Kiểm tra code và chạy thử các ví dụ:
   ```bash
   npm run example:send
   npm run example:webhook
   ```
6. Commit theo chuẩn **Conventional Commits**:
   - `feat: add support for new message template`
   - `fix: correct signature verification logic`
   - `docs: update webhook integration guide`
   - `refactor: optimize token caching`
7. Push lên fork của bạn và mở **Pull Request** (PR) vào nhánh `main` của repository gốc.

---

## 📝 Quy chuẩn Code (Coding Standards)

- Sử dụng **ES6+ Modern JavaScript** (async/await, modules sạch).
- Viết **JSDoc đầy đủ** trên mọi method public để hỗ trợ Autocomplete / IntelliSense trong VS Code.
- Không đưa thông tin nhạy cảm (token, secret, private key, IP nội bộ) vào code hoặc ví dụ.
- Xử lý lỗi đầy đủ, trả về các custom error class từ `src/errors/`.

---

## 🐞 Báo cáo Lỗi & Đề xuất Tính năng

Vui lòng sử dụng [GitHub Issues Template](https://github.com/NightOwl-VN/zalobot-sdk/issues) để tạo báo cáo lỗi hoặc đề xuất tính năng mới.

---

## 📄 Giấy phép

Mọi đóng góp cho dự án sẽ được cấp phép theo [MIT License](LICENSE).
