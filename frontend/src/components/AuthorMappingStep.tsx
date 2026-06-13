import { Plus, User, GitCommitHorizontal } from 'lucide-react';
import { Identity, Commit } from '../../bindings/changeme/models';

interface AuthorMappingStepProps {
  mailmap: Record<number, Identity>;
  setMailmap: (updater: (prev: Record<number, Identity>) => Record<number, Identity>) => void;
  commits: Commit[];
  setCommits: (updater: (prev: Commit[]) => Commit[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AuthorMappingStep({ mailmap, setMailmap, commits, setCommits, onNext, onBack }: AuthorMappingStepProps) {
  
  const handleIdentityChange = (slot: number, field: 'name' | 'email', value: string) => {
    setMailmap(prev => ({
      ...prev,
      [slot]: { ...prev[slot], [field]: value } as Identity
    }));
  };

  const handleAddIdentity = () => {
    setMailmap(prev => {
      const slots = Object.keys(prev).map(Number);
      const nextSlot = slots.length > 0 ? Math.max(...slots) + 1 : 1;
      return {
        ...prev,
        [nextSlot]: { name: 'New Author', email: 'new@example.com' } as Identity
      };
    });
  };

  const handleCommitChange = (commitIndex: number, newCommitterSlot: number) => {
    setCommits(prev => {
      const newCommits = [...prev];
      newCommits[commitIndex] = { ...newCommits[commitIndex], committer: newCommitterSlot } as Commit;
      return newCommits;
    });
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{minHeight: '480px', height: 'calc(100vh - 280px)', maxHeight: '700px'}}>
        
        {/* Identities Section */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col h-full shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-100">
              <User className="text-blue-400" /> Identities Map
            </h3>
            <button
              onClick={handleAddIdentity}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 hover:text-blue-300 rounded-lg transition-colors border border-blue-500/30"
            >
              <Plus size={16} /> Add New
            </button>
          </div>
          
          <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar">
            {Object.entries(mailmap).map(([slotStr, identity]) => {
              const slot = Number(slotStr);
              return (
                <div key={slot} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 space-y-3 hover:border-gray-600/50 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Slot #{slot}</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={identity.name}
                      onChange={(e) => handleIdentityChange(slot, 'name', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={identity.email}
                      onChange={(e) => handleIdentityChange(slot, 'email', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Email"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commits Section */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 flex flex-col h-full shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-100">
              <GitCommitHorizontal className="text-purple-400" /> Commits ({commits.length})
            </h3>
          </div>
          
          <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
            {commits.map((commit, idx) => (
              <div key={commit.hash + idx} className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-colors group">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                      {commit.hash.substring(0, 8)}
                    </span>
                    <select
                      value={commit.committer}
                      onChange={(e) => handleCommitChange(idx, Number(e.target.value))}
                      className="bg-gray-800 border border-gray-600 text-xs rounded px-2 py-1 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(mailmap).map(([s, id]) => (
                        <option key={s} value={s}>
                          Slot {s}: {id.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-200 truncate" title={commit.title}>
                    {commit.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Orig: {commit.originalAuthor.name} &lt;{commit.originalAuthor.email}&gt;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-gray-600"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25"
        >
          Preview Changes
        </button>
      </div>
    </div>
  );
}
