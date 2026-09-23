"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  Download, 
  Star, 
  History, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  FileCode, 
  HardDrive, 
  User, 
  PlusCircle, 
  Layers,
  ArrowLeft
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function AssetDetailsPage({ params }: Props) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "versions" | "reviews" | "issues">("overview");

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Issue state
  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  // User & Purchase state
  const [user, setUser] = useState<any>(null);
  const [userLicense, setUserLicense] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchAsset();
    fetchUserAndPurchases();
  }, [slug]);

  async function fetchUserAndPurchases() {
    try {
      const resUser = await fetch("/api/auth/me");
      const dataUser = await resUser.json();
      if (dataUser.user) {
        setUser(dataUser.user);
        // Check purchases
        const resPurchases = await fetch("/api/user/purchases");
        const dataPurchases = await resPurchases.json();
        if (dataPurchases.purchases) {
          const match = dataPurchases.purchases.find((p: any) => p.asset.slug === slug);
          if (match) {
            setUserLicense(match.licenseKey);
          }
        }
      }
    } catch {}
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const res = await fetch(`/api/assets/${slug}/purchase`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setUserLicense(data.licenseKey);
        setIsPurchaseModalOpen(false);
        fetchUserAndPurchases();
      } else {
        alert(data.error || "Purchase failed");
      }
    } catch {
      alert("Failed to complete purchase");
    } finally {
      setPurchasing(false);
    }
  }

  async function fetchAsset() {
    try {
      const res = await fetch(`/api/assets/${slug}`);
      const data = await res.json();
      if (data.asset) setAsset(data.asset);
    } catch (err) {
      console.error("Error fetching asset:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewSuccess(false);

    try {
      const res = await fetch(`/api/assets/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        setComment("");
        fetchAsset(); // Refresh asset with new ratings and review list
      } else {
        const data = await res.json();
        alert(data.error || "Please log in to submit a review");
      }
    } catch {
      alert("Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleIssueSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIssueSubmitting(true);

    try {
      const res = await fetch(`/api/assets/${slug}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: issueTitle, issueBody }),
      });

      if (res.ok) {
        setIsIssueModalOpen(false);
        setIssueTitle("");
        setIssueBody("");
        fetchAsset();
      } else {
        const data = await res.json();
        alert(data.error || "Please log in to create an issue");
      }
    } catch {
      alert("Failed to submit issue");
    } finally {
      setIssueSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-mono text-gray-400">Loading PocketMine asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white">Asset Not Found</h2>
        <p className="text-gray-400 text-sm mt-2">The requested asset does not exist or has been removed.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const latestVersion = asset.versions[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Market Catalog
      </Link>

      {/* Header Banner */}
      <div className="rounded-3xl bg-dark-900 border border-white/10 p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-dark-800 text-xs font-semibold text-gray-300 border border-white/5">
                {asset.category.name}
              </span>

              {latestVersion?.targetApi && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                  PocketMine API {latestVersion.targetApi}
                </span>
              )}

              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                asset.pricingType === "FREE"
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              }`}>
                {asset.pricingType === "FREE" ? "Free / Open-Source" : `${asset.price.toLocaleString("fa-IR")} تومان`}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {asset.title}
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              {asset.shortDescription}
            </p>

            {/* Author info & metrics */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-400">
              <Link href={`/users/${asset.author.username}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <img
                  src={asset.author.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${asset.author.username}`}
                  alt={asset.author.username}
                  className="w-5 h-5 rounded-full bg-dark-700"
                />
                <span className="font-semibold text-gray-200">@{asset.author.username}</span>
              </Link>

              <div className="flex items-center gap-1.5 text-gray-300">
                <Download className="w-4 h-4 text-brand-400" />
                <span className="font-bold">{asset.totalDownloads}</span> downloads
              </div>

              <div className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-white">{asset.ratingAvg.toFixed(1)}</span>
                <span className="text-gray-400">({asset.ratingCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Purchase / Download CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            {asset.pricingType === "FREE" || userLicense ? (
              <div className="space-y-2">
                {userLicense && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Licensed ✓</span>
                    <span className="text-xs font-mono font-bold text-white">{userLicense}</span>
                  </div>
                )}
                <a
                  href={`/api/assets/${asset.slug}/download`}
                  className="w-full px-6 py-3.5 rounded-xl font-bold text-sm text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group"
                >
                  <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Download {latestVersion ? `v${latestVersion.versionNumber}` : ""}</span>
                </a>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    alert("Please log in to purchase this asset");
                    return;
                  }
                  setIsPurchaseModalOpen(true);
                }}
                className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <span>Buy for {asset.price.toLocaleString("fa-IR")} Toman</span>
              </button>
            )}

            {asset.sourceCodeUrl && (
              <a
                href={asset.sourceCodeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-gray-300 bg-dark-800 hover:bg-dark-700 border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Source Code</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Content Tabs + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tabs & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-dark-800 text-brand-400 border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Documentation (README)</span>
            </button>

            <button
              onClick={() => setActiveTab("versions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "versions"
                  ? "bg-dark-800 text-brand-400 border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Versions & Changelog ({asset.versions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "reviews"
                  ? "bg-dark-800 text-brand-400 border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Reviews ({asset.reviews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("issues")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "issues"
                  ? "bg-dark-800 text-brand-400 border border-white/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Issues ({asset.issues.length})</span>
            </button>
          </div>

          {/* TAB 1: README / Overview */}
          {activeTab === "overview" && (
            <div className="rounded-3xl bg-dark-900 border border-white/10 p-6 sm:p-8">
              <MarkdownRenderer content={asset.descriptionMarkdown} />
            </div>
          )}

          {/* TAB 2: Versions & Changelog */}
          {activeTab === "versions" && (
            <div className="space-y-4">
              {asset.versions.map((ver: any, index: number) => (
                <div key={ver.id} className="rounded-2xl bg-dark-900 border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">v{ver.versionNumber}</span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          Latest
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-800 text-gray-400 border border-white/5">
                        API {ver.targetApi || "5.0.0"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300">
                      {ver.changelog || "No changelog provided for this release."}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono pt-1">
                      <span>{(ver.fileSize / 1024).toFixed(1)} KB</span>
                      <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      <span>{ver.downloadCount} downloads</span>
                    </div>
                  </div>

                  <a
                    href={`/api/assets/${asset.slug}/download?version=${ver.versionNumber}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-dark-800 hover:bg-brand-500 hover:text-dark-950 border border-white/10 transition-all flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Reviews & Ratings */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Write review card */}
              <div className="rounded-2xl bg-dark-900 border border-white/10 p-6">
                <h3 className="text-base font-bold text-white mb-3">Leave a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Your Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">{rating} Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Comment (Optional)</label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience using this plugin on your server..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {reviewSuccess && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Review submitted successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {asset.reviews.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No reviews yet. Be the first to leave one!</p>
                ) : (
                  asset.reviews.map((rev: any) => (
                    <div key={rev.id} className="rounded-2xl bg-dark-900 border border-white/5 p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.user.username}`}
                            alt={rev.user.username}
                            className="w-6 h-6 rounded-full bg-dark-700"
                          />
                          <span className="text-xs font-bold text-white">@{rev.user.username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-gray-700"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-xs text-gray-300 leading-relaxed">{rev.comment}</p>}
                      <span className="text-[10px] text-gray-500 block">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Issues Tracker (GitHub Style) */}
          {activeTab === "issues" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Community Issue Tracker
                </span>
                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Issue</span>
                </button>
              </div>

              {/* Issues List */}
              <div className="space-y-3">
                {asset.issues.length === 0 ? (
                  <div className="rounded-2xl bg-dark-900 border border-white/5 p-8 text-center text-gray-500 text-xs">
                    No issues reported yet. Everything is running smoothly!
                  </div>
                ) : (
                  asset.issues.map((iss: any) => (
                    <div key={iss.id} className="rounded-2xl bg-dark-900 border border-white/5 p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${iss.status === "OPEN" ? "bg-emerald-500" : "bg-purple-500"}`} />
                          <h4 className="text-sm font-bold text-white">{iss.title}</h4>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">{iss.body}</p>
                        <span className="text-[10px] text-gray-500">
                          opened by @{iss.author.username} on {new Date(iss.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        iss.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {iss.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Issue Modal */}
              {isIssueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl bg-dark-900 border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Report Issue or Bug</h3>
                      <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <form onSubmit={handleIssueSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Issue Title</label>
                        <input
                          type="text"
                          required
                          value={issueTitle}
                          onChange={(e) => setIssueTitle(e.target.value)}
                          placeholder="e.g. Crash on PMMP 5.1.0 when loading config"
                          className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Description & Steps to Reproduce</label>
                        <textarea
                          rows={4}
                          required
                          value={issueBody}
                          onChange={(e) => setIssueBody(e.target.value)}
                          placeholder="Explain what happened, error logs from console, server version..."
                          className="w-full px-3.5 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={issueSubmitting}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all disabled:opacity-50"
                      >
                        {issueSubmitting ? "Submitting..." : "Open Issue"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Technical Specs & Author Sidebar */}
        <div className="space-y-6">
          {/* Specs Card */}
          <div className="rounded-3xl bg-dark-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Technical Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Target API</span>
                <span className="font-mono font-bold text-brand-400">{latestVersion?.targetApi || "5.0.0"}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Latest Version</span>
                <span className="font-bold text-white">v{latestVersion?.versionNumber || "1.0.0"}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">File Type</span>
                <span className="font-mono text-gray-300">{latestVersion?.fileName?.endsWith(".phar") ? ".phar (PocketMine Archive)" : ".zip"}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">File Size</span>
                <span className="font-mono text-gray-300">{latestVersion ? (latestVersion.fileSize / 1024).toFixed(1) : "0"} KB</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Total Downloads</span>
                <span className="font-bold text-white">{asset.totalDownloads}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">License</span>
                <span className="font-bold text-emerald-400">MIT / Open</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Release Date</span>
                <span className="text-gray-300">{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="py-1.5">
                <span className="text-gray-400 block mb-1">SHA-256 Checksum</span>
                <span className="font-mono text-[10px] text-gray-500 break-all select-all">
                  {latestVersion?.fileHashSha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                </span>
              </div>
            </div>
          </div>

          {/* Injected Virions badge (if any) */}
          {latestVersion?.virionsJson && (
            <div className="rounded-3xl bg-dark-900 border border-white/10 p-5 space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                Injected PHP Virions
              </span>
              <p className="text-[11px] text-gray-400">Libraries bundled inside this build:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {JSON.parse(latestVersion.virionsJson).map((v: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-dark-800 text-brand-300 border border-brand-500/20">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Card */}
          <div className="rounded-3xl bg-dark-900 border border-white/10 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Developer Profile</h3>
            <div className="flex items-center gap-3">
              <img
                src={asset.author.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${asset.author.username}`}
                alt={asset.author.username}
                className="w-12 h-12 rounded-2xl bg-dark-800 border border-white/10 object-cover"
              />
              <div>
                <h4 className="font-bold text-white text-sm">{asset.author.name || asset.author.username}</h4>
                <span className="text-xs text-brand-400 font-mono">@{asset.author.username}</span>
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">{asset.author.role}</span>
              </div>
            </div>

            {asset.author.bio && (
              <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                {asset.author.bio}
              </p>
            )}

            <Link
              href={`/users/${asset.author.username}`}
              className="block text-center py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-bold text-gray-200 border border-white/5 transition-colors"
            >
              View Developer Assets
            </Link>
          </div>
        </div>
      </div>
      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-900 border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Purchase Asset</h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-dark-800 border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Asset:</span>
                <span className="font-bold text-white">{asset.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price:</span>
                <span className="font-bold text-purple-400 font-mono">{asset.price.toLocaleString("fa-IR")} تومان</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-gray-400">Your Wallet Balance:</span>
                <span className="font-bold text-brand-400 font-mono">{user?.walletBalance?.toLocaleString("fa-IR") || "0"} تومان</span>
              </div>
            </div>

            {user && user.walletBalance < asset.price ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  Insufficient funds in your wallet. You need {(asset.price - user.walletBalance).toLocaleString("fa-IR")} Tomans more.
                </div>
                <Link
                  href="/wallet"
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-dark-950 bg-brand-500 hover:bg-brand-400 transition-all flex items-center justify-center gap-2"
                >
                  Top Up Wallet Now →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Clicking confirm will deduct <span className="text-white font-bold">{asset.price.toLocaleString("fa-IR")} Tomans</span> from your wallet and instantly generate your lifetime DRM license key.
                </p>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  {purchasing ? "Processing Purchase..." : "Confirm & Buy Asset"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
