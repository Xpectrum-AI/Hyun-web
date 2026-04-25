// ─── HTTP Client Types ──────────────────────────────────────────────────────

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any> | FormData | null;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  rawBody?: boolean;
  timeout?: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ─── SSE Event Types ────────────────────────────────────────────────────────

export type SSEEvent =
  | 'message'
  | 'agent_message'
  | 'agent_thought'
  | 'message_file'
  | 'message_end'
  | 'message_replace'
  | 'tts_message'
  | 'tts_message_end'
  | 'workflow_started'
  | 'workflow_finished'
  | 'node_started'
  | 'node_finished'
  | 'error'
  | 'ping';

export interface SSEMessageData {
  event: SSEEvent;
  task_id?: string;
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  id?: string;
  [key: string]: any;
}

// ─── Event Emitter ──────────────────────────────────────────────────────────

export type EventHandler<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;
