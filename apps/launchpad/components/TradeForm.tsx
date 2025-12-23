"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpDown, Wallet, Loader2 } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { getDynamicBondingCurveTokenContract } from "@/contracts/dynamicBondingCurveToken";
import { Agent } from "@/lib/agentsData";
import { toast } from "sonner";

interface TradeFormProps {
  agent: Agent;
}

export default function TradeForm({ agent }: TradeFormProps) {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [estimatedReceive, setEstimatedReceive] = useState("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [balance, setBalance] = useState("0.00");

  const getProvider = async () => {
    if (!wallets || wallets.length === 0) return null;
    return await wallets[0].getEthereumProvider();
  };

  const fetchBalance = async () => {
    if (!authenticated || !wallets[0]) return;
    try {
      const provider = await getProvider();
      if (!provider) return;
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();

      if (mode === "buy") {
        // Get ETH/BNB balance
        const bal = await signer.getBalance();
        setBalance(ethers.utils.formatEther(bal));
      } else {
        // Get Token balance from token contract
        if (!agent.contractAddress) return;
        const contract = getDynamicBondingCurveTokenContract(
          agent.contractAddress,
          signer,
        );
        const address = await signer.getAddress();
        const tokenBal = await contract.balanceOf(address);
        const scalingFactor = await contract.SCALING_FACTOR();
        setBalance(tokenBal.div(scalingFactor).toString());
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [authenticated, mode, agent]);

  useEffect(() => {
    const estimate = async () => {
      if (
        !amount ||
        isNaN(Number(amount)) ||
        Number(amount) === 0 ||
        !agent.contractAddress
      ) {
        setEstimatedReceive("0.00");
        return;
      }

      setIsEstimating(true);
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          "https://data-seed-prebsc-1-s1.binance.org:8545/",
        );
        const contract = getDynamicBondingCurveTokenContract(
          agent.contractAddress,
          provider,
        );

        const amountBN = ethers.BigNumber.from(Math.floor(Number(amount)));
        const totalSupply = await contract.totalSupply();

        if (mode === "buy") {
          const cost = await contract.calculateTotalCost(totalSupply, amountBN);
          setEstimatedReceive(ethers.utils.formatEther(cost) + " BNB");
        } else {
          const receive = await contract.calculateTotalSellingCost(
            totalSupply,
            amountBN,
          );
          setEstimatedReceive(ethers.utils.formatEther(receive) + " BNB");
        }
      } catch (error) {
        console.error("Error estimating:", error);
        setEstimatedReceive("Error");
      } finally {
        setIsEstimating(false);
      }
    };

    const timeoutId = setTimeout(estimate, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [amount, mode, agent]);

  const handleTrade = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!amount || isNaN(Number(amount)) || !agent.contractAddress) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const provider = await getProvider();
      if (!provider) throw new Error("No provider");
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const network = await ethersProvider.getNetwork();

      // Ensure user is connected to BSC Testnet where the token contracts are deployed
      if (network.chainId !== 97) {
        toast.error(
          "Wrong network. Please switch your wallet to BSC Testnet (chainId 97) to trade this token.",
        );
        setIsLoading(false);
        return;
      }

      const signer = ethersProvider.getSigner();
      const contract = getDynamicBondingCurveTokenContract(
        agent.contractAddress,
        signer,
      );
      const address = await signer.getAddress();

      const amountBN = ethers.BigNumber.from(Math.floor(Number(amount)));

      let tx;
      if (mode === "buy") {
        const totalSupply = await contract.totalSupply();
        const cost = await contract.calculateTotalCost(totalSupply, amountBN);
        tx = await contract.buyTokens(address, amountBN, { value: cost });
        toast.info("Transaction sent: " + tx.hash);
      } else {
        tx = await contract.sellTokens(address, amountBN);
        toast.info("Transaction sent: " + tx.hash);
      }

      const receipt = await tx.wait();
      toast.success(
        `Successfully ${mode === "buy" ? "bought" : "sold"} ${amount} ${agent.ticker}`,
      );

      // Sync with database
      try {
        await fetch(`/api/v1/swap/${mode}/evm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: receipt.transactionHash,
            id: agent.id,
            amount: amountBN.toString(),
            address: address,
            blockHash: receipt.blockHash,
            txIndex: receipt.transactionIndex,
          }),
        });
      } catch (apiError) {
        console.error("Failed to sync with database:", apiError);
        toast.warning(
          "Trade successful on-chain, but failed to update database stats. Please contact support.",
        );
      }

      // Refresh balance
      fetchBalance();
      setAmount("");
    } catch (error: any) {
      console.error("Trade error:", error);
      toast.error("Trade failed: " + (error.reason || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-white/5 bg-bg-card p-6"
      style={{
        background:
          "linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)",
        border: "1px solid rgba(0, 249, 207, 0.3)",
        backdropFilter: "blur(92px)",
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="mb-6 flex rounded-lg bg-bg-surface p-1">
        <button
          onClick={() => setMode("buy")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
            mode === "buy"
              ? "text-white shadow-lg hover:scale-[1.02]"
              : "text-text-secondary hover:text-white"
          }`}
          style={
            mode === "buy"
              ? {
                  background:
                    "linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 255, 243, 0.1)",
                }
              : {}
          }
        >
          Buy
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
            mode === "sell"
              ? "bg-status-error text-white shadow-lg"
              : "text-text-secondary hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-secondary">
            <span className="font-medium">Amount ({agent.ticker})</span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {balance} {mode === "buy" ? "BNB" : agent.ticker}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-white/10 bg-bg-surface px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 focus:border-accent-primary focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
              {agent.ticker}
            </div>
          </div>
          <div className="flex gap-2">
            {["reset", "10", "100", "1000"].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val === "reset" ? "" : val)}
                className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-text-secondary hover:bg-white/10 hover:text-white"
              >
                {val === "reset" ? "Reset" : `${val} ${agent.ticker}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center py-2">
          <ArrowUpDown className="h-5 w-5 text-text-muted" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-secondary">
            <span className="font-medium">Cost (Estimated)</span>
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={isEstimating ? "Calculating..." : estimatedReceive}
              className="w-full rounded-lg border border-white/10 bg-bg-surface/50 px-4 py-3 text-lg font-bold text-text-muted focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
              BNB
            </div>
          </div>
        </div>

        <button
          onClick={handleTrade}
          disabled={isLoading || isEstimating || !agent.contractAddress}
          className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "sell" ? "bg-status-error" : ""
          }`}
          style={
            mode === "buy"
              ? {
                  background:
                    "linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 255, 243, 0.1)",
                }
              : {}
          }
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : !authenticated ? (
            "Connect Wallet"
          ) : mode === "buy" ? (
            "Place Buy Order"
          ) : (
            "Place Sell Order"
          )}
        </button>
      </div>
    </div>
  );
}
