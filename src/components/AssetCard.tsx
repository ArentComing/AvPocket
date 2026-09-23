import Link from "next/link";
import { Download, Star, Puzzle, Library, Map, Box, Server, CheckCircle2 } from "lucide-react";
import { AssetSummary } from "@/types";

interface Props {
  asset: AssetSummary;
}

const categoryIcons: Record<string, any> = {
  plugins: Puzzle,
  virions: Library,
  maps: Map,
  models: Box,
  setups: Server,
};

export default function AssetCard({ asset }: Props) {
  const Icon = categoryIcons[asset.category.slug] || Puzzle;

  return (
    <div className="group rounded-2xl bg-[#121721] border border-white/5 hover:border-brand-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1">
      <div>
        {/* Card Header: Category & PMMP API Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-800 text-[11px] font-semibold text-gray-300 border border-white/5">
            <Icon className="w-3.5 h-3.5 text-brand-400" />
            <span>{asset.category.name}</span>
          </div>

          {asset.targetApi && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              API {asset.targetApi}
            </span>
          )}
        </div>

        {/* Title & Short Description */}
        <Link href={`/assets/${asset.slug}`} className="block group-hover:text-brand-400 transition-colors">
          <h3 className="font-black text-lg text-white leading-snug line-clamp-1">
            {asset.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
          {asset.shortDescription}
        </p>
      </div>

      {/* Card Footer: Metadata, Author & Price */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        {/* Author info */}
        <div className="flex items-center gap-2">
          <img
            src={asset.author.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${asset.author.username}`}
            alt={asset.author.username}
            className="w-5 h-5 rounded-full bg-dark-700"
          />
          <span className="text-gray-300 font-medium">@{asset.author.username}</span>
        </div>

        {/* Stats & Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-400" title="Downloads">
            <Download className="w-3.5 h-3.5" />
            <span>{asset.totalDownloads}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400" title="Rating">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{asset.ratingAvg.toFixed(1)}</span>
          </div>

          {/* Pricing tag */}
          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
            asset.pricingType === "FREE"
              ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
          }`}>
            {asset.pricingType === "FREE" ? "Free" : `${asset.price.toLocaleString("fa-IR")} T`}
          </span>
        </div>
      </div>
    </div>
  );
}
