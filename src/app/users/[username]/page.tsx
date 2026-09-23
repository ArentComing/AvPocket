import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  User, 
  Download, 
  Boxes, 
  ExternalLink, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft 
} from "lucide-react";
import AssetCard from "@/components/AssetCard";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      assets: {
        where: { status: "APPROVED" },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              versionNumber: true,
              targetApi: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalDownloads = user.assets.reduce((acc, a) => acc + a.totalDownloads, 0);

  const formattedAssets = user.assets.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    shortDescription: a.shortDescription,
    type: a.type,
    pricingType: a.pricingType,
    price: a.price,
    author: a.author,
    category: a.category,
    totalDownloads: a.totalDownloads,
    ratingAvg: a.ratingAvg,
    ratingCount: a.ratingCount,
    latestVersion: a.versions[0]?.versionNumber || "1.0.0",
    targetApi: a.versions[0]?.targetApi || null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Market
      </Link>

      {/* User Header Profile Card */}
      <div className="rounded-3xl bg-dark-900 border border-white/10 p-8 mb-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt={user.username}
            className="w-24 h-24 rounded-3xl bg-dark-800 border-2 border-white/10 shadow-2xl object-cover"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name || user.username}</h1>
              <span className="text-xs font-mono text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                @{user.username}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-dark-800 text-gray-400 border border-white/5">
                {user.role}
              </span>
            </div>

            {user.bio && (
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                {user.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 pt-2 font-medium">
              <div className="flex items-center gap-1.5 text-white">
                <Boxes className="w-4 h-4 text-brand-400" />
                <span className="font-bold">{user.assets.length}</span> published assets
              </div>

              <div className="flex items-center gap-1.5 text-white">
                <Download className="w-4 h-4 text-brand-400" />
                <span className="font-bold">{totalDownloads}</span> total downloads
              </div>

              <div className="flex items-center gap-1.5 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              {user.githubUsername && (
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub: @{user.githubUsername}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Published Assets Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Boxes className="w-5 h-5 text-brand-400" />
          <span>Published PocketMine Assets ({user.assets.length})</span>
        </h2>

        {formattedAssets.length === 0 ? (
          <div className="rounded-3xl bg-dark-900 border border-white/5 p-12 text-center text-gray-400 text-xs">
            This developer has not published any approved assets yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
