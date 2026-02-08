import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role?: 'user' | 'admin' | 'editor';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
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
            setLoading(false);
        }
    }, []);

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

    const login = async (email: string, password: string) => {
        try {
            const response = await authAPI.login({ email, password });
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.error || 'Login failed');
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
        logout,
        isAuthenticated: !!user,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
