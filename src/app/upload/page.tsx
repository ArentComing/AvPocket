"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  ArrowRight,
  Puzzle,
  Code2,
  DollarSign
} from "lucide-react";
import { PluginInspectionResult } from "@/lib/pocketmine/inspector";

export default function UploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspection, setInspection] = useState<PluginInspectionResult | null>(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [versionNumber, setVersionNumber] = useState("1.0.0");
  const [targetApi, setTargetApi] = useState("5.0.0");
  const [categorySlug, setCategorySlug] = useState("plugins");
  const [shortDescription, setShortDescription] = useState("");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const [pricingType, setPricingType] = useState<"FREE" | "PREMIUM">("FREE");
  const [price, setPrice] = useState(0);
  const [sourceCodeUrl, setSourceCodeUrl] = useState("");

  async function handleFileChange(selectedFile: File) {
    setFile(selectedFile);
    setError("");
    setInspection(null);
    setInspecting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload/inspect", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Inspection failed");
        setInspecting(false);
        return;
      }

      const result: PluginInspectionResult = data.inspection;
      setInspection(result);

      // Auto-fill form fields
      if (result.name) setTitle(result.name);
      if (result.version) setVersionNumber(result.version);
      if (result.detectedApi) setTargetApi(result.detectedApi);
      if (result.description) {
        setShortDescription(result.description);
        setDescriptionMarkdown(`# ${result.name}\n\n${result.description}\n\n## Compatibility\nTested with PocketMine-MP API **${result.detectedApi || "5.0.0"}**.`);
      } else {
        setShortDescription(`A high-performance PocketMine-MP plugin for Minecraft: Bedrock Edition.`);
        setDescriptionMarkdown(`# ${result.name}\n\n## Features\n- Compatible with PMMP API ${result.detectedApi || "5.0.0"}`);
      }
    } catch (err: any) {
      setError("An unexpected error occurred while analyzing the file");
    } finally {
      setInspecting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("versionNumber", versionNumber);
      formData.append("targetApi", targetApi);
      formData.append("categorySlug", categorySlug);
      formData.append("shortDescription", shortDescription);
      formData.append("descriptionMarkdown", descriptionMarkdown);
      formData.append("pricingType", pricingType);
      formData.append("price", price.toString());
      formData.append("sourceCodeUrl", sourceCodeUrl);

      const res = await fetch("/api/assets/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish asset");
        setPublishing(false);
        return;
      }

      // Success: redirect to homepage
      router.push("/");
    } catch (err: any) {
      setError("Network error while publishing");
      setPublishing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
          <UploadCloud className="w-8 h-8 text-brand-400" />
          Publish Asset to AvPocket
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload your PocketMine-MP plugin (.phar / .zip), map, 3D model, or virion library.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="mb-8">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          1. Select File (.phar, .zip, .mcworld, .geo.json)
        </label>
        <div className="relative border-2 border-dashed border-white/15 hover:border-brand-500/50 rounded-3xl p-8 text-center bg-dark-900/60 transition-all cursor-pointer group">
          <input
            type="file"
            accept=".phar,.zip,.mcworld,.json,.geo.json"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="font-bold text-white text-base">
            {file ? file.name : "Drag & drop your file here, or browse"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {file 
              ? `${(file.size / 1024).toFixed(1)} KB selected`
              : "Supports PocketMine .phar files, plugin zips, Bedrock worlds and Blockbench models"}
          </p>

          {inspecting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-brand-400">
              <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing PocketMine plugin & scanning security...</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Inspection & Security Badges */}
      {inspection && (
        <div className="mb-8 rounded-2xl bg-dark-800/80 border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Automated PocketMine Inspection
            </span>
            <span className="text-xs font-mono text-gray-400">
              SHA256: {inspection.fileHashSha256.substring(0, 12)}...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Detected API Badge */}
            <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
              <span className="text-[11px] text-gray-400 block mb-1">PocketMine API</span>
              <span className="text-sm font-mono font-bold text-brand-400">
                {inspection.detectedApi ? `API ${inspection.detectedApi}` : "Non-plugin / Generic"}
              </span>
            </div>

            {/* Plugin Status */}
            <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
              <span className="text-[11px] text-gray-400 block mb-1">Manifest</span>
              <span className="text-sm font-bold text-white">
                {inspection.isValidPlugin ? "plugin.yml Valid" : "No manifest"}
              </span>
            </div>

            {/* Security Badge */}
            <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
              <span className="text-[11px] text-gray-400 block mb-1">Anti-Backdoor Scan</span>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${
                inspection.security.isSafe ? "text-emerald-400" : "text-red-400"
              }`}>
                {inspection.security.isSafe ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Passed (Score: {inspection.security.score}/100)
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    {inspection.security.criticalCount} Critical Findings
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Security Findings details if any */}
          {inspection.security.findings.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Security Warnings ({inspection.security.findings.length}):
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {inspection.security.findings.map((f, i) => (
                  <li key={i}>
                    <span className="font-semibold text-amber-400">{f.rule}:</span> {f.message} (file: {f.file})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Metadata Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
          2. Asset Details & Pricing
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SimpleWarp"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Version</label>
            <input
              type="text"
              required
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="1.0.0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="plugins">Plugins (.phar)</option>
              <option value="virions">Virions & PHP Libraries</option>
              <option value="maps">Maps & Worlds</option>
              <option value="models">3D Models (Blockbench)</option>
              <option value="setups">Server Bundles & Setups</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Target PMMP API</label>
            <input
              type="text"
              value={targetApi}
              onChange={(e) => setTargetApi(e.target.value)}
              placeholder="5.0.0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Short Description</label>
          <input
            type="text"
            required
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="A brief summary of what this asset provides..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Documentation (Markdown)</label>
          <textarea
            rows={6}
            value={descriptionMarkdown}
            onChange={(e) => setDescriptionMarkdown(e.target.value)}
            placeholder="# Overview&#10;&#10;Explain permissions, commands, and installation..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500 font-mono text-xs"
          />
        </div>

        {/* Pricing Selection */}
        <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-white">
              <input
                type="radio"
                name="pricing"
                checked={pricingType === "FREE"}
                onChange={() => {
                  setPricingType("FREE");
                  setPrice(0);
                }}
                className="accent-brand-500 w-4 h-4"
              />
              <span>Free / Open-Source</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-purple-400">
              <input
                type="radio"
                name="pricing"
                checked={pricingType === "PREMIUM"}
                onChange={() => setPricingType("PREMIUM")}
                className="accent-purple-500 w-4 h-4"
              />
              <span>Premium (Paid)</span>
            </label>
          </div>

          {pricingType === "PREMIUM" && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Price (Toman)</label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  placeholder="50000"
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-dark-800 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  تومان
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Source Code URL (Optional)</label>
          <input
            type="url"
            value={sourceCodeUrl}
            onChange={(e) => setSourceCodeUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={publishing || !file}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-dark-950 bg-gradient-to-r from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {publishing ? "Publishing..." : "Publish Asset to Marketplace"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
