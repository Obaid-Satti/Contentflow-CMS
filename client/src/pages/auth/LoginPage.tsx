import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    ArrowRight,
    ShieldCheck,
    Layers,
    Globe,
    Key,
} from 'lucide-react';

import { useAuth } from '@/context/useAuth';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL
                ? `${import.meta.env.VITE_API_URL}/auth/login`
                : 'http://localhost:5000/api/auth/login';

            const response = await axios.post(apiUrl, { email, password });

            if (response.data?.token) {
                login(response.data.token);
                navigate('/content-manager');
            } else {
                setError('Authentication succeeded but no token was returned.');
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Invalid credentials. Please check your email and password.'
                );
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">

            {/* ── LEFT PANEL — branding ── */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #0f0c29 0%, #1a1560 40%, #302b8a 70%, #4338ca 100%)' }}>

                {/* dot grid */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }} />

                {/* glow blobs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
                <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-15"
                    style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

                <div className="relative z-10 max-w-sm w-full text-center">
                    {/* Logo mark */}
                    <div className="flex items-center justify-center mb-8">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 12px 40px rgba(99,102,241,0.45)',
                            }}
                        >
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <rect x="5" y="7" width="30" height="5" rx="2.5" fill="white" opacity="0.95" />
                                <rect x="5" y="16" width="20" height="5" rx="2.5" fill="white" opacity="0.7" />
                                <rect x="5" y="25" width="25" height="5" rx="2.5" fill="white" opacity="0.45" />
                                <circle cx="33" cy="31" r="6" fill="#c4b5fd" stroke="white" strokeWidth="1.5" />
                                <path d="M30.5 31l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">ContentFlow</h1>
                    <p className="text-indigo-300 font-medium text-sm mb-3">Headless CMS</p>
                    <p className="text-indigo-400 text-sm leading-relaxed mb-10">
                        Securely create, manage, and serve structured content through an API — decoupled from any frontend.
                    </p>

                    {/* Feature list */}
                    <div className="flex flex-col gap-5 text-left">
                        {[
                            { Icon: Layers, title: 'Manage your content easily', desc: 'Create and update content from one place' },
                            { Icon: Key, title: 'Secure administrator access', desc: 'Keep your content protected' },
                            { Icon: Globe, title: 'Publish content anywhere', desc: 'Deliver your content to websites and apps' },
                        ].map(({ Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.35)' }}>
                                    <Icon className="w-4 h-4 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                                        <span className="text-indigo-400">✓</span> {title}
                                    </p>
                                    <p className="text-indigo-400/80 text-xs mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — login form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">

                {/* subtle ambient glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                    <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-15"
                        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
                </div>

                <div className="relative w-full max-w-md">

                    {/* Mobile logo (hidden on lg) */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                                <rect x="5" y="7" width="30" height="5" rx="2.5" fill="white" />
                                <rect x="5" y="16" width="20" height="5" rx="2.5" fill="white" opacity="0.7" />
                                <rect x="5" y="25" width="25" height="5" rx="2.5" fill="white" opacity="0.45" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-lg">ContentFlow</span>
                    </div>

                    {/* Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 sm:p-10 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
                        {/* top accent line */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Administrator login</h2>
                            <p className="mt-1.5 text-sm text-slate-400">Sign in to your administrative dashboard.</p>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div role="alert"
                                className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        disabled={isLoading}
                                        placeholder="admin@contentflow.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign in to ContentFlow</span>
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 border-t border-slate-800/80 pt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                            <span>ContentFlow CMS &mdash; Administrator portal &copy; {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
