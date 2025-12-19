"use client";
import React, { useState } from 'react';
import { X, GitBranch, Loader2, Link as LinkIcon, AlertCircle, Github, Plus } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (project: any) => void;
}

export function AddProjectModal({ isOpen, onClose, onProjectCreated }: AddProjectModalProps) {
    const [repoUrl, setRepoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { session } = useUser();
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [mode, setMode] = useState<'url' | 'github'>('url');

    const fetchGithubRepos = async () => {
        if (!session?.provider_token) {
            setError("GitHub access token not found. Please log out and sign in with GitHub again.");
            return;
        }
        setLoadingRepos(true);
        try {
            const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
                headers: {
                    Authorization: `Bearer ${session.provider_token}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch GitHub repos");
            const data = await res.json();
            setGithubRepos(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoadingRepos(false);
        }
    };

    // Auto-fetch if GitHub mode selected
    React.useEffect(() => {
        if (isOpen && mode === 'github' && githubRepos.length === 0) {
            fetchGithubRepos();
        }
    }, [isOpen, mode]);

    // Early return AFTER all hooks
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent, urlOverride?: string) => {
        if (e) e.preventDefault();
        const urlToSubmit = urlOverride || repoUrl;

        setIsLoading(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/projects/?repo_url=${encodeURIComponent(urlToSubmit)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ detail: 'Failed to create project' }));
                throw new Error(errData.detail || 'Failed to connect repository');
            }

            const newProject = await res.json();
            onProjectCreated(newProject);
            onClose();
            setRepoUrl('');
            setGithubRepos([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-surface border border-surface-elevated rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-elevated bg-surface-elevated/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-accent-blue/10 rounded-md">
                            <GitBranch className="w-4 h-4 text-accent-blue" />
                        </div>
                        <h2 className="text-sm font-semibold text-foreground tracking-tight">Connect Repository</h2>
                    </div>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setMode('url')}
                        className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${mode === 'url' ? 'bg-surface text-accent-blue border-b-2 border-accent-blue' : 'bg-surface-elevated/20 text-foreground-muted hover:text-foreground'}`}
                    >
                        URL Input
                    </button>
                    <button
                        onClick={() => setMode('github')}
                        className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${mode === 'github' ? 'bg-surface text-accent-blue border-b-2 border-accent-blue' : 'bg-surface-elevated/20 text-foreground-muted hover:text-foreground'}`}
                    >
                        Import from GitHub
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {mode === 'url' ? (
                        <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground-secondary uppercase tracking-wider">Repository URL</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="w-4 h-4 text-foreground-muted group-focus-within:text-accent-blue transition-colors" />
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        placeholder="https://github.com/organization/repo"
                                        className="w-full bg-surface-elevated border border-white/5 rounded-lg py-2.5 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent-blue/50 placeholder:text-foreground-muted/50 transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-200">{error}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading || !repoUrl} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{isLoading ? 'Ingesting...' : 'Connect'}</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {loadingRepos ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-accent-blue animate-spin mb-2" />
                                    <span className="text-xs text-foreground-muted">Fetching repositories...</span>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                                    {!session?.provider_token && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200 text-center">
                                            GitHub Token missing. Log out and sign in with GitHub to use this feature.
                                        </div>
                                    )}

                                    {githubRepos.length === 0 && session?.provider_token && (
                                        <div className="text-center py-4 text-xs text-foreground-muted">No repositories found.</div>
                                    )}

                                    {githubRepos.map(repo => (
                                        <button
                                            key={repo.id}
                                            onClick={() => handleSubmit(null as any, repo.html_url)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-white/5 hover:border-accent-blue/30 hover:bg-surface-elevated/80 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Github className="w-4 h-4 text-foreground-muted" />
                                                <div className="truncate">
                                                    <div className="text-sm font-medium text-foreground truncate">{repo.full_name}</div>
                                                    <div className="text-[10px] text-foreground-muted truncate">{repo.description || 'No description'}</div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4 text-accent-blue" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-200">{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
