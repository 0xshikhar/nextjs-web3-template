// hooks/useAuth.ts
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { createAuthMessage } from '@/lib/auth';

export function useAuth() {
    const { address, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { disconnect } = useDisconnect();
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);

    // Check for existing token on mount and when address changes
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            validateToken(token);
        } else if (address) {
            // Check if this wallet has been seen before
            checkUserExists(address);
        }
    }, [address]);

    // Validate the stored token
    const validateToken = async (token: string) => {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('auth_token');
                setIsAuthenticated(false);
                setUser(null);

                // If we have an address, check if user exists
                if (address) {
                    checkUserExists(address);
                }
            }
        } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('auth_token');
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    // Check if user exists and auto-sign in if they do
    const checkUserExists = async (walletAddress: string) => {
        try {
            const response = await fetch(`/api/user/check?address=${walletAddress}`);
            const data = await response.json();

            if (data.exists) {
                // User exists, auto-sign in
                setIsAutoSigningIn(true);
                await login();
                setIsAutoSigningIn(false);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            setIsAutoSigningIn(false);
        }
    };

    const login = useCallback(async () => {
        if (!address || !chain) return;

        try {
            setIsLoading(true);

            // Generate message
            const message = await createAuthMessage(address, chain.id);

            // Request signature
            const signature = await signMessageAsync({ message });

            // Verify on server
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, signature })
            });

            if (!response.ok) throw new Error('Authentication failed');

            const { token } = await response.json();

            // Store token
            localStorage.setItem('auth_token', token);
            setIsAuthenticated(true);

            // Fetch user data
            const userResponse = await fetch('/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData.user);
            }

            return token;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [address, chain, signMessageAsync]);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
        disconnect();
    }, [disconnect]);

    return {
        login,
        logout,
        isLoading,
        isAuthenticated,
        user,
        isAutoSigningIn
    };
}
