"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Chrome, MessageSquare, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ text: 'Check your email for the confirmation link.', type: 'success' });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
            }
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
        if (error) setMessage({ text: error.message, type: 'error' });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans text-foreground">

            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            <div className="flex w-full max-w-4xl h-[600px] bg-surface rounded-2xl border border-white/5 shadow-2xl relative z-10 overflow-hidden">

                {/* Left: Branding & Info */}
                <div className="hidden md:flex w-1/2 bg-surface-elevated flex-col justify-between p-12 border-r border-white/5 relative">
                    <div className="absolute inset-0 bg-accent-blue/5 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 grid grid-cols-2 grid-rows-2 gap-0.5">
                                <div className="bg-accent-blue rounded-[1px] opacity-100"></div>
                                <div className="bg-accent-blue rounded-[1px] opacity-50"></div>
                                <div className="bg-accent-blue rounded-[1px] opacity-75"></div>
                                <div className="bg-accent-cyan rounded-[1px] opacity-90"></div>
                            </div>
                            <span className="font-bold text-xl tracking-tight">SpecCraft AI</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Engineering Intelligence <br /> for Technical Leads.</h2>
                        <p className="text-foreground-secondary text-sm leading-relaxed">
                            Turn your repository into a queryable knowledge graph. Generate specifications, verify logic, and architecture your next breakthrough.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><Lock className="w-3 h-3" /></div>
                            <span>Enterprise-Grade Security</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                            <div className="w-6 h-6 rounded bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20"><MessageSquare className="w-3 h-3" /></div>
                            <span>Context-Aware RAG</span>
                        </div>
                    </div>
                </div>

                {/* Right: Auth Form */}
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-background/50 backdrop-blur-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
                        <p className="text-sm text-foreground-muted">
                            {isSignUp ? 'Initialize your workspace.' : 'Access your engineering dashboard.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="text-xs font-mono text-foreground-muted uppercase tracking-wider mb-1.5 block">Email Interface</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-elevated/50 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors outline-none"
                                    placeholder="name@company.com"
                                    required
                                />
                                <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-mono text-foreground-muted uppercase tracking-wider mb-1.5 block">Security Key</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface-elevated/50 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
                            </div>
                        </div>

                        {message && (
                            <div className={`text-xs px-3 py-2 rounded border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(79,139,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Initialize Account' : 'Authenticate')}
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-white/5 flex-1" />
                        <span className="text-[10px] text-foreground-muted uppercase tracking-widest">Or connect via</span>
                        <div className="h-px bg-white/5 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleOAuth('google')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-elevated border border-white/10 rounded-lg hover:bg-surface-elevated/80 transition-colors text-sm"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span>Google</span>
                        </button>
                        <button
                            onClick={() => handleOAuth('github')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-elevated border border-white/10 rounded-lg hover:bg-surface-elevated/80 transition-colors text-sm"
                        >
                            <Github className="w-4 h-4" />
                            <span>GitHub</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-foreground-muted hover:text-accent-blue transition-colors">
                            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
