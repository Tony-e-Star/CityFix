import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, 
  Plus, 
  FolderHeart, 
  Globe, 
  Trophy, 
  X, 
  User, 
  Settings,
  MessageSquare,
  AlertCircle,
  Clock
} from "lucide-react";
import { getInitials } from "../utils";

interface Report {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  userId?: string;
}

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; name?: string; photoURL?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigate: (tab: "home" | "report" | "my-reports" | "dashboard" | "gamification" | "settings", filter?: "all" | "mine") => void;
  activeTab: string;
  feedFilter: string;
  reports: Report[];
  onOpenSettings: () => void;
}

export const SideBar: React.FC<SideBarProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigate,
  activeTab,
  feedFilter,
  reports,
  onOpenSettings,
}) => {
  // Get the most recent reports for the user
  const recentReports = React.useMemo(() => {
    if (!currentUser) return [];
    
    // Filter strictly by the authenticated user's ID
    const filtered = reports.filter(r => r.userId === currentUser.id);
    
    // Sort by newest and limit to 5
    return [...filtered]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [reports, currentUser]);

  // Helper to format category labels
  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Helper for status colors mapped strictly to Citizen aesthetic
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Pending Approval":
        return "bg-accent-alert shadow-accent-alert/50";
      case "Submitted":
        return "bg-accent-info shadow-accent-info/50";
      case "Verified":
        return "bg-accent-info shadow-accent-info/50";
      case "In Review":
        return "bg-accent-info shadow-accent-info/50";
      case "Scheduled for Repair":
        return "bg-accent-info shadow-accent-info/50";
      case "Resolved":
        return "bg-accent-success shadow-accent-success/50";
      default:
        return "bg-zinc-600 shadow-zinc-600/50";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[80] backdrop-blur-xs"
            id="sidebar-backdrop"
          />

          {/* Citizen Slide-out Panel (Left) */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#0a0a0f] text-zinc-300 z-[90] flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.85)] border-r border-zinc-900 overflow-hidden"
            id="sidebar-container"
          >
            {/* Header: App Name & Close Icon */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
              <div className="flex items-center">
                <span className="text-lg font-black font-display tracking-tight text-white uppercase">CityFix</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-zinc-500 hover:text-white transition-colors cursor-pointer rounded-sm hover:bg-zinc-900"
                id="sidebar-close-btn"
                title="Collapse Menu"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Navigation / Content Area */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
              {/* Primary Actions Group */}
              <div className="space-y-1.5">
                {/* 1. Report New Issue */}
                <button
                  onClick={() => {
                    onNavigate("report");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-sm transition-all font-display font-black uppercase text-xs tracking-wider cursor-pointer ${
                    activeTab === "report"
                      ? "bg-accent-alert text-white shadow-md shadow-accent-alert/30"
                      : "bg-accent-alert/10 border border-accent-alert/20 text-accent-alert hover:bg-accent-alert/20"
                  }`}
                  id="nav-report-new"
                >
                  <Plus className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                  <span>Report New Issue</span>
                </button>

                {/* 2. My Reports */}
                <button
                  onClick={() => {
                    onNavigate("my-reports", "mine");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm transition-all text-xs font-semibold cursor-pointer ${
                    activeTab === "my-reports" && feedFilter === "mine"
                      ? "bg-zinc-900 text-accent-info"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/45"
                  }`}
                  id="nav-my-reports"
                >
                  <FolderHeart className={`w-4 h-4 shrink-0 stroke-[1.8px] ${activeTab === "my-reports" && feedFilter === "mine" ? "text-accent-info" : "text-zinc-500"}`} />
                  <span>My Reports</span>
                </button>

                {/* 3. District Feed */}
                <button
                  onClick={() => {
                    onNavigate("my-reports", "all");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm transition-all text-xs font-semibold cursor-pointer ${
                    activeTab === "my-reports" && feedFilter === "all"
                      ? "bg-zinc-900 text-accent-info"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/45"
                  }`}
                  id="nav-district-feed"
                >
                  <Globe className={`w-4 h-4 shrink-0 stroke-[1.8px] ${activeTab === "my-reports" && feedFilter === "all" ? "text-accent-info" : "text-zinc-500"}`} />
                  <span>District Feed</span>
                </button>

                {/* 4. Leaderboard */}
                <button
                  onClick={() => {
                    onNavigate("gamification");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm transition-all text-xs font-semibold cursor-pointer ${
                    activeTab === "gamification"
                      ? "bg-zinc-900 text-accent-info"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/45"
                  }`}
                  id="nav-leaderboard"
                >
                  <Trophy className={`w-4 h-4 shrink-0 stroke-[1.8px] ${activeTab === "gamification" ? "text-accent-info" : "text-zinc-500"}`} />
                  <span>Leaderboard</span>
                </button>
              </div>

              {/* Thin Section Divider */}
              <hr className="border-zinc-900" />

              {/* Recent Activity Section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-text-muted tracking-wider uppercase px-2.5 font-mono">
                  Recent Activity
                </label>

                {!currentUser ? (
                  <div className="px-3.5 py-2 rounded-sm bg-zinc-950/20 border border-dashed border-zinc-900 text-center">
                    <p className="text-[10px] text-text-muted italic">Sign in to see your recent activity</p>
                  </div>
                ) : recentReports.length === 0 ? (
                  <div className="px-3.5 py-2 rounded-sm bg-zinc-950/20 border border-dashed border-zinc-900 text-center">
                    <p className="text-[10px] text-text-muted italic">No recent reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-1" id="recent-activity-list">
                    {recentReports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => {
                          onNavigate("my-reports", currentUser ? "mine" : "all");
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-sm hover:bg-zinc-900/45 text-left text-xs transition-colors cursor-pointer group"
                        title={report.description}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                          <span className="truncate text-zinc-400 group-hover:text-zinc-200 font-medium">
                            {formatCategory(report.category)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pl-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(report.status)} shadow-[0_0_6px_rgba(0,0,0,0.5)]`} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom-pinned Account Row */}
            <div className="shrink-0 p-4 border-t border-zinc-900 bg-[#070707] flex items-center justify-between">
              {currentUser ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-zinc-900/60 transition-colors text-left cursor-pointer group"
                  id="sidebar-account-row"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-850 text-white font-black flex items-center justify-center text-xs shadow-sm border border-zinc-800 shrink-0">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.name || ""} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(currentUser.name, currentUser.email)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {currentUser.name || currentUser.email.split("@")[0]}
                      </p>
                      <p className="text-[10px] text-text-muted font-medium truncate mt-0.5 leading-none font-mono uppercase tracking-wider">
                        Active Profile
                      </p>
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-sm hover:bg-zinc-900/60 transition-colors text-left cursor-pointer group"
                  id="sidebar-signin-row"
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white leading-tight">Sign In</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5 leading-none">Access system settings</p>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideBar;
