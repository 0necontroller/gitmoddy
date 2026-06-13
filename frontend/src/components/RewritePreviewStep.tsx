import { useState, useMemo } from 'react';
import { main } from '../../wailsjs/go/models';
import { RewriteHistory } from '../../wailsjs/go/main/App';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface RewritePreviewStepProps {
  repoPath: string;
  commits: main.Commit[];
  mailmap: Record<number, main.Identity>;
  onBack: () => void;
}

export default function RewritePreviewStep({ repoPath, commits, mailmap, onBack }: RewritePreviewStepProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate changes
  const changes = useMemo(() => {
    return commits.filter(c => {
      const target = mailmap[c.committer];
      if (!target) return false;
      return c.originalAuthor.name !== target.name || c.originalAuthor.email !== target.email;
    });
  }, [commits, mailmap]);

  const handleRewrite = async () => {
    if (changes.length === 0) {
      setSuccess(true);
      return;
    }

    setIsRewriting(true);
    setError(null);

    try {
      // Build overrides map
      const overrides: Record<string, main.Identity> = {};
      for (const commit of changes) {
        const target = mailmap[commit.committer];
        overrides[commit.hash] = target;
      }

      await RewriteHistory(repoPath, overrides);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsRewriting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-100">History Rewritten!</h2>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 max-w-md text-gray-300">
          <p className="mb-4">The commit history has been successfully updated.</p>
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl text-yellow-500/90 text-sm flex gap-3 text-left">
            <AlertTriangle className="shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Important:</p>
              <p>You will need to force-push these changes to your remote repository.</p>
              <code className="block bg-black/40 p-2 rounded mt-2 text-yellow-400 border border-yellow-700/30">
                git push origin --force --all
              </code>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors border border-gray-600"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500" style={{minHeight: '480px', height: 'calc(100vh - 280px)', maxHeight: '700px'}}>
      
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col h-full shadow-lg overflow-hidden backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-6 text-gray-100 flex items-center gap-3">
          Review Changes
          <span className="text-sm font-normal px-2.5 py-0.5 bg-gray-900 rounded-full text-gray-400 border border-gray-700">
            {changes.length} commits will change
          </span>
        </h3>

        {changes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No changes detected. The identities already match.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {changes.map(commit => {
              const target = mailmap[commit.committer];
              return (
                <div key={commit.hash} className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/50 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                      {commit.hash.substring(0, 8)}
                    </span>
                    <span className="text-gray-300 truncate font-medium">{commit.title}</span>
                  </div>
                  
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mt-3 bg-black/20 p-3 rounded-lg">
                    <div className="truncate text-gray-400">
                      <p className="truncate">{commit.originalAuthor.name}</p>
                      <p className="text-xs opacity-70 truncate">{commit.originalAuthor.email}</p>
                    </div>
                    <ArrowRight className="text-gray-600 w-4 h-4" />
                    <div className="truncate text-green-400">
                      <p className="truncate">{target.name}</p>
                      <p className="text-xs opacity-70 truncate">{target.email}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          disabled={isRewriting}
          className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:text-white transition-all disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleRewrite}
          disabled={isRewriting || changes.length === 0}
          className="relative px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-xl hover:from-red-500 hover:to-orange-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          {isRewriting && (
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
          <span className="relative flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isRewriting ? 'Rewriting History...' : 'Rewrite History!'}
          </span>
        </button>
      </div>

    </div>
  );
}
