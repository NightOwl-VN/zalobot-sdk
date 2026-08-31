/**
 * Zalo Bot API SDK - TypeScript Type Definitions
 *
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 *
 * @module zalobot-sdk
 * @see https://bot.zapps.me/docs/
 */

import { Readable } from 'stream';
import { IncomingHttpHeaders } from 'http';

// ─────────────────────────────────────────────
//  Options Interfaces
// ─────────────────────────────────────────────

/**
 * Configuration options for creating a ZaloBot or ZaloConfig instance.
 */
export interface ConfigOptions {
  /** Zalo Bot Token (required, e.g. "123456789:abc-xyz") */
  botToken?: string;
  /** Secret key for webhook signature verification (8-256 chars) */
  secretKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Max retry attempts on rate limit errors (default: 3) */
  maxRetries?: number;
  /** Custom API base URL override */
  baseURL?: string;
  /** Retry configuration */
  retry?: RetryOptions;
}

/**
 * Options for the getConfig / toObject methods.
 */
export interface ConfigOutputOptions {
  /** Whether to include secretKey in the output (default: false) */
  includeSecrets?: boolean;
}

/**
 * Retry configuration for HTTP requests.
 */
export interface RetryOptions {
  /** Enable or disable retries (default: true) */
  enabled?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Maximum delay cap in ms (default: 30000) */
  maxDelay?: number;
  /** Add random jitter to backoff delays (default: true) */
  jitter?: boolean;
}

/**
 * Options for sending a text message.
 */
export interface SendTextOptions {
  /** Optional caption for media (1-2000 characters) */
  caption?: string;
}

/**
 * Options for sending a photo message.
 */
export interface SendPhotoOptions {
  /** Optional caption (1-2000 characters) */
  caption?: string;
}

/**
 * Options for getUpdates (long polling).
 */
export interface GetUpdatesOptions {
  /** Timeout in seconds (default: 30) */
  timeout?: number;
}

/**
 * Options for getProfile.
 */
export interface GetProfileOptions {
  /** Comma-separated list of fields to return */
  fields?: string;
}

/**
 * Options for getProfileCached.
 */
export interface GetProfileCachedOptions extends GetProfileOptions {
  /** Bypass cache and fetch fresh data (default: false) */
  forceRefresh?: boolean;
}

/**
 * Query parameters for getFollowers.
 */
export interface GetFollowersParams {
  /** Number of followers to return, max 200 (default: 50) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Comma-separated list of fields to return */
  fields?: string;
}

/**
 * Webhook middleware options.
 */
export interface WebhookOptions {
  /** Async handler called for each parsed event: (event, req, res) => Promise<void> */
  onEvent?: (event: WebhookEvent, req: WebhookRequest, res: WebhookResponse) => Promise<void>;
  /** Send 200 immediately before running the handler (default: false) */
  acknowledgeImmediately?: boolean;
}

/**
 * Options for uploadImage / uploadFile.
 */
export interface MediaUploadOptions {
  /** Custom filename (used when uploading a Buffer) */
  filename?: string;
  /** Media type: 'image' or 'file' */
  type?: 'image' | 'file';
}

/**
 * Options for getMediaUrl.
 */
export interface GetMediaUrlOptions {
  /** Return redirect URL instead of fetching (default: false) */
  redirect?: boolean;
}

/**
 * Image validation limits.
 */
export interface ImageValidationLimits {
  /** Maximum file size in bytes (default: 10 * 1024 * 1024 = 10MB) */
  maxSize?: number;
}

// ─────────────────────────────────────────────
//  Response Types
// ─────────────────────────────────────────────

/**
 * Standard API response envelope. Most Zalo Bot API endpoints return
 * `{ ok: true, result: { ... } }` on success.
 */
export interface ApiResponse<T = Record<string, unknown>> {
  ok: boolean;
  result: T;
}

/**
 * Generic response with an error body.
 */
export interface ApiErrorResponse {
  ok: false;
  error_code: number;
  description: string;
}

/**
 * Response from `getMe()`.
 */
export interface BotInfoResponse {
  id: string;
  account_name: string;
  account_type: string;
}

/**
 * Response from `sendMessage()`.
 */
