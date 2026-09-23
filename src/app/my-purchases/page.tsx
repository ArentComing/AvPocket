"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Key, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Code,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  async function fetchPurchases() {
    try {
      const res = await fetch("/api/user/purchases");
      const data = await res.json();
      if (res.ok) {
        setPurchases(data.purchases || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-gray-400">Loading your licensed assets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Market
      </Link>

      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
          <Key className="w-8 h-8 text-brand-400" />
          My Purchased Assets & License Keys
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Access your purchased PocketMine-MP plugins, copy your DRM license keys, and activate them on your server.
        </p>
      </div>

      {/* Activation Instructions Card */}
      <div className="rounded-3xl bg-dark-900 border border-brand-500/20 p-6 space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
          <Server className="w-4 h-4" />
          <span>How to activate a plugin on your PocketMine-MP server:</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          1. Download the plugin <code className="text-brand-300 font-mono">.phar</code> file and place it in your server's <code className="text-brand-300 font-mono">plugins/</code> folder.<br />
          2. Start the server once to generate the plugin config, then paste your unique <span className="text-white font-bold">License Key</span> into <code className="text-brand-300 font-mono">plugin_data/PluginName/config.yml</code>.<br />
          3. Restart the server. The plugin will verify with <span className="text-brand-400 font-mono">av-api.ir</span> and activate automatically.
        </p>
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {purchases.length === 0 ? (
          <div className="rounded-3xl bg-dark-900 border border-white/5 p-12 text-center text-gray-400 text-xs">
            You haven't purchased any premium assets yet.
            <div className="mt-4">
              <Link href="/" className="px-4 py-2 rounded-xl font-bold text-xs bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all">
                Browse Marketplace
              </Link>
            </div>
          </div>
        ) : (
          purchases.map((p: any) => {
            const latestVer = p.asset.versions[0] || null;
            return (
              <div key={p.id} className="rounded-2xl bg-dark-900 border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-500/30 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Link href={`/assets/${p.asset.slug}`} className="font-black text-lg text-white hover:text-brand-400 transition-colors">
                      {p.asset.title}
                    </Link>
                    <span className="text-xs text-gray-400">by @{p.asset.author.username}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Lifetime License
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1">{p.asset.shortDescription}</p>

                  {/* License Key Box */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400">License Key:</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800 border border-white/10 font-mono font-bold text-xs text-brand-300">
                      <span>{p.licenseKey}</span>
                      <button
                        onClick={() => handleCopy(p.licenseKey)}
                        title="Copy License Key"
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedKey === p.licenseKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {copiedKey === p.licenseKey && (
                      <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex items-center gap-3">
                  <a
                    href={`/api/assets/${p.asset.slug}/download`}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all shadow-md shadow-brand-500/20 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {latestVer ? `v${latestVer.versionNumber}` : ""}</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
