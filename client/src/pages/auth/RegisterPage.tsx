import { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkRegistrationStatus = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL
                    ? `${import.meta.env.VITE_API_URL}/auth/status`
                    : 'http://localhost:5000/api/auth/status';

                const response = await axios.get(apiUrl);

                if (!response.data.registrationAvailable) {
                    navigate('/login', { replace: true });
                    return;
                }
            } catch (err) {
                console.error('Failed to check registration status:', err);
                setError('Unable to check registration status.');
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkRegistrationStatus();
    }, [navigate]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL
                ? `${import.meta.env.VITE_API_URL}/auth/register`
                : 'http://localhost:5000/api/auth/register';

            await axios.post(apiUrl, { email, password });
            navigate('/login');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    'Registration failed. Please try again.',
                );
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingStatus) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">

                {/* Dot grid */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
                    <defs>
                        <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="#818cf8" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>

                {/* Ambient glows */}
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div
                        className="absolute top-[-30%] left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full opacity-[0.14] blur-[100px]"
                        style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
                    />
                    <div
                        className="absolute bottom-[-15%] right-[15%] h-96 w-96 rounded-full opacity-[0.10] blur-[80px]"
                        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}
                    />
                </div>

                {/* Card */}
                <div
                    className="relative flex flex-col items-center gap-8 px-10 py-14 rounded-3xl w-[320px]"
                    style={{
                        background: 'linear-gradient(160deg, rgba(30,27,75,0.7) 0%, rgba(15,15,30,0.85) 100%)',
                        border: '1px solid rgba(99,102,241,0.18)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Orbit rings + icon */}
                    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
                        <svg
                            className="absolute inset-0"
                            width="88" height="88" viewBox="0 0 88 88"
                            style={{ animation: 'spinCW 3s linear infinite' }}
                            aria-hidden="true"
                        >
                            <circle cx="44" cy="44" r="40" stroke="url(#orbitGrad)" strokeWidth="1.5"
                                strokeDasharray="60 192" strokeLinecap="round" fill="none" />
                            <defs>
                                <linearGradient id="orbitGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <svg
                            className="absolute inset-0"
                            width="88" height="88" viewBox="0 0 88 88"
                            style={{ animation: 'spinCCW 5s linear infinite' }}
                            aria-hidden="true"
                        >
                            <circle cx="44" cy="44" r="32" stroke="url(#orbitGrad2)" strokeWidth="1"
                                strokeDasharray="30 172" strokeLinecap="round" fill="none" />
                            <defs>
                                <linearGradient id="orbitGrad2" x1="88" y1="0" x2="0" y2="88" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div
                            className="relative flex items-center justify-center rounded-2xl"
                            style={{
                                width: 56, height: 56,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                boxShadow: '0 0 0 1px rgba(165,120,255,0.3), 0 16px 40px rgba(99,102,241,0.5)',
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                                <rect x="3" y="4" width="22" height="4.5" rx="2.25" fill="white" />
                                <rect x="3" y="11" width="16" height="4.5" rx="2.25" fill="white" fillOpacity="0.65" />
                                <rect x="3" y="18" width="10" height="4.5" rx="2.25" fill="white" fillOpacity="0.35" />
                                <path d="M21 11.5 L25 6 L25 17 Z" fill="white" fillOpacity="0.85" />
                            </svg>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                        <p className="text-[17px] font-bold tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
                            ContentFlow
                        </p>
                        <p className="text-[11px] text-slate-500 tracking-wide uppercase" style={{ letterSpacing: '0.1em' }}>
                            Checking availability…
                        </p>
                    </div>

                    {/* Shimmer bar */}
                    <div className="w-full">
                        <div className="h-[2px] w-full rounded-full bg-slate-800/80 overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: '55%',
                                    background: 'linear-gradient(90deg, transparent 0%, #6366f1 40%, #a78bfa 70%, transparent 100%)',
                                    animation: 'shimmer 2s ease-in-out infinite',
                                }}
                            />
                        </div>
                    </div>

                    {/* Dots */}
                    <div className="flex items-center gap-3">
                        {[
                            { label: 'Waking up', delay: '0s' },
                            { label: 'Loading', delay: '0.4s' },
                            { label: 'Almost', delay: '0.8s' },
                        ].map(({ label, delay }, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <span
                                    className="h-[6px] w-[6px] rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                                        animation: `dotPulse 1.6s ease-in-out ${delay} infinite`,
                                    }}
                                />
                                <span className="text-[9px] text-slate-600 tracking-widest uppercase">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <p
                    className="absolute bottom-8 text-[10px] tracking-widest text-slate-700 uppercase"
                    style={{ letterSpacing: '0.18em' }}
                >
                    Content management · reimagined
                </p>

                <style>{`
                    @keyframes spinCW  { to { transform: rotate(360deg);  } }
                    @keyframes spinCCW { to { transform: rotate(-360deg); } }
                    @keyframes shimmer { 0% { transform: translateX(-180%); } 100% { transform: translateX(320%); } }
                    @keyframes dotPulse {
                        0%, 100% { transform: scale(0.6); opacity: 0.25; }
                        50%       { transform: scale(1.5); opacity: 1;   }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
                            <ShieldCheck className="h-7 w-7 text-white" />
                        </div>

                        <h1 className="text-2xl font-bold text-white">
                            Create administrator account
                        </h1>

                        <p className="mt-2 text-sm text-slate-400">
                            Set up your ContentFlow administrator account.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
                        >
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="admin@contentflow.com"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-11 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Enter password again"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-11 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create administrator account
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            Already have an account? Sign in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
