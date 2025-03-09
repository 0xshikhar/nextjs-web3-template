"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function AuthButton() {
    const { address } = useAccount();
    const { login, logout, isLoading, isAuthenticated, user, isAutoSigningIn } = useAuth();
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
        <div className="flex items-center gap-2 flex-wrap">
            <ConnectButton />

            {/* Show sign-in button only if:
                1. Wallet is connected
                2. User is not authenticated
                3. Not currently auto-signing in
            */}
            {address && !isAuthenticated && !isAutoSigningIn && (
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    {isLoading ? 'Signing...' : 'Sign-In'}
                </button>
            )}

            {/* Show auto-signing indicator */}
            {isAutoSigningIn && (
                <div className="px-4 py-2 bg-gray-500 text-white rounded animate-pulse">
                    Signing in...
                </div>
            )}

            {isAuthenticated && (
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Sign Out
                </button>
            )}

            {error && <p className="text-red-500 w-full mt-2">{error}</p>}

            {/* {isAuthenticated && user && (
                <div className="mt-2 text-sm text-gray-500">
                    Signed in as {user.username || user.walletAddress}
                </div>
            )} */}
        </div>
    );
}
