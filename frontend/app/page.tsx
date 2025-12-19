"use client";
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChatInputCapsule } from "@/components/chat/ChatInputCapsule";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useChatStream } from "@/hooks/useChatStream";

// Dynamic import to avoid SSR issues with Supabase
const Sidebar = dynamic(() => import('@/components/layout/Sidebar').then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => <div className="w-[280px] h-screen bg-background border-r border-surface-elevated hidden md:block" />
});

export default function Home() {
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const { messages, sendMessage, status, setMessages } = useChatStream();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Handle Project Selection
  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setMessages([]); // Clear chat on switch (or load history if supported)
  };

  return (
    <div className="flex w-full h-full">
      {/* Sidebar (State Lifted) */}
      <Sidebar currentProjectId={currentProjectId} onSelectProject={handleProjectSelect} />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Scrollable Message Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth pb-4">
          <div className="max-w-[768px] mx-auto p-4 md:p-6 space-y-8">

            {/* Welcome / Context */}
            {messages.length === 0 && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-surface-elevated rounded-xl border border-white/10 mx-auto flex items-center justify-center mb-6 shadow-xl">
                  <div className="w-6 h-6 bg-foreground rounded-sm" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  {currentProjectId ? "Project Active." : "SpecCraft-AI"}
                </h1>
                <p className="text-foreground-muted max-w-md mx-auto">
                  {currentProjectId
                    ? "Ready to analyze code within this repository context."
                    : "Select or Create a Specification Project to begin."}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {/* Bottom Anchor */}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Persistent Input Dock */}
        <div className="shrink-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
          <div className="max-w-[768px] mx-auto">
            <ChatInputCapsule
              onSend={(msg) => currentProjectId ? sendMessage(msg, currentProjectId) : alert("Please select a project first.")}
              isStreaming={status === 'streaming' || status === 'buffering'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
