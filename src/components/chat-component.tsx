'use client';

import { useState, useRef, useEffect } from 'react';
import { XpectrumChat } from '@/lib/xpectrum';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export default function XpectrumChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>();

  const chatRef = useRef<XpectrumChat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize the SDK once
  useEffect(() => {
    chatRef.current = new XpectrumChat({
      baseUrl: process.env.NEXT_PUBLIC_CHAT_BASE_URL!,
      apiKey: process.env.NEXT_PUBLIC_CHAT_API_KEY!,
    });
    return () => { chatRef.current?.destroy(); };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input,
    };
    const assistantMessage: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      text: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await chatRef.current.sendMessage(input, {
        conversationId,
        onMessage: (responseText, messageId, convId) => {
          setConversationId(convId);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              id: messageId,
              role: 'assistant',
              text: responseText,
            };
            return updated;
          });
        },
        onError: (err) => setError(err.message),
        onCompleted: () => setIsLoading(false),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setConversationId(undefined);
    setError(null);
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Header, Messages, Input ... */}
    </div>
  );
}