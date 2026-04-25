import type { SSEMessageData } from './types';

export interface SSECallbacks {
  onEvent: (data: SSEMessageData) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * Parses a ReadableStream of Server-Sent Events from a fetch Response.
 * Handles buffering of partial chunks and multi-line data fields.
 */
export async function parseSSEStream(
  response: Response,
  callbacks: SSECallbacks,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newline (SSE event separator) or single newlines
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(':')) continue;

        // Parse data lines
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr) as SSEMessageData;

            // Skip ping events
            if (data.event === 'ping') continue;

            callbacks.onEvent(data);
          } catch {
            // Not valid JSON — could be a partial line, skip
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const data = JSON.parse(trimmed.slice(6)) as SSEMessageData;
          if (data.event !== 'ping') {
            callbacks.onEvent(data);
          }
        } catch {
          // Ignore parse errors for remaining buffer
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // Stream was intentionally aborted
      return;
    }
    callbacks.onError?.(error as Error);
  } finally {
    reader.releaseLock();
    callbacks.onClose?.();
  }
}
