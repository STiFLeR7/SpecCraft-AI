"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Terminal, Copy, Bot, User, BookOpen, FileText } from 'lucide-react';

interface ChatMessageProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: any[];
}

export function ChatMessage({ role, content, citations }: ChatMessageProps) {
    const isAssistant = role === 'assistant';

    return (
        <div className={`group flex gap-5 w-full ${isAssistant ? '' : 'flex-row-reverse'}`}>
            {/* Avatar / Icon */}
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${isAssistant
                ? 'bg-surface-elevated border-white/10 text-accent-blue shadow-[0_0_10px_rgba(79,139,255,0.1)]'
                : 'bg-surface border-transparent text-foreground-muted'
                }`}>
                {isAssistant ? <div className="grid grid-cols-2 gap-[1px] w-3.5 h-3.5"><div className="bg-current rounded-[0.5px]"></div><div className="bg-current rounded-[0.5px] opacity-50"></div><div className="bg-current rounded-[0.5px] opacity-75"></div><div className="bg-current rounded-[0.5px]"></div></div> : <User className="w-4 h-4" />}
            </div>

            {/* Content Document */}
            <div className={`flex-1 min-w-0 max-w-prose ${isAssistant ? '' : 'flex justify-end'}`}>
                {isAssistant && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-foreground font-semibold uppercase tracking-wider">SpecCraft Intelligence</span>
                        <div className="w-1 h-1 rounded-full bg-accent-blue/50"></div>
                        <span className="text-[10px] text-foreground-muted font-mono">MVP Inference</span>
                    </div>
                )}

                <div className={`relative ${isAssistant
                    ? 'text-foreground'
                    : 'text-foreground bg-surface-elevated px-5 py-3 rounded-2xl rounded-tr-sm border border-white/5 shadow-sm inline-block'
                    }`}>

                    {/* Citations Block (Evidence) */}
                    {isAssistant && citations && citations.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-1.5 mb-2 text-foreground-secondary/70">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Retrieved Context</span>
                            </div>
                            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                                {citations.map((cite, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 rounded bg-surface-elevated border border-white/5 hover:border-accent-blue/20 transition-colors cursor-help">
                                        <FileText className="w-3.5 h-3.5 text-accent-blue mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-mono text-foreground truncate" title={cite.file_name}>{cite.file_name}</div>
                                            <div className="text-[10px] text-foreground-muted truncate" title={cite.text}>{cite.text?.substring(0, 50)}...</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`prose prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-pre:p-0 prose-pre:rounded-lg max-w-none prose-a:text-accent-blue prose-img:rounded-xl`}>
                        {isAssistant ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // @ts-expect-error - types for components are loose
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <div className="relative group/code my-4 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Terminal className="w-3.5 h-3.5 text-foreground-muted" />
                                                        <span className="text-xs font-mono text-foreground-secondary">{match[1]}</span>
                                                    </div>
                                                    <button className="text-foreground-muted hover:text-foreground transition-colors" aria-label="Copy code">
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <code className={`${className} block p-4 bg-[#0B0F14] overflow-x-auto text-sm font-mono`} {...props}>
                                                    {children}
                                                </code>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-white/10 text-accent-cyan font-mono text-[0.85em] border border-white/5" {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        ) : (
                            <div className="whitespace-pre-wrap text-[15px]">{content}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
