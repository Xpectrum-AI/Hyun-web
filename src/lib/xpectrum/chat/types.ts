// ─── Chat Configuration ─────────────────────────────────────────────────────

export interface XpectrumChatConfig {
  /** Base URL of the Xpectrum API (e.g. https://app.yourserver.com/api/v1) */
  baseUrl: string;
  /** API key — used as Bearer token for all requests */
  apiKey: string;
  /** Optional user identifier — each unique user gets their own conversation history */
  user?: string;
  /** Default input variables to send with every message */
  inputs?: Record<string, any>;
}

// ─── Message Types ──────────────────────────────────────────────────────────

export interface SendMessageOptions {
  conversationId?: string;
  inputs?: Record<string, any>;
  files?: MessageFile[];
  onMessage?: (text: string, messageId: string, conversationId: string) => void;
  onThought?: (thought: ThoughtEvent) => void;
  onFile?: (file: FileEvent) => void;
  onMessageEnd?: (metadata: MessageEndEvent) => void;
  onMessageReplace?: (text: string, messageId: string) => void;
  onTTSChunk?: (messageId: string, audio: string) => void;
  onTTSEnd?: (messageId: string, audio: string) => void;
  onError?: (error: ErrorEvent) => void;
  onCompleted?: () => void;
  getAbortController?: (controller: AbortController) => void;
}

export interface MessageFile {
  type: 'image';
  transfer_method: 'remote_url' | 'local_file';
  url?: string;
  upload_file_id?: string;
}

// ─── SSE Event Payloads ─────────────────────────────────────────────────────

export interface ThoughtEvent {
  id: string;
  thought: string;
  observation?: string;
  tool?: string;
  tool_input?: string;
  message_id: string;
  position: number;
}

export interface FileEvent {
  id: string;
  type: string;
  url: string;
  belongs_to: string;
}

export interface MessageEndEvent {
  task_id: string;
  message_id: string;
  conversation_id: string;
  metadata: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      total_price: string;
      currency: string;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
}

export interface ErrorEvent {
  message: string;
  code?: string;
  status?: number;
}

// ─── Conversation Types ─────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface ConversationListResponse {
  data: Conversation[];
  has_more: boolean;
  limit: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  answer: string;
  message_files: Array<{
    id: string;
    type: string;
    url: string;
    belongs_to: string;
  }>;
  feedback: { rating: 'like' | 'dislike' | null } | null;
  retriever_resources: Array<{
    position: number;
    dataset_name: string;
    document_name: string;
    content: string;
    score: number;
  }>;
  agent_thoughts: ThoughtEvent[];
  created_at: number;
}

export interface MessageListResponse {
  data: Message[];
  has_more: boolean;
  limit: number;
}

// ─── App Info Types ─────────────────────────────────────────────────────────

export interface AppInfo {
  app_id: string;
  title: string;
  description: string;
  icon_type: string;
  icon: string;
  icon_background: string;
  icon_url: string | null;
}

export interface AppParams {
  opening_statement: string;
  suggested_questions: string[];
  suggested_questions_after_answer: { enabled: boolean };
  speech_to_text: { enabled: boolean };
  text_to_speech: { enabled: boolean; voice?: string; language?: string };
  retriever_resource: { enabled: boolean };
  file_upload: {
    image: { enabled: boolean; number_limits: number; transfer_methods: string[] };
  };
  system_parameters: { image_file_size_limit: string };
}
