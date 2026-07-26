import React from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

export default function PayloadModal({ agentName, payload, onClose }) {
  const [copied, setCopied] = React.useState(false);
  if (!payload) return null;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--navy)]/30 backdrop-blur-sm">
      <div className="bg-white border border-[var(--border-light)] rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-card-alt)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Code className="w-4 h-4 text-[var(--indigo)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-heading)] text-sm">{agentName}</h3>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">Structured JSON Output</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] text-xs transition-colors border border-[var(--border-light)]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--bg-input)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#fafbfc]">
          <pre className="font-mono text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-light)] bg-[var(--bg-card-alt)] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white text-xs font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
