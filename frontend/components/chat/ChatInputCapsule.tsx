"use client";
import React, { useRef, useState } from 'react';
import { Paperclip, ArrowUp, Zap } from 'lucide-react';

interface ChatInputCapsuleProps {
    onSend?: (message: string) => void;
    isStreaming?: boolean;
}

export function ChatInputCapsule({ onSend, isStreaming = false }: ChatInputCapsuleProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState("");

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const submit = () => {
        if (!value.trim() || isStreaming || !onSend) return;
        onSend(value);
        setValue("");
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    return (
        <div className={`relative w-full ${isStreaming ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="relative flex items-end gap-2 p-3 bg-surface-elevated rounded-2xl border border-white/5 shadow-2xl shadow-black/20 ring-1 ring-white/5 focus-within:ring-accent-blue/50 transition-all duration-200">
                {/* Upload Button */}
                <button className="shrink-0 p-2.5 text-foreground-muted hover:text-foreground hover:bg-white/5 rounded-xl transition-all" aria-label="Upload file">
                    <Paperclip className="w-5 h-5" />
                </button>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isStreaming}
                    placeholder={isStreaming ? "SpecCraft is thinking..." : "Ask SpecCraft to analyze..."}
                    className="flex-1 bg-transparent border-0 resize-none outline-none text-foreground placeholder-foreground-muted py-2.5 max-h-64 scrollbar-hide text-base leading-relaxed disabled:cursor-not-allowed"
                    style={{ minHeight: '48px' }}
                />

                {/* Send Button */}
                <button
                    onClick={submit}
                    disabled={!value.trim() || isStreaming}
                    className="shrink-0 p-2.5 bg-foreground text-background rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>

            {/* Footer / Context */}
            <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-[10px] font-medium text-accent-blue uppercase tracking-wider">
                        <Zap className="w-3 h-3" />
                        <span>Gemini 1.5 Pro</span>
                    </div>
                    <span className="text-xs text-foreground-muted">2.4M Context</span>
                </div>
                <span className="text-xs text-foreground-muted opacity-50">Press Enter to send, Shift+Enter for new line</span>
            </div>
        </div>
    )
}
