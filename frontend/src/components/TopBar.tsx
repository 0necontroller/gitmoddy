import { useState } from "react";
import { ChevronRight, ChevronDown, GitBranch, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import logoImage from "../assets/images/logo.png";
import { useAppContext } from "../context/AppContext";

export default function TopBar() {
  const { repoName, repoLoaded, synced, setSynced } = useAppContext();
  const [branchOpen, setBranchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="drag-region relative flex pl-24 items-stretch h-[52px] bg-[#2a2b2f] border-b border-white/[0.08] shrink-0">
      {/* Divider */}
      <div className="w-px bg-white/[0.08] self-stretch my-2" />

      {/* ── Panel 1: Current Repository ── */}
      <div
        className="no-drag-region flex items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/[0.045]"
        onClick={() => navigate('/')}
      >
        <span className="text-[#888a91] flex items-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.5 2.5 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"
            />
          </svg>
        </span>
        <div className="flex flex-col gap-px min-w-0">
          <span className="text-[10px] text-[#888a91] whitespace-nowrap">
            Current Repository
          </span>
          <span className="text-[13px] font-semibold text-[#e8e8ea] whitespace-nowrap overflow-hidden text-ellipsis">
            {repoName || "—"}
          </span>
        </div>
        <ChevronRight size={14} className="text-[#555760] shrink-0 ml-auto" />
      </div>

      {/* ── Branch + Sync panels (only when a repo is open) ── */}
      {repoLoaded && (
        <>
          {/* Divider */}
          <div className="w-px bg-white/[0.08] self-stretch my-2" />

          {/* ── Panel 2: Current Branch ── */}
          <div
            className="no-drag-region relative flex items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/[0.045]"
            onClick={() => setBranchOpen((o) => !o)}
          >
            <GitBranch size={15} className="text-[#888a91] shrink-0" />
            <div className="flex flex-col gap-px min-w-0">
              <span className="text-[10px] text-[#888a91] whitespace-nowrap">
                Current Branch
              </span>
              <span className="text-[13px] font-semibold text-[#e8e8ea] whitespace-nowrap">
                main
              </span>
            </div>
            {branchOpen ? (
              <ChevronDown
                size={14}
                className="text-[#555760] shrink-0 ml-auto"
              />
            ) : (
              <ChevronRight
                size={14}
                className="text-[#555760] shrink-0 ml-auto"
              />
            )}

            {/* Branch dropdown */}
            {branchOpen && (
              <div
                className="absolute top-full left-0 mt-px w-52 bg-[#2a2b2f] border border-white/[0.12]
                           rounded-xl shadow-2xl shadow-black/50 z-50 py-1.5 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-3 pt-1 pb-1.5 text-[9.5px] font-semibold text-[#555760] uppercase tracking-widest">
                  Branches
                </p>
                {/* main — selectable */}
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-medium
                             text-[#ec4f31] hover:bg-white/[0.06] transition-colors text-left"
                  onClick={() => setBranchOpen(false)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec4f31] shrink-0" />
                  main
                  <span className="ml-auto text-[9.5px] bg-[#ec4f31]/15 border border-[#ec4f31]/30 px-1.5 py-0.5 rounded-full">
                    current
                  </span>
                </button>
                <div className="h-px bg-white/[0.06] my-1" />
                <p className="px-3 py-1.5 text-[11px] text-[#555760] italic">
                  Other branches are read-only in GitModdy
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-white/[0.08] self-stretch my-2" />

          {/* ── Panel 3: Sync with origin ── */}
          <div
            className="no-drag-region flex flex-1 items-center gap-[9px] px-5 min-w-0 cursor-pointer transition-colors hover:bg-white/[0.045]"
            onClick={() => setSynced(true)}
          >
            <RefreshCw
              size={15}
              className={`shrink-0 transition-colors ${synced ? "text-[#56d364]" : "text-[#888a91]"}`}
            />
            <div className="flex flex-col gap-px min-w-0">
              <span className="text-[10px] text-[#888a91] whitespace-nowrap">
                Sync with origin
              </span>
              <span
                className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
                  synced
                    ? "text-[#56d364] font-medium"
                    : "text-[#888a91] font-normal"
                }`}
              >
                {synced ? "Latest from main" : "Never synced"}
              </span>
            </div>
            <ChevronRight
              size={14}
              className="text-[#555760] shrink-0 ml-auto"
            />
          </div>

        </>
      )}

      {/* ── Panel 4: Logo (Far right) ── */}
      <div className="no-drag-region flex items-stretch shrink-0 ml-auto">
        <div className="w-px bg-white/[0.08] self-stretch my-2" />
        <div
          className="flex items-center justify-center px-5 cursor-pointer hover:bg-white/[0.045] transition-colors"
          onClick={() => navigate('/about')}
          title="About GitModdy"
        >
          <img
            src={logoImage}
            alt="Git moddy logo"
            className="w-8 h-8 hover:scale-105 transition-transform"
          />
        </div>
      </div>
    </header>
  );
}
