import { useState } from 'react';
import { ChevronRight, GitBranch } from 'lucide-react';

interface SidebarFile {
  path: string;
  checked: boolean;
}

interface SidebarProps {
  step: number;
  repoPath: string;
  files?: SidebarFile[];
  commitTitle?: string;
}

const DEMO_FILES: SidebarFile[] = [];

export default function Sidebar({ step, repoPath, files = DEMO_FILES, commitTitle = '' }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [description, setDescription] = useState('');

  const displayFiles = files.length > 0 ? files : [];
  const fileCount = displayFiles.length;

  return (
    <aside className="sidebar">
      {/* Tab Bar */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'changes' ? 'sidebar-tab-active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'history' ? 'sidebar-tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* File List */}
      <div className="sidebar-section sidebar-files">
        <div className="sidebar-section-header">
          <span>{fileCount > 0 ? `${fileCount} changed file${fileCount !== 1 ? 's' : ''}` : 'No changed files'}</span>
        </div>
        <div className="sidebar-file-list">
          {displayFiles.map((file, i) => {
            const parts = file.path.split('/');
            const name = parts.pop() ?? file.path;
            const dir = parts.join('/') + (parts.length ? '/' : '');
            return (
              <div key={i} className="sidebar-file-item">
                <input
                  type="checkbox"
                  defaultChecked={file.checked}
                  className="sidebar-checkbox"
                />
                <span className="sidebar-file-path">
                  <span className="sidebar-file-dir">{dir}</span>
                  <span className="sidebar-file-name">{name}</span>
                </span>
                <span className="sidebar-file-badge">M</span>
              </div>
            );
          })}
          {displayFiles.length === 0 && step === 1 && (
            <div className="sidebar-empty-hint">
              Select a repository to see changed files
            </div>
          )}
        </div>
      </div>

      {/* Stashed Changes */}
      <div className="sidebar-stash">
        <div className="sidebar-stash-row">
          <GitBranch size={13} className="sidebar-stash-icon" />
          <span className="sidebar-stash-label">Stashed changes</span>
          <ChevronRight size={13} className="sidebar-stash-chevron" />
        </div>
      </div>

      {/* Commit Box */}
      <div className="sidebar-commit-box">
        {commitTitle && (
          <p className="sidebar-commit-title">{commitTitle}</p>
        )}
        <div className="sidebar-commit-input-wrap">
          <div className="sidebar-avatar" />
          <textarea
            className="sidebar-description"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </aside>
  );
}
