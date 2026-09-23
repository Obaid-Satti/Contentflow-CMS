import { useEffect } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
            </div>
        </div>
    );
}