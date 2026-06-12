import { useState } from 'react';
import { SelectRepository, ScanRepository } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import StepIndicator from './components/StepIndicator';
import SelectRepositoryStep from './components/SelectRepositoryStep';
import AuthorMappingStep from './components/AuthorMappingStep';
import RewritePreviewStep from './components/RewritePreviewStep';

export default function App() {
  const [step, setStep] = useState(1);
  const [repoPath, setRepoPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State loaded from scan
  const [commits, setCommits] = useState<main.Commit[]>([]);
  const [mailmap, setMailmap] = useState<Record<number, main.Identity>>({});

  const handleSelectRepository = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const path = await SelectRepository();
      if (!path) {
        setIsLoading(false);
        return; // User canceled dialog
      }
      
      setRepoPath(path);
      const result = await ScanRepository(path);
      
      setCommits(result.commits);
      setMailmap(result.mailmap);
      setStep(2);
    } catch (err: any) {
      setError(err.message || String(err));
      setRepoPath('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="flex items-center gap-3 p-6 border-b border-gray-800/50 bg-black/20 backdrop-blur-md">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            GitModdy
          </h1>
          <p className="text-xs text-gray-500">History Rewriter</p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col">
        <StepIndicator currentStep={step} />

        <div className="flex-1 mt-4 relative">
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
  );
}
