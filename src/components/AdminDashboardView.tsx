import React, { useState, useEffect } from "react";
import { 
  Shield, 
  User as UserIcon, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Award, 
  Activity, 
  FileText, 
  Navigation, 
  Compass, 
  Clock, 
  Lock, 
  Key, 
  RefreshCw, 
  Search, 
  Vote, 
  Flame, 
  Tv, 
  Heart,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Layers,
  Map,
  Sparkles,
  Info
} from "lucide-react";

interface UserReport {
  id: string;
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  category: string;
  confidence: number;
  status: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note: string;
  }>;
}

interface VouchRecord {
  reportId: string;
  reportTitle: string;
  reportUserId?: string;
  reportUserName?: string;
  voucherId?: string;
  voucherName?: string;
}

interface FlagRecord {
  reportId: string;
  reportTitle: string;
  reportUserId?: string;
  reportUserName?: string;
  flaggerId?: string;
  flaggerName?: string;
}

interface PollRecord {
  reportId: string;
  reportTitle: string;
  nominatedAt?: string;
  nominatedByUserId?: string;
}

interface QuestProgressDetail {
  progress: number;
  complete: boolean;
}

interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  photoURL: string;
  createdAt: string;
  savedLocation: {
    address: string;
    lat: number;
    lng: number;
  } | null;
  liveLocation: {
    lat: number;
    lng: number;
    updatedAt: string;
  } | null;
  loginMethod: string;
  tokens: string[];
  reports: UserReport[];
  vouchRecords: {
    given: VouchRecord[];
    received: VouchRecord[];
  };
  spamFlagRecords: {
    given: FlagRecord[];
    received: FlagRecord[];
  };
  pollRecords: {
    nominations: PollRecord[];
    votes: PollRecord[];
  };
  points: number;
  badges: string[];
  questProgress: {
    quest1: QuestProgressDetail;
    quest2: QuestProgressDetail;
    quest3: QuestProgressDetail;
  };
}

