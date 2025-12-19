import { useState, useRef, useCallback } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: any[];
}

export function useChatStream() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'idle' | 'buffering' | 'streaming' | 'error'>('idle');
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string, projectId: string = 'default') => {
        setStatus('buffering');

        // Optimistic User Message
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, userMessage]);

        // Placeholder Assistant Message
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

        abortControllerRef.current = new AbortController();

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, project_id: projectId }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setStatus('streaming');

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'token') {
                                assistantContent += parsed.data;
                                // We update state inside the setMessages functional update to ensure we have latest state
                                // This is slightly inefficient but safe for now.
                            } else if (parsed.type === 'citations') {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, citations: parsed.data }
                                        : msg
                                ));
                                continue; // Don't trigger the general update below yet
                            }

                            // Flush helper
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: assistantContent }
                                    : msg
                            ));
                        } catch (e) {
                            // console.error("Error parsing JSON chunk", e);
                        }
                    }
                }
            }

            setStatus('idle');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream aborted");
            } else {
                console.error("Stream error:", error);
                setStatus('error');
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + "\n\n*[Error generating response]*" }
                        : msg
                ));
            }
        }
    }, []);

    return { messages, sendMessage, status, setMessages };
}
