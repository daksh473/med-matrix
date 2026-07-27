import React from 'react';
import { ClipboardList, GitBranch, LayoutDashboard, Activity, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'intake', icon: ClipboardList, label: 'Patient Intake' },
  { id: 'pipeline', icon: GitBranch, label: 'AI Pipeline' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Recommendation' },
];

export default function Sidebar({ activeScreen, onNavigate, pipelineReady, dashboardReady }) {
  return (
    <div className="sidebar">
      {/* Brand Badge */}
      <div className="flex items-center gap-3 px-3 py-2 mb-4 border-b border-white/10 pb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4361ee] to-[#4cc9f0] flex items-center justify-center shadow-lg text-white flex-shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm text-white tracking-tight leading-none">Med Matrix</span>
          <span className="text-[10px] text-blue-300 font-mono mt-0.5">Precision AI</span>
        </div>
      </div>

      {/* Navigation Buttons with Text Labels */}
      <div className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id;
          const isDisabled =
            (item.id === 'pipeline' && !pipelineReady) ||
            (item.id === 'dashboard' && !dashboardReady);

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.id)}
              disabled={isDisabled}
              className={`sidebar-btn ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Icon */}
      <div className="pt-3 border-t border-white/10 mt-auto">
        <button className="sidebar-btn" title="Settings">
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
