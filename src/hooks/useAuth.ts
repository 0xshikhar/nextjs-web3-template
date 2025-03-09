// hooks/useAuth.ts
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useCallback, useEffect, useState, useRef } from 'react';
import { createAuthMessage } from '@/lib/auth';

export function useAuth() {
    const { address, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { disconnect } = useDisconnect();
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);

    // Track if we've already checked for existing users to prevent multiple sign-in prompts
    const [hasCheckedExistingUser, setHasCheckedExistingUser] = useState(false);

    // Use a ref to track the current wallet address we're processing
    const currentAddressRef = useRef<string | null>(null);

    // Use a ref to track if a check or login is in progress
    const isProcessingRef = useRef(false);

    // Add a timeout to reset the processing state if it gets stuck
    const resetProcessingState = () => {
        isProcessingRef.current = false;
        setIsAutoSigningIn(false);
        setIsLoading(false);
    };

    // Check for existing token on mount and when address changes
    useEffect(() => {
        const checkAuth = async () => {
            // If we're already processing an auth check, don't start another one
            if (isProcessingRef.current) {
                console.log('Auth check already in progress, skipping');
                return;
            }

            // If the address hasn't changed, don't recheck
            if (address === currentAddressRef.current) {
                console.log('Address unchanged, skipping auth check');
                return;
            }

            // Update the current address we're processing
            currentAddressRef.current = address || null;

            // If no address, reset state
            if (!address) {
                setHasCheckedExistingUser(false);
                return;
            }

            const token = localStorage.getItem('auth_token');

            try {
                isProcessingRef.current = true;

                // Set a timeout to reset the processing state if it gets stuck
                const timeoutId = setTimeout(resetProcessingState, 10000);

                if (token) {
                    await validateToken(token);
                } else if (!hasCheckedExistingUser) {
                    setHasCheckedExistingUser(true);
                    await checkUserExists(address);
                }

                // Clear the timeout if we complete successfully
                clearTimeout(timeoutId);
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                isProcessingRef.current = false;
            }
        };

        checkAuth();
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

                // If we have an address and haven't checked yet, check if user exists
                if (address && !hasCheckedExistingUser) {
                    setHasCheckedExistingUser(true);
                    await checkUserExists(address);
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
        // If we're already signing in or the address doesn't match current, don't proceed
        if (isAutoSigningIn) {
            console.log('Already auto-signing in, skipping user check');
            return;
        }

        if (walletAddress !== currentAddressRef.current) {
            console.log('Address changed during check, skipping');
            return;
        }

        try {
            console.log(`Checking if user exists for address: ${walletAddress}`);

            const response = await fetch(`/api/user/check?address=${walletAddress}`);

            if (!response.ok) {
                console.error('Error checking user:', response.status);
                return;
            }

            const data = await response.json();

            if (data.exists) {
                // User exists, auto-sign in
                console.log(`User exists for address ${walletAddress}, auto-signing in`);
                setIsAutoSigningIn(true);

                // Force reset the processing state before login
                isProcessingRef.current = false;

                try {
                    await login();
                } finally {
                    setIsAutoSigningIn(false);
                }
            } else {
                console.log(`No existing user for address ${walletAddress}`);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            setIsAutoSigningIn(false);
        }
    };

    const login = useCallback(async () => {
        if (!address || !chain) {
            console.log('No address or chain, cannot login');
            return;
        }

        // If we're already processing a login, don't start another one
        if (isProcessingRef.current) {
            console.log('Login already in progress, skipping');
            return;
        }

        try {
            console.log(`Starting login process for address: ${address}`);
            isProcessingRef.current = true;
            setIsLoading(true);

            // Set a timeout to reset the processing state if it gets stuck
            const timeoutId = setTimeout(resetProcessingState, 30000);

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

            // Clear the timeout since we got a response
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Authentication failed');

            const data = await response.json();
            const { token, user: userData } = data;

            // Store token
            localStorage.setItem('auth_token', token);
            setIsAuthenticated(true);

            // Use the user data returned from login
            if (userData) {
                setUser(userData);
                console.log('User data received from login endpoint');
            } else {
                // Fallback to fetching user data if not provided
                console.log('No user data in login response, fetching from protected endpoint');
                const userResponse = await fetch('/api/protected', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUser(userData.user);
                }
            }

            return token;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    }, [address, chain, signMessageAsync]);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
        setHasCheckedExistingUser(false);
        currentAddressRef.current = null;
        isProcessingRef.current = false;
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
