import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CommandLine({ cmd }: { cmd: string }) {
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
        className="text-[#555760] hover:text-[#e8e8ea] transition-colors shrink-0 p-1 hover:bg-white/[0.04] rounded cursor-pointer"
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
