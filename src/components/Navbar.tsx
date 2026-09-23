"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Boxes, 
  UploadCloud, 
  User as UserIcon, 
  Wallet, 
  LogOut, 
  Sparkles,
  Search,
  ShieldCheck
} from "lucide-react";
import { SafeUser } from "@/types";

export default function Navbar() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Form fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) setUser(data.user);
      else setUser(null);
    } catch {
      setUser(null);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" 
        ? { identifier, password }
        : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      setUser(data.user);
      setIsAuthModalOpen(false);
      setPassword("");
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUser(null);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-dark-950 font-black text-xl shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 text-dark-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                AvPocket
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  PMMP
                </span>
              </span>
              <span className="text-[11px] text-gray-400 -mt-1 font-medium">PocketMine-MP Hub</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/" className="hover:text-brand-400 transition-colors">Catalog</Link>
            <Link href="/?category=plugins" className="hover:text-brand-400 transition-colors">Plugins</Link>
            <Link href="/?category=virions" className="hover:text-brand-400 transition-colors">Virions</Link>
            <Link href="/?category=maps" className="hover:text-brand-400 transition-colors">Maps & Worlds</Link>
            <Link href="/?category=models" className="hover:text-brand-400 transition-colors">3D Models</Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Wallet Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-white/5 text-xs text-brand-300 font-semibold">
                  <Wallet className="w-3.5 h-3.5 text-brand-400" />
                  <span>{user.walletBalance.toLocaleString("fa-IR")} تومان</span>
                </div>

                {/* User Dropdown Preview */}
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-8 h-8 rounded-lg bg-dark-700 border border-white/10 object-cover"
                  />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">{user.name || user.username}</span>
                    <span className="text-[10px] text-gray-400 font-mono">@{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-dark-950 bg-gradient-to-r from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 shadow-md shadow-brand-500/20 transition-all"
                >
                  Join Community
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-dark-900 border border-white/10 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-white">
                {authMode === "login" ? "Welcome Back to AvPocket" : "Create Developer Account"}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {authMode === "login"
                  ? "Sign in to download, publish, and manage your PocketMine assets."
                  : "Join the largest Minecraft Bedrock & PMMP developer hub."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. steve_dev"
                      className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </>
              )}

              {authMode === "login" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Username or Email</label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="slappir or tag20craft23@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? "Processing..." : authMode === "login" ? "Sign In" : "Register"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 text-center text-xs text-gray-400">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setError("");
                    }}
                    className="text-brand-400 hover:underline font-semibold"
                  >
                    Register now
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                    }}
                    className="text-brand-400 hover:underline font-semibold"
                  >
                    Log In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
