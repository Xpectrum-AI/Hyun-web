import { HttpClient } from '../core/http-client';
import { parseSSEStream } from '../core/sse-parser';
import type { SSEMessageData } from '../core/types';
import type {
  XpectrumChatConfig,
  SendMessageOptions,
  ConversationListResponse,
  MessageListResponse,
  AppInfo,
  AppParams,
  Conversation,
} from './types';

/**
 * XpectrumChat — Streaming chat client for Xpectrum AI.
 *
 * Uses Bearer token auth with the provided API key.
 * Streams responses via Server-Sent Events (SSE).
 *
 * @example
 * ```ts
 * const chat = new XpectrumChat({
 *   baseUrl: 'https://app.yourserver.com/api/v1',
 *   apiKey: 'app-xxxxxxxxxxxx',
 *   user: 'user-123',
 * });
 *
 * await chat.sendMessage('Hello!', {
 *   onMessage: (text) => console.log(text),
 *   onError: (err) => console.error(err),
 * });
 * ```
 */
export class XpectrumChat {
  private http: HttpClient;
  private config: XpectrumChatConfig;
  private activeAbortControllers = new Map<string, AbortController>();

  constructor(config: XpectrumChatConfig) {
    this.config = config;
    this.http = new HttpClient({
      baseUrl: config.baseUrl,
      authMode: 'bearer',
      authValue: config.apiKey,
    });
  }

  // ─── Messaging ──────────────────────────────────────────────────────────

  /**
   * Send a message and receive a streaming response via SSE.
   * Returns the task_id which can be used to stop the response.
   */
  async sendMessage(query: string, options: SendMessageOptions = {}): Promise<string | undefined> {
    const abortController = new AbortController();
    options.getAbortController?.(abortController);

    const body: Record<string, any> = {
      query,
      inputs: options.inputs || this.config.inputs || {},
      response_mode: 'streaming',
      user: this.config.user || 'sdk-user',
    };

    if (options.conversationId) {
      body.conversation_id = options.conversationId;
    }
    if (options.files?.length) {
      body.files = options.files;
    }

    let taskId: string | undefined;
    let fullAnswer = '';

    try {
      const response = await this.http.streamPost('/chat-messages', body, abortController.signal);

      await parseSSEStream(response, {
        onEvent: (data: SSEMessageData) => {
          if (data.task_id && !taskId) {
            taskId = data.task_id;
            this.activeAbortControllers.set(taskId, abortController);
          }

          switch (data.event) {
            case 'message':
            case 'agent_message':
              fullAnswer += data.answer || '';
              options.onMessage?.(fullAnswer, data.message_id || '', data.conversation_id || '');
              break;

            case 'agent_thought':
              options.onThought?.({
                id: data.id || '',
                thought: data.thought || '',
                observation: data.observation,
                tool: data.tool,
                tool_input: data.tool_input,
                message_id: data.message_id || '',
                position: data.position || 0,
              });
              break;

            case 'message_file':
              options.onFile?.({
                id: data.id || '',
                type: data.type || '',
                url: data.url || '',
                belongs_to: data.belongs_to || '',
              });
              break;

            case 'message_end':
              options.onMessageEnd?.({
                task_id: data.task_id || '',
                message_id: data.message_id || '',
                conversation_id: data.conversation_id || '',
                metadata: data.metadata || {},
              });
              break;

            case 'message_replace':
              fullAnswer = data.answer || '';
              options.onMessageReplace?.(fullAnswer, data.message_id || '');
              break;

            case 'tts_message':
              options.onTTSChunk?.(data.message_id || '', data.audio || '');
              break;

            case 'tts_message_end':
              options.onTTSEnd?.(data.message_id || '', data.audio || '');
              break;

            case 'error':
              options.onError?.({
                message: data.message || 'Unknown error',
                code: data.code,
                status: data.status,
              });
              break;
          }
        },
        onError: (error) => {
          options.onError?.({ message: error.message });
        },
        onClose: () => {
          if (taskId) this.activeAbortControllers.delete(taskId);
          options.onCompleted?.();
        },
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        options.onError?.({
          message: error.message || 'Failed to send message',
          code: error.code,
          status: error.status,
        });
      }
    }

    return taskId;
  }

  /**
   * Stop a streaming response mid-generation.
   */
  async stopResponse(taskId: string): Promise<void> {
    const controller = this.activeAbortControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.activeAbortControllers.delete(taskId);
    }
    try {
      await this.http.post(`/chat-messages/${taskId}/stop`, {
        user: this.config.user || 'sdk-user',
      });
    } catch {
      // Best-effort
    }
  }

  // ─── Conversations ─────────────────────────────────────────────────────

  async getConversations(options?: {
    limit?: number;
    lastId?: string;
    pinned?: boolean;
  }): Promise<ConversationListResponse> {
    const params: Record<string, any> = {
      limit: options?.limit || 20,
      user: this.config.user || 'sdk-user',
    };
    if (options?.lastId) params.last_id = options.lastId;
    if (options?.pinned !== undefined) params.pinned = options.pinned;
    return this.http.get<ConversationListResponse>('/conversations', params);
  }

  async getMessages(
    conversationId: string,
    options?: { limit?: number; lastId?: string },
  ): Promise<MessageListResponse> {
    return this.http.get<MessageListResponse>('/messages', {
      conversation_id: conversationId,
      limit: options?.limit || 20,
      last_id: options?.lastId || '',
      user: this.config.user || 'sdk-user',
    });
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.http.delete(`/conversations/${conversationId}`, {
      body: { user: this.config.user || 'sdk-user' },
    });
  }

  async renameConversation(conversationId: string, name: string): Promise<void> {
    await this.http.post(`/conversations/${conversationId}/name`, {
      name,
      user: this.config.user || 'sdk-user',
    });
  }

  async generateConversationName(conversationId: string): Promise<Conversation> {
    return this.http.post<Conversation>(`/conversations/${conversationId}/name`, {
      auto_generate: true,
      user: this.config.user || 'sdk-user',
    });
  }

  async pinConversation(conversationId: string): Promise<void> {
    await this.http.patch(`/conversations/${conversationId}/pin`, {
      user: this.config.user || 'sdk-user',
    });
  }

  async unpinConversation(conversationId: string): Promise<void> {
    await this.http.patch(`/conversations/${conversationId}/unpin`, {
      user: this.config.user || 'sdk-user',
    });
  }

  // ─── App Info ──────────────────────────────────────────────────────────

  async getAppInfo(): Promise<AppInfo> {
    return this.http.get<AppInfo>('/site');
  }

  async getAppParams(): Promise<AppParams> {
    return this.http.get<AppParams>('/parameters');
  }

  // ─── Feedback ──────────────────────────────────────────────────────────

  async submitFeedback(messageId: string, rating: 'like' | 'dislike' | null): Promise<void> {
    await this.http.post(`/messages/${messageId}/feedbacks`, {
      rating,
      user: this.config.user || 'sdk-user',
    });
  }

  async getSuggestedQuestions(messageId: string): Promise<string[]> {
    const res = await this.http.get<{ data: string[] }>(
      `/messages/${messageId}/suggested-questions`,
    );
    return res.data;
  }

  // ─── Audio ─────────────────────────────────────────────────────────────

  async speechToText(audioFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('user', this.config.user || 'sdk-user');
    const res = await this.http.request<{ text: string }>('/audio-to-text', {
      method: 'POST',
      body: formData as any,
      rawBody: true,
    });
    return res.text;
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────

  destroy(): void {
    for (const [, controller] of this.activeAbortControllers) {
      controller.abort();
    }
    this.activeAbortControllers.clear();
  }
}
