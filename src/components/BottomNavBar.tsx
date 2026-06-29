import React from "react";
import { 
  Home as HomeIcon, 
  List, 
  Camera, 
  Vote, 
  Shield 
} from "lucide-react";

interface BottomNavBarProps {
  activeTab: "home" | "report" | "my-reports" | "dashboard" | "gamification" | "settings";
  onTabChange: (tab: "home" | "report" | "my-reports" | "dashboard" | "gamification" | "settings") => void;
  badges?: {
    unreadFeedCount?: number;
    hasCivicPending?: boolean;
  };
  isAdmin?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  badges,
  isAdmin,
}) => {
  const unreadCount = badges?.unreadFeedCount ?? 0;
  const hasCivicPending = badges?.hasCivicPending ?? false;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-bg-card border-t border-zinc-800 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
      <div className="max-w-lg mx-auto grid grid-cols-5 h-16 relative items-center px-1">
        {/* Slot 1: Home */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 cursor-pointer ${
            activeTab === "home" ? "text-accent-alert font-extrabold" : "text-text-muted hover:text-text-primary"
          }`}
          id="nav-tab-home"
        >
          <HomeIcon className={`w-5 h-5 ${activeTab === "home" ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
          <span className="text-[9px] mt-1 tracking-wide font-black uppercase">Home</span>
        </button>

        {/* Slot 2: Feed */}
        <button
          onClick={() => onTabChange("my-reports")}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 relative cursor-pointer ${
            activeTab === "my-reports" ? "text-accent-alert font-extrabold" : "text-text-muted hover:text-text-primary"
          }`}
          id="nav-tab-my-reports"
        >
          <span className="relative">
            <List className={`w-5 h-5 ${activeTab === "my-reports" ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-accent-alert text-white text-[8px] font-black h-3.5 min-w-[14px] px-1 rounded-sm flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </span>
          <span className="text-[9px] mt-1 tracking-wide font-black uppercase">Feed</span>
        </button>

        {/* Slot 3: Report (Raised camera button) */}
        <div className="flex flex-col items-center justify-center h-full relative">
          <button
            onClick={() => onTabChange("report")}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-[0_0_20px_rgba(255,59,48,0.4)] transition-all duration-300 absolute -top-3.5 cursor-pointer border-2 border-accent-alert ${
              activeTab === "report" 
                ? "bg-text-primary text-bg-primary scale-105" 
                : "bg-accent-alert text-white hover:bg-accent-alert/80 hover:shadow-[0_0_25px_rgba(255,59,48,0.6)] hover:-translate-y-0.5 active:scale-95"
            }`}
            id="nav-tab-report"
            title="Report Civic Issue"
          >
            <Camera className="w-5 h-5 stroke-[2.5px]" />
          </button>
          <span className={`text-[9px] tracking-wide mt-7 font-black uppercase transition-all duration-200 ${
            activeTab === "report" ? "text-accent-alert" : "text-text-muted"
          }`}>
            Report
          </span>
        </div>

        {/* Slot 4: Polls / Admin */}
        <button
          onClick={() => onTabChange("dashboard")}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 cursor-pointer ${
            activeTab === "dashboard" ? "text-accent-alert font-extrabold" : "text-text-muted hover:text-text-primary"
          }`}
          id="nav-tab-dashboard"
        >
          {isAdmin ? (
            <Shield className={`w-5 h-5 ${activeTab === "dashboard" ? "stroke-[2.5px] text-red-500 animate-pulse" : "stroke-[1.8px]"}`} />
          ) : (
            <Vote className={`w-5 h-5 ${activeTab === "dashboard" ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
          )}
          <span className="text-[9px] mt-1 tracking-wide font-black uppercase">
            {isAdmin ? "Admin" : "Polls"}
          </span>
        </button>

        {/* Slot 5: Civic */}
        <button
          onClick={() => onTabChange("gamification")}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 relative cursor-pointer ${
            activeTab === "gamification" ? "text-accent-alert font-extrabold" : "text-text-muted hover:text-text-primary"
          }`}
          id="nav-tab-gamification"
        >
          <span className="relative">
            <Shield className={`w-5 h-5 ${activeTab === "gamification" ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
            {hasCivicPending && (
              <span className="absolute top-0 right-0 bg-accent-alert w-2 h-2 rounded-full border border-bg-primary animate-ping" />
            )}
          </span>
          <span className="text-[9px] mt-1 tracking-wide font-black uppercase">Civic</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
