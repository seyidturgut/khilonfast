import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, clearApiCache } from '../services/api';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/safeStorage';

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
    loadUser: () => Promise<void>;
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
    const [token, setToken] = useState<string | null>(() => safeGetItem('token'));
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

            // Önceki oturumdan kalan tüm cache'lenmiş verileri temizle
            clearApiCache();
            setToken(newToken);
            setUser(userData);
            safeSetItem('token', newToken);
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

            clearApiCache();
            setToken(newToken);
            setUser(userData);
            safeSetItem('token', newToken);
        } catch (error: any) {
            console.error('Register error:', error);
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const googleLogin = async (credential: string) => {
        try {
            const response = await authAPI.google({ credential });
            const { token: newToken, user: userData } = response.data;

            clearApiCache();
            setToken(newToken);
            setUser(userData);
            safeSetItem('token', newToken);
        } catch (error: any) {
            console.error('Google login error:', error);
            throw new Error(error.response?.data?.error || 'Google ile giriş başarısız');
        }
    };

    const activateToken = async (newToken: string) => {
        setLoading(true);
        clearApiCache();
        setToken(newToken);
        safeSetItem('token', newToken);
        try {
            const response = await authAPI.getMe();
            setUser(response.data.user);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearApiCache();
        setUser(null);
        setToken(null);
        safeRemoveItem('token');
    };

    const value = {
        user,
        token,
        login,
        register,
        googleLogin,
        activateToken,
        loadUser,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
