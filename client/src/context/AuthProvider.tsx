import { useEffect, useState, type ReactNode } from 'react';

import axios from 'axios';

import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('contentflow_token');
    });

    const login = (newToken: string) => {
        localStorage.setItem('contentflow_token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('contentflow_token');
        setToken(null);
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: Boolean(token),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}