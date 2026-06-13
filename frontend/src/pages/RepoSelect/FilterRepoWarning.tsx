import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { System } from "@wailsio/runtime";
import Button from "../../components/ui/button";
import { useAppContext } from "../../context/AppContext";
import CommandLine from "./CommandLine";

export default function FilterRepoWarning() {
  const { filterRepoInstalled, checkFilterRepoInstalled } = useAppContext();

  const [activeTab, setActiveTab] = useState<"macos" | "windows" | "linux">(
    "macos",
  );

  const getEnvironment = async () => {
    if (System.IsWindows()) setActiveTab("windows");
    else if (System.IsLinux()) setActiveTab("linux");
    else setActiveTab("macos");
  };

  useEffect(() => {
    getEnvironment();
  }, []);

  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await checkFilterRepoInstalled();
    await new Promise((resolve) => setTimeout(resolve, 600));
    setChecking(false);
  };

  if (filterRepoInstalled !== false) {
    return null;
  }

  return (
    <div className="border border-[#ec4f31]/15 h-full overflow-y-scroll z-10 p-6 w-full">
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
            After running the installation commands for your platform, open a
            fresh terminal window and verify it works by checking the version:
          </p>
        </div>
        <CommandLine cmd="git filter-repo --version" />
      </div>

      {/* Action buttons */}
      <div className="mt-5 pt-4 mb-4 border-t border-white/[0.06] flex justify-end">
        <Button
          variant="ghost"
          onClick={handleRecheck}
          loading={checking}
          icon={<RefreshCw size={13} />}
          size="sm"
        >
          Re-check Installation
        </Button>
      </div>
    </div>
  );
}
