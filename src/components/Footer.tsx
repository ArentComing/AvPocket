import Link from "next/link";
import { Heart, Shield, Code, Server } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#090c10] py-12 text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <span className="text-white font-extrabold text-base tracking-tight flex items-center gap-2">
              AvPocket
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-semibold">
                PMMP
              </span>
            </span>
            <p className="text-gray-400 leading-relaxed">
              The modern marketplace and asset hub for PocketMine-MP developers and Minecraft: Bedrock Edition server owners.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Ecosystem</h4>
            <ul className="space-y-2">
              <li><Link href="/?category=plugins" className="hover:text-brand-400 transition-colors">PocketMine Plugins (.phar)</Link></li>
              <li><Link href="/?category=virions" className="hover:text-brand-400 transition-colors">PHP Virions & Libraries</Link></li>
              <li><Link href="/?category=maps" className="hover:text-brand-400 transition-colors">Bedrock Maps & Spawns</Link></li>
              <li><Link href="/?category=models" className="hover:text-brand-400 transition-colors">Blockbench 3D Models</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Developers</h4>
            <ul className="space-y-2">
              <li><a href="https://pmmp.io" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">PocketMine-MP Official</a></li>
              <li><a href="https://github.com/ArentComing/AvPocket" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">AvPocket GitHub Repository</a></li>
              <li><Link href="/ROADMAP.md" className="hover:text-brand-400 transition-colors">Development Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Infrastructure</h4>
            <p className="text-gray-400 mb-2">
              Hosted on secure Linux infrastructure with SSL at <span className="text-brand-400 font-mono">av-api.ir</span>
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AvPocket. Not affiliated with Mojang AB or Microsoft.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ArentComing/AvPocket"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
