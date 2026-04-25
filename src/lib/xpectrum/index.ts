// ─── Core ────────────────────────────────────────────────────────────────────
export { HttpClient, XpectrumApiError } from './core/http-client';
export type { HttpClientConfig } from './core/http-client';
export { parseSSEStream } from './core/sse-parser';
export { EventEmitter } from './core/event-emitter';
export type {
  RequestOptions,
  ApiError,
  SSEEvent,
  SSEMessageData,
  EventHandler,
  UnsubscribeFn,
} from './core/types';

// ─── Chat ────────────────────────────────────────────────────────────────────
export { XpectrumChat } from './chat/chat-client';
export type {
  XpectrumChatConfig,
  SendMessageOptions,
  MessageFile,
  ThoughtEvent,
  FileEvent,
  MessageEndEvent,
  ErrorEvent,
  Conversation,
  ConversationListResponse,
  Message,
  MessageListResponse,
  AppInfo,
  AppParams,
} from './chat/types';

// ─── Voice ───────────────────────────────────────────────────────────────────
export { XpectrumVoice } from './voice/voice-client';
export type {
  XpectrumVoiceConfig,
  TokenResponse,
  VoiceConnectionState,
  VoiceEventMap,
  VoiceConnectCallbacks,
  TranscriptionSegment,
} from './voice/types';