export interface SendMessageResult {
  message_id: string;
  date: number;
}

/**
 * Response from `sendPhoto()`.
 */
export interface SendPhotoResult {
  message_id: string;
  date: number;
}

/**
 * Response from `sendSticker()`.
 */
export interface SendStickerResult {
  message_id: string;
  date: number;
}

/**
 * Response from `sendVoice()`.
 */
export interface SendVoiceResult {
  message_id: string;
  date: number;
}

/**
 * Response from `setWebhook()`.
 */
export interface SetWebhookResult {
  url: string;
  updated_at: string;
  verification: string;
}

/**
 * Response from `testWebhook()`.
 */
export interface TestWebhookResult {
  ok: boolean;
  url: string;
  status_code: number;
  outcome: string;
  latency_ms: number;
  hint?: string;
}

/**
 * Response from `deleteWebhook()`.
 */
export interface DeleteWebhookResult {
  url: string;
  updated_at: string;
}

/**
 * Response from `getWebhookInfo()`.
 */
export interface WebhookInfoResult {
  url: string;
  updated_at: string;
}

/**
 * User profile data returned from `getProfile()`.
 */
export interface UserProfile {
  id: string;
  name?: string;
  avatar?: string;
  [key: string]: unknown;
}

/**
 * Response from `getFollowers()`.
 */
export interface FollowersResponse {
  data: UserProfile[];
  paging: PaginationPaging;
}

/**
 * Pagination metadata from API responses.
 */
export interface PaginationPaging {
  next?: string;
  cursor?: string;
}

/**
 * Paginated result helper returned by the `paginate()` formatter.
 */
export interface PaginatedResult<T> {
  data: T[];
  paging: PaginationPaging;
  hasNext: boolean;
  next: () => Promise<PaginatedResult<T> | null>;
  readonly all: T[];
}

/**
 * Response from `uploadImage()` / `uploadFile()`.
 */
export interface MediaUploadResult {
  attachment_id: string;
  [key: string]: unknown;
}

/**
 * Image validation result.
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Client configuration snapshot (safe — secrets excluded by default).
 */
export interface ClientConfig {
  botToken: string | null;
  timeout: number;
  baseURL: string;
  retry: RetryOptions;
}

/**
 * Parsed webhook event.
 */
export interface WebhookEvent {
  /** Normalized short event name */
  event: string;
  /** Original Zalo event name (e.g. 'message.text.received') */
  eventName: string;
  /** Sender user ID */
  userId: string;
  /** Chat ID (falls back to userId for 1:1 chats) */
  chatId: string;
  /** Message ID (if applicable) */
  messageId: string | null;
  /** Timestamp (ms since epoch) */
  timestamp: number;
  /** Parsed message content, shape varies by event type */
  message: WebhookEventMessage | null;
  /** Original raw webhook payload */
  raw: Record<string, unknown>;
}

/**
 * Parsed message content within a webhook event.
 */
export interface WebhookEventMessage {
  /** Text content (user_text events) */
  text?: string | null;
  /** Photo URL (user_image events) */
  photo?: string | null;
  /** Caption (user_image events) */
  caption?: string | null;
  /** Sticker ID (user_sticker events) */
  sticker?: string | null;
  /** Voice URL (user_voice events) */
  voiceUrl?: string | null;
  /** Full message object for unrecognized event types */
  [key: string]: unknown;
}

/**
 * Simplified request object for webhook verification.
 * Compatible with Express.js `req` but can be any object with headers.
 */
export interface WebhookRequest {
  headers: IncomingHttpHeaders;
  body?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Simplified response object for webhook middleware.
 * Compatible with Express.js `res`.
 */
export interface WebhookResponse {
  status(code: number): WebhookResponse;
  json(body: unknown): void;
  headersSent: boolean;
}

// ─────────────────────────────────────────────
//  Error Classes
// ─────────────────────────────────────────────

/**
 * Base error class for all Zalo Bot SDK errors.
 */
export class ZaloBotError extends Error {
  name: 'ZaloBotError';
  /** Zalo error code identifier */
  code: string | number | undefined;
  /** HTTP status code */
  status: number | undefined;
  /** Additional error details */
  details: Record<string, unknown> | undefined;

