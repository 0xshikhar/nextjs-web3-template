// hooks/useAuth.ts
import { useAccount, useSignMessage } from 'wagmi';
import { useCallback, useState } from 'react';
import { createAuthMessage, verifySignature } from '@/lib/auth';

export function useAuth() {
    const { address, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [isLoading, setIsLoading] = useState(false);

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

            return token;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [address, chain, signMessageAsync]);

    return { login, isLoading };
}
