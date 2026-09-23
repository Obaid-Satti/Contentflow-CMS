import { useEffect } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';

export default function AuthEntry() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/content-manager', { replace: true });
            return;
        }

        const checkRegistrationStatus = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL
                    ? `${import.meta.env.VITE_API_URL}/auth/status`
                    : 'http://localhost:5000/api/auth/status';

                const response = await axios.get(apiUrl);

                if (response.data.registrationAvailable) {
                    navigate('/register', { replace: true });
                } else {
                    navigate('/login', { replace: true });
                }
            } catch (error) {
                console.error('Failed to check registration status:', error);
                navigate('/login', { replace: true });
            }
        };

        checkRegistrationStatus();
    }, [isAuthenticated, navigate]);

    if (isAuthenticated) {
        return <Navigate to="/content-manager" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">

            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden="true">
                <filter id="noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>

            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
                <defs>
                    <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="1" fill="#818cf8" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>

            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full opacity-[0.14] blur-[100px]"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
                <div className="absolute bottom-[-15%] right-[15%] h-96 w-96 rounded-full opacity-[0.10] blur-[80px]"
                    style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
            </div>

            <div className="relative flex flex-col items-center gap-8 px-10 py-14 rounded-3xl w-[320px]"
                style={{
                    background: 'linear-gradient(160deg, rgba(30,27,75,0.7) 0%, rgba(15,15,30,0.85) 100%)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
                    <svg className="absolute inset-0" width="88" height="88" viewBox="0 0 88 88"
                        style={{ animation: 'spinCW 3s linear infinite' }} aria-hidden="true">
                        <circle cx="44" cy="44" r="40" stroke="url(#orbitGrad)" strokeWidth="1.5"
                            strokeDasharray="60 192" strokeLinecap="round" fill="none" />
                        <defs>
                            <linearGradient id="orbitGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <svg className="absolute inset-0" width="88" height="88" viewBox="0 0 88 88"
                        style={{ animation: 'spinCCW 5s linear infinite' }} aria-hidden="true">
                        <circle cx="44" cy="44" r="32" stroke="url(#orbitGrad2)" strokeWidth="1"
                            strokeDasharray="30 172" strokeLinecap="round" fill="none" />
                        <defs>
                            <linearGradient id="orbitGrad2" x1="88" y1="0" x2="0" y2="88" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="relative flex items-center justify-center rounded-2xl"
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

                <div className="text-center space-y-2">
                    <p className="text-[17px] font-bold tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
                        ContentFlow
                    </p>
                    <p className="text-[11px] text-slate-500 tracking-wide uppercase" style={{ letterSpacing: '0.1em' }}>
                        Initializing workspace
                    </p>
                </div>

                <div className="w-full">
                    <div className="h-[2px] w-full rounded-full bg-slate-800/80 overflow-hidden">
                        <div className="h-full rounded-full"
                            style={{
                                width: '55%',
                                background: 'linear-gradient(90deg, transparent 0%, #6366f1 40%, #a78bfa 70%, transparent 100%)',
                                animation: 'shimmer 2s ease-in-out infinite',
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {[
                        { label: 'Waking up', delay: '0s' },
                        { label: 'Loading', delay: '0.4s' },
                        { label: 'Almost', delay: '0.8s' },
                    ].map(({ label, delay }, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                            <span className="h-[6px] w-[6px] rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
                                    animation: `dotPulse 1.6s ease-in-out ${delay} infinite`,
                                }}
                            />
                            <span className="text-[9px] text-slate-600 tracking-widest uppercase">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="absolute bottom-8 text-[10px] tracking-widest text-slate-700 uppercase"
                style={{ letterSpacing: '0.18em' }}>
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