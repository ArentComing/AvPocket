"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  Filter, 
  SlidersHorizontal, 
  Terminal, 
  PlusCircle, 
  Layers,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import AssetCard from "@/components/AssetCard";
import { AssetSummary } from "@/types";

export default function HomePage() {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState("all");
  const [targetApi, setTargetApi] = useState("all");
  const [pricing, setPricing] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAssets();
  }, [category, targetApi, pricing]);

  async function fetchAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (pricing !== "all") params.set("pricing", pricing);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Failed to load assets", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchAssets();
  }

  const categoryPills = [
    { slug: "all", name: "All Assets" },
    { slug: "plugins", name: "Plugins (.phar)" },
    { slug: "virions", name: "Virions & Libs" },
    { slug: "maps", name: "Maps & Worlds" },
    { slug: "models", name: "3D Models" },
    { slug: "setups", name: "Server Bundles" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#141a29] to-[#0d111a] border border-white/10 p-8 sm:p-12 overflow-hidden mb-12 shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-brand-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Minecraft: Bedrock & PocketMine-MP Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Discover, Share & Monetize <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200">
              PocketMine-MP
            </span> Assets
          </h1>

          <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
            The next-generation marketplace and CI hub for PocketMine-MP plugins, PHP virions, Bedrock worlds, and custom 3D entity models.
          </p>

          {/* Search bar inside Hero */}
          <form onSubmit={handleSearchSubmit} className="mt-8 flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plugins, virions, maps by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-900 border border-white/15 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-400 text-dark-950 transition-all shadow-lg shadow-brand-500/20"
            >
              Search
            </button>
          </form>

          {/* Quick Metrics */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-8 text-xs text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">PM 5.x</span>
              <span>Fully Compatible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">Instant</span>
              <span>.phar Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-brand-400 text-base">100%</span>
              <span>Anti-Backdoor Scanned</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Filters & Category Pills */}
      <div className="space-y-4 mb-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryPills.map((pill) => (
            <button
              key={pill.slug}
              onClick={() => setCategory(pill.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === pill.slug
                  ? "bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20"
                  : "bg-dark-900 text-gray-400 hover:text-white hover:bg-dark-800 border border-white/5"
              }`}
            >
              {pill.name}
            </button>
          ))}
        </div>

        {/* Sub-filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-dark-900/60 border border-white/5">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400 flex items-center gap-1.5 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
              Filter by:
            </span>

            {/* Pricing filter */}
            <select
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-dark-800 border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Showing <span className="text-white font-bold">{assets.length}</span> assets
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Querying PocketMine registry...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-dark-900/30 border border-white/5 p-8">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No assets found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or explore other categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
