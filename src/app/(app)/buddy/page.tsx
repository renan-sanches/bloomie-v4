"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Paperclip, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callAiFlow } from "@/lib/ai-client";

type Message = { role: "user" | "model"; text: string };

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
        <Leaf size={16} className="text-white" />
      </div>
      <div className="bg-white rounded-[24px] rounded-bl-[4px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-brand-carbon/30 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-carbon/30 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand-carbon/30 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
          <Leaf size={16} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-brand-green text-white rounded-[24px] rounded-br-[4px]"
            : "bg-white text-brand-carbon rounded-[24px] rounded-bl-[4px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)]"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

export default function BuddyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result is "data:image/...;base64,XXXX" — strip the prefix for the API
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
      setPhotoPreview(result); // keep full data URL for preview
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const clearPhoto = useCallback(() => {
    setPhotoBase64(null);
    setPhotoPreview(null);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !photoBase64) return;
    if (loading) return;

    const userMessage: Message = { role: "user", text: text || "(photo attached)" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPhotoBase64(null);
    setPhotoPreview(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        message: text || "(photo attached)",
        history: messages,
      };
      if (photoBase64) body.photoBase64 = photoBase64;

      const data = await callAiFlow<{ reply?: string }>("bloomie-chat", body);
      const reply: string = data?.reply ?? "No response received.";
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sorry, I couldn't connect. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, photoBase64]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-brand-card px-4 py-3 flex items-center justify-between shadow-[0px_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-brand-carbon leading-tight text-sm md:text-base">
              Bloomie Buddy 🌿
            </h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-xs text-brand-carbon/50 font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl select-none">🌱</div>
            <div>
              <h2 className="text-xl font-bold text-brand-carbon mb-1">Hi, I&apos;m Bloomie Buddy!</h2>
              <p className="text-sm text-brand-carbon/50">Ask me anything about your plants.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 bg-white border-t border-brand-card px-4 py-3 space-y-2">
        {/* Photo preview */}
        {photoPreview && (
          <div className="relative w-16 h-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Attached photo"
              className="w-16 h-16 rounded-[12px] object-cover border border-brand-card"
            />
            <button
              onClick={clearPhoto}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-carbon text-white flex items-center justify-center hover:bg-brand-carbon/80 transition-colors"
              aria-label="Remove photo"
            >
              <X size={10} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Paperclip button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 text-brand-carbon/40 hover:text-brand-green hover:bg-brand-green/10 rounded-[16px]"
            aria-label="Attach photo"
          >
            <Paperclip size={20} />
          </Button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your plants..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none overflow-hidden bg-brand-bg rounded-[16px] px-4 py-2.5 text-sm text-brand-carbon placeholder:text-brand-carbon/30 border border-brand-card focus:outline-none focus:border-brand-green/50 focus:ring-2 focus:ring-brand-green/20 transition-all disabled:opacity-50"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />

          {/* Send button */}
          <Button
            onClick={sendMessage}
            disabled={(!input.trim() && !photoBase64) || loading}
            className="flex-shrink-0 w-10 h-10 rounded-[16px] bg-brand-green hover:bg-brand-green/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            size="icon"
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
