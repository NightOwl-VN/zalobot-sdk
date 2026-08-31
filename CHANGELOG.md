# Changelog

All notable changes to the **Zalo Bot SDK** project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-31

### Added
- **Initial Release**: Core SDK for Zalo Bot Platform (bot.zapps.me).
- `ZaloBot`: Entry point supporting both initialization patterns (via Object params or auto-read `.env`).
- `ZaloClient`: HTTP Client wrapping Axios with automatic retry on rate limits (code 429) and automatic API error handling.
- `ZaloConfig`: Strict configuration management and validation before sending requests.

### Modules
- `message`: Send text messages (`sendText`), photos (`sendPhoto`), stickers (`sendSticker`), voice messages (`sendVoice`), chat actions (`sendChatAction`). Also includes webhook management (`setWebhook`, `deleteWebhook`, `getWebhookInfo`, `testWebhook`) and bot info (`getMe`).
- `webhook`: Token-based verification via `X-Bot-Api-Secret-Token` header (`verify`), event parsing (`parseEvent`), Express middleware integration (`middleware`).

### Error Handling
- `ZaloApiError`: Maps all Zalo Bot API error codes to detailed English messages.
- `ZaloAuthError`: Authentication errors for invalid or expired bot tokens.
- `ZaloRateLimitError`: Rate limit errors with retry-after info.
- `ZaloWebhookError`: Webhook secret token verification failures.

### Infrastructure
- Integrated `.env.example` for examples, standard Node.js `.gitignore`.
- MIT License, contributing guide (`CONTRIBUTING.md`).
- API Reference documentation in English (`docs/en/api-reference.md`).

### Fixed
- Examples corrected to use `secretKey` instead of deprecated `secret` option.
- Fixed `require` path in `send-message.js` to use `../src`.
- Removed references to non-existent `sendQuickReply` method in examples.
- Updated `.gitignore` with `coverage/`, `dist/`, `*.tgz`, `.idea/`, `.vscode/`, `.nyc_output/`.

## [Unreleased]

Nothing yet.
