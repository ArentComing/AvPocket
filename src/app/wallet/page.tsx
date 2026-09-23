"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  ShieldCheck,
  TrendingUp,
  Percent
} from "lucide-react";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(50000);
  const [depositing, setDepositing] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  useEffect(() => {
    fetchWallet();
  }, []);

  async function fetchWallet() {
    try {
      const res = await fetch("/api/wallet/transactions");
      const data = await res.json();
      if (res.ok) {
        setBalance(data.walletBalance);
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit(depositAmount: number) {
    setDepositing(true);
    setDepositMsg("");

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });

      const data = await res.json();
      if (res.ok) {
        setDepositMsg(`Successfully topped up ${depositAmount.toLocaleString("fa-IR")} Tomans!`);
        fetchWallet();
      } else {
        alert(data.error || "Deposit failed");
      }
    } catch {
      alert("Failed to connect to payment gateway");
    } finally {
      setDepositing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-gray-400">Loading wallet balance and ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
          <Wallet className="w-8 h-8 text-brand-400" />
          AvPocket Wallet & Payments
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your balance, purchase premium PocketMine assets, and track developer revenue payouts.
        </p>
      </div>

      {depositMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{depositMsg}</span>
        </div>
      )}

      {/* Top Section: Balance Card + Quick Top-Up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#121824] to-[#0a0f18] border border-white/10 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Balance</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="my-6">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {balance !== null ? balance.toLocaleString("fa-IR") : "0"}
              <span className="text-sm font-semibold text-gray-400 ml-2">تومان</span>
            </div>
            <span className="text-xs text-brand-400 mt-1 block font-medium">Ready for instant marketplace purchases</span>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Platform Currency</span>
            <span className="text-white font-mono font-bold">IRR / Toman</span>
          </div>
        </div>

        {/* Quick Deposit Box */}
        <div className="md:col-span-2 rounded-3xl bg-dark-900 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              Direct Top-Up (Online Gateway)
            </h3>
            <span className="text-[11px] text-gray-400">Shaparak / ZarinPal Ready</span>
          </div>

          <p className="text-xs text-gray-300">
            Select an amount to instantly charge your AvPocket wallet:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[25000, 50000, 100000, 250000].map((quick) => (
              <button
                key={quick}
                onClick={() => setAmount(quick)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                  amount === quick
                    ? "bg-brand-500 text-dark-950 border-brand-400 shadow-md shadow-brand-500/20"
                    : "bg-dark-800 text-gray-300 hover:text-white border-white/5 hover:border-white/20"
                }`}
              >
                {quick.toLocaleString("fa-IR")} تومان
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              min="1000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
              placeholder="Custom amount in Tomans"
            />
            <button
              onClick={() => handleDeposit(amount)}
              disabled={depositing || amount < 1000}
              className="px-6 py-3 rounded-xl font-bold text-sm text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-brand-500/20"
            >
              {depositing ? "Processing..." : `Top Up ${amount.toLocaleString("fa-IR")} Toman`}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Developer Revenue Share Info */}
      <div className="rounded-2xl bg-dark-900 border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold block">Developer Revenue Share: 90%</span>
            <span>Authors keep 90% of every premium sale. Platform fee is only 10% to cover server and bandwidth costs.</span>
          </div>
        </div>
        <Link href="/my-purchases" className="text-brand-400 hover:underline font-semibold whitespace-nowrap">
          View My Bought Assets & Licenses →
        </Link>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-dark-900 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Transaction History
          </h3>
          <span className="text-xs text-gray-500 font-mono">{transactions.length} records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No transactions found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "DEPOSIT"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : tx.type === "SALE_PAYOUT"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-200 font-medium">{tx.description}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isPositive ? "text-emerald-400" : "text-gray-300"}>
                          {isPositive ? "+" : ""}{tx.amount.toLocaleString("fa-IR")} T
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">{tx.referenceId || "—"}</td>
                      <td className="py-3 px-3 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
