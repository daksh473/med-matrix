import React from 'react';
import { ClipboardList, GitBranch, LayoutDashboard, Activity, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'intake', icon: ClipboardList, label: 'Patient Intake' },
  { id: 'pipeline', icon: GitBranch, label: 'Agent Pipeline' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Final Recommendation' },
];

export default function Sidebar({ activeScreen, onNavigate, pipelineReady, dashboardReady }) {
  return (
    <div className="sidebar">
      {/* Logo Mark */}
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4361ee] to-[#4cc9f0] flex items-center justify-center mb-6 shadow-lg">
        <Activity className="w-5 h-5 text-white" />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 flex-1">
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
              title={item.label}
              className={`sidebar-icon ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}
            >
              <item.icon className="w-[20px] h-[20px]" />
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Icon */}
      <button className="sidebar-icon mt-auto" title="Settings">
        <Settings className="w-[20px] h-[20px]" />
      </button>
    </div>
  );
}
