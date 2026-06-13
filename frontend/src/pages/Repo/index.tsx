import Sidebar from "../../components/Sidebar";
import CommitDiffView from "../../components/CommitDiffView";
import { useAppContext } from "../../context/AppContext";
import { GitCommit } from "lucide-react";

export default function RepoPage() {
  const { repoPath, selectedCommit } = useAppContext();

  return (
    <>
      {repoPath && <Sidebar />}
      <main className="flex flex-col flex-1 bg-[#1a1b1e] min-w-0 overflow-hidden">
        {selectedCommit ? <CommitDiffView /> : <EmptyState repoPath={repoPath} />}
      </main>
    </>
  );
}

function EmptyState({ repoPath }: { repoPath: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
      <div className="w-14 h-14 bg-[#ec4f31]/10 border border-[#ec4f31]/20 rounded-2xl flex items-center justify-center">
        <GitCommit size={24} className="text-[#ec4f31]/50" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-[#888a91] mb-1">
          {repoPath ? "Select a commit" : "No repository open"}
        </p>
        <p className="text-[11.5px] text-[#555760]">
          {repoPath
            ? "Click any commit in the sidebar to view its diff"
            : "Click \"Current Repository\" in the top bar to get started"}
        </p>
      </div>
    </div>
  );
}
