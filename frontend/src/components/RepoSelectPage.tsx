import { useState } from "react";
import {
  Clock,
  FolderOpen,
  FolderX,
  ChevronRight,
  GitBranch,
  AlertTriangle,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import AppButton from "./AppButton";
import logoImage from "../assets/images/logo.png";
import { useAppContext } from "../context/AppContext";

function getRepoName(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function CommandLine({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2.5 bg-black/30 border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-3 text-[12px] font-mono transition-all duration-150">
      <span className="text-[#ec4f31] select-none font-bold">$</span>
      <code className="flex-1 text-[#e8e8ea] select-all truncate">{cmd}</code>
      <button
        onClick={handleCopy}
        className="text-[#555760] hover:text-[#e8e8ea] transition-colors shrink-0 p-1 hover:bg-white/[0.04] rounded"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={13} className="text-emerald-400" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
}

export default function RepoSelectPage() {
  const {
    recentRepos,
    isLoading,
    error,
    handleBrowse,
    openRepo,
    removeRecentRepo,
    filterRepoInstalled,
    checkFilterRepoInstalled,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<"macos" | "windows" | "linux">(
    () => {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("win")) return "windows";
      if (ua.includes("linux")) return "linux";
      return "macos";
    },
  );

  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await checkFilterRepoInstalled();
    await new Promise((resolve) => setTimeout(resolve, 600));
    setChecking(false);
  };

  return (
    <div className="flex flex-col relative h-full bg-main">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-96 h-96 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${logoImage})` }}
      />
      {/* Warning banner/card for git-filter-repo if not installed */}
      {filterRepoInstalled === false ? (
        <div className="border border-[#ec4f31]/15 h-full overflow-y-scroll z-10 p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 bg-[#ec4f31]/10 border border-[#ec4f31]/25 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="text-[#ec4f31]" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#e8e8ea]">
                git-filter-repo Required
              </h3>
              <p className="text-[12px] text-[#888a91] mt-1 leading-relaxed">
                GitModdy requires{" "}
                <code className="font-mono bg-white/[0.04] px-1 py-0.5 rounded text-base text-[#e8e8ea]">
                  git-filter-repo
                </code>{" "}
                to analyze and safely rewrite history. It appears that it is not
                currently installed or is missing from your system's PATH.
              </p>
            </div>
          </div>

          {/* OS Tabs */}
          <div className="flex gap-1.5 border-b border-white/[0.06] mb-5">
            {[
              { id: "macos", name: "🍏 macOS" },
              { id: "windows", name: "🪟 Windows" },
              { id: "linux", name: "🐧 Linux" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-all duration-150 -mb-[1px] cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#ec4f31] text-[#e8e8ea]"
                    : "border-transparent text-[#555760] hover:text-[#888a91]"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Installation Instructions */}
          <div className="min-h-[140px]">
            {activeTab === "macos" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Using Homebrew (Recommended):
                  </p>
                  <CommandLine cmd="brew install git-filter-repo" />
                </div>
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Using MacPorts:
                  </p>
                  <CommandLine cmd="sudo port install git-filter-repo" />
                </div>
              </div>
            )}

            {activeTab === "windows" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Using Python Package Index (pip):
                  </p>
                  <CommandLine cmd="pip install git-filter-repo" />
                </div>
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Using Scoop package manager:
                  </p>
                  <CommandLine cmd="scoop install git-filter-repo" />
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 text-[11px] text-[#555760] leading-relaxed">
                  Note: Ensure Python and its Scripts folder are added to your
                  system's Environment Variables PATH.
                </div>
              </div>
            )}

            {activeTab === "linux" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Ubuntu / Debian:
                  </p>
                  <CommandLine cmd="sudo apt update && sudo apt install git-filter-repo" />
                </div>
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Fedora:
                  </p>
                  <CommandLine cmd="sudo dnf install git-filter-repo" />
                </div>
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Arch Linux:
                  </p>
                  <CommandLine cmd="sudo pacman -S git-filter-repo" />
                </div>
                <div>
                  <p className="text-[12px] text-[#888a91] mb-2 font-medium">
                    Using Pip (Any Distribution):
                  </p>
                  <CommandLine cmd="pip3 install git-filter-repo" />
                </div>
              </div>
            )}
          </div>

          {/* Verification */}
          <div className="pt-5 mt-5 border-t border-white/[0.06] space-y-3">
            <div>
              <p className="text-[12px] font-semibold text-[#e8e8ea] flex items-center gap-1.5">
                <span>🛠️</span> Verification
              </p>
              <p className="text-[11.5px] text-[#888a91] mt-1 leading-relaxed">
                After running the installation commands for your platform, open
                a fresh terminal window and verify it works by checking the
                version:
              </p>
            </div>
            <CommandLine cmd="git filter-repo --version" />
          </div>

          {/* Action buttons */}
          <div className="mt-5 pt-4 mb-4 border-t border-white/[0.06] flex justify-end">
            <AppButton
              variant="ghost"
              onClick={handleRecheck}
              loading={checking}
              icon={<RefreshCw size={13} />}
              size="sm"
            >
              Re-check Installation
            </AppButton>
          </div>
        </div>
      ) : (
        <div className="z-10">
          {/* Page header */}
          <div className="px-10 pt-12 pb-8 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#ec4f31]/15 border border-[#ec4f31]/25 rounded-xl flex items-center justify-center">
                <GitBranch size={17} className="text-[#ec4f31]" />
              </div>
              <h1 className="text-2xl font-bold text-[#e8e8ea] tracking-tight">
                Select Repository
              </h1>
            </div>
            <p className="text-[13px] text-[#555760] ml-12">
              Open a local Git repository to browse and rewrite its history.
            </p>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8 space-y-8">
            {/* Browse section */}
            <div>
              <AppButton
                variant="primary"
                size="lg"
                icon={<FolderOpen size={16} />}
                onClick={handleBrowse}
                loading={isLoading}
                disabled={!!filterRepoInstalled === false}
              >
                Browse for Repository
              </AppButton>

              {error && (
                <p className="mt-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Recent repos */}
            {recentRepos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} className="text-[#555760]" />
                  <span className="text-[10.5px] font-semibold text-[#555760] uppercase tracking-widest">
                    Recent Repositories
                  </span>
                </div>

                <div className="space-y-1.5">
                  {recentRepos.map((path) => {
                    const isDisabled = !!filterRepoInstalled === false;
                    return (
                      <div
                        key={path}
                        onClick={() => !isDisabled && openRepo(path)}
                        className={`group flex items-center gap-3.5 bg-[#252629]/50 border border-white/[0.06] rounded-xl px-4 py-3.5 transition-all duration-150 ${
                          isDisabled
                            ? "opacity-45 cursor-not-allowed"
                            : "hover:bg-[#2c2d31] hover:border-white/[0.12] cursor-pointer"
                        }`}
                      >
                        {/* Folder icon */}
                        <div
                          className="w-9 h-9 bg-[#ec4f31]/10 border border-[#ec4f31]/20 rounded-lg
                                  flex items-center justify-center shrink-0 transition-colors
                                  group-hover:bg-[#ec4f31]/15 group-hover:border-[#ec4f31]/30"
                        >
                          <FolderOpen size={15} className="text-[#ec4f31]" />
                        </div>

                        {/* Repo info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#e8e8ea] truncate">
                            {getRepoName(path)}
                          </p>
                          <p className="text-[11px] text-[#555760] truncate mt-0.5">
                            {path}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            title="Remove from recent"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentRepo(path);
                            }}
                            className="p-1.5 rounded-lg text-transparent group-hover:text-[#555760]
                                 hover:!text-[#e8e8ea] hover:bg-white/[0.06] transition-all"
                          >
                            <FolderX size={13} />
                          </button>
                          <ChevronRight
                            size={14}
                            className="text-[#555760] opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {recentRepos.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div
                  className="w-14 h-14 bg-white/[0.04] border border-white/[0.07] rounded-2xl
                            flex items-center justify-center"
                >
                  <FolderOpen size={22} className="text-[#555760]" />
                </div>
                <p className="text-[12.5px] text-[#555760]">
                  No recent repositories. Browse to open one.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
