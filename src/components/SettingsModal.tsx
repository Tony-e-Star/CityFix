import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Bell, 
  Globe, 
  Wifi, 
  WifiOff, 
  Shield, 
  LogOut, 
  Check, 
  Sparkles, 
  Lock, 
  UserPlus, 
  ChevronDown, 
  ChevronUp,
  MapPin
} from "lucide-react";
import { getInitials } from "../utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { 
    id: string; 
    email: string; 
    name?: string; 
    photoURL?: string;
    savedLocation?: {
      address: string;
      lat: number;
      lng: number;
    };
  } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  language: "en" | "es" | "hi" | "tl";
  onLanguageChange: (lang: "en" | "es" | "hi" | "tl") => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profilePhoto: string;
  setProfilePhoto: (val: string) => void;
  profileUpdating: boolean;
  onUpdateProfile: () => Promise<void>;
  userLevel: number;
  onUpdateLocationClick: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenAuth,
  notifications,
  onMarkNotificationsRead,
  isOfflineMode,
  onToggleOffline,
  language,
  onLanguageChange,
  profileName,
  setProfileName,
  profilePhoto,
  setProfilePhoto,
  profileUpdating,
  onUpdateProfile,
  userLevel,
  onUpdateLocationClick,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSection = (section: string) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  const getTierBadge = () => {
    if (!currentUser) return "Guest Explorer";
    if (userLevel >= 10) return "Master Inspector";
    if (userLevel >= 5) return "Senior Dispatcher";
    return "Civic Responder";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[110] backdrop-blur-xs"
            id="settings-backdrop"
          />

          {/* Settings Panel Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 top-10 md:top-20 md:max-w-lg md:mx-auto md:rounded-t-3xl bg-bg-primary text-text-primary z-[120] flex flex-col shadow-2xl border-t border-zinc-900 overflow-hidden"
            id="settings-modal-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-950">
              <div>
                <h2 className="text-sm font-display font-black uppercase tracking-wider text-white">Settings</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Manage details, preferences, and offline status</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm hover:bg-zinc-900 text-text-muted hover:text-white transition-colors cursor-pointer"
                id="settings-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-[#0a0a0f]">
              {/* Top Card: Account Overview */}
              <div className="bg-bg-card rounded-sm p-4 border border-zinc-850/80 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                    {currentUser ? getInitials(currentUser.name, currentUser.email) : "G"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser ? currentUser.email : "Guest Session"}
                    </p>
                    <p className="text-[10px] text-text-muted font-medium mt-0.5 truncate font-mono uppercase">
                      {currentUser ? `User ID: ${currentUser.id.slice(0, 8)}...` : "Anonymous mode"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-mono font-black uppercase tracking-wider bg-accent-info/10 text-accent-info border border-accent-info/20">
                    <Sparkles className="w-3 h-3 text-accent-info shrink-0" />
                    {getTierBadge()}
                  </span>
                  {currentUser && (
                    <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider pr-1 font-mono">
                      Level {userLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Grouped list sections below */}
              <div className="space-y-2">
                {/* 1. Profile Section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => toggleSection("profile")}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/40 transition-colors text-left"
                    id="setting-profile-trigger"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-white">Citizen Profile Details</span>
                    </div>
                    {activeSection === "profile" ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSection === "profile" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-950/40 border-t border-zinc-900"
                      >
                        {currentUser ? (
                          <div className="p-4 space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-text-muted font-mono">Citizen Display Name</label>
                              <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Enter display name"
                                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-sm text-xs font-medium focus:ring-1 focus:ring-accent-alert outline-none text-white placeholder-zinc-700"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-text-muted font-mono">Profile Image URL</label>
                              <input
                                type="text"
                                value={profilePhoto}
                                onChange={(e) => setProfilePhoto(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-sm text-xs font-medium focus:ring-1 focus:ring-accent-alert outline-none text-white placeholder-zinc-700"
                              />
                            </div>
                            <button
                              onClick={onUpdateProfile}
                              disabled={profileUpdating}
                              className="w-full bg-accent-info hover:bg-accent-info/95 text-white text-xs font-display font-black uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all cursor-pointer disabled:opacity-50"
                              id="settings-profile-save"
                            >
                              {profileUpdating ? "Saving..." : "Save Profile Details"}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-text-muted mb-2">You are in anonymous mode.</p>
                            <button
                              onClick={() => {
                                onClose();
                                onOpenAuth();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-info hover:bg-accent-info/90 text-white text-xs font-bold rounded-sm transition-all cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5" /> Sign In with Google
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Saved Location Section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => toggleSection("location")}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/40 transition-colors text-left"
                    id="setting-location-trigger"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-white">Saved Home/Base Location</span>
                    </div>
                    {activeSection === "location" ? (
                      <ChevronUp className="w-4.5 h-4.5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSection === "location" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-950/40 border-t border-zinc-900"
                      >
                        <div className="p-4 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-text-muted font-mono block">Current Saved Address</label>
                            {currentUser?.savedLocation ? (
                              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-3 font-mono text-[11px] text-slate-300 leading-relaxed break-words flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-accent-alert shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-white break-words">{currentUser.savedLocation.address}</p>
                                  <p className="text-[10px] text-text-muted mt-1">Coordinates: {currentUser.savedLocation.lat.toFixed(5)}, {currentUser.savedLocation.lng.toFixed(5)}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 text-center">
                                <p className="text-xs text-text-muted font-mono">No base location configured yet.</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={onUpdateLocationClick}
                            className="w-full bg-accent-alert hover:bg-accent-alert/95 text-white text-xs font-display font-black uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            id="settings-location-update"
                          >
                            <MapPin className="w-4 h-4" />
                            {currentUser?.savedLocation ? "Change Saved Location" : "Configure Base Location"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Notifications Section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => toggleSection("notifications")}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/40 transition-colors text-left"
                    id="setting-notifications-trigger"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Bell className="w-4.5 h-4.5 text-text-muted shrink-0" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-alert rounded-full" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Live System Alerts {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                    </div>
                    {activeSection === "notifications" ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSection === "notifications" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-950/40 border-t border-zinc-900"
                      >
                        <div className="p-4 space-y-3">
                          {notifications.length > 0 && (
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                              <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider font-mono">Unread Alerts</span>
                              <button 
                                onClick={onMarkNotificationsRead}
                                className="text-[10px] text-accent-info hover:underline cursor-pointer font-bold"
                              >
                                Mark all as read
                              </button>
                            </div>
                          )}

                          {notifications.length === 0 ? (
                            <p className="text-[11px] text-text-muted py-3 text-center italic">No current notifications.</p>
                          ) : (
                            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                              {notifications.map((noti) => (
                                <div key={noti.id} className={`text-[11px] space-y-0.5 ${!noti.read ? "bg-accent-info/5 -mx-2 px-2 py-1 rounded-sm" : ""}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white">{noti.title}</span>
                                    <span className="text-[9px] text-text-muted font-mono shrink-0">{noti.time}</span>
                                  </div>
                                  <p className="text-text-muted leading-normal">{noti.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Language Selector Section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => toggleSection("language")}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/40 transition-colors text-left"
                    id="setting-language-trigger"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-white">Application Language</span>
                    </div>
                    {activeSection === "language" ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSection === "language" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-950/40 border-t border-zinc-900"
                      >
                        <div className="p-4 grid grid-cols-2 gap-2" id="settings-lang-selector-grid">
                          {(["en", "hi", "es", "tl"] as const).map((lang) => {
                            const labels: Record<string, string> = {
                              en: "English",
                              hi: "हिन्दी (Hindi)",
                              es: "Español",
                              tl: "Tagalog"
                            };
                            const active = language === lang;
                            return (
                              <button
                                key={lang}
                                onClick={() => onLanguageChange(lang)}
                                className={`py-2 px-3 rounded-sm text-xs font-bold border transition-all text-center flex items-center justify-between cursor-pointer ${
                                  active
                                    ? "bg-accent-alert/10 border-accent-alert text-accent-alert"
                                    : "bg-zinc-950 border-zinc-900 text-text-muted hover:text-white"
                                }`}
                              >
                                <span>{labels[lang]}</span>
                                {active && <Check className="w-3.5 h-3.5 text-accent-alert" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Online/Offline Status Section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 p-4 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-sm border ${
                      !isOfflineMode 
                        ? "bg-accent-info/10 text-accent-info border-accent-info/20" 
                        : "bg-zinc-900 text-text-muted border-zinc-800"
                    }`}>
                      {!isOfflineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Connection Mode</p>
                      <p className="text-[10px] text-text-muted">
                        {!isOfflineMode ? "Active Live Sync Mode" : "Offline Simulator Only"}
                      </p>
                    </div>
                  </div>

                  {/* iOS Style switch */}
                  <button
                    onClick={onToggleOffline}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      !isOfflineMode ? "bg-accent-alert" : "bg-zinc-800"
                    }`}
                    id="settings-online-toggle"
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-200 ${
                      !isOfflineMode ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* 5. Privacy section */}
                <div className="bg-bg-card rounded-sm border border-zinc-850/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => toggleSection("privacy")}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/40 transition-colors text-left"
                    id="setting-privacy-trigger"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-white">Data Privacy & Storage</span>
                    </div>
                    {activeSection === "privacy" ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeSection === "privacy" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-zinc-950/40 border-t border-zinc-900"
                      >
                        <div className="p-4 text-[11px] text-text-muted leading-relaxed font-light space-y-2">
                          <p>
                            CityFix takes data privacy seriously. All report pins, description tags, and photos uploaded are sandboxed and stored locally on your device's index database.
                          </p>
                          <p>
                            When online, dispatch tickets sync with a secure civic backplane. You can erase all cached local databases inside the main Preferences panel at any time.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Section: Log Out / Sign In, separate at the bottom */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900">
              {currentUser ? (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-display font-black uppercase tracking-wider bg-accent-alert/10 hover:bg-accent-alert text-accent-alert hover:text-white rounded-sm transition-all cursor-pointer border border-accent-alert/20 active:scale-95"
                  id="settings-signout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out Account
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-display font-black uppercase tracking-wider bg-accent-info hover:bg-accent-info/90 text-white rounded-sm transition-all cursor-pointer active:scale-95"
                  id="settings-login-btn"
                >
                  <User className="w-4 h-4" />
                  Sign In with Google
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
