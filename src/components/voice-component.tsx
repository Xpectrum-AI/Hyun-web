"use client";
import { useEffect, useRef, useState } from "react";
import { XpectrumVoice, type TranscriptionSegment } from "@xpectrum/sdk";
import dotenv from "dotenv";

dotenv.config();

export default function VoiceCall() {
  const voiceRef = useRef<XpectrumVoice | null>(null);
  const [connected, setConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptionSegment[]>([]);

  useEffect(() => {
    voiceRef.current = new XpectrumVoice({
      baseUrl: process.env.VITE_PUBLIC_VOICE_BASE_URL,
      apiKey: process.env.VITE_PUBLIC_VOICE_API_KEY ,
      agentName: process.env.VITE_PUBLIC_AGENT_NAME,
    });
    return () => voiceRef.current?.destroy();
  }, []);

  const startCall = async () => {
    await voiceRef.current?.connect({
      onConnected: () => setConnected(true),
      onTranscription: (seg) => {
        setTranscripts((prev) => {
          const idx = prev.findIndex((t) => t.id === seg.id);
          if (idx >= 0) { const u = [...prev]; u[idx] = seg; return u; }
          return [...prev, seg];
        });
      },
      onDisconnected: () => setConnected(false),
    });
  };

  return (
    <div>
      <button onClick={connected ? () => voiceRef.current?.disconnect() : startCall}>
        {connected ? "End Call" : "Start Call"}
      </button>
      {transcripts.map((t) => (
        <p key={t.id}><strong>{t.speaker}:</strong> {t.text}</p>
      ))}
    </div>
  );
}