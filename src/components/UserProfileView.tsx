import React, { useMemo } from "react";
import { 
  ChevronRight, 
  Shield, 
  Crown, 
  Medal, 
  Award, 
  Flame, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Building, 
  AlertTriangle,
  MapPin,
  Tag
} from "lucide-react";
import { motion } from "motion/react";
import { getInitials } from "../utils";

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  reports: any[];
  dbUsers: any[];
  leaderboardTab?: "nearby" | "district";
  nearbyLeaderboard?: any[];
  districtLeaderboard?: any[];
}

export default function UserProfileView({ 
  userId, 
  onBack, 
  reports, 
  dbUsers,
  leaderboardTab,
  nearbyLeaderboard,
  districtLeaderboard
}: UserProfileViewProps) {
  // Find the user details
  const user = useMemo(() => {
    // 1. First look in the active leaderboard list for real-time points/data!
    const activeList = leaderboardTab === "district" ? districtLeaderboard : nearbyLeaderboard;
    if (activeList) {
      const foundInLeaderboard = activeList.find(u => u.id === userId);
      if (foundInLeaderboard) return foundInLeaderboard;
    }

    // 2. Then look in dbUsers
    const found = dbUsers.find(u => u.id === userId);
    if (found) return found;

    // 3. Fallback to default users if not fetched yet
    const defaults = [
      { id: "USR-alex", name: "Alex Mercer", points: 1820, badges: ["First Resp", "Civic Vett", "Fix Hero"] },
      { id: "USR-satoshi", name: "Satoshi K.", points: 1250, badges: ["Civic Vett", "Overlord"] },
      { id: "USR-jane", name: "Jane Doe", points: 380, badges: ["First Resp"] }
    ];
    return defaults.find(u => u.id === userId) || { id: userId, name: "Civic Resident", points: 0, badges: ["First Resp"] };
  }, [userId, dbUsers, leaderboardTab, nearbyLeaderboard, districtLeaderboard]);

  const userEmail = useMemo(() => {
    const found = dbUsers.find(u => u.id === userId);
    return found?.email;
  }, [userId, dbUsers]);

  const { userLevel, userXP } = useMemo(() => {
    const totalPoints = user.points ?? 0;
    const level = Math.floor(totalPoints / 500) + 1;
    const xp = totalPoints % 500;
    return { userLevel: level, userXP: xp };
  }, [user.points]);

  // Calculate sorted leaderboard positions to find exact current rank!
  const rank = useMemo(() => {
    const activeList = leaderboardTab === "district" ? districtLeaderboard : nearbyLeaderboard;
    if (activeList && activeList.length > 0) {
      const index = activeList.findIndex(u => u.id === userId);
      return index !== -1 ? index + 1 : activeList.length + 1;
    }

    const list = [...dbUsers];
    // Include defaults if dbUsers is empty
    if (list.length === 0) {
      list.push(
        { id: "USR-alex", name: "Alex Mercer", points: 1820, badges: ["First Resp", "Civic Vett", "Fix Hero"], createdAt: "2026-06-25T07:02:45.542Z" },
        { id: "USR-satoshi", name: "Satoshi K.", points: 1250, badges: ["Civic Vett", "Overlord"], createdAt: "2026-06-25T07:02:45.543Z" },
        { id: "USR-jane", name: "Jane Doe", points: 380, badges: ["First Resp"], createdAt: "2026-06-25T07:02:45.544Z" }
      );
    }
    
    // Filter out test/demo accounts
    const filtered = list.filter(u => {
      const nameLower = (u.name || "").toLowerCase();
      const emailLower = (u.email || "").toLowerCase();
      return !(
        u.id === "USR-11111111111" ||
        nameLower.includes("test") ||
        nameLower.includes("demo") ||
        emailLower.includes("test@") ||
        emailLower.includes("demo@")
      );
    });

    const sorted = filtered.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // TIEBREAKER: Rank ties by earliest account creation date
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    const index = sorted.findIndex(u => u.id === userId);
    return index !== -1 ? index + 1 : sorted.length + 1;
  }, [userId, dbUsers, leaderboardTab, nearbyLeaderboard, districtLeaderboard]);

  const rankingLabel = useMemo(() => {
    if (leaderboardTab === "nearby") return "Nearby Ranking";
    if (leaderboardTab === "district") return "District Ranking";
    return "City Ranking";
  }, [leaderboardTab]);

  // Filter reported issues for this user
  const userReports = useMemo(() => {
    const email = userEmail || user.email;
    return reports.filter(r => r.userId === userId || (email && r.userEmail?.toLowerCase() === email.toLowerCase()));
  }, [userId, userEmail, user.email, reports]);

  const initials = useMemo(() => {
    return getInitials(user.name, userEmail || user.email);
  }, [user.name, userEmail, user.email]);

  // Format badges with metadata (icon, colors, descriptions)
  const badgeDetails = useMemo(() => {
    const list = user.badges || ["First Resp"];
    return list.map((badgeName: string) => {
      switch (badgeName) {
        case "First Resp":
          return {
            name: "First Responder",
            desc: "Submitted your first civic infrastructure report.",
            color: "from-accent-info/10 to-accent-info/5 border-accent-info/20 text-accent-info",
            icon: Shield
          };
        case "Civic Vett":
          return {
            name: "Civic Veteran",
            desc: "Submissions resolved by dispatch teams.",
            color: "from-accent-success/10 to-accent-success/5 border-accent-success/20 text-accent-success",
            icon: Award
          };
        case "Fix Hero":
          return {
            name: "Fix Hero",
            desc: "Contributed over 1,000 repair points.",
            color: "from-accent-alert/10 to-accent-alert/5 border-accent-alert/20 text-accent-alert",
            icon: Flame
          };
        case "Overlord":
          return {
            name: "City Fixer #1",
            desc: "Held the coveted #1 spot on the city leaderboard.",
            color: "from-accent-alert/15 to-accent-alert/5 border-accent-alert/30 text-accent-alert",
            icon: Crown
          };
        default:
          return {
            name: badgeName,
            desc: "Earned for ongoing civic feedback efforts.",
            color: "from-zinc-800/20 to-zinc-900/10 border-zinc-800 text-text-muted",
            icon: Medal
          };
      }
    });
  }, [user.badges]);

  // Rank Styling
  let rankColorClass = "text-text-muted";
  let gradientRingClass = "bg-zinc-800";
  let rankTitle = "Civic Cadet";

  if (rank === 1) {
    rankColorClass = "text-accent-alert font-bold";
    gradientRingClass = "bg-gradient-to-tr from-accent-alert/60 via-accent-alert to-accent-alert/90";
    rankTitle = "Chief Infrastructure Warden";
  } else if (rank === 2) {
    rankColorClass = "text-accent-info font-bold";
    gradientRingClass = "bg-gradient-to-tr from-accent-info/60 via-accent-info to-accent-info/90";
    rankTitle = "Senior Deputy Dispatcher";
  } else if (rank === 3) {
    rankColorClass = "text-accent-alert/70 font-bold";
    gradientRingClass = "bg-gradient-to-tr from-accent-alert/30 via-accent-alert/70 to-accent-alert/50";
    rankTitle = "Active Lead Patrol";
  } else if (user.points > 500) {
    rankTitle = "Veteran Inspector";
  }

  // Get status color styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending Approval":
        return "bg-accent-alert/10 text-accent-alert border-accent-alert/20";
      case "Submitted":
        return "bg-accent-info/10 text-accent-info border-accent-info/20";
      case "Verified":
        return "bg-accent-info/10 text-accent-info border-accent-info/20";
      case "In Review":
        return "bg-accent-info/10 text-accent-info border-accent-info/20";
      case "Scheduled for Repair":
        return "bg-accent-info/15 text-accent-info border-accent-info/30";
      case "Resolved":
        return "bg-accent-success text-white border-accent-success/20 font-bold";
      default:
        return "bg-zinc-900 text-text-muted border-zinc-800/40";
    }
  };

  // Helper to get formatted date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Just now";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      key="user-profile-page"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-5 pb-10"
      id={`user-profile-view-${userId}`}
    >
      {/* Navigation Header */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-accent-alert hover:text-accent-alert/90 hover:underline cursor-pointer group uppercase tracking-wider font-mono"
          id="back-to-leaderboard-btn"
        >
          <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5 text-accent-alert" />
          Back to Leaderboard
        </button>
      </div>

      {/* Main Profile Info Banner */}
      <div className="bg-bg-card border border-zinc-850 rounded-sm p-5 shadow-sm text-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] dark:opacity-[0.04]">
          <Building className="w-32 h-32" />
        </div>

        {/* Avatar Ring */}
        <div className="mx-auto w-20 h-20 rounded-full p-1 flex items-center justify-center bg-zinc-900 border border-zinc-850 mb-3.5 shadow-sm">
          <div className={`w-full h-full rounded-full p-[3px] ${gradientRingClass}`}>
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              <span className="text-xl font-bold font-mono text-text-primary">
                {initials}
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-base font-display font-black uppercase tracking-wider text-white">
          {user.name}
        </h2>
        <p className="text-[10px] text-accent-alert font-mono font-black tracking-widest uppercase mt-0.5">
          {rankTitle}
        </p>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-900">
          <div className="text-center">
            <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">
              {rankingLabel}
            </span>
            <span className={`block text-xl font-black font-mono mt-0.5 ${rankColorClass}`}>
              #{rank}
            </span>
          </div>
          <div className="text-center border-l border-zinc-900">
            <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest font-mono">
              Civic XP Points
            </span>
            <span className="block text-xl font-black font-mono text-white mt-0.5">
              {user.points.toLocaleString()} pt
            </span>
          </div>
        </div>

        {/* Level and XP Progress Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-900 text-left space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-text-muted font-bold uppercase tracking-wider">Level {userLevel} Progress</span>
            <span className="text-accent-info font-extrabold">{userXP} / 500 XP</span>
          </div>
          <div className="h-2 w-full bg-zinc-950 border border-zinc-900 rounded-sm overflow-hidden relative">
            <div 
              className="bg-accent-info h-full rounded-sm transition-all duration-300" 
              style={{ width: `${(userXP / 500) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Earned Badges Subsection */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1 font-mono">
          Earned Badges ({badgeDetails.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badgeDetails.map((badge, idx) => {
            const IconComponent = badge.icon;
            return (
              <div 
                key={idx}
                className={`bg-gradient-to-r ${badge.color} border border-zinc-805 p-3 rounded-sm flex items-start gap-2.5 transition-all hover:translate-y-[-1px] shadow-sm`}
                id={`badge-card-${idx}`}
              >
                <div className="p-1.5 rounded-sm bg-zinc-950/40 shadow-sm mt-0.5">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold tracking-tight uppercase font-mono">
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-text-muted leading-relaxed font-light">
                    {badge.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Civic Reports List Subsection */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1 font-mono">
          Issues Logged ({userReports.length})
        </h3>

        {userReports.length === 0 ? (
          <div className="bg-bg-card border border-dashed border-zinc-800 rounded-sm p-6 text-center text-text-muted" id="empty-issues-message">
            <Building className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
            <p className="text-xs font-medium font-mono uppercase tracking-wider">No civic reports filed yet</p>
            <p className="text-[10px] text-text-muted mt-1">Their verified repairs and alerts will populate here when dispatched.</p>
          </div>
        ) : (
          <div className="space-y-3" id="user-issues-list">
            {userReports.map((report) => (
              <div
                key={report.id}
                className="bg-bg-card border border-zinc-850 border-l-4 border-l-accent-alert rounded-sm p-4 shadow-sm space-y-3 hover:border-zinc-750 transition-colors"
                id={`user-report-card-${report.id}`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold text-text-muted uppercase border border-zinc-800">
                      {report.id.slice(0, 10)}
                    </span>
                    <h4 className="text-[12px] font-display font-black text-white uppercase tracking-wide">
                      {report.category.replace("_", " ")}
                    </h4>
                  </div>
                  
                  <span className={`text-[9px] font-black font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border shrink-0 ${getStatusStyle(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                  {report.description}
                </p>

                {/* Footer details row */}
                <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 border-t border-zinc-900">
                  <span className="flex items-center gap-1 max-w-[200px] truncate font-mono">
                    <MapPin className="w-3 h-3 text-text-muted flex-shrink-0" />
                    {report.address ? report.address.split(",")[0] : "Assigned Pin"}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0 font-mono">
                    <Calendar className="w-3 h-3 text-text-muted" />
                    {formatDate(report.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
