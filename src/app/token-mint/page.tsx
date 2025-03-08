"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CoinsIcon, RefreshCwIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { contractAddresses, contractABIs, blockExplorer } from "@/lib/contracts";
import { useAuth } from "@/hooks/useAuth";

export default function TokenMintPage() {
    const [amount, setAmount] = useState<number>(1);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { address, isConnected } = useAccount();
    const { isAuthenticated } = useAuth();

    // Reset states when transaction completes
    const resetStates = () => {
        setTimeout(() => {
            setIsSuccess(false);
            setError(null);
        }, 5000);
    };

    // Read contract data
    const { data: mintPrice } = useReadContract({
        address: contractAddresses.tokenMint as `0x${string}`,
        abi: contractABIs.tokenMint,
        functionName: "mintPrice",
    });

    const { data: remainingAllowance } = useReadContract({
        address: contractAddresses.tokenMint as `0x${string}`,
        abi: contractABIs.tokenMint,
        functionName: "getRemainingMintAllowance",
        args: [address || "0x0000000000000000000000000000000000000000"],
        query: {
            enabled: !!address
        }
    });

    const { data: tokenSymbol } = useReadContract({
        address: contractAddresses.tokenMint as `0x${string}`,
        abi: contractABIs.tokenMint,
        functionName: "symbol",
    });

    const { data: tokenName } = useReadContract({
        address: contractAddresses.tokenMint as `0x${string}`,
        abi: contractABIs.tokenMint,
        functionName: "name",
    });

    const { data: tokenBalance } = useReadContract({
        address: contractAddresses.tokenMint as `0x${string}`,
        abi: contractABIs.tokenMint,
        functionName: "balanceOf",
        args: [address || "0x0000000000000000000000000000000000000000"],
        query: {
            enabled: !!address
        }
    });

    // Write contract
    const { data: hash, isPending, writeContract } = useWriteContract();

    // Wait for transaction receipt
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    // Handle mint function
    const handleMint = async () => {
        try {
            setError(null);

            if (!address) {
                setError("Please connect your wallet first");
                return;
            }

            if (!isAuthenticated) {
                setError("Please sign in with your wallet first");
                return;
            }

            const value = mintPrice ? (Number(mintPrice) * amount).toString() : "0";

            writeContract({
                address: contractAddresses.tokenMint as `0x${string}`,
                abi: contractABIs.tokenMint,
                functionName: "mint",
                args: [BigInt(amount)],
                value: BigInt(value),
            });
        } catch (err) {
            console.error("Error minting tokens:", err);
            setError(err instanceof Error ? err.message : "Failed to mint tokens");
        }
    };

    // Update UI based on transaction status
    useEffect(() => {
        if (isConfirmed) {
            setIsSuccess(true);
            resetStates();
        }
    }, [isConfirmed]);

    // Format balance for display
    const formattedBalance = tokenBalance && typeof tokenBalance === 'bigint'
        ? Number(formatEther(tokenBalance))
        : 0;

    return (
        <div className="container max-w-4xl py-12">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Token Minting Portal
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                            <CoinsIcon className="mr-2 h-5 w-5" />
                            Token Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formattedBalance.toLocaleString()}</p>
                        <p className="text-sm text-slate-400">{tokenSymbol as string ?? "Tokens"}</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                            <RefreshCwIcon className="mr-2 h-5 w-5" />
                            Daily Allowance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{Number(remainingAllowance ?? 0).toString()}</p>
                        <p className="text-sm text-slate-400">Tokens available today</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                            <InfoIcon className="mr-2 h-5 w-5" />
                            Mint Price
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {mintPrice ? formatEther(mintPrice as bigint) : "0"} ETH
                        </p>
                        <p className="text-sm text-slate-400">Per token</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Mint {tokenName as string || "Tokens"}</CardTitle>
                    <CardDescription>
                        Mint up to {Number(remainingAllowance ?? 10).toString()} tokens per day
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="amount">Amount to Mint</Label>
                                <Badge variant="outline" className="font-mono">
                                    {amount} {tokenSymbol as string || "Tokens"}
                                </Badge>
                            </div>

                            <div className="pt-4 pb-2">
                                <Slider
                                    id="amount"
                                    defaultValue={[1]}
                                    max={Number(remainingAllowance || 10)}
                                    min={1}
                                    step={1}
                                    onValueChange={(value) => setAmount(value[0])}
                                    disabled={!isConnected || !isAuthenticated}
                                />
                            </div>

                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>1</span>
                                <span>{Number(remainingAllowance || 10)}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Total Cost</Label>
                            <div className="text-2xl font-bold">
                                {mintPrice ? formatEther(BigInt(Number(mintPrice) * amount)) : "0"} ETH
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Plus gas fees
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircleIcon className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {isSuccess && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Success!</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Tokens minted successfully!{" "}
                                    {hash && (
                                        <a
                                            href={`${blockExplorer.tokenMint.split("?")[0]}/tx/${hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline font-medium"
                                        >
                                            View transaction
                                        </a>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>

                <CardFooter>
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        size="lg"
                        onClick={handleMint}
                        disabled={!isConnected || !isAuthenticated || isPending || isConfirming}
                    >
                        {isPending || isConfirming ? (
                            <>
                                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                                {isPending ? "Confirm in Wallet" : "Processing..."}
                            </>
                        ) : (
                            <>Mint Tokens</>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>
                    Contract Address:{" "}
                    <a
                        href={blockExplorer.tokenMint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                    >
                        {contractAddresses.tokenMint}
                    </a>
                </p>
            </div>
        </div>
    );
} 