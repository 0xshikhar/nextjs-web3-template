"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function AuthButton() {
    const { address } = useAccount();
    const { login, isLoading } = useAuth();
    const [error, setError] = useState<string>();

    const handleLogin = async () => {
        try {
            setError(undefined);
            await login();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to login');
        }
    };

    return (
        <div>
            <ConnectButton />
            {address && (
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                    {isLoading ? 'Signing...' : 'Sign-In'}
                </button>
            )}
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
}
