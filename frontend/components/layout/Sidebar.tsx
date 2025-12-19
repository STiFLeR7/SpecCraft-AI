"use client";
import React, { useEffect, useState } from 'react';
import { Layers, Plus, GitGraph, Search, FolderGit2, Cpu, Database, Activity, ShieldCheck, Command } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { AddProjectModal } from '@/components/modals/AddProjectModal';

interface Project {
    id: string;
    name: string;
    repo_url: string;
}

interface SidebarProps {
    currentProjectId?: string;
    onSelectProject: (id: string) => void;
}

export function Sidebar({ currentProjectId, onSelectProject }: SidebarProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, session, logout } = useUser();

    const fetchProjects = async () => {
        if (!session?.access_token) {
            setLoading(false);
            return;
        }
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/projects/`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.access_token) {
            fetchProjects();
        } else {
            setLoading(false);
        }
    }, [session]);

    const handleProjectCreated = (newProject: Project) => {
        setProjects(prev => [newProject, ...prev]);
        onSelectProject(newProject.id);
    };

    return (
        <>
            <aside className="w-[280px] h-screen border-r border-surface-elevated bg-background hidden md:flex flex-col sticky top-0 shrink-0 font-sans text-[13px]">
                {/* Header / Logo Area */}
                <a href="/" className="px-4 h-14 flex items-center justify-between border-b border-surface-elevated select-none hover:bg-surface-elevated/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                        {/* Technical Logo: Modular Grid */}
                        <div className="w-6 h-6 grid grid-cols-2 grid-rows-2 gap-0.5">
                            <div className="bg-accent-blue rounded-[1px] opacity-100"></div>
                            <div className="bg-accent-blue rounded-[1px] opacity-50"></div>
                            <div className="bg-accent-blue rounded-[1px] opacity-75"></div>
                            <div className="bg-accent-cyan rounded-[1px] opacity-90"></div>
                        </div>
                        <span className="font-semibold text-foreground tracking-tight text-sm">SpecCraft AI</span>
                    </div>
                    <div className="text-[10px] font-mono text-foreground-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-white/5">v1.0</div>
                </a>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto py-6 scrollbar-thin">
                    <div className="px-4 mb-6 space-y-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 rounded-lg transition-all group shadow-[0_0_10px_rgba(79,139,255,0.1)] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="font-medium tracking-wide text-xs uppercase">New Specification</span>
                            </div>
                        </button>

                        <a href="/" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-foreground-secondary hover:text-foreground hover:bg-surface-elevated rounded-lg transition-all group">
                            <div className="flex items-center gap-2">
                                <Command className="w-3.5 h-3.5" />
                                <span className="font-medium tracking-wide text-xs uppercase">Chat Workspace</span>
                            </div>
                        </a>

                        <a href="/playground" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-foreground-secondary hover:text-foreground hover:bg-surface-elevated rounded-lg transition-all group">
                            <div className="flex items-center gap-2">
                                <GitGraph className="w-3.5 h-3.5" />
                                <span className="font-medium tracking-wide text-xs uppercase">Architecture Graph</span>
                            </div>
                        </a>
                    </div>
                    {/* System Monitoring Section (Decoration for Technicality) */}
                    <div className="px-5 mb-8 space-y-3">
                        <div className="flex items-center gap-2 text-foreground-secondary/70">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wider">System Health</span>
                        </div>
                        <div className="pl-5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-foreground-muted font-mono">
                                <span>RAG Vector Index</span>
                                <span className="text-emerald-500">OPTIMIZED</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-foreground-muted font-mono">
                                <span>airLLM Inference</span>
                                <span className="text-emerald-500">ONLINE</span>
                            </div>
                        </div>
                    </div>

                    {/* Repository List */}
                    <div className="px-3">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Connected Repositories</h3>
                            <span className="text-[10px] text-foreground-muted font-mono">{projects.length} ACTIVE</span>
                        </div>

                        {loading ? (
                            <div className="space-y-2 px-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-surface-elevated/50 rounded animate-pulse w-full" />)}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="mx-2 px-3 py-4 text-xs text-foreground-muted/50 border border-dashed border-white/5 rounded-lg bg-surface-elevated/20 text-center">
                                No knowledge bases linked.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {projects.map((project) => {
                                    const isActive = project.id === currentProjectId;
                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => onSelectProject(project.id)}
                                            className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all border group relative overflow-hidden ${isActive
                                                ? 'bg-surface-elevated border-accent-blue/30 shadow-lg'
                                                : 'border-transparent hover:bg-surface-elevated/50 hover:border-white/5'
                                                }`}
                                        >
                                            <div className={`shrink-0 mt-0.5 ${isActive ? 'text-accent-blue' : 'text-foreground-muted'}`}>
                                                <FolderGit2 className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground-secondary group-hover:text-foreground'}`}>
                                                    {project.name}
                                                </div>
                                                <div className="text-[10px] text-foreground-muted truncate font-mono mt-0.5 flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-foreground-muted/50'}`} />
                                                    <span>{isActive ? 'Live Context' : 'Indexed'}</span>
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-accent-blue shadow-[0_0_10px_rgba(79,139,255,0.8)]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-surface-elevated bg-surface-elevated/20">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center text-white shadow-inner shrink-0">
                                <span className="text-xs font-bold uppercase">{(user.email?.[0] || 'U').toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-foreground tracking-wide truncate" title={user.email}>{user.email?.split('@')[0]}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-foreground-muted font-mono truncate">FREE PLAN</span>
                                    <button onClick={logout} className="text-[9px] text-red-400 hover:text-red-300 ml-auto">SIGNOUT</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <a href="/login" className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 px-4 py-2 bg-accent-blue/10 rounded-lg border border-accent-blue/20 w-full text-center">
                                Login / Sign Up
                            </a>
                        </div>
                    )}
                </div>
            </aside>

            <AddProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
        </>
    );
}