interface AdminDashboardViewProps {
  token: string;
  onLogout: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ token, onLogout }) => {
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "location" | "reports" | "gamification" | "interactions" | "auth">("profile");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/all-users-details", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch admin raw user profiles: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data);
      
      // Keep selected user updated if already selected
      if (selectedUser) {
        const updated = data.find((u: AdminUserDetail) => u.id === selectedUser.id);
        if (updated) {
          setSelectedUser(updated);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse admin raw user payload");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const getDistrictFromAddress = (addressStr: string | null | undefined): string => {
    if (!addressStr) return "N/A";
    const addressLower = addressStr.toLowerCase();
    if (addressLower.includes("mission district") || addressLower.includes("mission dolores") || addressLower.includes("dolores")) {
      return "Mission District (SF Ward 9)";
    }
    if (addressLower.includes("soma") || addressLower.includes("south of market") || addressLower.includes("guerrero") || addressLower.includes("11th street")) {
      return "SOMA District (SF Ward 6)";
    }
    if (addressLower.includes("tenderloin") || addressLower.includes("civic center") || addressLower.includes("union square") || addressLower.includes("market street")) {
      return "Civic Center / Downtown (SF Ward 6)";
    }
    if (addressLower.includes("haight-ashbury") || addressLower.includes("haight")) {
      return "Haight-Ashbury (SF Ward 5)";
    }
    if (addressLower.includes("chinatown")) {
      return "Chinatown (SF Ward 3)";
    }
    if (addressLower.includes("castro")) {
      return "The Castro (SF Ward 8)";
    }
    if (addressLower.includes("nob hill")) {
      return "Nob Hill (SF Ward 3)";
    }
    if (addressLower.includes("marina")) {
      return "Marina District (SF Ward 2)";
    }
    if (addressLower.includes("richmond")) {
      return "Richmond District (SF Ward 1)";
    }
    if (addressLower.includes("sunset")) {
      return "Sunset District (SF Ward 4)";
    }

    const parts = addressStr.split(",").map(p => p.trim());
    for (const p of parts) {
      const pLower = p.toLowerCase();
      if (pLower.includes("ward") || pLower.includes("district") || pLower.includes("neighborhood") || pLower.includes("suburb")) {
        return p;
      }
    }
    return "San Francisco (General Ward)";
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white animate-fadeIn font-sans pb-12">
      {/* Admin Panel Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-900 border-b border-zinc-800 p-4 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-red-600 text-white font-extrabold px-2.5 py-1 rounded text-xs uppercase tracking-widest animate-pulse flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Admin</span>
          </div>
          <div>
            <h1 className="text-sm font-bold font-mono tracking-tight uppercase">System Control Center</h1>
            <p className="text-[10px] text-zinc-400 font-mono">Live database administration & multi-agent telemetry</p>
          </div>
        </div>

        <button 
          onClick={fetchUsers}
          disabled={isLoading}
          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all text-zinc-300 hover:text-white"
          title="Refresh User List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-500" : ""}`} />
        </button>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading comprehensive database user index...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <h3 className="text-sm font-bold uppercase font-mono text-red-400">Telemetry Sync Failed</h3>
          <p className="text-xs text-zinc-400 max-w-xs">{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-4 rounded transition-all active:scale-95"
          >
            Retry Verification
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Workspace */}
          {selectedUser ? (
            /* USER EXPANDED DETAIL VIEW */
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900/60 animate-fadeIn">
              {/* Profile Selection Bar */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold uppercase"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to List</span>
                </button>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="truncate flex-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500">Selected Telemetry</span>
                  <p className="text-xs font-bold truncate text-white">{selectedUser.name}</p>
                </div>
              </div>

              {/* Sub tabs selector */}
              <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950 text-xs shrink-0 no-scrollbar">
                {(["profile", "location", "reports", "gamification", "interactions", "auth"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-4 py-2.5 font-bold uppercase font-mono border-b-2 text-[10px] shrink-0 transition-all ${
                      activeSubTab === tab
                        ? "border-red-500 text-white bg-zinc-900"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Detail scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. PROFILE SUBTAB */}
                {activeSubTab === "profile" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded flex items-center gap-4">
                      <img 
                        src={selectedUser.photoURL} 
                        alt={selectedUser.name} 
                        className="w-16 h-16 rounded border-2 border-red-500/20 bg-zinc-900 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 truncate">
                        <h2 className="text-sm font-bold text-white">{selectedUser.name}</h2>
                        <p className="text-xs text-zinc-400 truncate">{selectedUser.email}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3 font-mono text-xs">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-zinc-400" />
                        <span>Security & Access Credentials</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900 p-2 rounded">
                          <span className="text-[9px] text-zinc-500 block uppercase">User GUID</span>
                          <span className="text-[10px] font-bold text-zinc-300 select-all block truncate">{selectedUser.id}</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded">
                          <span className="text-[9px] text-zinc-500 block uppercase">Login Method</span>
                          <span className="text-[10px] font-bold text-zinc-300 block uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {selectedUser.loginMethod}
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900 p-2 rounded.5">
                        <span className="text-[9px] text-zinc-500 block uppercase">Registration Timestamp</span>
                        <span className="text-[10px] text-zinc-300">{selectedUser.createdAt}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LOCATION SUBTAB */}
                {activeSubTab === "location" && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Live GPS location */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3 font-mono text-xs">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-zinc-400" />
                        <span>Live GPS Coordinates (Satellite Telemetry)</span>
                      </h3>
                      
                      {selectedUser.liveLocation ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-zinc-900 p-2.5 rounded">
                              <span className="text-[9px] text-zinc-500 block uppercase">Latitude</span>
                              <span className="text-xs font-bold text-emerald-400">{selectedUser.liveLocation.lat.toFixed(6)}</span>
                            </div>
                            <div className="bg-zinc-900 p-2.5 rounded">
                              <span className="text-[9px] text-zinc-500 block uppercase">Longitude</span>
                              <span className="text-xs font-bold text-emerald-400">{selectedUser.liveLocation.lng.toFixed(6)}</span>
                            </div>
                          </div>
                          <div className="bg-zinc-900 p-2 rounded text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Telemetry updated at: {new Date(selectedUser.liveLocation.updatedAt).toLocaleString()}</span>
                          </div>
                          
                          {/* Mini visual map tracker coordinates */}
                          <div className="h-28 bg-zinc-900 rounded border border-zinc-800 relative overflow-hidden flex items-center justify-center text-center">
                            <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                            <div className="z-10 text-center space-y-1">
                              <MapPin className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
                              <p className="text-[9px] text-zinc-500">MAPPED ACTIVE SAT-GRID NODE</p>
                              <p className="text-[10px] text-zinc-300">SF Grid: {selectedUser.liveLocation.lat.toFixed(4)}, {selectedUser.liveLocation.lng.toFixed(4)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 p-4 rounded text-center space-y-1">
                          <Navigation className="w-5 h-5 text-zinc-600 mx-auto animate-pulse" />
                          <p className="text-zinc-500 text-[11px]">No active GPS coordinates reported yet.</p>
                          <p className="text-[9px] text-zinc-600 uppercase">Awaits first live viewport mapping session</p>
                        </div>
                      )}
                    </div>

                    {/* Manually entered address */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3 font-mono text-xs">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <span>Registered Base Location & Ward</span>
                      </h3>

                      {selectedUser.savedLocation ? (
                        <div className="space-y-3">
                          <div className="bg-zinc-900 p-3 rounded space-y-1.5">
                            <span className="text-[9px] text-zinc-500 block uppercase">Manually Entered Address</span>
                            <span className="text-[11px] text-zinc-200 block leading-relaxed">{selectedUser.savedLocation.address}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-zinc-900 p-2.5 rounded">
                              <span className="text-[9px] text-zinc-500 block uppercase">Assigned District / Ward</span>
                              <span className="text-[10px] font-bold text-red-400 block mt-0.5">
                                {getDistrictFromAddress(selectedUser.savedLocation.address)}
                              </span>
                            </div>
                            <div className="bg-zinc-900 p-2.5 rounded">
                              <span className="text-[9px] text-zinc-500 block uppercase">Registered Lat/Lng</span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                                {selectedUser.savedLocation.lat.toFixed(5)}, {selectedUser.savedLocation.lng.toFixed(5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 p-4 rounded text-center space-y-1">
                          <MapPin className="w-5 h-5 text-zinc-600 mx-auto" />
                          <p className="text-zinc-500 text-[11px]">No saved base location configured.</p>
                          <p className="text-[9px] text-zinc-600 uppercase">Awaits manual profile address settings save</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. REPORTS SUBTAB */}
                {activeSubTab === "reports" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-400 uppercase">Author Reports logged ({selectedUser.reports.length})</span>
                      <span className="text-red-400 font-bold uppercase">SF Telemetry DB</span>
                    </div>

                    {selectedUser.reports.length === 0 ? (
                      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded text-center text-zinc-500 font-mono text-xs">
                        <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-1.5" />
                        No reports filed by this user yet.
                      </div>
                    ) : (
                      selectedUser.reports.map((report) => (
                        <div key={report.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded space-y-3 font-mono text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-white leading-tight">{report.title}</h4>
                              <p className="text-[9px] text-zinc-500 uppercase">{report.id} • {report.category.replace("_", " ")}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              report.status === "Resolved"
                                ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                                : report.status === "In Review"
                                ? "bg-blue-950 border border-blue-800 text-blue-400"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                            }`}>
                              {report.status}
                            </span>
                          </div>

                          <p className="text-zinc-300 font-sans text-[11px] leading-relaxed bg-zinc-900/60 p-2 rounded border border-zinc-900">
                            {report.description}
                          </p>

                          {/* Location Detail */}
                          <div className="flex items-center gap-1 text-[9px] text-zinc-400">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Coordinates: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                          </div>

                          {/* Image List */}
                          {report.images && report.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {report.images.map((imgUrl, i) => (
                                <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 rounded overflow-hidden relative group">
                                  <img 
                                    src={imgUrl} 
                                    alt="Report file" 
                                    className="object-cover w-full h-full"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* AI confidence block */}
                          <div className="flex items-center justify-between text-[9px] p-1.5 rounded bg-zinc-900/50 border border-zinc-900 font-mono">
                            <span className="text-zinc-500 uppercase">AI Confidence Score</span>
                            <span className={`font-bold uppercase ${report.confidence >= 0.85 ? "text-emerald-400" : "text-amber-400"}`}>
                              {(report.confidence * 100).toFixed(1)}% Secure Match
                            </span>
                          </div>

                          {/* Full Report Timeline */}
                          <div className="space-y-1.5 border-t border-zinc-900 pt-2.5">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Log Dispatch Timeline</span>
                            <div className="space-y-2 pl-1.5 border-l border-zinc-800">
                              {report.timeline && report.timeline.length > 0 ? (
                                report.timeline.map((event, i) => (
                                  <div key={i} className="relative text-[10px]">
                                    <div className="absolute -left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-zinc-300 uppercase">{event.status}</span>
                                      <span className="text-[8px] text-zinc-500">{new Date(event.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-zinc-400 font-sans mt-0.5 leading-relaxed">{event.note}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-zinc-600">No events logged on dispatch timeline.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. GAMIFICATION SUBTAB */}
                {activeSubTab === "gamification" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded grid grid-cols-2 gap-4 font-mono text-center">
                      <div className="bg-zinc-900 p-3 rounded">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Citizen Rank Points</span>
                        <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1 mt-1">
                          <Flame className="w-6 h-6 text-amber-500 shrink-0" />
                          {selectedUser.points} <span className="text-xs text-zinc-500">XP</span>
                        </span>
                      </div>
                      <div className="bg-zinc-900 p-3 rounded">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Acquired Badges</span>
                        <span className="text-2xl font-black text-red-400 flex items-center justify-center gap-1 mt-1">
                          <Award className="w-6 h-6 text-red-500 shrink-0" />
                          {selectedUser.badges.length}
                        </span>
                      </div>
                    </div>

                    {/* Badges details */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3 font-mono text-xs">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-zinc-400" />
                        <span>Unlocked Achievements</span>
                      </h3>
                      {selectedUser.badges.length === 0 ? (
                        <p className="text-zinc-500 text-center py-2">No citizen achievements unlocked.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.badges.map((badge, idx) => (
                            <span 
                              key={idx}
                              className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-amber-400 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quest Progress logs */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3 font-mono text-xs">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <span>Weekly Challenger Quest Progress</span>
                      </h3>

                      <div className="space-y-3">
                        {/* Quest 1 */}
                        <div className="bg-zinc-900 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">Quest 1: Citizen Report Initiative</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              selectedUser.questProgress.quest1.complete ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                            }`}>
                              {selectedUser.questProgress.quest1.complete ? "Complete" : "In Progress"}
                            </span>
                          </div>
                          <div className="h-1.5 bg-zinc-950 rounded overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (selectedUser.questProgress.quest1.progress / 1) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 block">Filer logs: {selectedUser.questProgress.quest1.progress} / 1 reports logged this week</span>
                        </div>

                        {/* Quest 2 */}
                        <div className="bg-zinc-900 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">Quest 2: Dispatch Vouch Endorsement</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              selectedUser.questProgress.quest2.complete ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                            }`}>
                              {selectedUser.questProgress.quest2.complete ? "Complete" : "In Progress"}
                            </span>
                          </div>
                          <div className="h-1.5 bg-zinc-950 rounded overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (selectedUser.questProgress.quest2.progress / 3) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 block">Vouch logs: {selectedUser.questProgress.quest2.progress} / 3 vouches endorsed this week</span>
                        </div>

                        {/* Quest 3 */}
                        <div className="bg-zinc-900 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">Quest 3: Infrastructure Maintenance</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              selectedUser.questProgress.quest3.complete ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                            }`}>
                              {selectedUser.questProgress.quest3.complete ? "Complete" : "In Progress"}
                            </span>
                          </div>
                          <div className="h-1.5 bg-zinc-950 rounded overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (selectedUser.questProgress.quest3.progress / 1) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-zinc-500 block">Target category: pothole or garbage issues solved ({selectedUser.questProgress.quest3.progress}/1)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. INTERACTIONS SUBTAB */}
                {activeSubTab === "interactions" && (
                  <div className="space-y-4 animate-fadeIn font-mono text-xs">
                    {/* Vouch logs */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-zinc-400" />
                        <span>Vouch & Endorsement Records</span>
                      </h3>

                      <div className="space-y-3">
                        {/* Given */}
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Vouches Given ({selectedUser.vouchRecords.given.length})</span>
                          {selectedUser.vouchRecords.given.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No vouches cast yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.vouchRecords.given.map((v, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-zinc-300 truncate font-semibold pr-2">{v.reportTitle}</span>
                                  <span className="text-[8px] text-zinc-500 uppercase font-mono shrink-0">By: {v.reportUserName || "Anonymous"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Received */}
                        <div className="border-t border-zinc-900 pt-2.5">
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Vouches Received ({selectedUser.vouchRecords.received.length})</span>
                          {selectedUser.vouchRecords.received.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No received vouches yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.vouchRecords.received.map((v, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-zinc-300 truncate font-semibold pr-2">{v.reportTitle}</span>
                                  <span className="text-[8px] text-emerald-400 uppercase font-mono shrink-0">From: {v.voucherName || "Anonymous"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spam Flags */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-zinc-400" />
                        <span>Spam / Verification Flags</span>
                      </h3>

                      <div className="space-y-3">
                        {/* Given */}
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Flags Submitted ({selectedUser.spamFlagRecords.given.length})</span>
                          {selectedUser.spamFlagRecords.given.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No moderation flags submitted.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.spamFlagRecords.given.map((f, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-zinc-300 truncate pr-2">{f.reportTitle}</span>
                                  <span className="text-[8px] text-zinc-500 uppercase font-mono shrink-0">Filer: {f.reportUserName || "Anonymous"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Received */}
                        <div className="border-t border-zinc-900 pt-2.5">
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Flags Received on User's Reports ({selectedUser.spamFlagRecords.received.length})</span>
                          {selectedUser.spamFlagRecords.received.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No verification warnings reported.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.spamFlagRecords.received.map((f, i) => (
                                <div key={i} className="bg-red-950/20 border border-red-900/30 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-red-300 truncate pr-2 font-bold">{f.reportTitle}</span>
                                  <span className="text-[8px] text-red-400 uppercase font-mono shrink-0 font-bold">Flagger ID: {f.flaggerId}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Poll Nominations & Votes */}
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Vote className="w-4 h-4 text-zinc-400" />
                        <span>Poll Nominations & Votes Cast</span>
                      </h3>

                      <div className="space-y-3">
                        {/* Nominations */}
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Nominations Created ({selectedUser.pollRecords.nominations.length})</span>
                          {selectedUser.pollRecords.nominations.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No reports nominated for council review yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.pollRecords.nominations.map((n, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-zinc-300 truncate pr-2 font-semibold">{n.reportTitle}</span>
                                  <span className="text-[8px] text-zinc-500 shrink-0">{n.nominatedAt ? new Date(n.nominatedAt).toLocaleDateString() : ""}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Votes */}
                        <div className="border-t border-zinc-900 pt-2.5">
                          <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider mb-1.5">Poll Votes Cast ({selectedUser.pollRecords.votes.length})</span>
                          {selectedUser.pollRecords.votes.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No votes submitted in any council ballots.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedUser.pollRecords.votes.map((v, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded text-[10px] flex items-center justify-between">
                                  <span className="text-zinc-300 truncate pr-2">{v.reportTitle}</span>
                                  <span className="text-[8px] text-zinc-500 shrink-0 font-bold uppercase">Ballot Endorsed</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. AUTH & TOKENS SUBTAB */}
                {activeSubTab === "auth" && (
                  <div className="space-y-4 animate-fadeIn font-mono text-xs">
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded space-y-3">
                      <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider pb-1.5 border-b border-zinc-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-zinc-400" />
                        <span>Active Session Authentication Tokens ({selectedUser.tokens.length})</span>
                      </h3>
                      
                      {selectedUser.tokens.length === 0 ? (
                        <p className="text-zinc-500 text-[10px]">No active authenticated sessions detected on server nodes.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[9px] text-zinc-500 leading-relaxed uppercase">
                            These JWT/Access signature tokens are cached in server-side session memory maps for instant API routing authorizations.
                          </p>
                          <div className="space-y-1.5">
                            {selectedUser.tokens.map((tok, i) => (
                              <div key={i} className="bg-zinc-900 p-2.5 rounded border border-zinc-800 select-all font-mono text-[9px] break-all text-red-400">
                                {tok}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* USER DIRECTORY LIST VIEW (SEARCHABLE) */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Directory search control */}
              <div className="p-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by Name, Email, or GUID..."
                    className="w-full bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-2 text-xs rounded text-white outline-none focus:ring-1 focus:ring-red-600 tracking-tight font-mono"
                  />
                </div>
              </div>

              {/* User rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                    No registered matching users found in DB.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setActiveSubTab("profile");
                      }}
                      className="w-full p-3.5 bg-zinc-950 hover:bg-zinc-900/60 text-left flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <img 
                          src={user.photoURL} 
                          alt={user.name} 
                          className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-white truncate leading-tight">{user.name}</h3>
                            {(user.id === "J3mM82uxvxR1ZwhYH4aTL8DbD0v2" || user.id === "USR-1782557260903-153") && (
                              <span className="bg-red-950/40 border border-red-800/60 text-red-400 text-[8px] font-bold px-1 rounded uppercase tracking-wider shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
                          <span className="text-[9px] text-zinc-500 font-mono block">ID: {user.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 shrink-0 ml-3">
                        <div className="text-right">
                          <p className="font-bold text-amber-500">{user.points} XP</p>
                          <p className="text-[8px] text-zinc-500">{user.reports.length} Reports</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
