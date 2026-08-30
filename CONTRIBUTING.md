# Contributing to Zalo Bot SDK

> Language: [English 🇺🇸](./CONTRIBUTING.md) | [Tiếng Việt 🇻🇳](./docs/vi/contributing.md)

Thank you for your interest in contributing to **Zalo Bot SDK**! We welcome contributions from developers of all skill levels. Whether you are reporting a bug, improving documentation, or adding new features, your help is appreciated.

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and professional in all interactions across issues, pull requests, and discussions.

---

## 🛠️ How to Contribute

### 1. Reporting Bugs
- Search existing [GitHub Issues](https://github.com/NightOwl-VN/zalobot-sdk/issues) first to ensure the bug hasn't already been reported.
- If not, create a new issue using the **Bug Report** template.
- Provide a clear title, reproduction steps, expected vs. actual behavior, and environment details (Node.js version, OS, SDK version).
- Include relevant error logs or minimal code snippets without exposing sensitive access tokens or secret keys.

### 2. Suggesting Enhancements
- Open an issue using the **Feature Request** template.
- Clearly describe the proposed feature, user motivation, and potential API design.
- Discuss breaking changes or architectural modifications before implementing them.

### 3. Submitting Pull Requests (PRs)
- Keep PRs focused on a single feature or bug fix.
- Ensure all existing and new code adheres to our style guidelines and passes local testing.

---

## 💻 Local Development Setup

Follow these steps to set up the development environment locally:

```bash
# 1. Clone the repository
git clone https://github.com/NightOwl-VN/zalobot-sdk.git
cd zalobot-sdk

# 2. Install dependencies
npm install

# 3. Create a local environment file
cp .env.example .env

# 4. Fill in your test credentials in .env (never commit this file)
# ZALO_BOT_ACCESS_TOKEN=your_test_token

# 5. Link package locally for testing in other projects (optional)
npm link
```

### Running Examples Locally
```bash
# Test message dispatch
npm run example:send

# Start the local webhook receiver
npm run example:webhook
```

---

## 🎨 Coding & Style Guidelines

To keep the codebase maintainable and consistent, please follow these rules:

1. **Modern JavaScript (ES6+)**:
   - Use `async/await` for asynchronous code.
   - Use native ES features (destructuring, arrow functions, template literals).
   - Write clean, modular functions with single responsibility.

2. **JSDoc Documentation**:
   - Every public class, method, function, and parameter **must** include comprehensive JSDoc comments.
   - Specify accurate types and return shapes to maintain rich IDE autocomplete / IntelliSense.

3. **Zero Hardcoded Secrets & Localhost**:
   - Never commit API keys, access tokens, secret keys, or internal IP addresses.
   - All URLs and endpoints must be dynamically configurable via `src/config.js` and `.env`.

4. **Error Handling**:
   - Use custom error classes from `src/errors/` (`ZaloApiError`, `ZaloAuthError`, `ZaloValidationError`).
   - All error messages must be in clear Technical English.

---

## 🔀 Git Commit Conventions

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Usage | Example |
|---|---|---|
| `feat:` | A new feature | `feat: add support for interactive carousel templates` |
| `fix:` | A bug fix | `fix: handle edge case in webhook signature parser` |
| `docs:` | Documentation changes | `docs: add webhook troubleshooting guide` |
| `refactor:` | Code change that neither fixes a bug nor adds a feature | `refactor: optimize token refresh helper` |
| `test:` | Adding or updating tests | `test: add unit tests for message module` |
| `chore:` | Build process, auxiliary tools, dependencies | `chore: update dependencies` |

---

## 🚀 Pull Request Process

1. **Fork & Branch**:
   Create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Develop & Test**:
   - Write your code following the style guide.
   - Add/update JSDoc comments.
   - Verify by running the examples in `examples/`.

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feat/your-feature-name
   ```

4. **Open a Pull Request**:
   - Open a PR against the `main` branch of `NightOwl-VN/zalobot-sdk`.
   - Provide a clear summary of changes and reference related issue numbers (e.g., `Closes #12`).
   - A maintainer will review your PR and provide feedback.

---

## 📄 License

By contributing to Zalo Bot SDK, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
