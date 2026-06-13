import { FolderSearch, AlertCircle } from 'lucide-react';

interface SelectRepositoryStepProps {
  onSelect: () => void;
  repoPath: string;
  error: string | null;
  isLoading: boolean;
}

export default function SelectRepositoryStep({ onSelect, repoPath, error, isLoading }: SelectRepositoryStepProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3 max-w-lg">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ec4f31] to-[#ff7357]">
          Target Repository
        </h2>
        <p className="text-gray-400 leading-relaxed">
          Select the local Git repository whose commit history you wish to modify. Make sure you have a backup of this repository before proceeding!
        </p>
      </div>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-[#ec4f31] rounded-xl hover:bg-[#d43d20] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec4f31] focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
        <span className="relative flex items-center gap-2">
          <FolderSearch className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {isLoading ? 'Scanning...' : 'Browse for Repository'}
        </span>
      </button>

      {repoPath && !error && (
        <div className="w-full max-w-md p-4 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl shadow-inner">
          <p className="text-sm text-gray-400 mb-1">Selected Path:</p>
          <p className="text-gray-200 font-mono text-sm truncate" title={repoPath}>
            {repoPath}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 w-full max-w-md p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
