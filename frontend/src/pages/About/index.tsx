import { useEffect, useState } from "react";
import logoImage from "../../assets/images/logo.png";
import { GetAppVersion } from "../../../bindings/changeme/git/service";

export default function AboutPage() {
  const [version, setVersion] = useState("Loading...");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const v = await GetAppVersion();
        setVersion(v);
      } catch {
        setVersion("1.0.0");
      }
    };
    fetchVersion();
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#1a1b1e] p-6 relative">
      <div className="z-10 w-full max-w-md  p-8 flex flex-col items-center relative overflow-hidden">
        {/* Logo */}
        <div className="w-20 h-20 bg-[#ec4f31]/10 border border-[#ec4f31]/20 rounded-2xl flex items-center justify-center mb-6">
          <img src={logoImage} alt="GitModdy Logo" className="w-12 h-12" />
        </div>

        {/* Name and description */}
        <h2 className="text-2xl font-black text-[#e8e8ea] tracking-tight flex items-center gap-1.5 mb-2">
          Git<span className="text-[#ec4f31]">Moddy</span>
        </h2>
        <p className="text-[11.5px] font-semibold text-[#555760] uppercase tracking-widest mb-6">
          Git History Editor
        </p>

        <p className="text-sm text-[#888a91] text-center leading-relaxed mb-8">
          GitModdy is a desktop Git history editor. Rewrite commit authors,
          titles, dates, and restructure your commits safely using the speed and
          reliability of `git-filter-repo`.
        </p>

        {/* Version */}
        <div className="text-[11px] text-[#555760] flex items-center gap-1">
          <span>Version</span>
          <span className="font-mono text-[#888a91] font-bold">{version}</span>
        </div>
      </div>
    </main>
  );
}