  constructor(message: string, options?: {
    code?: string | number;
    status?: number;
    details?: Record<string, unknown>;
    cause?: Error;
  });
}

/**
 * Error thrown when the Zalo Bot API returns an error response.
 */
export class ZaloApiError extends ZaloBotError {
  name: 'ZaloApiError';

  constructor(
    message: string,
    code?: string | number,
    status?: number,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when the bot token is invalid, missing, or expired.
 */
export class ZaloAuthError extends ZaloBotError {
  name: 'ZaloAuthError';

  constructor(
    message?: string,
    status?: number,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when webhook secret token verification fails.
 */
export class ZaloWebhookError extends ZaloBotError {
  name: 'ZaloWebhookError';

  constructor(
    message?: string,
    status?: number,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when the rate limit is exceeded (HTTP 429).
 */
export class ZaloRateLimitError extends ZaloBotError {
  name: 'ZaloRateLimitError';
  /** Seconds to wait before retrying (NOT the HTTP status code) */
  retryAfter: number | undefined;

  constructor(
    message?: string,
    status?: number,
    retryAfter?: number,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when input validation fails.
 */
export class ZaloValidationError extends ZaloBotError {
  name: 'ZaloValidationError';
  /** Name of the field that failed validation */
  field: string;

  constructor(
    message: string,
    field: string,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when a network request fails (DNS, connection refused, etc.).
 */
export class ZaloNetworkError extends ZaloBotError {
  name: 'ZaloNetworkError';

  constructor(
    message?: string,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

/**
 * Error thrown when a request times out.
 */
export class ZaloTimeoutError extends ZaloBotError {
  name: 'ZaloTimeoutError';

  constructor(
    message?: string,
    details?: Record<string, unknown>,
    cause?: Error,
  );
}

// ─────────────────────────────────────────────
//  ZaloClient
// ─────────────────────────────────────────────

/**
 * Core HTTP client for the Zalo Bot API.
 * Handles authentication, request retries, and error classification.
 */
export class ZaloClient {
  /** Bot token used for API authentication */
  botToken: string;
  /** Secret key for webhook verification */
  secretKey: string | null;
  /** Request timeout in ms */
  timeout: number;
  /** Resolved API base URL */
  baseURL: string;
  /** Retry configuration */
  retry: RetryOptions;

  constructor(config: {
    botToken: string;
    secretKey?: string;
    timeout?: number;
    baseURL?: string;
    maxRetries?: number;
    retry?: RetryOptions;
  });

  /** Make a GET request */
  get(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Make a POST request */
  post(method: string, data?: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Upload a file via multipart/form-data POST */
  upload(
    method: string,
    form: { getHeaders(): Record<string, string> },
    options?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  /** Download binary content (returns a readable stream) */
  download(url: string, options?: Record<string, unknown>): Promise<Readable>;
  /** Update bot token at runtime */
  updateBotToken(newToken: string): void;
  /** Get client configuration snapshot (safe — excludes secrets) */
  getConfig(): ClientConfig;
}

// ─────────────────────────────────────────────
//  ZaloConfig
// ─────────────────────────────────────────────

/**
 * Configuration for the Zalo Bot SDK.
 * Supports both environment variables and manual configuration.
 */
export class ZaloConfig {
  botToken: string | null;
  secretKey: string | null;
  timeout: number;
  maxRetries: number;
  baseURL: string;

  constructor(options?: ConfigOptions);

  /**
   * Create a ZaloConfig purely from environment variables.
   * process.env must already be populated.
   */
  static fromEnv(overrides?: ConfigOptions): ZaloConfig;

  /** Get config as a plain object (secretKey excluded by default) */
  toObject(options?: ConfigOutputOptions): Record<string, unknown>;
  /** Alias for toObject — safe config snapshot */
  getConfig(options?: ConfigOutputOptions): Record<string, unknown>;
  /** Get the plain API base URL */
  getApiBaseUrl(): string;
  /** Check if a valid webhook secret key is configured (>= 8 chars) */
  hasSecretKey(): boolean;
  /** Human-readable summary without leaking secrets */
  toString(): string;
}

// ─────────────────────────────────────────────
//  MessageModule
// ─────────────────────────────────────────────

/**
 * Message module — send and manage Zalo Bot messages.
 */
export class MessageModule {
  constructor(client: ZaloClient);

  /** Send a text message to a user or chat */
  sendText(chatId: string, text: string, options?: SendTextOptions): Promise<ApiResponse<SendMessageResult>>;
  /** Send a photo message */
  sendPhoto(chatId: string, photo: string, options?: SendPhotoOptions): Promise<ApiResponse<SendPhotoResult>>;
  /** Send a sticker message */
  sendSticker(chatId: string, sticker: string): Promise<ApiResponse<SendStickerResult>>;
  /** Send a voice message (1:1 chats only) */
  sendVoice(chatId: string, voiceUrl: string): Promise<ApiResponse<SendVoiceResult>>;
  /** Send a chat action (typing indicator) */
  sendChatAction(chatId: string, action: string): Promise<ApiResponse>;
  /** Get bot info */
  getMe(): Promise<ApiResponse<BotInfoResponse>>;
  /** Get updates via long polling (only works if no webhook is configured) */
  getUpdates(options?: GetUpdatesOptions): Promise<ApiResponse>;
  /** Set webhook URL */
  setWebhook(url: string, secretToken: string): Promise<ApiResponse<SetWebhookResult>>;
  /** Test the configured webhook URL */
  testWebhook(): Promise<ApiResponse<TestWebhookResult>>;
  /** Delete webhook configuration */
  deleteWebhook(): Promise<ApiResponse<DeleteWebhookResult>>;
  /** Get current webhook info */
  getWebhookInfo(): Promise<ApiResponse<WebhookInfoResult>>;
}

// ─────────────────────────────────────────────
//  UserModule
// ─────────────────────────────────────────────

/**
 * User module — get user information and follower management.
 */
export class UserModule {
  constructor(client: ZaloClient);

  /** Get user profile information */
  getProfile(userId: string, options?: GetProfileOptions): Promise<ApiResponse<UserProfile>>;
  /** Get list of followers (users who follow the OA) */
  getFollowers(params?: GetFollowersParams): Promise<ApiResponse<FollowersResponse>>;
  /** Check if a user is following the OA */
  isFollowing(userId: string): Promise<boolean>;
  /** Get user profile with in-memory caching (5 min TTL) */
  getProfileCached(userId: string, options?: GetProfileCachedOptions): Promise<ApiResponse<UserProfile>>;
  /** Clear user cache (all or by user ID) */
  clearCache(userId?: string): void;
}

// ─────────────────────────────────────────────
//  WebhookModule
// ─────────────────────────────────────────────

/**
 * Webhook module — parse and verify Zalo Bot webhook events.
 */
export class WebhookModule {
  constructor(config?: { secretKey?: string });

  /** Verify webhook request using X-Bot-Api-Secret-Token header (timing-safe) */
  verify(req: WebhookRequest): boolean;
  /** Verify and throw ZaloWebhookError if invalid */
  requireValid(req: WebhookRequest): void;
  /** Parse and normalize a webhook event payload */
  parseEvent(payload: Record<string, unknown>): WebhookEvent;
  /** Create Express.js middleware for webhook handling */
  middleware(options?: WebhookOptions): (req: WebhookRequest, res: WebhookResponse) => Promise<void>;
  /** Quick handler for simple bots — shortcut for middleware({ onEvent }) */
  handle(handler: (event: WebhookEvent) => Promise<void>): (req: WebhookRequest, res: WebhookResponse) => Promise<void>;
}

// ─────────────────────────────────────────────
//  MediaModule
// ─────────────────────────────────────────────

/**
 * Media module — upload and manage media files.
 */
export class MediaModule {
  constructor(client: ZaloClient);

  /** Upload an image file to Zalo */
  uploadImage(file: string | Buffer, options?: MediaUploadOptions): Promise<ApiResponse<MediaUploadResult>>;
  /** Upload a file to Zalo */
  uploadFile(file: string | Buffer, options?: MediaUploadOptions): Promise<ApiResponse<MediaUploadResult>>;
  /** Get media URL by attachment ID */
  getMediaUrl(attachmentId: string, options?: GetMediaUrlOptions): Promise<string | null>;
  /** Download media file to local path */
  downloadMedia(attachmentId: string, savePath: string): Promise<string>;

  /** Check if a file is a valid image format */
  static isValidImage(filePath: string): boolean;
  /** Get file size in bytes */
  static getFileSize(filePath: string): number;
  /** Validate image file (size and format) */
  static validateImage(filePath: string, limits?: ImageValidationLimits): ImageValidationResult;
}

// ─────────────────────────────────────────────
//  ZaloBot (Main Class)
// ─────────────────────────────────────────────

/**
 * Main Zalo Bot class — the primary entry point for the SDK.
 *
 * @example
 * ```ts
 * const bot = new ZaloBot({
 *   botToken: '123456789:abc-xyz',
 *   secretKey: 'your-secret-token',
 * });
 *
 * await bot.message.sendText('chat_id', 'Hello!');
 *
 * app.post('/webhook', bot.webhook.middleware({
 *   async onEvent(event) {
 *     console.log('Received:', event);
 *   },
 * }));
 * ```
 */
export class ZaloBot {
  /** Configuration instance */
  config: ZaloConfig;
  /** HTTP client instance */
  client: ZaloClient;
  /** Message module */
  message: MessageModule;
  /** User module */
  user: UserModule;
  /** Webhook module */
  webhook: WebhookModule;
  /** Media module */
  media: MediaModule;

  constructor(config: ConfigOptions | ZaloConfig);

  /** Update bot token at runtime */
  setBotToken(newToken: string): void;

  /**
   * Get current configuration as a plain object.
   * secretKey is excluded by default.
   */
  getConfig(options?: ConfigOutputOptions): Record<string, unknown>;

  /** Create a ZaloBot from environment variables */
  static fromEnv(overrides?: ConfigOptions): ZaloBot;
}

// ─────────────────────────────────────────────
//  Errors Convenience Object
// ─────────────────────────────────────────────

/**
 * All SDK error classes grouped for convenient access.
 */
export const Errors: {
  ZaloBotError: typeof ZaloBotError;
  ZaloApiError: typeof ZaloApiError;
  ZaloAuthError: typeof ZaloAuthError;
  ZaloWebhookError: typeof ZaloWebhookError;
  ZaloRateLimitError: typeof ZaloRateLimitError;
  ZaloValidationError: typeof ZaloValidationError;
  ZaloNetworkError: typeof ZaloNetworkError;
  ZaloTimeoutError: typeof ZaloTimeoutError;
};

// ─────────────────────────────────────────────
//  Module Declaration
// ─────────────────────────────────────────────

declare module 'zalobot-sdk' {
  export {
    // Main class
    ZaloBot,

    // Core modules
    ZaloClient,
    ZaloConfig,
    MessageModule,
    UserModule,
    WebhookModule,
    MediaModule,

    // Error classes
    ZaloBotError,
    ZaloApiError,
    ZaloAuthError,
    ZaloWebhookError,
    ZaloRateLimitError,
    ZaloValidationError,
    ZaloNetworkError,
    ZaloTimeoutError,

    // Errors convenience object
    Errors,

    // Options interfaces
    ConfigOptions,
    ConfigOutputOptions,
    RetryOptions,
    SendTextOptions,
    SendPhotoOptions,
    GetUpdatesOptions,
    GetProfileOptions,
    GetProfileCachedOptions,
    GetFollowersParams,
    WebhookOptions,
    MediaUploadOptions,
    GetMediaUrlOptions,
    ImageValidationLimits,

    // Response types
    ApiResponse,
    ApiErrorResponse,
    BotInfoResponse,
    SendMessageResult,
    SendPhotoResult,
    SendStickerResult,
    SendVoiceResult,
    SetWebhookResult,
    TestWebhookResult,
    DeleteWebhookResult,
    WebhookInfoResult,
    UserProfile,
    FollowersResponse,
    PaginationPaging,
    PaginatedResult,
    MediaUploadResult,
    ImageValidationResult,
    ClientConfig,
    WebhookEvent,
    WebhookEventMessage,
    WebhookRequest,
    WebhookResponse,
  };

  // Default export for `import ZaloBot from 'zalobot-sdk'`
  export default ZaloBot;
}
