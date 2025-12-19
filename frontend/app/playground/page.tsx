"use client";
import React, { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { RepoVisualizer } from "@/components/visualizer/RepoVisualizer";

export default function PlaygroundPage() {
    const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);

    return (
        <div className="flex w-full h-full text-foreground bg-background">
            <Sidebar
                currentProjectId={currentProjectId}
                onSelectProject={(id) => setCurrentProjectId(id)}
            />

            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header */}
                <div className="absolute top-4 right-6 z-10 flex gap-4">
                    <div className="px-3 py-1.5 rounded-full bg-surface-elevated border border-white/5 text-xs font-mono text-foreground-muted shadow-lg backdrop-blur">
                        Interactive Mode: ACTIVE
                    </div>
                </div>

                <RepoVisualizer projectId={currentProjectId} />
            </main>
        </div>
    );
}
