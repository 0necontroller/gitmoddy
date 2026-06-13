import { useState } from "react";
import {
  SelectRepository,
  ScanRepository,
} from "../bindings/changeme/gitservice";
import { Commit, Identity } from "../bindings/changeme/models";
import SelectRepositoryStep from "./components/SelectRepositoryStep";
import AuthorMappingStep from "./components/AuthorMappingStep";
import RewritePreviewStep from "./components/RewritePreviewStep";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import StepIndicator from "./components/StepIndicator";
import { Settings, Maximize2 } from "lucide-react";

export default function App() {
  const [step, setStep] = useState(1);
  const [repoPath, setRepoPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commits, setCommits] = useState<Commit[]>([]);
  const [mailmap, setMailmap] = useState<Record<number, Identity>>({});

  const handleSelectRepository = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const path = await SelectRepository();
      if (!path) {
        setIsLoading(false);
        return;
      }

      setRepoPath(path);
      const result = await ScanRepository(path);

      if (!result) {
        throw new Error("No commits found in this repository.");
      }

      setCommits(result.commits ?? []);
      setMailmap(result.mailmap as unknown as Record<number, Identity>);
      setStep(2);
    } catch (err: any) {
      setError(err.message || String(err));
      setRepoPath("");
    } finally {
      setIsLoading(false);
    }
  };

  const repoName = repoPath
    ? (repoPath.split("/").filter(Boolean).pop() ?? repoPath)
    : "";

  return (
    // app-root: full viewport, dark background, flex column, no overflow
    <div className="flex flex-col h-screen bg-[#1e1f22] text-[#e8e8ea] overflow-hidden">
      {/* ── Top Header Bar ── */}
      <TopBar repoName={repoName} />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <Sidebar step={step} repoPath={repoPath} />

        {/* ── Right Main Panel ── */}
        <main className="flex flex-col flex-1 bg-[#1a1b1e] min-w-0 overflow-hidden">
          {/* Diff-file header bar */}
          <div className="flex items-center justify-between px-4 h-[42px] bg-[#2a2b2f] border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2">
              <svg
                className="text-[#c9a227]"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V6H9.75A1.75 1.75 0 018 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0112.25 16h-8.5A1.75 1.75 0 012 14.25V1.75z"
                />
              </svg>
              <span className="font-mono text-xs text-[#e8e8ea]">
                {repoName || "gitmoddy"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Settings
                size={15}
                className="text-[#c9a227] opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
              />
              <Maximize2
                size={15}
                className="text-[#c9a227] opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-8 py-7 custom-scrollbar">
            <StepIndicator currentStep={step} />

            {step === 1 && (
              <SelectRepositoryStep
                onSelect={handleSelectRepository}
                repoPath={repoPath}
                error={error}
                isLoading={isLoading}
              />
            )}

            {step === 2 && (
              <AuthorMappingStep
                mailmap={mailmap}
                setMailmap={setMailmap}
                commits={commits}
                setCommits={setCommits}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <RewritePreviewStep
                repoPath={repoPath}
                commits={commits}
                mailmap={mailmap}
                onBack={() => setStep(2)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
