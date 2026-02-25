import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role?: 'user' | 'admin' | 'editor';
    must_change_password?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<User>;
    register: (data: RegisterData) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    activateToken: (token: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data.user);
        } catch (error) {
            console.error('Load user error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<User> => {
        try {
            const response = await authAPI.login({ email, password });
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            return userData;
        } catch (error: any) {
            console.error('Login error:', error);
            if (error?.response?.data?.error) {
                throw new Error(error.response.data.error);
            }

            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Sunucuya baglanilamadi. Backend calisiyor olmali (localhost:3002).');
            }

            throw new Error('Giris basarisiz');
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await authAPI.register(data);
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
        } catch (error: any) {
            console.error('Register error:', error);
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const googleLogin = async (credential: string) => {
        try {
            const response = await authAPI.google({ credential });
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
        } catch (error: any) {
            console.error('Google login error:', error);
            throw new Error(error.response?.data?.error || 'Google ile giriş başarısız');
        }
    };

    const activateToken = async (newToken: string) => {
        setLoading(true);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        try {
            const response = await authAPI.getMe();
            setUser(response.data.user);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        login,
        register,
        googleLogin,
        activateToken,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
