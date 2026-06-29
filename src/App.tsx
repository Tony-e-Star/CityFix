import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { 
  Camera, 
  Vote,
  Video, 
  MapPin, 
  Settings, 
  FileVideo,
  CheckCircle2, 
  XCircle, 
  X, 
  AlertTriangle, 
  Moon, 
  Sun, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Building, 
  Clock,
  Info,
  Check,
  Smartphone,
  Globe,
  Upload,
  RefreshCw,
  Award,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  Flame,
  Zap,
  TrendingUp,
  BarChart2,
  Flag,
  MessageSquare,
  Bell,
  WifiOff,
  Shield,
  Menu,
  Crown,
  Medal,
  ArrowLeft,
  Mail,
  Key,
  UserPlus,
  Locate,
  Compass,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BottomNavBar from "./components/BottomNavBar";
import SideBar from "./components/SideBar";
import UserProfileView from "./components/UserProfileView";
import SettingsModal from "./components/SettingsModal";
import SmsDispatchBot from "./components/SmsDispatchBot";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { getInitials } from "./utils";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

// Types
interface Report {
  id: string;
  category: string;
  confidence: number;
  description: string;
  status: "Pending Approval" | "Submitted" | "Verified" | "In Review" | "Scheduled for Repair" | "Resolved";
  latitude: number;
  longitude: number;
  address: string;
  imageData: string; // base64 / data URL
  videoData?: string; // base64 / data URL
  imageHash: string;
  createdAt: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateReason?: string;
  userId?: string;
  userEmail?: string;
  explanation?: string;
  vouchCount?: number;
  timeline?: { stage: string; time: string; note: string }[];
  comments?: { id: string; author: string; text: string; createdAt: string }[];
  flagCount?: number;
  afterImageData?: string;
  assignedDepartment?: string;
  slaDurationDays?: number;
  slaDueDate?: string;
  isEscalated?: boolean;
  urgencyCues?: string[];
  landmarks?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  citizenConfirmed?: boolean;
  classificationMethod?: "ai" | "manual";
  vouchedUserIds?: string[];
  flaggedUserIds?: string[];
  pollVotedUserIds?: string[];
}

const translations = {
  en: {
    appTitle: "CityFix",
    homeTitle: "Smart Municipal Dispatch & Citizen Insights",
    tagline: "Empower your local community by reporting road hazards, blackouts, sanitation issues, and leaks analyzed by AI.",
    reportTab: "File Report",
    feedTab: "District Feed",
    insightsTab: "Analytics Dashboard",
    heroTab: "Civic League",
    settingsTab: "Configure System",
    allFeeds: "District Feed",
    myFeeds: "My Submissions"
  },
  es: {
    appTitle: "CityFix",
    homeTitle: "Servicio Municipal Inteligente e Información Ciudadana",
    tagline: "Empodere a su comunidad informando baches, cortes de energía y fugas analizados por IA.",
    reportTab: "Presentar Reporte",
    feedTab: "Feed del Distrito",
    insightsTab: "Panel de Análisis",
    heroTab: "Liga Cívica",
    settingsTab: "Configurar Sistema",
    allFeeds: "Feed del Distrito",
    myFeeds: "Mis Envíos"
  },
  hi: {
    appTitle: "CityFix",
    homeTitle: "स्मार्ट नगर पालिका प्रेषण और नागरिक अंतर्दृष्टि",
    tagline: "एआई द्वारा प्रसंस्कृत गड्ढों, ब्लैकआउट और पानी रिसाव की रिपोर्ट करके स्थानीय सुशासन में योगदान दें।",
    reportTab: "रिपोर्ट दर्ज़ करें",
    feedTab: "जिला फ़ीड",
    insightsTab: "विश्लेषण डैशबोर्ड",
    heroTab: "नागरिक लीग",
    settingsTab: "सिस्टम कॉन्फ़िगर करें",
    allFeeds: "जिला फ़ीड",
    myFeeds: "मेरी प्रस्तुतियां"
  },
  tl: {
    appTitle: "CityFix",
    homeTitle: "Smart Municipal Dispatch at Mga Pananaw ng Mamamayan",
    tagline: "Palakasin ang iyong lokal na komunidad sa pamamagitan ng pag-ulat ng mga pothole, outage, at leakage na sinusuri ng AI.",
    reportTab: "Maghain ng Ulat",
    feedTab: "Feed ng Distrito",
    insightsTab: "Dashboard ng Analytics",
    heroTab: "Civic League",
    settingsTab: "I-configure ang System",
    allFeeds: "Feed ng Distrito",
    myFeeds: "Aking Mga Isinumite"
  }
};

type TabType = "home" | "report" | "my-reports" | "dashboard" | "gamification" | "settings";
type ThemeMode = "light" | "dark" | "auto";

export function getReportImage(imageData: string | undefined, category: string): string {
  if (!imageData) {
    return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";
  }
  const imgStr = String(imageData);
  if (imgStr.startsWith("data:") || imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
    return imgStr;
  }
  if (imgStr === "MOCK_POTHOLE_IMAGE") {
    return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80";
  }
  if (imgStr === "MOCK_STREETLIGHT_IMAGE") {
    return "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80";
  }
  if (imgStr === "MOCK_GARBAGE_IMAGE") {
    return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80";
  }
  if (imgStr === "MOCK_WATER_LEAK_IMAGE") {
    return "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80";
  }
  if (imgStr === "MOCK_RESOLVED_STREETLIGHT" || imgStr === "MOCK_RESOLVED_AFTER") {
    return "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80";
  }
  
  // Fallback by category
  const cat = (category || "").toLowerCase();
  if (cat.includes("pothole") || cat.includes("road")) {
    return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("streetlight") || cat.includes("light") || cat.includes("outage")) {
    return "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("garbage") || cat.includes("trash") || cat.includes("overflow") || cat.includes("sanitation")) {
    return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("water") || cat.includes("leak") || cat.includes("hydrant")) {
    return "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80";
  }
  return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";
}

const getDistanceKm = (la1: number, lo1: number, la2: number, lo2: number) => {
  const R = 6371; // km
  const dLat = (la2 - la1) * Math.PI / 180;
  const dLon = (lo2 - lo1) * Math.PI / 180;
  const alpha = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const cDist = 2 * Math.atan2(Math.sqrt(alpha), Math.sqrt(1-alpha));
  return R * cDist;
};

const isThisWeek = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  
  // Set start of the current week (Sunday, 00:00:00)
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  return date.getTime() >= startOfWeek.getTime();
};

export default function App() {
  // Navigation & UI tabs
  const [activeTab, setActiveTab] = useState<TabType>("home");

  // --- USER AUTHENTICATION STATE ---
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(() => {
    const cached = localStorage.getItem("civic-user");
    if (cached) {
      try { return JSON.parse(cached); } catch { return null; }
    }
    return null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("civic-token") || null;
  });

  const [profileName, setProfileName] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [profileUpdating, setProfileUpdating] = useState<boolean>(false);
  const [isQuestsExpanded, setIsQuestsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName((currentUser as any).name || "");
      setProfilePhoto((currentUser as any).photoURL || "");
    } else {
      setProfileName("");
      setProfilePhoto("");
    }
  }, [currentUser]);

  // Track the timestamp when the feed tab was last opened/viewed
  const [lastFeedViewedAt, setLastFeedViewedAt] = useState<number>(() => {
    try {
      const cachedUser = localStorage.getItem("civic-user");
      const userId = cachedUser ? JSON.parse(cachedUser)?.id : "anonymous";
      const saved = localStorage.getItem(`civic-last-feed-viewed-${userId || "anonymous"}`);
      return saved ? parseInt(saved, 10) : (Date.now() - 24 * 3600 * 1000); // default to 24 hours ago
    } catch {
      return Date.now() - 24 * 3600 * 1000;
    }
  });

  // Keep lastFeedViewedAt synchronized with current user/account
  useEffect(() => {
    const userId = currentUser?.id || "anonymous";
    try {
      const saved = localStorage.getItem(`civic-last-feed-viewed-${userId}`);
      if (saved) {
        setLastFeedViewedAt(parseInt(saved, 10));
      } else {
        const defaultVal = Date.now() - 24 * 3600 * 1000; // default 24 hours ago
        setLastFeedViewedAt(defaultVal);
        localStorage.setItem(`civic-last-feed-viewed-${userId}`, defaultVal.toString());
      }
    } catch (err) {
      console.warn("Could not load lastFeedViewedAt from localStorage:", err);
    }
  }, [currentUser]);

  // Mark feed as viewed when entering Feed tab
  useEffect(() => {
    if (activeTab === "my-reports") {
      const now = Date.now();
      setLastFeedViewedAt(now);
      const userId = currentUser?.id || "anonymous";
      try {
        localStorage.setItem(`civic-last-feed-viewed-${userId}`, now.toString());
      } catch (err) {
        console.warn("Could not save lastFeedViewedAt to localStorage:", err);
      }
    }
  }, [activeTab, currentUser]);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Custom multi-view authentication states (cleaned up)

  // --- REPORT FEED FILTER STYLE ---
  const [feedFilter, setFeedFilter] = useState<"all" | "mine">("all");
  const [pollsSubTab, setPollsSubTab] = useState<"active" | "nominate">("active");
  
  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("civic-reporter-theme") as ThemeMode) || "auto";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Permission settings loaded
  const [cameraPermission, setCameraPermission] = useState<"Prompt" | "Granted" | "Denied">("Prompt");
  const [locationPermission, setLocationPermission] = useState<"Prompt" | "Granted" | "Denied">("Prompt");
  
  // Create / Report Form State
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 }); // default SF
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const [address, setAddress] = useState<string>("");
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const [imageData, setImageData] = useState<string>("");
  const [videoData, setVideoData] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  
  // Active report capture methods
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Verification & AI Verification state
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const [classificationMethod, setClassificationMethod] = useState<"ai" | "manual">("ai");
  const [showManualClassificationModal, setShowManualClassificationModal] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    category: string;
    confidence: number;
    explanation: string;
    autoDescription: string;
    imageHash: string;
    isDuplicate: boolean;
    existingReportId?: string;
    aiFiltered?: boolean; 
  } | null>(null);

  // Overrides & Submitting
  const [isOverriding, setIsOverriding] = useState<boolean>(false);
  const [manualCategory, setManualCategory] = useState<string>("");
  const [customCategoryText, setCustomCategoryText] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState<boolean>(false);
  const [isSubmitSuccessAnimating, setIsSubmitSuccessAnimating] = useState<boolean>(false);

  // Manual location fallback states
  const [locationPinned, setLocationPinned] = useState<boolean>(false);
  const [isUsingIpFallback, setIsUsingIpFallback] = useState<boolean>(false);
  const [showManualLocationModal, setShowManualLocationModal] = useState<boolean>(false);
  const [manualLocationInput, setManualLocationInput] = useState<string>("");
  const [manualLocationError, setManualLocationError] = useState<string | null>(null);
  const [manualLocationLoading, setManualLocationLoading] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);

  const fetchIpLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
          const ipLat = data.latitude;
          const ipLng = data.longitude;
          console.log(`[IP Geolocation] Estimated location: ${data.city || ""}, ${data.country_name || ""}. Coords: ${ipLat}, ${ipLng}`);
          
          setCoords({ lat: ipLat, lng: ipLng });
          setIsUsingIpFallback(true);
          setAddress(data.city && data.country_name ? `${data.city}, ${data.country_name} (Approximate)` : "Approximate Location");
          
          if (bgMapRef.current) {
            bgMapRef.current.setView([ipLat, ipLng], 5);
          }
          if (mapRef.current) {
            mapRef.current.setView([ipLat, ipLng], 5);
          }
          return;
        }
      }
    } catch (e1) {
      console.warn("ipapi.co failed, trying fallback ipinfo.io:", e1);
    }

    try {
      const res = await fetch("https://ipinfo.io/json");
      if (res.ok) {
        const data = await res.json();
        if (data && data.loc) {
          const [latStr, lngStr] = data.loc.split(",");
          const ipLat = parseFloat(latStr);
          const ipLng = parseFloat(lngStr);
          if (!isNaN(ipLat) && !isNaN(ipLng)) {
            console.log(`[IP Geolocation] Estimated location via ipinfo: ${data.city || ""}, ${data.country || ""}. Coords: ${ipLat}, ${ipLng}`);
            
            setCoords({ lat: ipLat, lng: ipLng });
            setIsUsingIpFallback(true);
            setAddress(data.city && data.country ? `${data.city}, ${data.country} (Approximate)` : "Approximate Location");
            
            if (bgMapRef.current) {
              bgMapRef.current.setView([ipLat, ipLng], 5);
            }
            if (mapRef.current) {
              mapRef.current.setView([ipLat, ipLng], 5);
            }
            return;
          }
        }
      }
    } catch (e2) {
      console.warn("ipinfo.io failed:", e2);
    }

    // Direct fallback to world view if both failed
    console.warn("All IP geolocation lookups failed. Defaulting to world view.");
    const worldLat = 20.0;
    const worldLng = 0.0;
    setCoords({ lat: worldLat, lng: worldLng });
    setIsUsingIpFallback(true);
    setAddress("Global View");
    if (bgMapRef.current) {
      bgMapRef.current.setView([worldLat, worldLng], 2);
    }
    if (mapRef.current) {
      mapRef.current.setView([worldLat, worldLng], 2);
    }
  };

  // Rapido-inspired location & autocomplete states
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("civic-reporter-recent-searches") || "[]");
    } catch {
      return [];
    }
  });
  const [manualSuggestions, setManualSuggestions] = useState<any[]>([]);
  const [showManualSuggestionsDropdown, setShowManualSuggestionsDropdown] = useState<boolean>(false);
  const [reportSuggestions, setReportSuggestions] = useState<any[]>([]);
  const [showReportSuggestionsDropdown, setShowReportSuggestionsDropdown] = useState<boolean>(false);

  // Main Reports stored locally + synced
  const [reports, setReports] = useState<Report[]>(() => {
    const cached = localStorage.getItem("civic-reporter-reports");
    if (cached) {
      try { return JSON.parse(cached); } catch { return []; }
    }
    // Pre-seed some mock reports for demo richness if empty
    return [
      {
        id: "REP-1701345600000",
        category: "pothole",
        confidence: 94,
        description: "Large deep pothole on the center lane of the main avenue, causing cars to swerve.",
        status: "In Review",
        latitude: 37.7849,
        longitude: -122.4094,
        address: "750 Market Street, San Francisco, CA 94102",
        imageData: "MOCK_POTHOLE_IMAGE",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        isDuplicate: false,
        imageHash: "mock_hash_1",
        explanation: "AI classified pothole with high confidence due to clear road asphalt breakage and depth.",
        vouchCount: 14,
        timeline: [
          { stage: "Submitted", time: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), note: "Report successfully filed by citizen." },
          { stage: "In Review", time: new Date(Date.now() - 47 * 3600 * 1000).toISOString(), note: "Municipality engineer assigned for physical on-site evaluation." }
        ]
      },
      {
        id: "REP-1701321200000",
        category: "streetlight_issue",
        confidence: 98,
        description: "Entire streetlamp lamp head is unlit. Pitch black corridor at night.",
        status: "Resolved",
        latitude: 37.7649,
        longitude: -122.4294,
        address: "180 Guerrero Street, San Francisco, CA 94103",
        imageData: "MOCK_STREETLIGHT_IMAGE",
        createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
        isDuplicate: false,
        imageHash: "mock_hash_2",
        explanation: "AI matched streetlight_issue with 98% confidence. Visible dead mercury luminaire.",
        vouchCount: 32,
        timeline: [
          { stage: "Submitted", time: new Date(Date.now() - 120 * 3600 * 1000).toISOString(), note: "Report logged via smartphone camera pinpoint." },
          { stage: "In Review", time: new Date(Date.now() - 118 * 3600 * 1000).toISOString(), note: "Public Works team confirmed outage schedule." },
          { stage: "Resolved", time: new Date(Date.now() - 110 * 3600 * 1000).toISOString(), note: "Sodium vapor bulb replaced with energy-efficient LED fixture." }
        ]
      }
    ];
  });

  // Gamification & Community states
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});
  const [dbUsers, setDbUsers] = useState<Array<{ id: string; name: string; points: number; badges: string[]; photoURL?: string; createdAt: string }>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [floatingPoints, setFloatingPoints] = useState<Array<{ id: string; amount: number }>>([]);

  const totalPoints = useMemo(() => {
    return (currentUser as any)?.points ?? 0;
  }, [currentUser]);

  const userLevel = useMemo(() => {
    return Math.floor(totalPoints / 500) + 1;
  }, [totalPoints]);

  const userXP = useMemo(() => {
    return totalPoints % 500;
  }, [totalPoints]);

  // Weekly Challenger Quests calculations
  const quest1Progress = useMemo(() => {
    if (!currentUser) return 0;
    return reports.filter(r => r.userId === currentUser.id && isThisWeek(r.createdAt)).length;
  }, [reports, currentUser]);

  const quest1Complete = useMemo(() => {
    return quest1Progress >= 1;
  }, [quest1Progress]);

  const quest2Progress = useMemo(() => {
    if (!currentUser) return 0;
    return reports.filter(r => r.vouchedUserIds?.includes(currentUser.id) && r.userId !== currentUser.id && isThisWeek(r.createdAt)).length;
  }, [reports, currentUser]);

  const quest2Complete = useMemo(() => {
    return quest2Progress >= 3;
  }, [quest2Progress]);

  const quest3Progress = useMemo(() => {
    if (!currentUser) return 0;
    return reports.filter(r => r.userId === currentUser.id && (r.category === "pothole" || r.category === "garbage_overflow") && isThisWeek(r.createdAt)).length;
  }, [reports, currentUser]);

  const quest3Complete = useMemo(() => {
    return quest3Progress >= 1;
  }, [quest3Progress]);

  const completedQuestsCount = useMemo(() => {
    let count = 0;
    if (quest1Complete) count++;
    if (quest2Complete) count++;
    if (quest3Complete) count++;
    return count;
  }, [quest1Complete, quest2Complete, quest3Complete]);

  const isFirstRespEarned = useMemo(() => {
    if (!currentUser) return false;
    return reports.some(r => r.userId === currentUser.id);
  }, [reports, currentUser]);

  const isCivicVettEarned = useMemo(() => {
    if (!currentUser) return false;
    return reports.some(r => r.vouchedUserIds?.includes(currentUser.id) && r.userId !== currentUser.id);
  }, [reports, currentUser]);

  const isFixHeroEarned = useMemo(() => {
    if (!currentUser) return false;
    return reports.some(r => r.userId === currentUser.id && r.status === "Resolved");
  }, [reports, currentUser]);

  const isOverlordEarned = useMemo(() => {
    if (!currentUser) return false;
    return reports.filter(r => r.userId === currentUser.id).length >= 3;
  }, [reports, currentUser]);

  const prevPointsRef = useRef<number>(totalPoints);

  // Sync / Get current registered users
  const fetchDbUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setDbUsers(data);
      }
    } catch (err) {
      console.warn("Could not retrieve users from server:", err);
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("civic-user", JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.warn("Could not retrieve current user profile:", err);
    }
  };

  const refreshUserData = () => {
    fetchDbUsers();
    fetchCurrentUserProfile();
  };

  useEffect(() => {
    if (totalPoints > prevPointsRef.current) {
      const diff = totalPoints - prevPointsRef.current;
      const newFloatingId = `fp-${Date.now()}-${Math.random()}`;
      setFloatingPoints(prev => [...prev, { id: newFloatingId, amount: diff }]);
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(fp => fp.id !== newFloatingId));
      }, 1500);
    }
    prevPointsRef.current = totalPoints;
  }, [totalPoints]);

  const leaderboard = useMemo(() => {
    // If we have a list of users from the database, map them.
    // If the database users are empty, fall back to default seeds to avoid empty screens
    const listToMap = dbUsers.length > 0 ? dbUsers : [
      { id: "USR-alex", name: "Alex Mercer", points: 1820, badges: ["First Resp", "Civic Vett", "Fix Hero"], photoURL: undefined, createdAt: "2026-06-25T07:02:45.542Z" },
      { id: "USR-satoshi", name: "Satoshi K.", points: 1250, badges: ["Civic Vett", "Overlord"], photoURL: undefined, createdAt: "2026-06-25T07:02:45.543Z" },
      { id: "USR-jane", name: "Jane Doe", points: 380, badges: ["First Resp"], photoURL: undefined, createdAt: "2026-06-25T07:02:45.544Z" }
    ];

    const mapped = listToMap.map(u => {
      const isCurrentUser = currentUser && u.id === currentUser.id;
      // Use real-time points from state for current user so visual "+pts" updates instantenously
      const points = isCurrentUser ? totalPoints : u.points;
      const name = isCurrentUser ? ((currentUser as any).name || u.name) : u.name;
      const photoURL = isCurrentUser ? ((currentUser as any).photoURL || u.photoURL) : u.photoURL;
      const initials = getInitials(name, isCurrentUser ? currentUser.email : undefined);
      return {
        id: u.id,
        name,
        photoURL,
        initials,
        points,
        isCurrentUser,
        badges: u.badges || [],
        createdAt: u.createdAt || ""
      };
    });

    // Handle case where currentUser is logged in but not loaded in user database yet (edge case)
    const hasCurrent = currentUser && mapped.some(m => m.id === currentUser.id);
    if (currentUser && !hasCurrent) {
      const initials = getInitials((currentUser as any).name, currentUser.email);
      mapped.push({
        id: currentUser.id,
        name: (currentUser as any).name || currentUser.email.split("@")[0],
        photoURL: (currentUser as any).photoURL,
        initials,
        points: totalPoints,
        isCurrentUser: true,
        badges: (currentUser as any).badges || ["First Resp"],
        createdAt: (currentUser as any).createdAt || new Date().toISOString()
      });
    }

    // Filter out test/demo accounts from the leaderboard
    const filtered = mapped.filter(u => {
      const nameLower = (u.name || "").toLowerCase();
      // Find original user email if present in dbUsers to inspect email
      const origUser = dbUsers.find(dbU => dbU.id === u.id);
      const email = origUser?.email || (u.isCurrentUser ? currentUser?.email : "");
      const emailLower = (email || "").toLowerCase();
      return !(
        u.id === "USR-11111111111" ||
        nameLower.includes("test") ||
        nameLower.includes("demo") ||
        emailLower.includes("test@") ||
        emailLower.includes("demo@")
      );
    });

    return filtered.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // TIEBREAKER: Rank ties by earliest account creation date.
      // This is simpler given our current data model because every user object (both on disk/db and in-memory)
      // has a 'createdAt' timestamp field ready to use, avoiding any extra queries to parse reports or messages.
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB; // earlier creation date gets a better (higher) rank
    });
  }, [dbUsers, currentUser, totalPoints]);

  useEffect(() => {
    localStorage.setItem("civic-reporter-xp", String(userXP));
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem("civic-reporter-level", String(userLevel));
  }, [userLevel]);

  // Client Simulation Config (fallback if server Gemini fails or is missing key)
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [serverKeyStatus, setServerKeyStatus] = useState<boolean>(false);

  // --- ADDED SYSTEM STATES (FOR ENRICHED REQUIREMENTS) ---
  const [language, setLanguage] = useState<"en" | "es" | "hi" | "tl">("en");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "urgency" | "distance">("distance");
  const [showAllDistricts, setShowAllDistricts] = useState<boolean>(false);

  const [leaderboardTab, setLeaderboardTab] = useState<"nearby" | "district">("nearby");
  const [currentDistrict, setCurrentDistrict] = useState<string>("San Francisco");
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);

  const getDistrictFromAddress = useCallback((addressStr: string) => {
    if (!addressStr) return "San Francisco";
    const addressLower = addressStr.toLowerCase();
    
    // SF specific neighborhood / district matching as priority override
    if (addressLower.includes("mission district") || addressLower.includes("mission dolores") || addressLower.includes("dolores")) {
      return "Mission District";
    }
    if (addressLower.includes("soma") || addressLower.includes("south of market") || addressLower.includes("guerrero") || addressLower.includes("11th street")) {
      return "SOMA District";
    }
    if (addressLower.includes("tenderloin") || addressLower.includes("civic center") || addressLower.includes("union square") || addressLower.includes("market street")) {
      return "Civic Center / Downtown";
    }
    if (addressLower.includes("haight-ashbury") || addressLower.includes("haight")) {
      return "Haight-Ashbury";
    }
    if (addressLower.includes("chinatown")) {
      return "Chinatown";
    }
    if (addressLower.includes("castro")) {
      return "The Castro";
    }
    if (addressLower.includes("nob hill")) {
      return "Nob Hill";
    }
    if (addressLower.includes("marina")) {
      return "Marina District";
    }
    if (addressLower.includes("richmond")) {
      return "Richmond District";
    }
    if (addressLower.includes("sunset")) {
      return "Sunset District";
    }

    const parts = addressStr.split(",").map(p => p.trim());
    
    // 1. Check for specific administrative/ward indicators first
    for (const p of parts) {
      const pLower = p.toLowerCase();
      if (
        pLower.includes("ward") || 
        (pLower.includes("district") && !pLower.includes("district de")) || 
        pLower.includes("neighbourhood") || 
        pLower.includes("neighborhood") || 
        pLower.includes("suburb") || 
        (pLower.includes("zone") && !pLower.includes("time zone"))
      ) {
        // Exclude broad countries, states, exact zip codes
        if (
          !pLower.includes("united states") && 
          !pLower.includes("india") && 
          !pLower.includes("california") && 
          !pLower.includes("maharashtra") && 
          !pLower.match(/^\d+$/)
        ) {
          return p;
        }
      }
    }

    // 2. Fallback to middle-tier administrative segments
    const ignoreList = [
      "san francisco", "mumbai", "california", "maharashtra", "india", "united states", 
      "united kingdom", "london", "ca", "ny", "tx", "usa", "uk", "state", "province", 
      "county", "suburban", "zone", "delhi", "mumbai zone", "mumbai suburban"
    ];

    if (parts.length > 2) {
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const pLower = p.toLowerCase();
        
        // Skip zip codes/numbers
        if (pLower.match(/^\d+$/) || p.length <= 2) continue;

        const shouldIgnore = ignoreList.some(ignoreWord => pLower.includes(ignoreWord));
        if (!shouldIgnore) {
          return p;
        }
      }
    }
    
    // 3. Fallback to first non-empty component if possible, or "San Francisco"
    if (parts.length > 0 && parts[0]) {
      const p0Lower = parts[0].toLowerCase();
      const shouldIgnore = ignoreList.some(ignoreWord => p0Lower.includes(ignoreWord));
      if (!shouldIgnore && !parts[0].match(/^\d+$/)) {
        return parts[0];
      }
    }

    return "San Francisco";
  }, []);

  const getUserCoords = useCallback((user: any) => {
    if (user.isCurrentUser) {
      return coords;
    }
    if (user.savedLocation?.lat && user.savedLocation?.lng) {
      return { lat: user.savedLocation.lat, lng: user.savedLocation.lng };
    }
    const userReports = reports.filter(r => r.userId === user.id);
    if (userReports.length > 0) {
      const sortedReports = [...userReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { lat: sortedReports[0].latitude, lng: sortedReports[0].longitude };
    }
    return coords;
  }, [coords, reports]);

  const getUserDistrict = useCallback((user: any) => {
    if (user.isCurrentUser) {
      return currentDistrict || getDistrictFromAddress(address);
    }
    if (user.savedLocation?.address) {
      return getDistrictFromAddress(user.savedLocation.address);
    }
    const userReports = reports.filter(r => r.userId === user.id);
    if (userReports.length > 0) {
      const sortedReports = [...userReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return getDistrictFromAddress(sortedReports[0].address);
    }
    return "San Francisco";
  }, [currentDistrict, address, reports, getDistrictFromAddress]);

  // Consolidated district scope helper functions
  const isWithinActiveDistrict = useCallback((addressStr?: string) => {
    if (!addressStr) return false;
    const activeDistrict = currentDistrict || getDistrictFromAddress(address);
    const targetDistrict = getDistrictFromAddress(addressStr);
    return targetDistrict.toLowerCase() === activeDistrict.toLowerCase();
  }, [currentDistrict, address, getDistrictFromAddress]);

  const isReportInActiveDistrict = useCallback((report: { address?: string }) => {
    return isWithinActiveDistrict(report.address);
  }, [isWithinActiveDistrict]);

  const isUserInActiveDistrict = useCallback((user: any) => {
    const activeDistrict = currentDistrict || getDistrictFromAddress(address);
    const uDistrict = getUserDistrict(user);
    return uDistrict.toLowerCase() === activeDistrict.toLowerCase();
  }, [currentDistrict, address, getUserDistrict, getDistrictFromAddress]);

  const nearbyLeaderboard = useMemo(() => {
    return leaderboard.filter(u => {
      if (isUsingIpFallback) return false;
      const uCoords = getUserCoords(u);
      const dist = getDistanceKm(coords.lat, coords.lng, uCoords.lat, uCoords.lng);
      return dist <= 10;
    });
  }, [leaderboard, coords, getUserCoords, isUsingIpFallback]);

  const districtLeaderboard = useMemo(() => {
    return leaderboard.filter(u => {
      if (isUsingIpFallback) return false;
      return isUserInActiveDistrict(u);
    });
  }, [leaderboard, isUserInActiveDistrict, isUsingIpFallback]);

  // Unread feed items newer than lastFeedViewedAt and within nearby radius / active district scope
  const unreadFeedCount = useMemo(() => {
    return reports.filter(r => {
      // Created after the timestamp
      const isNewer = new Date(r.createdAt).getTime() > lastFeedViewedAt;
      if (!isNewer) return false;
      
      if (isUsingIpFallback) return false;
      if (showAllDistricts) {
        return isReportInActiveDistrict(r);
      }
      const d = getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude);
      return d <= 10;
    }).length;
  }, [reports, lastFeedViewedAt, coords, showAllDistricts, isReportInActiveDistrict, isUsingIpFallback]);
  
  // Real-time notifications inbox
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string; read: boolean }[]>([
    { id: "noti-1", title: "Welcome back!", message: "Thank you for supporting community maintenance via AI-Dispatch.", time: "Just now", read: false },
    { id: "noti-2", title: "Verification Achieved 🎉", message: "Pothole #REP-1701345600000 has been verified with 14 community vouches.", time: "2 hours ago", read: false },
    { id: "noti-3", title: "System Ready", message: "You are currently Level 3 (Civic Sentinel) with 340 League XP.", time: "1 day ago", read: true }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Offline queue states (offline-first sync)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isRecenterDropdownOpen, setIsRecenterDropdownOpen] = useState<boolean>(false);
  const [isNewLocationFromRecenterDropdown, setIsNewLocationFromRecenterDropdown] = useState<boolean>(false);
  const [pendingConfirmLocation, setPendingConfirmLocation] = useState<{ address: string, lat: number, lng: number } | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("civic-offline-queue") || "[]");
    } catch {
      return [];
    }
  });

  // SMS helper chatbot states
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [chatbotMessages, setChatbotMessages] = useState<{ sender: "bot" | "user"; text: string; time: string }[]>([
    { sender: "bot", text: "Hello! I am your AI Civic SMS assistant. Text me what issue you see in your neighborhood (e.g. \"near 23 Main St there is a massive water leak\").", time: "Just now" }
  ]);
  const [chatbotInput, setChatbotInput] = useState<string>("");
  const [chatbotStep, setChatbotStep] = useState<number>(0);
  const [chatbotDraft, setChatbotDraft] = useState<{ category: string; description: string; landmarks: string; severity: string }>({
    category: "pothole",
    description: "",
    landmarks: "",
    severity: "Medium"
  });

  // comments thread input state: [reportId]: text
  const [commentsInput, setCommentsInput] = useState<{ [reportId: string]: string }>({});

  // administrator resolution states (simulation)
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingNote, setResolvingNote] = useState<string>("");
  const [resolvingAfterImage, setResolvingAfterImage] = useState<string>("");
  const [resolvingLoading, setResolvingLoading] = useState<boolean>(false);

  // Toast Notification Overlay State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flagConfirmation, setFlagConfirmation] = useState<{
    reportId: string;
    isRemoval: boolean;
  } | null>(null);
  const [vouchConfirmation, setVouchConfirmation] = useState<{
    reportId: string;
  } | null>(null);
  const showAlert = (msg: string) => {
    setToastMessage(msg);
  };

  // Map reference
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const bgMapRef = useRef<any>(null);
  const bgMarkersRef = useRef<any[]>([]);
  const chatbotEndRef = useRef<HTMLDivElement>(null);
  const lastSavedLocationStrRef = useRef<string>("");

  // Auto-scroll chatbot scroll reference to bottom
  useEffect(() => {
    if (isChatbotOpen) {
      chatbotEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatbotMessages, isChatbotOpen]);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem("civic-reporter-reports", JSON.stringify(reports));
  }, [reports]);

  // Save offlineQueue to localStorage
  useEffect(() => {
    localStorage.setItem("civic-offline-queue", JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Sync / Get current reports from API on startup
  useEffect(() => {
    fetchHealth();
    fetchReports();
    fetchDbUsers();
    restoreAuthOnLoad();
    requestLocationOnLoad();
  }, []);

  // Real-time synchronization via WebSocket & frequent polling fallback
  useEffect(() => {
    let ws: any = null;
    let reconnectTimeout: any = null;

    const handleOnlineStatus = () => {
      setIsBrowserOnline(navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    const connectWS = () => {
      // If simulated offline mode is active or browser is offline, don't establish socket
      if (isOfflineMode || !navigator.onLine) {
        setWsConnected(false);
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      
      console.log("Connecting WebSocket to:", wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connection established.");
        setWsConnected(true);
      };

      ws.onmessage = (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "db_update") {
            console.log("Real-time DB update pushed via WebSocket. Syncing...");
            fetchDbUsers();
            fetchReports();
          } else if (payload.type === "report_update" && payload.data) {
            console.log("Real-time report update pushed via WebSocket. Updating report:", payload.data.id);
            const updated = payload.data;
            setReports(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        console.warn("WebSocket disconnected. Reconnecting in 5 seconds...");
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      ws.onerror = (err: any) => {
        console.warn("WebSocket connection status (safe fallback to polling):", err);
        setWsConnected(false);
      };
    };

    connectWS();

    const interval = setInterval(() => {
      if (navigator.onLine && !isOfflineMode) {
        fetchDbUsers();
        fetchReports();
      }
    }, 5000);

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(interval);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [authToken, isOfflineMode]);

  // Recalculate and pull issues when token changes
  useEffect(() => {
    fetchReports();
  }, [authToken]);

  // Request Location permission only when starting the report flow
  useEffect(() => {
    if (activeTab === "report") {
      requestLocationOnLoad();
    }
  }, [activeTab]);

  const restoreAuthOnLoad = async () => {
    const cachedToken = localStorage.getItem("civic-token");
    if (!cachedToken) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${cachedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // clear stale profile
        handleLogout();
      }
    } catch {
      // offline fallback - keep cached profile
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerKeyStatus(data.apiKeyConfigured);
        if (!data.apiKeyConfigured) {
          console.log("No backend API key configured. Utilizing smart simulator mode as fallback.");
        }
      }
    } catch (err) {
      console.warn("Backend API not responsive. Direct simulator enabled.", err);
      setSimulationMode(true);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", {
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const serverReports = await res.json();
        if (serverReports && serverReports.length > 0) {
          // Merge client local reports with server reports safely
          setReports(prev => {
            const map = new Map<string, Report>(prev.map(r => [r.id, r]));
            serverReports.forEach((r: Report) => map.set(r.id, r));
            return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
          // Refresh user data (points, level, leaderboard) based on live reports
          fetchDbUsers();
          fetchCurrentUserProfile();
        }
      }
    } catch (err) {
      console.warn("Could not retrieve reports from server node.", err);
    }
  };

  // Resolve Auto & Theme shifts
  useEffect(() => {
    localStorage.setItem("civic-reporter-theme", themeMode);
    
    const applyTheme = (theme: "light" | "dark") => {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
      setResolvedTheme(theme);
    };

    if (themeMode === "auto") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(systemDark ? "dark" : "light");

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(themeMode);
    }
  }, [themeMode]);

  // Synchronize background map view when activeTab or coords change to zoom into local area/city
  useEffect(() => {
    if (bgMapRef.current && (activeTab === "home" || activeTab === "my-reports")) {
      try {
        const container = bgMapRef.current.getContainer();
        if (container) {
          const targetZoom = isUsingIpFallback ? (coords.lat === 20.0 && coords.lng === 0.0 ? 2 : 5) : (activeTab === "home" ? 15 : 13);
          bgMapRef.current.setView([coords.lat, coords.lng], targetZoom);
          bgMapRef.current.invalidateSize();

          // Force a delayed size recalculation and tile redraw to handle the CSS opacity transitions smoothly
          const timer = setTimeout(() => {
            if (bgMapRef.current) {
              bgMapRef.current.invalidateSize();
              bgMapRef.current.eachLayer((layer: any) => {
                if (layer.redraw) {
                  try {
                    layer.redraw();
                  } catch (err) {}
                }
              });
            }
          }, 350);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn("bgMap setView/invalidateSize failed:", e);
      }
    }
  }, [coords.lat, coords.lng, activeTab, isUsingIpFallback]);

  // Synchronize active (interactive) map view and pinpoint marker based on IP fallback status
  useEffect(() => {
    if (mapRef.current) {
      try {
        const zoomVal = isUsingIpFallback ? (coords.lat === 20.0 && coords.lng === 0.0 ? 2 : 5) : 15;
        mapRef.current.setView([coords.lat, coords.lng], zoomVal);
        
        if (markerRef.current) {
          if (isUsingIpFallback) {
            if (mapRef.current.hasLayer(markerRef.current)) {
              mapRef.current.removeLayer(markerRef.current);
            }
          } else {
            markerRef.current.setLatLng([coords.lat, coords.lng]);
            if (!mapRef.current.hasLayer(markerRef.current)) {
              markerRef.current.addTo(mapRef.current);
            }
          }
        }
      } catch (err) {
        console.warn("Error synchronizing active map state:", err);
      }
    }
  }, [coords.lat, coords.lng, isUsingIpFallback]);

  // Initial Location & Camera permission prompt
  const requestLocationOnLoad = () => {
    // If we already have a saved location in currentUser, use it!
    if (currentUser && (currentUser as any).savedLocation) {
      const loc = (currentUser as any).savedLocation;
      setIsUsingIpFallback(false);
      setCoords({ lat: loc.lat, lng: loc.lng });
      setAddress(loc.address);
      setLocationPermission("Granted");
      setLocationPinned(true);
      if (bgMapRef.current) {
        bgMapRef.current.setView([loc.lat, loc.lng], 15);
      }
      if (mapRef.current) {
        mapRef.current.setView([loc.lat, loc.lng], 15);
      }
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setIsUsingIpFallback(false);
          setCoords({ lat, lng });
          setLocationPermission("Granted");
          reverseGeocode(lat, lng);
          if (bgMapRef.current) {
            bgMapRef.current.setView([lat, lng], 15);
          }
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
          }
        },
        (err) => {
          console.warn("Location permission refused or failed:", err);
          setLocationPermission("Denied");
          if (!currentUser || !(currentUser as any).savedLocation) {
            setShowManualLocationModal(true);
          }
          // Fetch the IP approximate location fallback
          fetchIpLocation();
        }
      );
    } else {
      setLocationPermission("Denied");
      if (!currentUser || !(currentUser as any).savedLocation) {
        setShowManualLocationModal(true);
      }
      fetchIpLocation();
    }
  };

  // Trigger geolocation explicitly
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationPermission("Prompt");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setIsUsingIpFallback(false);
          setCoords({ lat, lng });
          setLocationPermission("Granted");
          setLocationPinned(true);
          reverseGeocode(lat, lng);
          if (mapRef.current) {
            try {
              mapRef.current.setView([lat, lng], 15);
              if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
                markerRef.current.setLatLng([lat, lng]);
              }
            } catch (err) {}
          }
          if (bgMapRef.current) {
            bgMapRef.current.setView([lat, lng], 15);
          }
        },
        (err) => {
          setLocationPermission("Denied");
          setShowManualLocationModal(true);
          showAlert("Could not retrieve position. Please enter your address or pin location manually.");
        }
      );
    } else {
      showAlert("Location features are not supported on this device browser.");
    }
  };

  // Map recenter handler (supports both GPS centering and dropdown coordinates)
  const handleRecenterMapToActive = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setIsUsingIpFallback(false);
          setCoords({ lat, lng });
          reverseGeocode(lat, lng);
          if (bgMapRef.current) {
            try {
              bgMapRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
            } catch (e) {
              bgMapRef.current.setView([lat, lng], 15);
            }
          }
          if (mapRef.current) {
            try {
              mapRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
            } catch (e) {
              try { mapRef.current.setView([lat, lng], 15); } catch (err) {}
            }
            try {
              if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
                markerRef.current.setLatLng([lat, lng]);
              }
            } catch (err) {}
          }
          setLocationToast("Recentered map to GPS location");
        },
        (err) => {
          console.warn("GPS centering failed, falling back to active coords:", err);
          if (bgMapRef.current) {
            try {
              bgMapRef.current.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.5 });
            } catch (e) {
              bgMapRef.current.setView([coords.lat, coords.lng], 15);
            }
          }
          if (mapRef.current) {
            try {
              mapRef.current.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.5 });
            } catch (e) {
              try { mapRef.current.setView([coords.lat, coords.lng], 15); } catch (err) {}
            }
            try {
              if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
                markerRef.current.setLatLng([coords.lat, coords.lng]);
              }
            } catch (err) {}
          }
          setLocationToast("Recentered to current saved location");
        }
      );
    } else {
      if (bgMapRef.current) {
        bgMapRef.current.setView([coords.lat, coords.lng], 15);
      }
      if (mapRef.current) {
        try {
          mapRef.current.setView([coords.lat, coords.lng], 15);
          if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
            markerRef.current.setLatLng([coords.lat, coords.lng]);
          }
        } catch (err) {}
      }
      setLocationToast("Recentered to current location");
    }
  };

  // Generate a distinct list of user's saved or recently used/reported locations
  const userLocationsList = useMemo(() => {
    if (!currentUser) return [];
    const list: { name: string; lat: number; lng: number; type: "base" | "report" }[] = [];

    // 1. Base permanent profile location
    const saved = (currentUser as any).savedLocation;
    if (saved && saved.address && saved.lat && saved.lng) {
      list.push({
        name: saved.address,
        lat: saved.lat,
        lng: saved.lng,
        type: "base"
      });
    }

    // 2. Previously reported locations by the user
    const myReports = reports.filter(r => r.userId === currentUser.id);
    myReports.forEach(r => {
      if (r.address && r.latitude && r.longitude) {
        const isDuplicate = list.some(item => item.name.toLowerCase().trim() === r.address.toLowerCase().trim() || (Math.abs(item.lat - r.latitude) < 0.0001 && Math.abs(item.lng - r.longitude) < 0.0001));
        if (!isDuplicate) {
          list.push({
            name: r.address,
            lat: r.latitude,
            lng: r.longitude,
            type: "report"
          });
        }
      }
    });

    return list.slice(0, 5); // top 5 most relevant locations
  }, [currentUser, reports]);

  // Dropdown location select callback
  const handleSelectDropdownLocation = (latVal: number, lngVal: number, addressStr: string) => {
    setIsUsingIpFallback(false);
    setCoords({ lat: latVal, lng: lngVal });
    setAddress(addressStr);
    setLocationPinned(true);
    if (bgMapRef.current) {
      try {
        bgMapRef.current.flyTo([latVal, lngVal], 15, { animate: true, duration: 1.5 });
      } catch (e) {
        bgMapRef.current.setView([latVal, lngVal], 15);
      }
    }
    if (mapRef.current) {
      try {
        mapRef.current.flyTo([latVal, lngVal], 15, { animate: true, duration: 1.5 });
      } catch (e) {
        try { mapRef.current.setView([latVal, lngVal], 15); } catch (err) {}
      }
      try {
        if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
          markerRef.current.setLatLng([latVal, lngVal]);
        }
      } catch (err) {}
    }
    setIsRecenterDropdownOpen(false);
    setLocationToast(`Map moved to: ${addressStr.split(",")[0]}`);
  };

  // Save custom location to backend user profile
  const saveLocationToBackend = async (addressStr: string, latVal: number, lngVal: number) => {
    setIsUsingIpFallback(false);
    if (!currentUser) {
      // For unauthenticated visitors, store only in local session/browser state for that visit
      setCoords({ lat: latVal, lng: lngVal });
      setAddress(addressStr);
      setLocationPinned(true);
      
      if (bgMapRef.current) {
        bgMapRef.current.setView([latVal, lngVal], 15);
      }
      if (mapRef.current) {
        try {
          mapRef.current.setView([latVal, lngVal], 15);
          if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
            markerRef.current.setLatLng([latVal, lngVal]);
          }
        } catch (err) {}
      }
      setLocationToast("Local area updated for session");
      return true;
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          savedLocation: {
            address: addressStr,
            lat: latVal,
            lng: lngVal
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("civic-user", JSON.stringify(data.user));
        
        setIsUsingIpFallback(false);
        setCoords({ lat: latVal, lng: lngVal });
        setAddress(addressStr);
        
        if (bgMapRef.current) {
          bgMapRef.current.setView([latVal, lngVal], 15);
        }
        if (mapRef.current) {
          try {
            mapRef.current.setView([latVal, lngVal], 15);
            if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
              markerRef.current.setLatLng([latVal, lngVal]);
            }
          } catch (err) {}
        }

        setLocationToast("Location saved successfully");
        return true;
      }
    } catch (err) {
      console.error("Error saving location:", err);
    }
    return false;
  };

  // Keep currentDistrict synchronized with address automatically
  useEffect(() => {
    if (address) {
      const resolved = getDistrictFromAddress(address);
      setCurrentDistrict(resolved);
    }
  }, [address, getDistrictFromAddress]);

  // Auto-dismiss location saved toast
  useEffect(() => {
    if (locationToast) {
      const timer = setTimeout(() => {
        setLocationToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [locationToast]);

  // Process pending location after sign-in completes
  useEffect(() => {
    if (currentUser && authToken && pendingLocation) {
      const { address, lat, lng } = pendingLocation;
      setPendingLocation(null);
      saveLocationToBackend(address, lat, lng);
    }
  }, [currentUser, authToken, pendingLocation]);

  // Synchronize coords/address on app load or login if user has a saved location
  useEffect(() => {
    if (currentUser && (currentUser as any).savedLocation) {
      const loc = (currentUser as any).savedLocation;
      const currentLocStr = JSON.stringify(loc);
      if (lastSavedLocationStrRef.current !== currentLocStr) {
        lastSavedLocationStrRef.current = currentLocStr;
        setIsUsingIpFallback(false);
        setCoords({ lat: loc.lat, lng: loc.lng });
        setAddress(loc.address);
        setLocationPinned(true);
        if (bgMapRef.current) {
          bgMapRef.current.setView([loc.lat, loc.lng], 15);
        }
        if (mapRef.current) {
          try {
            mapRef.current.setView([loc.lat, loc.lng], 15);
            if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
              markerRef.current.setLatLng([loc.lat, loc.lng]);
            }
          } catch (err) {}
        }
      }
    } else if (!currentUser) {
      lastSavedLocationStrRef.current = "";
    }
  }, [currentUser]);

  // Handle geocoding manual area/neighborhood via OSM Nominatim API
  const handleManualGeocodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualLocationInput.trim()) {
      setManualLocationError("Please enter an area, neighborhood, or city name.");
      return;
    }

    setManualLocationLoading(true);
    setManualLocationError(null);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationInput)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const name = first.display_name || manualLocationInput;
          
          // Save successful manual query to recent searches
          saveRecentSearch(name);

          if (isNewLocationFromRecenterDropdown && currentUser) {
            // Recenter maps immediately
            setIsUsingIpFallback(false);
            setCoords({ lat, lng });
            setAddress(name);
            setLocationPinned(true);
            if (bgMapRef.current) {
              bgMapRef.current.setView([lat, lng], 15);
            }
            if (mapRef.current) {
              try {
                mapRef.current.setView([lat, lng], 15);
                if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
                  markerRef.current.setLatLng([lat, lng]);
                }
              } catch (err) {}
            }
            // Ask user to save
            setPendingConfirmLocation({ address: name, lat, lng });
            setIsNewLocationFromRecenterDropdown(false);
            setShowManualLocationModal(false);
            setManualLocationInput("");
          } else {
            // Save/Sync to backend profile
            await saveLocationToBackend(name, lat, lng);
            // Hide modal and reset input
            setShowManualLocationModal(false);
            setManualLocationInput("");
          }
        } else {
          setManualLocationError("Location not found. Please try a more specific area name or add the city (e.g., 'Mission District, San Francisco').");
        }
      } else {
        setManualLocationError("Unable to reach the geocoding service. Please check your network or try again.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setManualLocationError("An error occurred during search. Please try again.");
    } finally {
      setManualLocationLoading(false);
    }
  };

  // Save search query to history
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery || !searchQuery.trim()) return;
    const trimmed = searchQuery.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5); // limit to 5
      localStorage.setItem("civic-reporter-recent-searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Debounced search for manual fallback modal suggestions
  useEffect(() => {
    if (!manualLocationInput || manualLocationInput.trim().length < 3) {
      setManualSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationInput)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setManualSuggestions(data || []);
        }
      } catch (err) {
        console.warn("Failed to fetch suggestions:", err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [manualLocationInput]);

  // Debounced search for report form address suggestions
  useEffect(() => {
    if (!address || address.trim().length < 3) {
      setReportSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setReportSuggestions(data || []);
        }
      } catch (err) {
        console.warn("Failed to fetch report suggestions:", err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [address]);

  const handleSelectManualSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const name = suggestion.display_name;
    
    saveRecentSearch(name);
    
    if (isNewLocationFromRecenterDropdown && currentUser) {
      // Recenter maps immediately
      setIsUsingIpFallback(false);
      setCoords({ lat, lng });
      setAddress(name);
      setLocationPinned(true);
      if (bgMapRef.current) {
        bgMapRef.current.setView([lat, lng], 15);
      }
      if (mapRef.current) {
        try {
          mapRef.current.setView([lat, lng], 15);
          if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
            markerRef.current.setLatLng([lat, lng]);
          }
        } catch (err) {}
      }
      // Ask user to save
      setPendingConfirmLocation({ address: name, lat, lng });
      setIsNewLocationFromRecenterDropdown(false);
      setShowManualLocationModal(false);
    } else {
      saveLocationToBackend(name, lat, lng);
    }
    setManualSuggestions([]);
  };

  const handleSelectReportSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const name = suggestion.display_name;
    
    saveRecentSearch(name);
    saveLocationToBackend(name, lat, lng);
    setLocationPinned(true);
    setReportSuggestions([]);
    setShowReportSuggestionsDropdown(false);
  };

  const handleSelectRecentSearchInModal = async (search: string) => {
    setManualLocationInput(search);
    setManualLocationLoading(true);
    setManualLocationError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const name = first.display_name || search;
          
          saveRecentSearch(search);
          
          if (isNewLocationFromRecenterDropdown && currentUser) {
            // Recenter maps immediately
            setIsUsingIpFallback(false);
            setCoords({ lat, lng });
            setAddress(name);
            setLocationPinned(true);
            if (bgMapRef.current) {
              bgMapRef.current.setView([lat, lng], 15);
            }
            if (mapRef.current) {
              try {
                mapRef.current.setView([lat, lng], 15);
                if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
                  markerRef.current.setLatLng([lat, lng]);
                }
              } catch (err) {}
            }
            setPendingConfirmLocation({ address: name, lat, lng });
            setIsNewLocationFromRecenterDropdown(false);
            setShowManualLocationModal(false);
          } else {
            saveLocationToBackend(name, lat, lng);
            setShowManualLocationModal(false);
          }
        } else {
          setManualLocationError("Location no longer found.");
        }
      }
    } catch (err) {
      setManualLocationError("Error retrieving coordinates.");
    } finally {
      setManualLocationLoading(false);
    }
  };

  const handleSelectRecentSearchInReport = async (search: string) => {
    setAddress(search);
    setAddressLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          
          saveRecentSearch(search);
          saveLocationToBackend(search, lat, lng);
          setLocationPinned(true);
        }
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Snap map camera to city central administrative boundary center
  const handleSnapToCityCenter = () => {
    const cityCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco City Hall / Admin center
    setIsUsingIpFallback(false);
    setCoords(cityCenter);
    setLocationPinned(true);
    reverseGeocode(cityCenter.lat, cityCenter.lng);
    if (mapRef.current) {
      try {
        mapRef.current.setView([cityCenter.lat, cityCenter.lng], 13);
        if (markerRef.current && markerRef.current._map && markerRef.current._icon) {
          markerRef.current.setLatLng([cityCenter.lat, cityCenter.lng]);
        }
      } catch (err) {}
    }
  };

  // Manual Address Geocoding Fallback via OSM Search API
  const handleManualAddressGeocode = async (query: string) => {
    if (!query || query.trim() === "") return;
    setAddressLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          saveLocationToBackend(query, lat, lng);
          setLocationPinned(true);
        }
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Reverse Geocoding Helper
  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          const districtVal = getDistrictFromAddress(data.display_name);
          setCurrentDistrict(districtVal);
        } else {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setAddressLoading(false);
    }
  };

  // Leaflet Map callback ref for dynamic mounting / unmounting safely without window load or element timing errors.
  const mapContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      if (!(window as any).L) return;
      if (mapRef.current) {
        // If the map is already attached to this exact element, just update view and marker
        if (mapRef.current.getContainer() === el) {
          try {
            const zoomVal = isUsingIpFallback ? (coordsRef.current.lat === 20.0 && coordsRef.current.lng === 0.0 ? 2 : 5) : 15;
            mapRef.current.setView([coordsRef.current.lat, coordsRef.current.lng], zoomVal);
            if (markerRef.current) {
              if (isUsingIpFallback) {
                if (mapRef.current.hasLayer(markerRef.current)) {
                  mapRef.current.removeLayer(markerRef.current);
                }
              } else {
                markerRef.current.setLatLng([coordsRef.current.lat, coordsRef.current.lng]);
                if (!mapRef.current.hasLayer(markerRef.current)) {
                  markerRef.current.addTo(mapRef.current);
                }
              }
            }
          } catch (e) {
            console.warn("Error updating active map view:", e);
          }
          return;
        } else {
          // Stale map instance on a detached/different element - tear it down first!
          try {
            if (markerRef.current) {
              try {
                mapRef.current.removeLayer(markerRef.current);
              } catch (err) {}
              markerRef.current = null;
            }
            try {
              mapRef.current.off();
            } catch (err) {}
            mapRef.current.remove();
          } catch (e) {
            console.warn("Leaflet map removal exception:", e);
          }
          mapRef.current = null;
          markerRef.current = null;
        }
      }

      const L = (window as any).L;
      
      try {
        // Create interactive map instance using direct ref
        const initZoom = isUsingIpFallback ? (coordsRef.current.lat === 20.0 && coordsRef.current.lng === 0.0 ? 2 : 5) : 15;
        const map = L.map(el, {
          zoomControl: false,
        }).setView([coordsRef.current.lat, coordsRef.current.lng], initZoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors © CartoDB",
        }).addTo(map);

        // Custom leaflet pin styled as a glowing citizen dot icon
        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="glow-pin-alert" style="width: 18px; height: 18px;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([coordsRef.current.lat, coordsRef.current.lng], {
          draggable: true,
          icon: icon,
        });

        if (!isUsingIpFallback) {
          marker.addTo(map);
        }

        L.control.zoom({ position: "topright" }).addTo(map);

        // Event listener on dragging pinpoint
        marker.on("dragend", async () => {
          try {
            const pos = marker.getLatLng();
            setIsUsingIpFallback(false);
            setCoords({ lat: pos.lat, lng: pos.lng });
            setLocationPinned(true);
            await reverseGeocode(pos.lat, pos.lng);
          } catch (err) {
            console.warn("Leaflet dragend handler error:", err);
          }
        });

        // Tap to drop pinpoint directly to clicked location
        map.on("click", async (e: any) => {
          try {
            const clickedLat = e.latlng.lat;
            const clickedLng = e.latlng.lng;
            
            setIsUsingIpFallback(false);
            setCoords({ lat: clickedLat, lng: clickedLng });
            setLocationPinned(true);

            if (marker) {
              marker.setLatLng([clickedLat, clickedLng]);
              if (!map.hasLayer(marker)) {
                marker.addTo(map);
              }
            }
            
            await reverseGeocode(clickedLat, clickedLng);
          } catch (err) {
            console.warn("Leaflet map click handler error:", err);
          }
        });

        mapRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.error("Failed to initialize Leaflet map:", err);
      }
    } else {
      // Cleanup leaflet map instance on unmount
      if (mapRef.current) {
        try {
          if (markerRef.current) {
            try {
              mapRef.current.removeLayer(markerRef.current);
            } catch (err) {}
          }
          try {
            mapRef.current.off();
          } catch (err) {}
          mapRef.current.remove();
        } catch (e) {
          console.warn("Leaflet map removal exception:", e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    }
  }, []);

  // Background Leaflet Map callback ref for Home and District Feed screens
  const bgMapContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      if (!(window as any).L) return;
      if (bgMapRef.current) {
        if (bgMapRef.current.getContainer() === el) {
          try {
            bgMapRef.current.invalidateSize();
          } catch (e) {
            console.warn("Error updating background map view:", e);
          }
          return;
        } else {
          try {
            bgMarkersRef.current.forEach((m: any) => {
              try {
                bgMapRef.current.removeLayer(m);
              } catch (err) {}
            });
            bgMarkersRef.current = [];
            try {
              bgMapRef.current.off();
            } catch (err) {}
            bgMapRef.current.remove();
          } catch (e) {
            console.warn("Background map removal exception:", e);
          }
          bgMapRef.current = null;
        }
      }

      const L = (window as any).L;
      try {
        const initZoom = isUsingIpFallback ? (coordsRef.current.lat === 20.0 && coordsRef.current.lng === 0.0 ? 2 : 5) : 15;
        const map = L.map(el, {
          zoomControl: false,
          attributionControl: false,
        }).setView([coordsRef.current.lat, coordsRef.current.lng], initZoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors © CartoDB",
        }).addTo(map);

        bgMapRef.current = map;
        updateBgMarkers();
      } catch (err) {
        console.error("Failed to initialize background map:", err);
      }
    } else {
      if (bgMapRef.current) {
        try {
          bgMarkersRef.current.forEach((m: any) => {
            try {
              bgMapRef.current.removeLayer(m);
            } catch (err) {}
          });
          bgMarkersRef.current = [];
          try {
            bgMapRef.current.off();
          } catch (err) {}
          bgMapRef.current.remove();
        } catch (e) {
          console.warn("Background map removal exception:", e);
        }
        bgMapRef.current = null;
      }
    }
  }, []);

  const updateBgMarkers = () => {
    const map = bgMapRef.current;
    if (!map || !(window as any).L) return;
    if (activeTab !== "home" && activeTab !== "my-reports") return;

    try {
      if (!map.getContainer()) return;
    } catch (e) {
      return;
    }

    const L = (window as any).L;

    const mapReports = isUsingIpFallback ? [] : reports.filter((r) => {
      if (showAllDistricts) return isReportInActiveDistrict(r);
      const d = getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude);
      return d <= 10;
    });

    const nextMarkers: any[] = [];
    const existingMarkersMap = new Map<string, any>();
    bgMarkersRef.current.forEach((m: any) => {
      if (m && m.reportId) {
        existingMarkersMap.set(m.reportId, m);
      }
    });

    mapReports.forEach((report) => {
      try {
        let pinClass = "glow-pin-info";
        if (report.status === "Resolved") {
          pinClass = "glow-pin-success";
        } else if (report.status === "Pending Approval" || report.severity === "Critical" || report.severity === "High") {
          pinClass = "glow-pin-alert";
        }

        const isAlreadyVouched = !!(currentUser && report.vouchedUserIds?.includes(currentUser.id));
        const currentVouches = report.vouchCount || 1;

        const popupContent = `
          <div class="p-1.5 min-w-[180px] font-mono">
            <h4 class="font-display font-black text-xs uppercase tracking-wide text-[#ff3b30]">${report.category === "other" && report.customCategoryLabel ? report.customCategoryLabel : report.category.split("_").join(" ")}</h4>
            <p class="text-[10px] text-zinc-300 mt-1.5 line-clamp-3">${report.description}</p>
            
            <div class="mt-2 text-[9px] text-zinc-400">
              <span class="text-zinc-500 font-sans">Reporter:</span> <strong class="text-zinc-300">Reporter #${report.id.slice(-6)}</strong>
            </div>

            <div class="mt-2.5 flex items-center justify-between text-[8px] uppercase tracking-wider text-zinc-400">
              <span class="font-bold border px-1 py-0.5 rounded ${
                report.status === "Resolved" ? "text-[#30d158] border-[#30d158]/30 bg-[#30d158]/10" : "text-[#ff3b30] border-[#ff3b30]/30 bg-[#ff3b30]/10"
              }">${report.status}</span>
              <span>${report.severity || "Medium"}</span>
            </div>

            ${
              isAlreadyVouched
                ? `
                  <div style="background:rgba(48,209,88,0.1); color:#30d158; border:1px solid rgba(48,209,88,0.2); padding:5px; border-radius:4px; font-family:monospace; font-size:9px; font-weight:bold; text-align:center; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:4px; width:100%;">
                    ✓ Already Verified (${currentVouches})
                  </div>
                `
                : `
                  <button onclick="window.vouchFromMap('${report.id}')" style="background:#ff3b30; color:white; border:none; padding:5px 8px; border-radius:4px; font-family:monospace; font-size:9px; font-weight:bold; cursor:pointer; margin-top:8px; display:inline-flex; align-items:center; gap:4px; width:100%; justify-content:center; transition: all 0.2s;" onmouseover="this.style.background='#ff453a'" onmouseout="this.style.background='#ff3b30'">
                    👍 Verify / Vouch (${currentVouches})
                  </button>
                `
            }
          </div>
        `;

        const existingMarker = existingMarkersMap.get(report.id);

        if (existingMarker) {
          const changed = 
            existingMarker.reportStatus !== report.status || 
            existingMarker.reportSeverity !== report.severity || 
            existingMarker.reportVouchCount !== currentVouches ||
            existingMarker.isVouched !== isAlreadyVouched;

          if (changed) {
            const icon = L.divIcon({
              className: "custom-div-icon",
              html: `<div class="${pinClass}"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });
            existingMarker.setIcon(icon);
            existingMarker.setPopupContent(popupContent);
            existingMarker.reportStatus = report.status;
            existingMarker.reportSeverity = report.severity;
            existingMarker.reportVouchCount = currentVouches;
            existingMarker.isVouched = isAlreadyVouched;
          }
          nextMarkers.push(existingMarker);
          existingMarkersMap.delete(report.id);
        } else {
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div class="${pinClass}"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([report.latitude, report.longitude], { icon })
            .addTo(map)
            .bindPopup(popupContent);

          marker.reportId = report.id;
          marker.reportStatus = report.status;
          marker.reportSeverity = report.severity;
          marker.reportVouchCount = currentVouches;
          marker.isVouched = isAlreadyVouched;

          nextMarkers.push(marker);
        }
      } catch (err) {
        console.warn("Error creating or updating background marker:", err);
      }
    });

    existingMarkersMap.forEach((oldMarker) => {
      try {
        if (map.hasLayer(oldMarker)) {
          map.removeLayer(oldMarker);
        }
      } catch (e) {
        console.warn("Error removing background marker:", e);
      }
    });

    bgMarkersRef.current = nextMarkers;
  };

  useEffect(() => {
    (window as any).vouchFromMap = (reportId: string) => {
      handleVouch(reportId);
    };
    return () => {
      delete (window as any).vouchFromMap;
    };
  }, []);

  useEffect(() => {
    if (activeTab === "home" || activeTab === "my-reports") {
      updateBgMarkers();
    }
  }, [reports, activeTab, currentUser, coords, showAllDistricts, isUsingIpFallback]);

  // Device Camera activation
  const startCamera = async (mode?: "user" | "environment") => {
    const activeMode = mode || facingMode;
    try {
      setIsCapturing(true);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: activeMode },
        audio: false,
      });
      setCameraStream(stream);
      setCameraPermission("Granted");
      
      // Delay slightly or wait to ensure videoRef DOM element is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      }, 100);
    } catch (err) {
      console.error("Camera getUserMedia failed:", err);
      setCameraPermission("Denied");
      setIsCapturing(false);
      showAlert("Live camera refused. Dropping back to standard picture or file uploads instead.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const toggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setImageData(dataUrl);
        } catch (e) {
          console.error("Canvas read failed, fallback file option", e);
        }
      }
      stopCamera();
    }
  };

  // Gallery file picker
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageData(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Optional Video Upload Handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showAlert("Video size exceeds the maximum limit (15MB) for mobile submissions.");
        return;
      }
      setVideoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setVideoData(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run image verification (Gemini backend verification vs custom client simulation fallback)
  const triggerVerifyImage = async () => {
    if (!imageData) return;

    setVerifying(true);
    setVerificationResult(null);
    setVerified(false);

    // AI Safety Simulator Mode if chosen manually or server lacks API key
    if (simulationMode || !serverKeyStatus) {
      setTimeout(() => {
        // Look at current image data bytes or simulate realistic civic recognition
        // Simply determine classification based on local factors, or randomly assign mock classes
        // to facilitate complete end-to-end user tests
        const mockCategories = ["pothole", "streetlight_issue", "water_leakage", "garbage_overflow", "broken_pavement", "not_a_civic_issue"];
        
        // We'll choose pothole mostly, unless it's a specific simulated item or chosen at random
        const index = Math.floor(Math.random() * (mockCategories.length - 1));
        const category = mockCategories[index];
        const confidence = Math.floor(Math.random() * 30) + 70; // 70 - 99%

        let explanation = "Visual simulator detected asphalt structural anomalies compatible with standard road potholes.";
        let autoDescription = "Large jagged street pothole visible in roadway causing a high risk of damage to tires.";
        
        if (category === "streetlight_issue") {
          explanation = "Detected damaged municipal grid lighting post or broken overhead lamp structure.";
          autoDescription = "Broken streetlight causing unsafe pedestrian corridor illumination.";
        } else if (category === "water_leakage") {
          explanation = "Classified pooling of clean water emitting directly from municipal pipeline fissure.";
          autoDescription = "Major water pipeline leakage, flooding roadway and sidewalk pathway.";
        } else if (category === "garbage_overflow") {
          explanation = "Identified solid waste overspill surrounding municipal public container.";
          autoDescription = "Overloaded biological waste collection container spilling trash material onto street.";
        } else if (category === "broken_pavement") {
          explanation = "Assessed uneven block layout of concrete sidewalk creating dangerous pedestrian tripping hazard.";
          autoDescription = "Cracked high-altitude pavement block hazard requiring fast repair.";
        }

        const simHash = "simhash_" + Math.random().toString(36).substring(7);

        setVerificationResult({
          category,
          confidence,
          explanation,
          autoDescription,
          imageHash: simHash,
          isDuplicate: false,
        });
        setManualCategory(category);
        setDescription(autoDescription);
        setVerifying(false);
        setVerified(true);
      }, 1500);
      return;
    }

    try {
      const res = await fetch("/api/verify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          mimeType: "image/jpeg",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isConfigError) {
          // Key was missing on server, auto fallback to client simulation so they don't lock
          setSimulationMode(true);
          setServerKeyStatus(false);
          showAlert("Server missing valid API secret. Direct Smart Simulator mode has been activated.");
          setTimeout(() => triggerVerifyImage(), 100);
          return;
        }

        // Trigger manual classification fallback if confidence is low, or if categorized as not_a_civic_issue
        if ((data.confidence || 0) < 70 || data.category === "not_a_civic_issue") {
          setManualCategory("pothole");
          setCustomCategoryText("");
          setShowManualClassificationModal(true);
          setClassificationMethod("manual");
        } else {
          setVerificationResult(data);
          setManualCategory(data.category);
          setCustomCategoryText("");
          setDescription(data.autoDescription || "");
          setClassificationMethod("ai");
          setVerified(true);
        }
      } else {
        setManualCategory("pothole");
        setCustomCategoryText("");
        setShowManualClassificationModal(true);
        setClassificationMethod("manual");
      }
    } catch (err: any) {
      console.error(err);
      setManualCategory("pothole");
      setCustomCategoryText("");
      setShowManualClassificationModal(true);
      setClassificationMethod("manual");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmManualClassification = () => {
    const selectedCategory = manualCategory || "pothole";
    
    if (selectedCategory === "other") {
      const trimmed = customCategoryText.trim();
      if (!trimmed) {
        showAlert("Please enter a custom description for the 'Other' category.");
        return;
      }
      if (trimmed.length > 50) {
        showAlert("Custom category label must be 50 characters or less.");
        return;
      }
    }

    const categoryLabel = selectedCategory === "other" ? customCategoryText.trim() : getCategoryLabel(selectedCategory);
    
    setVerificationResult({
      category: selectedCategory,
      confidence: 100,
      explanation: `Manually classified as ${categoryLabel}.`,
      autoDescription: `Citizen reported public hazard identified as ${categoryLabel}.`,
      imageHash: "manual_" + Date.now(),
      isDuplicate: false,
    });
    
    setDescription(`Citizen reported public hazard identified as ${categoryLabel}.`);
    setClassificationMethod("manual");
    setVerified(true);
    setShowManualClassificationModal(false);
  };

  // Submit Final Report
  const handleSubmitReport = async () => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in with Google to submit a civic report.");
      setAuthModalOpen(true);
      return;
    }

    const finalCategory = isOverriding ? manualCategory : verificationResult?.category;
    if (!finalCategory || finalCategory === "not_a_civic_issue") {
      showAlert("Invalid category selected. Cannot submit non-civic issues.");
      return;
    }

    if (finalCategory === "other") {
      const trimmed = customCategoryText.trim();
      if (!trimmed) {
        showAlert("Please enter a custom description for the 'Other' category.");
        return;
      }
      if (trimmed.length > 50) {
        showAlert("Custom category label must be 50 characters or less.");
        return;
      }
    }

    setSubmittingReport(true);
    setSubmittedId(null);

    const finalClassificationMethod: "ai" | "manual" = (isOverriding || classificationMethod === "manual") ? "manual" : "ai";

    const payload = {
      category: finalCategory,
      customCategoryLabel: finalCategory === "other" ? customCategoryText.trim() : undefined,
      confidence: verificationResult?.confidence || 100,
      description: description || "Reported public hazard",
      latitude: coords.lat,
      longitude: coords.lng,
      address: address || "GPS Pinpoint Coordinate",
      imageData: imageData,
      videoData: videoData,
      imageHash: verificationResult?.imageHash || "client_" + Date.now(),
      userId: currentUser?.id || "anonymous",
      userEmail: currentUser?.email || "anonymous",
      classificationMethod: finalClassificationMethod,
    };

    // --- OFFLINE ELEMENT INTEGRATION ---
    if (isOfflineMode) {
      const offlineId = `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const offlineItem = {
        ...payload,
        id: offlineId,
        status: "Submitted",
        createdAt: new Date().toISOString(),
        vouchCount: 1,
        timeline: [
          { stage: "Submitted", time: new Date().toISOString(), note: "Draft compiled offline. Added to the local outbox sync queue." }
        ],
        comments: [],
        severity: "Medium",
        landmarks: "Recorded while offline in the field",
        assignedDepartment: "Department of Public Works",
        slaDurationDays: 5,
        slaDueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
      };

      setOfflineQueue(prev => [...prev, offlineItem]);
      setReports(prev => [offlineItem as any, ...prev]);
      setSubmittedId(offlineId);
      setIsSubmitSuccessAnimating(true);

      setNotifications(prev => [
        {
          id: `noti-${Date.now()}`,
          title: "Offline Ticket Enqueued 📥",
          message: "No internet connection detected. Your ticket has been preserved in the outbox.",
          time: "Just now",
          read: false
        },
        ...prev
      ]);

      setTimeout(() => {
        setIsSubmitSuccess(true);
        resetFormState();
        setIsSubmitSuccessAnimating(false);
        setSubmittingReport(false);
        setActiveTab("my-reports");
      }, 2200);
      return;
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Add to client tab list
        setReports(prev => [result.report, ...prev]);

        setSubmittedId(result.report.id);
        setIsSubmitSuccessAnimating(true);

        setNotifications(prev => [
          {
            id: `noti-${Date.now()}`,
            title: "Report Submitted! 🚀",
            message: `Your ticket for a ${result.report.category.replace('_', ' ')} was dispatched successfully.`,
            time: "Just now",
            read: false
          },
          ...prev
        ]);

        // Refresh points and badges based on the newly submitted issue
        refreshUserData();

        setTimeout(() => {
          setIsSubmitSuccess(true);
          resetFormState();
          setIsSubmitSuccessAnimating(false);
          setSubmittingReport(false);
          setActiveTab("my-reports");
        }, 2200);
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert(`Failed to submit report: ${errData.error || "Server error"}`);
        setSubmittingReport(false);
      }
    } catch (err) {
      // client-only local submit if server backend fails
      const reportId = `REP-${Date.now()}`;
      const fallbackReport: Report = {
        ...payload,
        id: reportId,
        status: "Pending Approval",
        createdAt: new Date().toISOString(),
        isDuplicate: false,
        explanation: "Offline/Client fallback submission",
        vouchCount: 1,
        timeline: [
          { stage: "Pending Approval", time: new Date().toISOString(), note: "Report filed and compiled locally. Awaiting review." }
        ],
        comments: [],
        severity: "Medium",
        landmarks: "Vicinity of custom GPS pins",
        assignedDepartment: "Department of Public Works",
        slaDurationDays: 5,
        slaDueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
      };
      setReports(prev => [fallbackReport, ...prev]);
      setSubmittedId(reportId);
      setIsSubmitSuccessAnimating(true);

      // Offline fallback: no live XP sync

      setTimeout(() => {
        setIsSubmitSuccess(true);
        resetFormState();
        setIsSubmitSuccessAnimating(false);
        setSubmittingReport(false);
        setActiveTab("my-reports");
      }, 2200);
    }
  };

  const resetFormState = () => {
    setImageData("");
    setVideoData("");
    setVideoName("");
    setVerificationResult(null);
    setVerified(false);
    setClassificationMethod("ai");
    setLocationPinned(false);
    setIsOverriding(false);
    setDescription("");
  };

  // --- ADDED ACTION RUNNERS ---
  
  // 1. Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      showAlert("Offline queue is currently empty.");
      return;
    }
    
    let successCount = 0;
    const itemsToSync = [...offlineQueue];
    
    for (const item of itemsToSync) {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({
            ...item,
            userId: currentUser?.id || item.userId || "anonymous",
            userEmail: currentUser?.email || item.userEmail || "anonymous",
          })
        });

        if (res.ok) {
          const result = await res.json();
          // Remove from local reports matching OFF- IDs and insert the fresh server ticket
          setReports(prev => {
            const filtered = prev.filter(r => r.id !== item.id);
            return [result.report, ...filtered];
          });
          successCount++;
        }
      } catch (err) {
        console.warn("Failed syncing individual item in queue:", err);
      }
    }

    if (successCount > 0) {
      setOfflineQueue(prev => prev.slice(successCount));
      setNotifications(prev => [
        {
          id: `noti-${Date.now()}`,
          title: "Offline Sync Succeeded 📲",
          message: `Synchronized ${successCount} report(s) successfully with regional dispatch database.`,
          time: "Just now",
          read: false
        },
        ...prev
      ]);
      // Refresh points and badges after synchronizing queue
      refreshUserData();
      showAlert(`Successfully dispatched ${successCount} queued field report(s) online!`);
    } else {
      showAlert("Offline dispatch sync could not contact the server nodes. Try disabling offline mode.");
    }
    setIsOfflineMode(false);
  };

  // 2. Submit Comment
  const handlePostComment = async (reportId: string, text: string) => {
    if (!text.trim()) return;
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in with Google to post comments on reported issues.");
      setAuthModalOpen(true);
      return;
    }
    
    const authorName = currentUser ? currentUser.email.split("@")[0] : "Civic Guardian";

    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: authorName, text })
      });

      if (res.ok) {
        const data = await res.json();
        // Update reports list state
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return { ...r, comments: data.comments };
          }
          return r;
        }));
        
        // Clear input text
        setCommentsInput(prev => ({ ...prev, [reportId]: "" }));

        // Send alert
        setNotifications(prev => [
          {
            id: `noti-${Date.now()}`,
            title: "Comment Logged 💬",
            message: `You commented on ticket #${reportId.slice(-6)}.`,
            time: "Just now",
            read: false
          },
          ...prev
        ]);
      } else {
        // Local fallback (in-memory simulation)
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            const currentComments = r.comments || [];
            const mockCmt = {
              id: `CMT-${Date.now()}`,
              author: authorName,
              text,
              createdAt: new Date().toISOString()
            };
            return { ...r, comments: [...currentComments, mockCmt] };
          }
          return r;
        }));
        setCommentsInput(prev => ({ ...prev, [reportId]: "" }));
      }
    } catch {
      // Local fallback
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const currentComments = r.comments || [];
          const mockCmt = {
            id: `CMT-${Date.now()}`,
            author: authorName,
            text,
            createdAt: new Date().toISOString()
          };
          return { ...r, comments: [...currentComments, mockCmt] };
        }
        return r;
      }));
      setCommentsInput(prev => ({ ...prev, [reportId]: "" }));
    }
  };

  // 3. Vouch/Upvote
  const handleVouch = async (reportId: string) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in with Google to vouch for an issue.");
      setAuthModalOpen(true);
      return;
    }

    const targetReport = reports.find(r => r.id === reportId);
    if (!targetReport) return;

    const alreadyVouched = !!(currentUser && targetReport.vouchedUserIds?.includes(currentUser.id));
    if (alreadyVouched) {
      setVouchConfirmation({ reportId });
      return;
    }

    // Otherwise, immediate vouch (1st click)
    executeVouchReport(reportId, false);
  };

  const executeVouchReport = async (reportId: string, isRemoval: boolean) => {
    if (!currentUser) return;

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const endpoint = isRemoval 
        ? `/api/reports/${reportId}/unvouch`
        : `/api/reports/${reportId}/vouch`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return { 
              ...r, 
              vouchCount: data.report.vouchCount,
              vouchedUserIds: data.report.vouchedUserIds,
              status: data.report.status,
              timeline: data.report.timeline
            };
          }
          return r;
        }));

        // Refresh user points and leaderboard immediately
        refreshUserData();

        if (isRemoval) {
          showAlert("Your vouch has been removed successfully.");
        } else {
          if (data.statusChanged) {
            setNotifications(prev => [
              {
                id: `noti-${Date.now()}`,
                title: "Threshold Achieved 🛡️",
                message: `Ticket #${reportId.slice(-6)} escalated to Verified. Dispatch assigned.`,
                time: "Just now",
                read: false
              },
              ...prev
            ]);
          }

          setNotifications(prev => [
            {
              id: `noti-${Date.now()}`,
              title: "Vouch Confirmed 👍",
              message: "You backed this report. Points added to Civic profile.",
              time: "Just now",
              read: false
            },
            ...prev
          ]);
        }
      } else {
        // Fallback vouch/unvouch
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            const currentVouches = isRemoval 
              ? Math.max(0, (r.vouchCount || 0) - 1)
              : (r.vouchCount || 0) + 1;
            const newStatus = !isRemoval && currentVouches >= 3 && r.status === "Submitted" ? "Verified" : r.status;
            const timeline = r.timeline || [];
            return {
              ...r,
              vouchCount: currentVouches,
              vouchedUserIds: isRemoval 
                ? (r.vouchedUserIds || []).filter(uid => uid !== currentUser.id)
                : [...(r.vouchedUserIds || []), currentUser.id],
              status: newStatus as any,
              timeline: [
                ...timeline,
                { 
                  stage: isRemoval ? "Unvouched" : "Vouched", 
                  time: new Date().toISOString(), 
                  note: `${isRemoval ? "Vouch removal" : "Vouch"} acknowledged client-side. Vouches: ${currentVouches}` 
                }
              ]
            };
          }
          return r;
        }));
      }
    } catch {
      // Fallback
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const currentVouches = isRemoval 
            ? Math.max(0, (r.vouchCount || 0) - 1)
            : (r.vouchCount || 0) + 1;
          const newStatus = !isRemoval && currentVouches >= 3 && r.status === "Submitted" ? "Verified" : r.status;
          return {
            ...r,
            vouchCount: currentVouches,
            vouchedUserIds: isRemoval 
              ? (r.vouchedUserIds || []).filter(uid => uid !== currentUser.id)
              : [...(r.vouchedUserIds || []), currentUser.id],
            status: newStatus as any
          };
        }
        return r;
      }));
    }
  };

  // Community Poll Nomination
  const handleNominate = async (reportId: string) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in to nominate an issue for the community poll.");
      setAuthModalOpen(true);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/reports/${reportId}/nominate`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
        refreshUserData();
        showAlert("Issue nominated for Community Polls successfully! 👍");
      } else {
        const errData = await res.json();
        showAlert(errData.error || "Failed to nominate issue.");
      }
    } catch (e) {
      // Fallback
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            nominatedAt: new Date().toISOString(),
            nominatedByUserId: currentUser.id,
            pollVotes: 1,
            pollVotedUserIds: [currentUser.id]
          };
        }
        return r;
      }));
      showAlert("Issue nominated for Community Polls (local simulation)! 👍");
    }
  };

  // Vote for Nominated Issue
  const handlePollVote = async (reportId: string) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in to vote for a community priority.");
      setAuthModalOpen(true);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/reports/${reportId}/poll-vote`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
        refreshUserData();
        showAlert("Your priority vote has been cast! 🗳️");
      } else {
        const errData = await res.json();
        showAlert(errData.error || "Failed to submit vote.");
      }
    } catch (e) {
      // Fallback
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const pollVotedUserIds = r.pollVotedUserIds || [];
          if (pollVotedUserIds.includes(currentUser.id)) {
            showAlert("You have already voted for this issue.");
            return r;
          }
          return {
            ...r,
            pollVotes: (r.pollVotes || 0) + 1,
            pollVotedUserIds: [...pollVotedUserIds, currentUser.id]
          };
        }
        return r;
      }));
      showAlert("Your priority vote has been cast (local simulation)! 🗳️");
    }
  };

  // 4. Flag False / Spam Reports
  const handleFlagReport = async (reportId: string) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in with Google to flag a report as spam.");
      setAuthModalOpen(true);
      return;
    }

    const targetReport = reports.find(r => r.id === reportId);
    if (!targetReport) return;

    const isAlreadyFlagged = !!(targetReport.flaggedUserIds?.includes(currentUser.id));
    setFlagConfirmation({
      reportId,
      isRemoval: isAlreadyFlagged
    });
  };

  const executeFlagReport = async (reportId: string, isRemoval: boolean) => {
    if (!currentUser) return;

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const endpoint = isRemoval 
        ? `/api/reports/${reportId}/unflag`
        : `/api/reports/${reportId}/flag`;

      const res = await fetch(endpoint, { 
        method: "POST",
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? { 
          ...r, 
          flagCount: data.report.flagCount, 
          flaggedUserIds: data.report.flaggedUserIds,
          timeline: data.report.timeline 
        } : r));
        
        if (isRemoval) {
          showAlert("Your spam flag has been removed successfully.");
        } else {
          showAlert("Report has been flagged. Administrators and moderation systems have been notified.");
          setNotifications(prev => [
            {
              id: `noti-${Date.now()}`,
              title: "Flag Logged ⚠️",
              message: `Report #${reportId.slice(-6)} flagged for system audit.`,
              time: "Just now",
              read: false
            },
            ...prev
          ]);
        }
      } else {
        const errText = await res.text();
        console.error(`Failed to ${isRemoval ? "unflag" : "flag"} report on server:`, errText);
        // Optimistic local update as fallback
        setReports(prev => prev.map(r => r.id === reportId ? { 
          ...r, 
          flagCount: isRemoval ? Math.max(0, (r.flagCount || 0) - 1) : (r.flagCount || 0) + 1,
          flaggedUserIds: isRemoval 
            ? (r.flaggedUserIds || []).filter(uid => uid !== currentUser.id)
            : [...(r.flaggedUserIds || []), currentUser.id]
        } : r));
        showAlert(`Request failed. Note: server returned status ${res.status} - ${errText}`);
      }
    } catch (err: any) {
      console.error(`Error ${isRemoval ? "unflagging" : "flagging"} report:`, err);
      // Optimistic local update as fallback
      setReports(prev => prev.map(r => r.id === reportId ? { 
        ...r, 
        flagCount: isRemoval ? Math.max(0, (r.flagCount || 0) - 1) : (r.flagCount || 0) + 1,
        flaggedUserIds: isRemoval 
          ? (r.flaggedUserIds || []).filter(uid => uid !== currentUser.id)
          : [...(r.flaggedUserIds || []), currentUser.id]
      } : r));
      showAlert(`Request failed. Note: network request failed - ${err.message || err}`);
    }
  };

  // 5. Escalate Past SLA Timeout
  const handleEscalateReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/escalate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isEscalated: true, timeline: data.report.timeline } : r));
      } else {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isEscalated: true } : r));
      }

      setNotifications(prev => [
        {
          id: `noti-${Date.now()}`,
          title: "Breach Escalated! ⚡",
          message: `Ticket #${reportId.slice(-6)} escalated due to SLA backlog.`,
          time: "Just now",
          read: false
        },
        ...prev
      ]);
      showAlert("Ticket escalated. Sent alert notifications to District Engineering Supervisors.");
    } catch {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, isEscalated: true } : r));
    }
  };

  // 6. Admin Action Resolve (Upload After photo & Note)
  const handleAdminResolve = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!resolvingId) return;

    setResolvingLoading(true);

    try {
      const res = await fetch(`/api/reports/${resolvingId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afterImageData: resolvingAfterImage || "MOCK_RESOLVED_AFTER",
          note: resolvingNote || "Remedial construction completed. Materials standard checklist fulfilled."
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === resolvingId ? { 
          ...r, 
          status: "Resolved", 
          afterImageData: data.report.afterImageData, 
          timeline: data.report.timeline 
        } : r));

        setNotifications(prev => [
          {
            id: `noti-${Date.now()}`,
            title: "Work Order Completed 🏗️",
            message: `Ticket #${resolvingId.slice(-6)} resolved. Awaiting citizen inspection.`,
            time: "Just now",
            read: false
          },
          ...prev
        ]);
        
        // Reset states
        setResolvingId(null);
        setResolvingNote("");
        setResolvingAfterImage("");
        showAlert("Report marked as Resolved by municipal operator!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingLoading(false);
    }
  };

  // 7. Citizen Loop Confirm Resolution closure
  const handleCitizenConfirm = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/citizen-confirm`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? { 
          ...r, 
          citizenConfirmed: true, 
          timeline: data.report.timeline 
        } : r));
      } else {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, citizenConfirmed: true } : r));
      }

      setNotifications(prev => [
        {
          id: `noti-${Date.now()}`,
          title: "Civic Circle Closed! 🌟",
          message: `You verified resolution for ticket #${reportId.slice(-6)}.`,
          time: "Just now",
          read: false
        },
        ...prev
      ]);

      // Refresh user points and badges
      refreshUserData();

      showAlert("Thank you! Loop officially closed. Verified construction resolution archived.");
    } catch {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, citizenConfirmed: true } : r));
    }
  };

  // 8. SMS Chatbot Message Processor with Live Gemini Intake
  const handleSmsReportSubmit = async (
    category: string,
    description: string,
    location: string,
    severity: "Low" | "Medium" | "High" | "Critical",
    imageData?: string,
    imageHash?: string,
    confidence?: number
  ) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthError("You must sign in with Google to submit or process civic tickets.");
      setAuthModalOpen(true);
      throw new Error("Authentication Required — Please log in or register a citizen profile.");
    }

    if (!imageData || imageData === "SMS_REPORTER_MOCK") {
      throw new Error("Verification error: A real verified photo is required to submit a report.");
    }

    const payload = {
      category,
      confidence: confidence || 90,
      description: description + " [Reported via SMS Chatbot]",
      latitude: coords.lat + (Math.random() - 0.5) * 0.01,
      longitude: coords.lng + (Math.random() - 0.5) * 0.01,
      address: location || "Regional Ward Grid",
      imageData: imageData,
      imageHash: imageHash || "sms_" + Date.now(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      landmarks: location || "SMS Specified location",
      severity: severity || "Medium",
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setReports(prev => [result.report, ...prev]);
        setNotifications(prev => [
          {
            id: `noti-${Date.now()}`,
            title: "SMS Bot Report Lodged 📱",
            message: `SMS/WhatsApp chatbot filed ticket #${result.report.id.slice(-6)}.`,
            time: "Just now",
            read: false
          },
          ...prev
        ]);
        refreshUserData();
        return result.report;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Failed to submit via SMS chatbot backend:", err);
      showAlert(err.message || "Failed to submit SMS report. Security verification active.");
      throw err;
    }
  };

  // --- AUTH RUNNERS ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, name: authName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("civic-user", JSON.stringify(data.user));
        localStorage.setItem("civic-token", data.token);
        setAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        fetchDbUsers();
      } else {
        setAuthError(data.error || "Signup failed.");
      }
    } catch (err) {
      setAuthError("Registering offline profile (demo mode).");
      const mockUser = { id: `USR-${Date.now()}`, email: authEmail, name: authName || authEmail.split("@")[0] };
      setCurrentUser(mockUser);
      setAuthToken(`mock_token_${mockUser.id}`);
      localStorage.setItem("civic-user", JSON.stringify(mockUser));
      localStorage.setItem("civic-token", `mock_token_${mockUser.id}`);
      setAuthModalOpen(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) {
      setAuthError("Please fill in email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("civic-user", JSON.stringify(data.user));
        localStorage.setItem("civic-token", data.token);
        setAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        fetchDbUsers();
      } else {
        setAuthError(data.error || "Invalid user credentials.");
      }
    } catch (err) {
      // offline login fallback for test user
      if (authEmail === "test@example.com" && authPassword === "password123") {
        const mockUser = { id: "USR-11111111111", email: authEmail, name: "Test Officer" };
        setCurrentUser(mockUser);
        setAuthToken(`mock_token_${mockUser.id}`);
        localStorage.setItem("civic-user", JSON.stringify(mockUser));
        localStorage.setItem("civic-token", `mock_token_${mockUser.id}`);
        setAuthModalOpen(false);
      } else {
        setAuthError("Incorrect password. Use password123 as test password.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;
      if (!email) {
        throw new Error("No email address associated with this Google Account.");
      }
      const name = user.displayName || email.split("@")[0];
      const photoURL = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, photoURL }),
      });
      
      const responseText = await res.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error(`Server returned a non-JSON response (Status ${res.status}). The server might be misconfigured, offline, or returning an HTML error page. Response prefix: ${responseText.slice(0, 100)}`);
      }

      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("civic-user", JSON.stringify(data.user));
        localStorage.setItem("civic-token", data.token);
        setAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        fetchDbUsers();
      } else {
        setAuthError(data.error || `Google authentication failed on server (Status ${res.status}).`);
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      const isInIframe = window.self !== window.top;
      if (err?.code === "auth/popup-closed-by-user") {
        if (isInIframe) {
          setAuthError("Google Sign-In popup was closed or blocked. Note: Inside the AI Studio preview iframe, browser policies block authentication popups. Please click the 'Open in New Tab' icon at the top-right of your preview to sign in, or use email/password instead.");
        } else {
          setAuthError("Sign-in popup was closed before completion.");
        }
      } else if (err?.code === "auth/cancelled-popup-request") {
        setAuthError("Multiple sign-in attempts detected. Please try again.");
      } else if (err?.code === "auth/popup-blocked") {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups or use email/password.");
      } else {
        setAuthError(err.message || "Google authentication failed.");
      }
    } finally {
      setAuthLoading(false);
    }
  };



  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem("civic-user");
    localStorage.removeItem("civic-token");
    setFeedFilter("all");
  };

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      showAlert("Display Name cannot be empty.");
      return;
    }

    setProfileUpdating(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: profileName,
          photoURL: profilePhoto
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("civic-user", JSON.stringify(data.user));
          showAlert("Your citizen profile has been updated successfully!");
          fetchDbUsers();
        } else {
          showAlert(data.error || "Profile update failed.");
        }
      } else {
        showAlert("Failed to update profile. Server returned an error.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showAlert("An error occurred while saving your profile changes.");
    } finally {
      setProfileUpdating(false);
    }
  };

  // --- ADMIN MOUNT MODERATION ---
  const handleApproveReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ 
          status: "In Review",
          note: "Civil report reviewed by department supervisor. Assigned to crew." 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
      } else {
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              status: "In Review",
              timeline: [...(r.timeline || []), {
                stage: "In Review",
                time: new Date().toISOString(),
                note: "Citizen approved in simulation queue. Assessed and ready."
              }]
            };
          }
          return r;
        }));
      }
    } catch (e) {
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: "In Review",
            timeline: [...(r.timeline || []), {
              stage: "In Review",
              time: new Date().toISOString(),
              note: "Citizen approved in offline mode. Verified."
            }]
          };
        }
        return r;
      }));
    }
  };

  const handleMergeDuplicate = async (reportId: string, originalId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/merge`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ originalId }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => {
          if (r.id === reportId) return data.report;
          if (r.id === originalId) return data.original;
          return r;
        }));
        showAlert(`Merged duplicate ticket with Master ticket #${originalId.substring(4, 11)} successfully!`);
      } else {
        performOfflineMerge(reportId, originalId);
      }
    } catch (e) {
      performOfflineMerge(reportId, originalId);
    }
  };

  const performOfflineMerge = (reportId: string, originalId: string) => {
    setReports(prev => {
      const original = prev.find(r => r.id === originalId);
      const originalStatus = original ? original.status : "In Review";
      const mergeTime = new Date().toISOString();
      return prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            isDuplicate: true,
            duplicateOfId: originalId,
            status: originalStatus,
            timeline: [...(r.timeline || []), {
              stage: "Merged",
              time: mergeTime,
              note: `Offline consolidated duplicate, synced with ticket #${originalId}.`
            }]
          };
        }
        if (r.id === originalId) {
          return {
            ...r,
            timeline: [...(r.timeline || []), {
              stage: "Duplicate Linked",
              time: mergeTime,
              note: `Offline consolidated duplicate ticket #${reportId}.`
            }]
          };
        }
        return r;
      });
    });
    showAlert(`Merged duplicate ticket in offline mode.`);
  };

  const handleUnlinkDuplicate = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/unlink`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
        showAlert("Marked as separate independent hazard. Duplication flag successfully removed.");
      } else {
        performOfflineUnlink(reportId);
      }
    } catch (e) {
      performOfflineUnlink(reportId);
    }
  };

  const performOfflineUnlink = (reportId: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          isDuplicate: false,
          duplicateOfId: undefined,
          duplicateReason: undefined,
          timeline: [...(r.timeline || []), {
            stage: "Unlinked",
            time: new Date().toISOString(),
            note: "Offline unlinked and processed as an independent civic issue."
          }]
        };
      }
      return r;
    }));
    showAlert("Duplicate flag removed in offline mode.");
  };

  // Mock Admin State Toggle (Status changer to test flow)
  const toggleReportStatus = async (reportId: string, currentStatus: string) => {
    const statusSequence = ["Pending Approval", "Submitted", "In Review", "Scheduled for Repair", "Resolved"];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    const nextStatus = statusSequence[nextIndex];

    const getTimelineNote = (status: string) => {
      switch (status) {
        case "Submitted": return "Citizen's report approved and compiled under main service register.";
        case "In Review": return "Municipality engineer assigned to assess the on-site structure damage.";
        case "Scheduled for Repair": return "Repair schedule assigned. Public Works crew ordered to dispatch.";
        case "Resolved": return "Crew dispatched. Repairs finished and verified by Public Works.";
        default: return "Status reset to Pending Approval by district supervisor.";
      }
    };

    const newLog = {
      stage: nextStatus,
      time: new Date().toISOString(),
      note: getTimelineNote(nextStatus)
    };

    // Inform server of status shift
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ status: nextStatus, note: getTimelineNote(nextStatus) }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
      } else {
        // mock locally
        setReports(prev => 
          prev.map(r => r.id === reportId ? { 
            ...r, 
            status: nextStatus as any,
            timeline: r.timeline ? [...r.timeline, newLog] : [newLog]
          } : r)
        );
      }
    } catch (e) {
      // Local shift
      setReports(prev => 
        prev.map(r => r.id === reportId ? { 
          ...r, 
          status: nextStatus as any,
          timeline: r.timeline ? [...r.timeline, newLog] : [newLog]
        } : r)
      );
    }
  };

  // Community voucher handler has been upgraded to API sync mode at the top level.
  const handleVouchOld = (reportId: string) => {
    handleVouch(reportId);
  };

  const getCategoryThemeColor = (cat: string) => {
    switch (cat) {
      case "pothole": return "from-accent-alert to-accent-alert/80 bg-accent-alert/10 text-accent-alert border-accent-alert/20";
      case "streetlight_issue": return "from-accent-alert/90 to-accent-alert/75 bg-accent-alert/5 text-accent-alert border-accent-alert/10";
      case "water_leakage": return "from-accent-info to-accent-info/80 bg-accent-info/10 text-accent-info border-accent-info/20";
      case "garbage_overflow": return "from-accent-info/90 to-accent-info/70 bg-accent-info/5 text-accent-info border-accent-info/15";
      case "broken_pavement": return "from-accent-alert/85 to-accent-info/85 bg-accent-info/5 text-accent-alert border-accent-info/10";
      default: return "from-zinc-700 to-zinc-800 bg-zinc-950 text-text-muted border-zinc-900";
    }
  };

  const getCategoryLabel = (cat: string) => {
    return cat
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isAnyOverlayOpen = isSidebarOpen || isSettingsModalOpen || authModalOpen || resolvingId !== null || toastMessage !== null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-bg-primary text-text-primary relative transition-colors duration-200">
      {/* Full-bleed background map for Home and Feed */}
      {(activeTab === "home" || activeTab === "my-reports") && (
        <div 
          key={activeTab === "home" ? "bg-map-home" : "bg-map-feed"}
          ref={bgMapContainerRef} 
          className={`absolute inset-0 w-full h-full z-0 pointer-events-auto transition-opacity duration-300 ${
            activeTab === "home" ? "opacity-100" : "opacity-60"
          }`}
          id="background-fullbleed-map"
        />
      )}
      {/* SideBar Drawer */}
      <SideBar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthMode("login");
          setAuthError("");
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onNavigate={(tab, filter) => {
          setActiveTab(tab);
          if (filter) {
            setFeedFilter(filter);
          }
        }}
        activeTab={activeTab}
        feedFilter={feedFilter}
        reports={reports}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Settings & Account Overlay Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthMode("login");
          setAuthError("");
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode(prev => !prev)}
        language={language}
        onLanguageChange={setLanguage}
        profileName={profileName}
        setProfileName={setProfileName}
        profilePhoto={profilePhoto}
        setProfilePhoto={setProfilePhoto}
        profileUpdating={profileUpdating}
        onUpdateProfile={handleUpdateProfile}
        userLevel={userLevel}
        onUpdateLocationClick={() => {
          if (!currentUser) {
            setAuthMode("login");
            setAuthError("Please sign in to configure a permanent base location.");
            setAuthModalOpen(true);
          } else {
            setShowManualLocationModal(true);
          }
        }}
      />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-card/90 border-b border-zinc-800/80 px-4 py-3 safe-top flex items-center justify-between text-text-primary">
        <div className="flex items-center gap-1.5">
          {/* Hamburger Menu Trigger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer mr-0.5"
            id="sidebar-trigger-btn"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center">
            <h1 className="text-md font-display font-bold uppercase tracking-wide text-slate-900 dark:text-white leading-none">CityFix</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status Dot */}
          <button 
            onClick={() => setIsOfflineMode(prev => !prev)}
            className="flex items-center justify-center p-2 rounded-sm bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all border border-transparent dark:border-slate-800/40 relative cursor-pointer active:scale-95"
            title={
              isOfflineMode 
                ? "Simulated Offline Mode (Tap to toggle Online)" 
                : !isBrowserOnline 
                ? "Network Offline (Device is disconnected)" 
                : !wsConnected 
                ? "Connecting to WebSocket/Leaderboard Server..." 
                : "Real-time Dispatch Server Connected"
            }
            id="connection-status-dot-btn"
          >
            <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.15)] ${
              isOfflineMode 
                ? "bg-[#ff453a] animate-pulse shadow-[#ff453a]/50" 
                : !isBrowserOnline 
                ? "bg-zinc-500 shadow-zinc-500/50" 
                : !wsConnected 
                ? "bg-amber-500 animate-bounce shadow-amber-500/50" 
                : "bg-[#30d158] shadow-[#30d158]/50"
            }`} />
          </button>

          {/* Recenter & Location Dropdown Button */}
          <div className="relative" id="map-recenter-dropdown-container">
            <button
              onClick={() => {
                // If signed in, toggle the dropdown; otherwise, just trigger the active map recentering immediately!
                if (currentUser) {
                  setIsRecenterDropdownOpen(prev => !prev);
                } else {
                  handleRecenterMapToActive();
                }
              }}
              className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-transparent dark:border-slate-800/40 flex items-center justify-center relative active:scale-95"
              title="Recenter map to your location"
              id="map-recenter-btn"
            >
              <Locate className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Dropdown Menu for Signed-in Users */}
            {currentUser && isRecenterDropdownOpen && (
              <>
                {/* Click outside to close */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsRecenterDropdownOpen(false)} 
                />
                
                <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-50 py-1.5 text-xs text-left animate-fadeIn font-mono">
                  <div className="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Map Actions & Locations
                  </div>
                  
                  {/* Option 1: Live GPS Recenter */}
                  <button
                    onClick={() => {
                      handleRecenterMapToActive();
                      setIsRecenterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#ff453a] shrink-0" />
                    <span className="font-semibold text-[11px]">Recenter to GPS Location</span>
                  </button>

                  {/* Option 2: Saved / Used Locations List */}
                  {userLocationsList.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <div className="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Saved / Used Locations
                      </div>
                      {userLocationsList.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectDropdownLocation(loc.lat, loc.lng, loc.name)}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${loc.type === "base" ? "text-emerald-500" : "text-slate-400"}`} />
                          <div className="truncate flex-1">
                            <p className="font-medium text-[11px] truncate">{loc.name.split(",")[0]}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {loc.type === "base" ? "Permanent Base" : "Used in Report"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Option 3: Enter New Location Autocomplete flow */}
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsNewLocationFromRecenterDropdown(true);
                        setIsRecenterDropdownOpen(false);
                        setShowManualLocationModal(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-[#ff453a] dark:text-[#ff453a] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold text-[11px]">Enter New Location</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Notification Shortcut */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all relative cursor-pointer border border-transparent dark:border-slate-800/40 flex items-center justify-center"
            title="View notifications in drawer"
            id="notifications-bell-btn"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#ff453a] rounded-sm border border-white dark:border-[#0a0a0f]" />
            )}
          </button>

          {/* User profile identifier / logout action */}
          {currentUser && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-7 h-7 rounded-sm bg-[#ff453a] hover:bg-[#ff3b30] text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm border border-[#ff453a]/20 cursor-pointer transition-all active:scale-95 shrink-0"
              title="View your citizen account"
              id="header-profile-shortcut"
            >
              {currentUser.email[0].toUpperCase()}
            </button>
          )}
        </div>
      </header>

      {/* Offline Sync Bar Alerts */}
      {offlineQueue.length > 0 && (
        <div className="bg-accent-alert text-white px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-between gap-2 shadow-inner border-b border-zinc-950 animate-pulse z-40">
          <div className="flex items-center gap-1.5 mx-auto">
            <WifiOff className="w-4 h-4" />
            <span>You have {offlineQueue.length} report(s) drafted offline. Connect online and sync payload to dispatch.</span>
            <button 
              onClick={syncOfflineQueue}
              className="ml-3 bg-white text-accent-alert px-3 py-1 rounded-sm text-xs font-bold hover:bg-neutral-100 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              Sync Now
            </button>
          </div>
        </div>
      )}
      
      {isOfflineMode && (
        <div className="bg-accent-alert text-white px-4 py-1 flex items-center justify-center gap-2 z-40">
          <span className="text-[9px] font-bold tracking-wider animate-pulse font-mono uppercase">● NETWORK SIMULATION OFFLINE — SUBMITTED REPORTS GO TO OUTBOX QUEUE</span>
        </div>
      )}

      {/* Main Container Content */}
      <main className={`flex-1 w-full relative z-10 ${
        (activeTab === "home")
          ? "pointer-events-none overflow-hidden h-full flex flex-col justify-end pb-16 px-0 pt-0"
          : `${isAnyOverlayOpen ? "overflow-hidden" : "overflow-y-auto"} max-w-lg mx-auto px-4 py-4 pb-24`
      }`}>
        <AnimatePresence mode="wait">
          
          {/* HOME TAB */}
          {activeTab === "home" && (() => {
            const homeReports = isUsingIpFallback ? [] : reports.filter((r) => {
              if (showAllDistricts) return isReportInActiveDistrict(r);
              const d = getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude);
              return d <= 10;
            });

            const sortedHomeReports = [...homeReports].sort((a, b) => {
              if (sortBy === "distance") {
                const distA = getDistanceKm(coords.lat, coords.lng, a.latitude, a.longitude);
                const distB = getDistanceKm(coords.lat, coords.lng, b.latitude, b.longitude);
                return distA - distB;
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            const toggleSheet = () => {
              setIsSheetExpanded(prev => !prev);
            };

            const sheetVariants = {
              hidden: { y: "100%", opacity: 0 },
              expanded: { y: 0, opacity: 1 },
              collapsed: { y: "78%", opacity: 1 }
            };

            const sheetTransition = {
              type: "spring",
              damping: 24,
              stiffness: 180
            };

            return (
              <motion.div
                key="home-tab"
                initial="hidden"
                animate={isSheetExpanded ? "expanded" : "collapsed"}
                exit="hidden"
                variants={sheetVariants}
                transition={sheetTransition}
                drag="y"
                dragConstraints={isSheetExpanded ? { top: 0, bottom: 350 } : { top: -350, bottom: 0 }}
                dragElastic={0.15}
                onDragEnd={(event, info) => {
                  if (info.offset.y < -50) {
                    setIsSheetExpanded(true);
                  } else if (info.offset.y > 50) {
                    setIsSheetExpanded(false);
                  }
                }}
                className={`pointer-events-auto flex flex-col h-[42vh] max-h-[42vh] w-full bg-[#16161d]/90 dark:bg-[#16161d]/95 backdrop-blur-md border border-zinc-800/80 rounded-t-xl p-4 pt-1 space-y-3.5 shadow-2xl relative z-10 no-scrollbar ${
                  isSheetExpanded ? "overflow-y-auto" : "overflow-hidden"
                }`}
                id="home-bottom-sheet"
              >
                {/* Drag Handle & Arrow Toggle Header */}
                <div 
                  className="w-full pt-2.5 pb-2 flex flex-col items-center justify-center cursor-pointer select-none shrink-0"
                  onClick={toggleSheet}
                  id="bottom-sheet-drag-header"
                >
                  <div className="w-12 h-1 bg-zinc-700 rounded-full mb-1.5 opacity-60 hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-[10px] uppercase font-mono tracking-widest transition-colors">
                    {isSheetExpanded ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-accent-alert animate-bounce" />
                        <span>Collapse Feed</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-accent-alert animate-bounce" />
                        <span>Expand Feed</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status and Analytics Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-bg-card border border-zinc-800/80 p-3.5 rounded-sm flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono">All Submissions</span>
                      <Activity className="w-4 h-4 text-accent-alert" />
                    </div>
                    <div className="mt-2.5">
                      <span className="text-3xl font-extrabold font-display text-text-primary leading-none block">{homeReports.length}</span>
                      <p className="text-[10px] text-text-muted mt-1 font-mono">{showAllDistricts ? "Live community reports logged" : "Active issues in 10km radius"}</p>
                    </div>
                  </div>

                  <div className="bg-bg-card border border-zinc-800/80 p-3.5 rounded-sm flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Resolution Rate</span>
                      <Award className="w-4 h-4 text-[#30d158]" />
                    </div>
                    <div className="mt-2.5">
                      <span className="text-3xl font-extrabold font-display text-[#30d158] leading-none block">
                        {homeReports.length > 0 ? Math.round((homeReports.filter(r => r.status === "Resolved").length / homeReports.length) * 100) : 0}%
                      </span>
                      <p className="text-[10px] text-text-muted mt-1 font-mono font-normal">Fixed municipality tasks</p>
                    </div>
                  </div>
                </div>

                {/* Recent System Submissions list */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center justify-between sticky top-0 bg-[#16161d]/10 backdrop-blur-md py-1 z-10">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xs text-text-muted tracking-widest uppercase">Active Dispatch Feed</h3>
                      {!isUsingIpFallback && (
                        <button
                          onClick={() => setShowAllDistricts(prev => !prev)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                            showAllDistricts
                              ? "bg-accent-alert/10 text-accent-alert border-accent-alert/20"
                              : "bg-zinc-900 text-text-muted border-zinc-800 hover:text-text-primary"
                          }`}
                          title={showAllDistricts ? "Switch to Local Area Feed" : "Show All Districts"}
                        >
                          {showAllDistricts ? "All Districts" : "Nearby Only"}
                        </button>
                      )}
                    </div>
                    {!isUsingIpFallback && (
                      <button onClick={() => setActiveTab("my-reports")} className="text-xs font-bold text-accent-alert hover:text-accent-alert/80 uppercase tracking-wider font-mono flex items-center gap-0.5 cursor-pointer">
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {isUsingIpFallback ? (
                      <div className="text-center py-6 bg-bg-card border border-zinc-800 rounded-sm px-4">
                        <MapPin className="w-8 h-8 text-accent-alert mx-auto animate-pulse" />
                        <p className="text-xs font-bold mt-2.5 text-text-primary">Precise Location Required</p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal max-w-xs mx-auto">
                          Enter your precise location to see active dispatch issues in your local area.
                        </p>
                        <div className="mt-3.5 flex items-center justify-center gap-2">
                          <button
                            onClick={handleUseCurrentLocation}
                            className="bg-accent-alert hover:bg-accent-alert/85 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                          >
                            Use GPS
                          </button>
                          <button
                            onClick={() => setShowManualLocationModal(true)}
                            className="bg-zinc-900 hover:bg-zinc-850 text-text-primary border border-zinc-800 text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                          >
                            Set Address
                          </button>
                        </div>
                      </div>
                    ) : sortedHomeReports.length === 0 ? (
                      <div className="text-center py-6 bg-bg-card border border-zinc-800 rounded-sm">
                        <Activity className="w-8 h-8 text-text-muted mx-auto animate-pulse" />
                        <p className="text-xs font-semibold mt-2 text-text-primary">No active reports nearby</p>
                      </div>
                    ) : (
                      sortedHomeReports.slice(0, 3).map((report) => {
                        const isResolved = report.status === "Resolved";
                        const isInReview = report.status === "In Review" || report.status === "Scheduled for Repair";
                        const statusBorderColor = isResolved 
                          ? "border-l-accent-success" 
                          : isInReview 
                            ? "border-l-accent-info" 
                            : "border-l-accent-alert";
                        const statusBadgeColor = isResolved 
                          ? "bg-accent-success/10 text-accent-success border-accent-success/30" 
                          : isInReview 
                            ? "bg-accent-info/10 text-accent-info border-accent-info/30" 
                            : "bg-accent-alert/10 text-accent-alert border-accent-alert/30";

                        return (
                          <div 
                            key={report.id} 
                            onClick={() => {
                              if (bgMapRef.current) {
                                bgMapRef.current.setView([report.latitude, report.longitude], 15);
                              }
                              setResolvingId(report.id);
                              setResolvingNote("");
                              setResolvingAfterImage("");
                            }}
                            className={`bg-bg-card border border-zinc-800/80 border-l-4 ${statusBorderColor} rounded-sm p-3 flex gap-3 shadow-none cursor-pointer hover:bg-zinc-900/40 transition-colors duration-200 select-none`}
                            title="Click to view ticket detail actions"
                          >
                            <div className="w-12 h-12 rounded-sm bg-zinc-900 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-850">
                              <img 
                                src={getReportImage(report.imageData, report.category)} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                                alt="" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";
                                }}
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <span className="text-xs font-bold uppercase tracking-wider font-display truncate capitalize text-text-primary min-w-0 flex-1">{report.category === "other" && report.customCategoryLabel ? report.customCategoryLabel : report.category.split("_").join(" ")}</span>
                                <span className={`text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded-sm border shrink-0 ${statusBadgeColor}`}>{report.status === "Scheduled for Repair" ? "Scheduled" : report.status}</span>
                              </div>
                              <p className="text-[11px] text-text-muted truncate mt-0.5">{report.description}</p>
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-muted font-mono">
                                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                                <span className="truncate max-w-[200px]">{report.address}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            ); })()}

          {/* REPORT TAB */}
          {activeTab === "report" && (
            <motion.div
              key="report-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Form Title */}
              <div>
                <h2 className="text-lg font-display font-bold uppercase tracking-wide">File a Public Civic Report</h2>
                <p className="text-xs text-slate-500 mt-1">Specify road damage or local hazards for immediate municipal evaluation.</p>
              </div>

              {!currentUser ? (
                <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-sm p-6 text-center space-y-4 max-w-sm mx-auto shadow-sm mt-6">
                  <div className="mx-auto w-12 h-12 bg-[#ff453a]/10 text-[#ff453a] rounded-sm flex items-center justify-center border border-[#ff453a]/20">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display uppercase tracking-wider">Authentication Required</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed font-mono text-[11px]">
                      Please sign in with Google to submit verified infrastructure tickets to Public Works.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError("");
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-bold py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer font-mono"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress Tracker (Clean visual indicators) */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 font-mono">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${imageData ? "bg-[#ff453a] text-white animate-pulse" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                        {imageData ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Visual Data</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${verified ? "bg-[#ff453a] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                        {verified ? <Check className="w-3 h-3 stroke-[3]" /> : "2"}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">AI/Manual Classify</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${locationPinned ? "bg-[#ff453a] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                        {locationPinned ? <Check className="w-3 h-3 stroke-[3]" /> : "3"}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                    </div>
                  </div>

              {/* Camera / Capture Section */}
              <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-sm p-4 space-y-4">
                <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">1. Upload Visual Grounding Evidence</label>
                
                {/* Captured Image / Upload Fallback representation */}
                <div className="space-y-3">
                  {imageData ? (
                    <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-850 aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                      <img src={imageData} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Evidence Preview" id="evidence-preview-img" />
                      <button
                        onClick={() => {
                          setImageData("");
                          setVerified(false);
                          setVerificationResult(null);
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-sm hover:bg-black/80 backdrop-blur-sm shadow-sm transition-all cursor-pointer"
                        id="clear-evidence-photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-sm p-8 text-center flex flex-col items-center justify-center space-y-3.5 bg-slate-50/50 dark:bg-black/40">
                      <div className="p-3 bg-[#ff453a]/10 text-[#ff453a] rounded-sm border border-[#ff453a]/25 animate-pulse">
                        <Camera className="w-6 h-6" id="upload-camera-placeholder-icon" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide">Take a realistic photo of road damage</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">Camera capture or library uploads accepted</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2.5">
                        <button
                          onClick={() => startCamera()}
                          className="bg-[#ff453a] hover:bg-[#ff3b30] text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all font-mono cursor-pointer"
                          id="use-live-camera-button"
                        >
                          <Camera className="w-3.5 h-3.5" /> Use Live Camera
                        </button>
                        
                        <label className="bg-transparent text-slate-700 dark:text-slate-300 border border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 font-mono">
                          <Upload className="w-3.5 h-3.5" /> Upload File
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            id="image-file-picker"
                          />
                        </label>
                      </div>
                      {cameraPermission === "Denied" && (
                        <div className="bg-accent-alert/10 text-accent-alert border border-accent-alert/20 p-3 rounded-sm text-xs font-mono leading-relaxed text-center max-w-sm mx-auto mt-2 flex flex-col gap-1">
                          <span className="font-bold">⚠️ Camera Access Denied</span>
                          <span>We need camera access to let you snap a photo — tap "Use Live Camera" to try allowing again, or select an existing file.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Video Upload Panel */}
                <div className="pt-2 border-t border-slate-150 dark:border-slate-850">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">Optionally Add Short Video</span>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">Provide direct surrounding dynamic context (max 15MB)</p>
                    </div>
                    <div>
                      <label className="bg-[#0a0a0f] text-slate-300 border border-slate-800 hover:bg-slate-900 px-3.5 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all">
                        <FileVideo className="w-3.5 h-3.5" /> {videoData ? "Uploaded" : "Add Video"}
                        <input 
                          type="file" 
                          accept="video/*" 
                          onChange={handleVideoUpload} 
                          className="hidden" 
                          id="video-file-picker"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Video upload badge */}
                  {videoData && (
                    <div className="mt-2 text-[11px] bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/30 p-2 rounded-sm flex items-center justify-between font-mono">
                      <span className="truncate max-w-[240px]">🎥 Attached: {videoName || "Short video upload"}</span>
                      <button onClick={() => { setVideoData(""); setVideoName(""); }} className="text-[#ff453a] hover:text-[#ff3b30]" id="clear-uploaded-video">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini Vision Filtering Section */}
              {imageData && (
                <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-sm p-4 space-y-4">
                  <div className="flex items-center justify-between font-mono">
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">2. AI/Manual Damage & Safety Verification</label>
                    <span className="text-[10px] flex items-center gap-1 text-slate-500">
                      <Sparkles className="w-3 h-3 text-[#ff453a]" /> Powered by Gemini 2.5
                    </span>
                  </div>

                  {!verified ? (
                    <div className="text-center py-2.5 font-mono">
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">To ensure civic dispatcher efficiency, run visual integrity validation checks.</p>
                      <button
                        onClick={triggerVerifyImage}
                        disabled={verifying}
                        className="bg-[#ff453a] flex items-center justify-center hover:bg-[#ff3b30] text-white py-2.5 px-5 rounded-sm text-xs font-bold uppercase tracking-wider w-full disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
                        id="run-ai-verification"
                      >
                        {verifying ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            Evaluating asphalt diagnostics...
                          </>
                        ) : "Analyze Evidence Image"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5 text-xs font-mono">
                      {/* Success / Classification Summary Box */}
                      {classificationMethod === "manual" ? (
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-sm border border-amber-500/30 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-2">
                              <div className="mt-0.5 p-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" id="verification-passed-badge" />
                              </div>
                              <div>
                                <strong className="font-bold text-xs uppercase tracking-wider text-white block">Manual Classification Active</strong>
                                <span className="text-[10px] text-slate-500">Fallback due to temporary server load</span>
                              </div>
                            </div>
                            <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold px-2 py-0.5 rounded-sm">
                              Manual Fallback
                            </span>
                          </div>

                          <div className="border-t border-slate-205 dark:border-slate-800 pt-2 text-[11px] space-y-1.5 text-slate-400 font-sans normal-case leading-relaxed">
                            <p><strong>Proposed Classification:</strong> <span className="capitalize text-white font-bold">{verificationResult?.category === "other" && customCategoryText ? customCategoryText : verificationResult?.category.split("_").join(" ")}</span></p>
                            <p><strong>Verdict Details:</strong> {verificationResult?.explanation}</p>
                          </div>
                        </div>
                      ) : verificationResult?.category === "not_a_civic_issue" ? (
                        <div className="p-3 bg-[#ff453a]/10 text-[#ff453a] rounded-sm border border-[#ff453a]/30 space-y-2">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-[#ff453a] flex-shrink-0 mt-0.5" id="critical-alert-icon" />
                            <div>
                              <strong className="font-bold block uppercase tracking-wider text-xs">AI Filtering Flag: Non-Civic upload</strong>
                              <p className="text-[11px] mt-0.5 text-slate-400 leading-relaxed font-sans normal-case">
                                This submission was flagged as private or non-civic. Explanation: {verificationResult?.explanation}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-[#ff453a]/20 p-2.5 rounded-sm text-[10px] font-bold">
                            Confidence Score: {verificationResult?.confidence}% (Strict limit threshold: 70%)
                          </div>

                          <div className="text-[10px] text-[#ff453a]/80 pt-1 font-sans normal-case leading-relaxed">
                            ⚠️ Unrelated/indoor images, faces or animals cannot be routed to civic dispatch lines. Please take or choose a direct image of road infrastructure damage.
                          </div>
                        </div>
                      ) : (verificationResult?.confidence || 0) < 70 ? (
                        <div className="p-3 bg-[#ff9f0a]/10 text-[#ff9f0a] rounded-sm border border-[#ff9f0a]/30 space-y-2">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-[#ff9f0a] flex-shrink-0 mt-0.5" id="warning-alert-icon" />
                            <div>
                              <strong className="font-bold block uppercase tracking-wider text-xs">Low Identification Confidence ({verificationResult?.confidence}%)</strong>
                              <p className="text-[11px] mt-0.5 text-slate-400 font-sans normal-case leading-relaxed">
                                Gemini identified standard category '{verificationResult?.category.split("_").join(" ")}' but with a certainty level of only {verificationResult?.confidence}%. Strict standard limit for automatic dispatches is 70%.
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-[#ff9f0a]/85 font-sans normal-case leading-relaxed">
                            💡 We recommend retaking your photograph under cleaner light, or you can manually override below if you are certain this is public damage.
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#30d158]/10 text-[#30d158] rounded-sm border border-[#30d158]/30 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-2">
                              <div className="mt-0.5 p-1 bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/30 rounded-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" id="verification-passed-badge" />
                              </div>
                              <div>
                                <strong className="font-bold text-xs uppercase tracking-wider text-white block">AI Analysis Passed</strong>
                                <span className="text-[10px] text-slate-500">MIME checked & verified</span>
                              </div>
                            </div>
                            <span className="text-xs bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/30 font-bold px-2 py-0.5 rounded-sm">
                              Score: {verificationResult?.confidence}%
                            </span>
                          </div>

                          <div className="border-t border-slate-200 dark:border-slate-800 pt-2 text-[11px] space-y-1.5 text-slate-400 font-sans normal-case leading-relaxed">
                            <p><strong>Proposed Classification:</strong> <span className="capitalize text-white font-bold">{verificationResult?.category.split("_").join(" ")}</span></p>
                            <p><strong>AI Verdict Details:</strong> {verificationResult?.explanation}</p>
                          </div>

                          {/* Duplicate image match warning badge */}
                          {verificationResult?.isDuplicate && (
                            <div className="mt-2.5 p-2 bg-[#ff9f0a]/10 text-[#ff9f0a] text-[10px] rounded-sm border border-[#ff9f0a]/20 flex items-start gap-1.5 leading-relaxed">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <div>
                                <strong>Severe Co-report Matched:</strong> A duplicate image is logged as public Report #{verificationResult.existingReportId}. Your submit will group under this existing public ticket.
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual Override Option Step */}
                      {verificationResult?.category !== "not_a_civic_issue" && (
                        <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] p-3.5 rounded-sm border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                          <div className="flex items-center justify-between text-slate-400 font-bold mb-1 text-[11px] uppercase tracking-wider">
                            <span>Is this AI classification correct?</span>
                            <button
                              onClick={() => {
                                setIsOverriding(!isOverriding);
                                if (!isOverriding) {
                                  // initializeoverride with the identified category
                                  setManualCategory(verificationResult?.category || "pothole");
                                }
                              }}
                              className="text-[11px] text-[#ff453a] hover:text-[#ff3b30] font-bold underline uppercase tracking-wider cursor-pointer"
                              id="toggle-override-category"
                            >
                              {isOverriding ? "Keep AI classification" : "No, correction needed"}
                            </button>
                          </div>

                          {isOverriding && (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] block text-slate-400 font-bold tracking-wide uppercase">Select Correct Civic Category</label>
                                <select
                                  value={manualCategory}
                                  onChange={(e) => setManualCategory(e.target.value)}
                                  className="w-full bg-[#0a0a0f] text-slate-200 border border-slate-300 dark:border-slate-800 py-1.5 px-2 text-xs rounded-sm font-mono cursor-pointer"
                                  id="manual-override-category-picker"
                                >
                                  <option value="pothole">Pothole</option>
                                  <option value="streetlight_issue">Streetlight Issue</option>
                                  <option value="water_leakage">Water Leakage</option>
                                  <option value="garbage_overflow">Garbage Overflow</option>
                                  <option value="broken_pavement">Broken Pavement</option>
                                  <option value="other_infrastructure">Other Public Infrastructure</option>
                                  <option value="other">Other (Specify Custom Name)</option>
                                </select>
                              </div>

                              {manualCategory === "other" && (
                                <div className="space-y-1">
                                  <label className="text-[10px] block text-slate-400 font-bold tracking-wide uppercase">Custom Category Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Fallen Tree, Graffiti, Vandalism"
                                    value={customCategoryText}
                                    onChange={(e) => setCustomCategoryText(e.target.value)}
                                    maxLength={50}
                                    className="w-full bg-[#0a0a0f] text-slate-200 border border-slate-300 dark:border-slate-850 py-1.5 px-2 text-xs rounded-sm font-sans placeholder-slate-600 focus:outline-none focus:border-red-500"
                                    id="manual-override-custom-text"
                                  />
                                  <p className="text-[9px] text-zinc-500 font-mono">Max 50 characters.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* GPS Mapping Coordinates with OSM tiles */}
              {imageData && verificationResult?.category !== "not_a_civic_issue" && (
                <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-sm p-4 space-y-4">
                  <div className="flex items-center justify-between font-mono">
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">3. Pinpoint Hazard Location</label>
                    <button
                      onClick={handleUseCurrentLocation}
                      className="text-[11px] text-[#ff453a] hover:text-[#ff3b30] font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      id="gps-location-button"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Use Current Location
                    </button>
                  </div>

                  {locationPermission === "Denied" && (
                    <div className="bg-accent-alert/10 text-accent-alert border border-accent-alert/20 p-3 rounded-sm text-xs font-mono leading-relaxed mt-2 flex flex-col gap-1">
                      <span className="font-bold">⚠️ Location Services Unavailable</span>
                      <span>We need your location to pinpoint the hazard automatically — tap "Use Current Location" to try again, or type your street address or nearby landmark below.</span>
                    </div>
                  )}

                  {/* Leaflet instance container */}
                  <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div id="leaflet-map" ref={mapContainerRef} className="w-full h-48 sm:h-56 z-10" />
                    <button
                      onClick={handleSnapToCityCenter}
                      type="button"
                      className="absolute top-2 left-2 z-20 bg-[#0a0a0f]/95 backdrop-blur-sm text-slate-100 hover:bg-slate-900 border border-slate-800 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer font-mono"
                      id="snap-to-city-boundary-btn"
                    >
                      <Building className="w-3 h-3 text-[#ff453a]" />
                      Snap to City Center
                    </button>
                    <div className="absolute bottom-2 left-2 z-20 bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] text-white rounded-sm flex items-center gap-1 font-mono border border-slate-800">
                      <Globe className="w-3 h-3 text-[#30d158]" />
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                  </div>

                  {/* Manual coordinates address bar manual field fallback */}
                  <div className="space-y-2 font-mono relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] block text-slate-400 font-bold tracking-wide uppercase">Manual Street Address Override</label>
                      {addressLoading && <span className="text-[10px] text-[#ff453a]">Syncing address...</span>}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-[#0a0a0f] text-slate-200 border border-slate-300 dark:border-slate-800 py-2 px-3 text-xs rounded-sm focus:ring-1 focus:ring-[#ff453a] font-mono"
                        placeholder="Type closest landmark or address link"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setShowReportSuggestionsDropdown(true);
                        }}
                        onFocus={() => setShowReportSuggestionsDropdown(true)}
                        onBlur={() => {
                          // Allow item click to register, then trigger standard manual geocode fallback
                          setTimeout(() => {
                            setShowReportSuggestionsDropdown(false);
                            handleManualAddressGeocode(address);
                          }, 250);
                        }}
                        id="manual-address-input-fallback"
                      />

                      {/* Suggestions Dropdown */}
                      {showReportSuggestionsDropdown && (
                        <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-[#16161d] border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl z-[150] max-h-56 overflow-y-auto text-left">
                          {/* 1. Show Nominatim Suggestions */}
                          {address.trim().length >= 3 && reportSuggestions.length > 0 && (
                            <div className="py-1">
                              <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-zinc-800">
                                Matching Suggestions
                              </div>
                              {reportSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectReportSuggestion(suggestion);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-zinc-900 transition-all font-mono truncate flex items-center gap-2 border-b border-zinc-900 last:border-0"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#ff453a] shrink-0" />
                                  <span className="truncate">{suggestion.display_name}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 2. Show Recent Searches */}
                          {(!address.trim() || reportSuggestions.length === 0) && recentSearches.length > 0 && (
                            <div className="py-1">
                              <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-zinc-800 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> Recent Searches
                              </div>
                              {recentSearches.map((search, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectRecentSearchInReport(search);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-zinc-900 transition-all font-mono truncate flex items-center gap-2 border-b border-zinc-900 last:border-0"
                                >
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{search}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {address.trim().length >= 3 && reportSuggestions.length === 0 && !addressLoading && (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No match suggestions found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submision fields: descriptive title + final send trigger */}
              {imageData && verified && verificationResult?.category !== "not_a_civic_issue" && (
                <div className="bg-[#0e0e14] dark:bg-[#0a0a0f] border border-slate-200 dark:border-slate-800 rounded-sm p-4 space-y-4">
                  <div className="space-y-1 font-mono">
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">4. Dispatcher Description Notes (Optional)</label>
                    <p className="text-[10px] text-slate-500 font-sans normal-case">Gemini suggests title context, which you can edit or augment freely.</p>
                  </div>

                  <textarea
                    rows={3}
                    className="w-full bg-[#0a0a0f] text-slate-200 border border-slate-300 dark:border-slate-800 p-3 text-xs rounded-sm focus:ring-1 focus:ring-[#ff453a] font-mono"
                    placeholder="Enter additional details helpful for road crews..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    id="report-description-text"
                  />

                  {/* Submit Final Button */}
                  <motion.button
                    layout
                    onClick={handleSubmitReport}
                    disabled={submittingReport || isSubmitSuccessAnimating}
                    animate={isSubmitSuccessAnimating ? {
                      scale: [1, 1.02, 1],
                      backgroundColor: "#30d158", // Green
                    } : {}}
                    transition={{ duration: 0.4 }}
                    className="bg-[#ff453a] hover:bg-[#ff3b30] text-white py-3.5 px-5 rounded-sm text-xs font-bold uppercase tracking-wider w-full disabled:opacity-50 transition-all flex items-center justify-center gap-1 mt-2 active:scale-[0.98] cursor-pointer font-mono"
                    id="submit-final-ticket-button"
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitSuccessAnimating ? (
                        <motion.div
                          key="success"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-5 h-5 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <motion.span
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="font-black text-black tracking-wider uppercase text-xs"
                          >
                            Ticket Logged Successfully!
                          </motion.span>
                        </motion.div>
                      ) : submittingReport ? (
                        <motion.div
                          key="submitting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                          Transmitting to public dispatch logs...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Submit Civic Ticket to Municipality
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}
              </>
              )}
            </motion.div>
          )}

             {/* MY REPORTS TAB */}
          {activeTab === "my-reports" && (
            <motion.div
              key="my-reports-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
              id="feed-view-container"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-black uppercase tracking-wider text-text-primary">Logged Civic Tickets</h2>
                  <p className="text-xs text-text-muted mt-1">Review status lifecycle, duplicates, and dispatcher repairs.</p>
                </div>
                <button
                  onClick={() => setActiveTab("report")}
                  className="bg-accent-alert hover:bg-accent-alert/85 text-white p-2 rounded-sm active:scale-95 transition-all shadow-sm"
                  id="header-shortcut-create"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Success submit alert overlay */}
              {isSubmitSuccess && submittedId && (
                <div className="p-3 bg-accent-success/10 text-accent-success border border-accent-success/30 rounded-sm relative flex justify-between items-start gap-2 animate-bounce">
                  <div>
                    <strong className="text-xs font-semibold block">Ticket Logged Successfully!</strong>
                    <p className="text-[11px] mt-0.5">Your official civic report was filed. Report ID: <strong>#{submittedId}</strong>.</p>
                  </div>
                  <button onClick={() => { setIsSubmitSuccess(false); setSubmittedId(null); }} className="text-accent-success hover:opacity-85" id="dismiss-submit-banner">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Segment Toggle Filters for Feed & Sorting */}
              <div className="space-y-3 py-1.5 animate-fadeIn">
                {/* Row 1: Primary Feed Tabs (Full Width) */}
                <div className="flex bg-zinc-950 p-1 rounded-sm select-none text-[10px] w-full border border-zinc-800/80">
                  <button
                    onClick={() => setFeedFilter("all")}
                    className={`flex-1 text-center py-2 font-bold rounded-sm transition-all cursor-pointer ${
                      feedFilter === "all"
                        ? "bg-bg-card text-text-primary border border-zinc-800 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    District Feed ({reports.filter(r => showAllDistricts ? isReportInActiveDistrict(r) : getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude) <= 10).length})
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthMode("login");
                        setAuthError("Please sign in with Google to view and track your submitted civic reports.");
                        setAuthModalOpen(true);
                        return;
                      }
                      setFeedFilter("mine");
                    }}
                    className={`flex-1 text-center py-2 font-bold rounded-sm transition-all cursor-pointer ${
                      feedFilter === "mine"
                        ? "bg-bg-card text-text-primary border border-zinc-800 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    My Submissions {currentUser ? `(${reports.filter(r => r.userId === currentUser.id).length})` : ""}
                  </button>
                </div>

                {/* Row 2: Location Toggle and Sort Option (Separate Row) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 p-2.5 border border-zinc-900 rounded-sm">
                  {/* Location Scope Selector */}
                  <div className="flex items-center gap-2">
                    {feedFilter === "all" ? (
                      <div className="flex bg-zinc-900 p-0.5 rounded-sm border border-zinc-800 select-none text-[10px]">
                        <button
                          onClick={() => setShowAllDistricts(false)}
                          className={`px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                            !showAllDistricts
                              ? "bg-accent-alert text-white font-black shadow-md"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                          title="Show reports within 10km of your coordinates"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Nearby Only (10km)</span>
                        </button>
                        <button
                          onClick={() => setShowAllDistricts(true)}
                          className={`px-3 py-1.5 font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                            showAllDistricts
                              ? "bg-accent-alert text-white font-black shadow-md"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                          title="Show all public reports regardless of distance"
                        >
                          <Globe className="w-3 h-3" />
                          <span>All Districts</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted font-mono font-bold uppercase tracking-wider pl-1.5">
                        Your Secure Local Submissions
                      </span>
                    )}
                  </div>

                  {/* Sorting Select Component */}
                  <div className="flex items-center gap-2 text-xs justify-between sm:justify-end w-full sm:w-auto">
                    <span className="text-text-muted font-mono text-[10px] uppercase font-bold tracking-wider">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-bg-card border border-zinc-800 rounded-sm px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-alert text-xs font-medium cursor-pointer"
                    >
                      <option value="distance">Closest Distance</option>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="urgency">Highest Urgency</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feed of reports */}
              <div className="space-y-4">
                {(() => {
                  const filteredReports = reports.filter(r => {
                    if (feedFilter === "mine") {
                      return r.userId === currentUser?.id;
                    }
                    if (isUsingIpFallback) return false;
                    if (!showAllDistricts) {
                      const d = getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude);
                      return d <= 10;
                    }
                    return isReportInActiveDistrict(r);
                  });

                  // Perform sorting
                  const sortedReports = [...filteredReports].sort((a, b) => {
                    if (sortBy === "newest") {
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }
                    if (sortBy === "oldest") {
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    }
                    if (sortBy === "urgency") {
                      const urgencyRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                      const scoreA = urgencyRank[a.severity || "Medium"] || 2;
                      const scoreB = urgencyRank[b.severity || "Medium"] || 2;
                      if (scoreA !== scoreB) {
                        return scoreB - scoreA;
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }
                    if (sortBy === "distance") {
                      const distA = getDistanceKm(coords.lat, coords.lng, a.latitude, a.longitude);
                      const distB = getDistanceKm(coords.lat, coords.lng, b.latitude, b.longitude);
                      return distA - distB;
                    }
                    return 0;
                  });

                  if (isUsingIpFallback && feedFilter === "all") {
                    return (
                      <div className="text-center py-12 bg-bg-card border border-zinc-800 rounded-sm p-6 space-y-4">
                        <MapPin className="w-10 h-10 text-accent-alert mx-auto animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-text-primary">Precise Location Required</p>
                          <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                            Enter your precise location to see issues in your local area.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto">
                          <button
                            onClick={handleUseCurrentLocation}
                            className="w-full bg-accent-alert hover:bg-accent-alert/85 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                          >
                            Use GPS / Locate Me
                          </button>
                          <button
                            onClick={() => setShowManualLocationModal(true)}
                            className="w-full bg-zinc-900 hover:bg-zinc-850 text-text-primary border border-zinc-800 text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                          >
                            Enter Address Manually
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (sortedReports.length === 0) {
                    return (
                      <div className="text-center py-12 bg-bg-card border border-zinc-800 rounded-sm p-6">
                        <Activity className="w-10 h-10 text-text-muted mx-auto animate-pulse" />
                        <p className="text-xs font-semibold mt-3 text-text-primary">No active reports found</p>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                          {feedFilter === "mine" ? "Reports you file will display securely inside your citizen wallet." : "There are no district issues logged right now."}
                        </p>
                      </div>
                    );
                  }

                  return sortedReports.map((report) => {
                    const isResolved = report.status === "Resolved";
                    const isInReview = report.status === "In Review" || report.status === "Scheduled for Repair";
                    const statusBorderColor = isResolved 
                      ? "border-l-accent-success" 
                      : isInReview 
                        ? "border-l-accent-info" 
                        : "border-l-accent-alert";
                    const statusBadgeColor = isResolved 
                      ? "bg-accent-success/15 text-accent-success border-accent-success/30" 
                      : isInReview 
                        ? "bg-accent-info/15 text-accent-info border-accent-info/30" 
                        : "bg-accent-alert/15 text-accent-alert border-accent-alert/30";

                    return (
                      <motion.div
                        key={report.id}
                        layoutId={`card-${report.id}`}
                        className={`bg-bg-card border border-zinc-800/80 border-l-4 ${statusBorderColor} rounded-sm overflow-hidden shadow-lg shadow-black/40 flex flex-col`}
                      >
                        {/* Grid structure details */}
                        <div className="p-4 flex gap-4">
                          {/* Left image holder */}
                          <div className="w-24 h-24 rounded-sm bg-zinc-900 border border-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                            <img 
                              src={getReportImage(report.imageData, report.category)} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                              alt="" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                            {report.isDuplicate && (
                              <span className="absolute bottom-1 right-1 bg-accent-alert text-white text-[8px] px-1 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                DUPL
                              </span>
                            )}
                          </div>

                          {/* Right Content */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold bg-zinc-900 border border-zinc-800/50 px-2 py-0.5 rounded text-text-muted text-[10px] uppercase font-mono">
                                    #{report.id.substring(4, 11)}
                                  </span>
                                  {report.severity && (
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${
                                      report.severity === "Critical" ? "bg-accent-alert/15 text-accent-alert border border-accent-alert/25" :
                                      report.severity === "High" ? "bg-accent-alert/15 text-accent-alert border border-accent-alert/25" :
                                      report.severity === "Medium" ? "bg-accent-info/15 text-accent-info border border-accent-info/25" :
                                      "bg-zinc-800 text-text-muted border border-zinc-700/30"
                                    }`}>
                                      {report.severity}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-sm font-display font-black uppercase tracking-wide truncate mt-1 text-text-primary">
                                  {report.category === "other" && report.customCategoryLabel ? report.customCategoryLabel : report.category.split("_").join(" ")}
                                </h3>
                              </div>
                              
                              {/* Inter-state modifier button */}
                              <button
                                onClick={() => toggleReportStatus(report.id, report.status)}
                                className={`text-[9px] font-black px-2.5 py-1 rounded-sm border tracking-wide transition-all uppercase font-mono cursor-pointer shrink-0 ${statusBadgeColor} hover:opacity-80`}
                                title="Click to mock toggling server status lifecycle (Moderation simulation)"
                                id={`status-toggle-${report.id}`}
                              >
                                ● {report.status === "Pending Approval" ? "Awaiting Action" : report.status === "Scheduled for Repair" ? "Scheduled Repair" : report.status}
                              </button>
                            </div>

                            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                              {report.description}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 pb-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-text-muted min-w-0 flex-1">
                                <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                                <span className="truncate">{report.address}</span>
                              </div>
                              {(() => {
                                const getDistanceKm = (la1: number, lo1: number, la2: number, lo2: number) => {
                                  const R = 6371; // km
                                  const dLat = (la2 - la1) * Math.PI / 180;
                                  const dLon = (lo2 - lo1) * Math.PI / 180;
                                  const alpha = 
                                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                                    Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * 
                                    Math.sin(dLon/2) * Math.sin(dLon/2);
                                  const cDist = 2 * Math.atan2(Math.sqrt(alpha), Math.sqrt(1-alpha));
                                  return R * cDist;
                                };
                                const userLat = (coords && coords.lat !== 0) ? coords.lat : 37.7749;
                                const userLng = (coords && coords.lng !== 0) ? coords.lng : -122.4194;
                                const dist = getDistanceKm(userLat, userLng, report.latitude, report.longitude);
                                const formattedDist = isUsingIpFallback ? "Approximate" : (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
                                return (
                                  <span className="text-[10px] text-text-muted font-bold font-mono shrink-0 bg-zinc-900/50 px-1.5 py-0.5 rounded-sm border border-zinc-800">
                                    📍 {isUsingIpFallback ? formattedDist : `${formattedDist} away`}
                                  </span>
                                );
                              })()}
                            </div>

                            {report.id && (
                              <div className="text-[9px] text-text-muted font-mono">
                                Reporter: <strong>Reporter #{report.id.slice(-6)}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin/Supervisor actions panel if report is Pending Approval */}
                        {report.status === "Pending Approval" && (
                          <div className="px-4 py-2.5 bg-accent-alert/5 border-t border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-[10px] text-accent-alert font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 animate-spin text-accent-alert" />
                              File is inside simulated moderation queue.
                            </span>
                            <button
                              onClick={() => handleApproveReport(report.id)}
                              className="bg-accent-alert hover:bg-accent-alert/80 text-white font-extrabold py-1.5 px-3 rounded-sm text-[9px] active:scale-95 transition-all shadow-md cursor-pointer font-mono uppercase tracking-wider"
                              id={`approve-dispatch-btn-${report.id}`}
                            >
                              Approve Report & Launch Review
                            </button>
                          </div>
                        )}

                        {/* Duplication Alerts / Merge Operations */}
                        {report.isDuplicate && (
                          <div className="px-4 py-3 bg-accent-alert/5 border-t border-zinc-800 space-y-2">
                            <div className="flex items-start gap-2 text-[10px] text-accent-alert font-medium">
                              <AlertTriangle className="w-4 h-4 text-accent-alert mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-bold block text-[11px] text-accent-alert">Potential Duplicate Identified</span>
                                <p className="mt-0.5 text-text-muted font-light leading-snug">
                                  {report.duplicateReason || "This report lists visual properties and GPS coordinate signatures highly resembling another recent hazard."}
                                </p>
                              </div>
                            </div>
                            
                            {report.duplicateOfId && (
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <button
                                  onClick={() => handleMergeDuplicate(report.id, report.duplicateOfId!)}
                                  className="bg-accent-alert hover:bg-accent-alert/90 text-white font-bold py-1.5 px-2.5 rounded-sm text-[9px] active:scale-95 transition-all shadow-sm cursor-pointer font-mono uppercase tracking-wider"
                                >
                                  Consolidate & Merge with Master #{report.duplicateOfId.substring(4, 11)}
                                </button>
                                <button
                                  onClick={() => handleUnlinkDuplicate(report.id)}
                                  className="border border-zinc-700 hover:bg-zinc-800 text-text-muted font-bold py-1.5 px-2 rounded-sm text-[9px] active:scale-95 transition-all cursor-pointer font-mono uppercase tracking-wider"
                                >
                                  Process as Independent Issue
                                </button>
                              </div>
                            )}

                            {!report.duplicateOfId && (
                              <div className="text-[9px] text-text-muted font-mono">
                                Linked under duplicate parent group.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Community verification & AI confidence line */}
                        <div className="bg-zinc-950/40 px-4 py-2.5 text-[10px] text-text-muted border-t border-zinc-800/80 flex justify-between items-center flex-wrap gap-2">
                          <span className="flex items-center gap-1 font-mono text-text-muted">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            {new Date(report.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* Community upvote / verify trigger */}
                            <button
                              onClick={() => handleVouch(report.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm font-semibold transition-all border cursor-pointer ${
                                (currentUser && report.vouchedUserIds?.includes(currentUser.id))
                                  ? "bg-accent-success/10 text-accent-success border-accent-success/30"
                                  : "bg-transparent text-text-muted hover:bg-zinc-850 border-zinc-800"
                              }`}
                              id={`vouch-btn-${report.id}`}
                              title="Vouch for this issue to verify its accuracy for dispatch workers"
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${(currentUser && report.vouchedUserIds?.includes(currentUser.id)) ? "fill-accent-success text-accent-success" : ""}`} />
                              <span>{(currentUser && report.vouchedUserIds?.includes(currentUser.id)) ? "Already Vouched" : `${report.vouchCount || 1} Vouch`}</span>
                            </button>

                            {/* Nominate for Poll Action */}
                            {report.status !== "Resolved" && (() => {
                              const isCurrentlyNominated = report.nominatedAt && (Date.now() - new Date(report.nominatedAt).getTime() <= 7 * 24 * 3600 * 1000);
                              if (isCurrentlyNominated) {
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-sm font-bold border bg-accent-alert/10 text-accent-alert border-accent-alert/20 font-mono text-[9px]" title="This issue is actively featured in community priority polls.">
                                    🗳️ Nominated ({report.pollVotes || 1})
                                  </span>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={() => handleNominate(report.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-sm font-semibold transition-all border cursor-pointer bg-transparent text-text-muted hover:bg-zinc-850 border-zinc-800 hover:text-accent-alert hover:border-accent-alert/30 text-[10px]"
                                    title="Nominate this issue to the community priority poll"
                                  >
                                    <span>🗳️ Nominate</span>
                                  </button>
                                );
                              }
                            })()}

                            {report.classificationMethod === "manual" ? (
                              <span className="font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-sm font-mono text-[9px] border border-amber-500/20">
                                Manually Classified
                              </span>
                            ) : (
                              report.confidence && (
                                <span className="font-semibold text-text-muted bg-zinc-900 px-2 py-0.5 rounded-sm font-mono text-[9px] border border-zinc-800">
                                  AI Confidence: {report.confidence}%
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        {/* Real-time Tracking and Progress Stepper */}
                        <div className="border-t border-zinc-800 bg-zinc-950/20 p-3.5 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-widest font-mono">
                            <span>Dispatch Operations</span>
                            <span className="text-accent-success font-bold px-1.5 py-0.5 rounded bg-accent-success/5 select-none animate-pulse">● Active Log</span>
                          </div>

                          {/* Interactive Status Stepper (5-stage) */}
                          <div className="relative flex items-center justify-between py-1.5 max-w-sm mx-auto">
                            {/* Stepper progress line background */}
                            <div className="absolute top-[18px] left-[15px] right-[15px] h-0.5 bg-zinc-900 z-0" />
                            
                            {/* Active filled line part based on status */}
                            <div className="absolute top-[18px] left-[15px] h-0.5 bg-accent-success z-0 transition-all duration-300" style={{
                              width: report.status === "Pending Approval" ? "0%" :
                                     report.status === "Submitted" ? "25%" :
                                     report.status === "In Review" ? "50%" :
                                     report.status === "Scheduled for Repair" ? "75%" : "100%"
                            }} />

                            {/* Step 1: Pending */}
                            <div className="flex flex-col items-center z-10">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold bg-accent-success text-black">
                                ✓
                              </div>
                              <span className="text-[8px] mt-1 font-mono font-medium text-text-muted">Pending</span>
                            </div>

                            {/* Step 2: Submitted */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                report.status !== "Pending Approval"
                                  ? "bg-accent-success text-black" : "bg-zinc-900 text-text-muted border border-zinc-800"
                              }`}>
                                {report.status !== "Pending Approval" ? "✓" : "2"}
                              </div>
                              <span className="text-[8px] mt-1 font-mono font-medium text-text-muted">Logged</span>
                            </div>

                            {/* Step 3: In Review */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                report.status === "In Review" || report.status === "Scheduled for Repair" || report.status === "Resolved"
                                  ? "bg-accent-success text-black" : "bg-zinc-900 text-text-muted border border-zinc-800"
                              }`}>
                                {report.status === "Scheduled for Repair" || report.status === "Resolved" ? "✓" : "3"}
                              </div>
                              <span className="text-[8px] mt-1 font-mono font-medium text-text-muted">Review</span>
                            </div>

                            {/* Step 4: Scheduled */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                report.status === "Scheduled for Repair" || report.status === "Resolved"
                                  ? "bg-accent-success text-black" : "bg-zinc-900 text-text-muted border border-zinc-800"
                              }`}>
                                {report.status === "Resolved" ? "✓" : "4"}
                              </div>
                              <span className="text-[8px] mt-1 font-mono font-medium text-text-muted">Scheduled</span>
                            </div>

                            {/* Step 5: Resolved */}
                            <div className="flex flex-col items-center z-10">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                report.status === "Resolved"
                                  ? "bg-accent-success text-black" : "bg-zinc-900 text-text-muted border border-zinc-800"
                              }`}>
                                5
                              </div>
                              <span className="text-[8px] mt-1 font-mono font-medium text-text-muted">Resolved</span>
                            </div>
                          </div>

                          {/* Staggered detailed list of logs */}
                          <div className="space-y-2 pt-1">
                            {report.timeline?.slice(0, 3).map((log, index) => (
                              <div key={index} className="flex gap-2 text-[10px] items-start border-l border-zinc-800 pl-2.5 relative animate-fade-in">
                                <div className="absolute top-1.5 -left-[4.5px] w-2 h-2 rounded-full bg-accent-success" />
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-text-primary">{log.stage}</span>
                                    <span className="text-text-muted font-mono text-[8px]">
                                      {new Date(log.time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-text-muted mt-0.5 font-light leading-relaxed">{log.note}</p>
                                </div>
                              </div>
                            ))}
                            
                            {/* Fallback Timeline Log if none exists yet */}
                            {(!report.timeline || report.timeline.length === 0) && (
                              <div className="flex gap-2 text-[10px] items-start border-l border-zinc-800 pl-2.5 relative">
                                <div className="absolute top-1.5 -left-[4.5px] w-2 h-2 rounded-full bg-accent-success" />
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-text-primary">Submitted</span>
                                    <span className="text-text-muted font-mono text-[8px]">Just now</span>
                                  </div>
                                  <p className="text-text-muted mt-0.5 font-light">Issue ticket generated and registered under district GPS grid.</p>
                                </div>
                              </div>
                            )}

                            {report.timeline && report.timeline.length > 3 && (
                              <button
                                onClick={() => setExpandedTimelines(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                                className="w-full flex items-center justify-between text-left pt-2 border-t border-zinc-800/60 focus:outline-none cursor-pointer group text-[10px] text-text-muted hover:text-text-primary transition-colors font-mono font-medium"
                                id={`toggle-timeline-${report.id}`}
                              >
                                <span className="uppercase tracking-wider">
                                  {expandedTimelines[report.id] ? "Show less" : `Show more (${report.timeline.length - 3} more)`}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedTimelines[report.id] ? "rotate-180" : ""}`} />
                              </button>
                            )}

                            {expandedTimelines[report.id] && report.timeline?.slice(3).map((log, index) => (
                              <div key={index + 3} className="flex gap-2 text-[10px] items-start border-l border-zinc-800 pl-2.5 relative animate-fade-in">
                                <div className="absolute top-1.5 -left-[4.5px] w-2 h-2 rounded-full bg-accent-success" />
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-text-primary">{log.stage}</span>
                                    <span className="text-text-muted font-mono text-[8px]">
                                      {new Date(log.time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-text-muted mt-0.5 font-light leading-relaxed">{log.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                          {/* --- ENRICHED SLA, DEPT, & SEVERITY METRICS --- */}
                          <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-905/50 flex flex-wrap justify-between items-center gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {report.severity && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    report.severity === "Critical" ? "bg-accent-alert text-white" :
                                    report.severity === "High" ? "bg-accent-alert/80 text-white" :
                                    report.severity === "Medium" ? "bg-accent-info text-white" : "bg-zinc-700 text-text-muted"
                                  }`}>
                                    {report.severity} Urgency
                                  </span>
                                )}
                                {report.assignedDepartment && (
                                  <span className="text-[10px] text-text-muted font-medium">
                                    🏢 Assigned: {report.assignedDepartment}
                                  </span>
                                )}
                              </div>
                              {report.landmarks && (
                                <p className="text-[10px] text-text-muted font-light italic">
                                  📍 Landmarks: &ldquo;{report.landmarks}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* SLA Timer details */}
                            {report.slaDueDate && (
                              <div className="text-right">
                                <span className="text-[9px] text-text-muted block font-mono">
                                  Target SLA: {report.slaDurationDays || 7} Days
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-[10px] font-bold ${report.isEscalated ? "text-accent-alert" : "text-accent-success"}`}>
                                    {report.isEscalated ? "⚠️ SLA OVERDUE" : `📅 Limit: ${new Date(report.slaDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                                  </span>
                                  {!report.isEscalated && report.status !== "Resolved" && (
                                    <button
                                      onClick={() => handleEscalateReport(report.id)}
                                      className="text-[9px] font-bold text-accent-alert hover:underline ml-1.5 cursor-pointer"
                                      title="Escalate ticket for breaching speed targets"
                                    >
                                      Escalate
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Comparative Before/After Photo Viewer */}
                          {report.status === "Resolved" && (
                            <div className="px-4 py-3 bg-accent-success/5 border-t border-zinc-800 space-y-2">
                              <span className="text-[10px] font-bold text-accent-success block uppercase tracking-wider font-mono">
                                Verified Construction Comparison
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-text-muted font-medium block">BEFORE REPORTED</span>
                                  <div className="aspect-video rounded-sm bg-zinc-900 overflow-hidden flex items-center justify-center border border-zinc-800">
                                    <img 
                                      src={getReportImage(report.imageData, report.category)} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                      alt="Before Repair" 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-text-muted font-medium block">AFTER RESOLUTION</span>
                                  <div className="aspect-video rounded-sm bg-accent-success/10 overflow-hidden flex items-center justify-center border border-accent-success/20">
                                    <img 
                                      src={getReportImage(report.afterImageData || "MOCK_RESOLVED_AFTER", "resolved")} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer" 
                                      alt="After Repair" 
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80";
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* --- CITIZEN CONFIRMATION & ROAD-CLOSURE LOOP --- */}
                          {report.status === "Resolved" && (
                            <div className="px-4 py-3 bg-accent-success/5 border-t border-zinc-800 flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex-1 min-w-[150px]">
                                {report.citizenConfirmed ? (
                                  <div className="flex items-center gap-1.5 text-accent-success">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">Civic Audit Complete: Resolution Confirmed by Citizens.</span>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-text-muted leading-normal">
                                    Officials marked this Resolved. Are you on-site? Confirm to seal the loop.
                                  </p>
                                )}
                              </div>
                              {!report.citizenConfirmed && (
                                <button
                                  onClick={() => handleCitizenConfirm(report.id)}
                                  className="bg-accent-success text-black font-extrabold py-1.5 px-3 rounded-sm text-[9px] active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                                >
                                  ✓ Citizen Confirms Done (+85 XP)
                                </button>
                              )}
                            </div>
                          )}

                          {/* --- ACTIVE COMMENTS THREAD DIALOGUE PANEL --- */}
                          <div className="border-t border-zinc-800 px-4 py-3.5 space-y-3 bg-zinc-950/30">
                            <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wider font-mono">
                              Citizen Forum & Updates ({report.comments?.length || 0})
                            </span>

                            {/* Comment log list */}
                            {report.comments && report.comments.length > 0 ? (
                              <div className="space-y-2 max-h-36 overflow-y-auto divide-y divide-zinc-800/40">
                                {report.comments.map((cmt) => (
                                  <div key={cmt.id} className="pt-2 first:pt-0">
                                    <div className="flex justify-between text-[9px] font-mono font-medium text-text-muted mb-0.5">
                                      <span>@{cmt.author}</span>
                                      <span>{new Date(cmt.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-text-primary leading-relaxed font-light">
                                      {cmt.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-text-muted italic">No community comments listed. Add yours below.</p>
                            )}

                            {/* Post comment form */}
                            <div className="flex gap-2 pt-1.5">
                              <input
                                type="text"
                                placeholder="Write a community status update..."
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent-alert text-text-primary placeholder-text-muted"
                                value={commentsInput[report.id] || ""}
                                onChange={(e) => setCommentsInput(prev => ({ ...prev, [report.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handlePostComment(report.id, commentsInput[report.id] || "");
                                  }
                                }}
                              />
                              <button
                                onClick={() => handlePostComment(report.id, commentsInput[report.id] || "")}
                                className="bg-zinc-800 hover:bg-zinc-700 text-text-primary font-bold px-3 rounded-sm text-xs transition-all cursor-pointer font-mono uppercase tracking-wider"
                              >
                                Send
                              </button>
                            </div>
                          </div>

                          {/* Moderation Controls (Spam moderation and resolving operator tools) */}
                          <div className="border-t border-zinc-800 px-4 py-2.5 bg-zinc-950/50 flex items-center justify-between gap-3">
                            <button
                              onClick={() => handleFlagReport(report.id)}
                              className={`${(currentUser && report.flaggedUserIds?.includes(currentUser.id)) ? "text-accent-alert" : "text-text-muted hover:text-accent-alert"} flex items-center gap-1 text-[9px] font-semibold transition-colors shrink-0`}
                              title="Flag this report as inaccurate, spam, or completed"
                            >
                              <Flag className={`w-3 h-3 ${(currentUser && report.flaggedUserIds?.includes(currentUser.id)) ? "fill-accent-alert text-accent-alert" : ""}`} />
                              <span>{(currentUser && report.flaggedUserIds?.includes(currentUser.id)) ? "Already Flagged" : `Flag Spam (${report.flagCount || 0})`}</span>
                            </button>

                            {report.status !== "Resolved" && (
                              <button
                                onClick={() => {
                                  setResolvingId(report.id);
                                  setResolvingNote("");
                                  setResolvingAfterImage("");
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-text-primary font-bold px-2.5 py-1 rounded-sm text-[9px] tracking-wide active:scale-95 transition-all outline-none border border-zinc-700/50 font-mono uppercase"
                                title="Simulate on-site repair completing as authority operator"
                              >
                                ⚙️ Simulate On-site Repair Work (Admin Tool)
                              </button>
                            )}
                          </div>
                        </motion.div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {/* COMMUNITY POLLS TAB */}
          {activeTab === "dashboard" && (() => {
            if (currentUser?.id === "J3mM82uxvxR1ZwhYH4aTL8DbD0v2" || currentUser?.id === "USR-1782557260903-153" || currentUser?.email?.toLowerCase() === "tonysanap.145@gmail.com") {
              return (
                <motion.div
                  key="admin-dashboard-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <AdminDashboardView
                    token={authToken || ""}
                    onLogout={handleLogout}
                  />
                </motion.div>
              );
            }

            // Filter reports to only show active nominated reports in nearby 10km radius / active district scope
            const activePolls = reports.filter(r => {
              if (!r.nominatedAt) return false;
              if (r.status === "Resolved") return false;
              
              // 7-day expiration check
              const ageMs = Date.now() - new Date(r.nominatedAt).getTime();
              const isWithin7Days = ageMs <= 7 * 24 * 3600 * 1000;
              if (!isWithin7Days) return false;
              
              if (isUsingIpFallback) return true;
              if (showAllDistricts) {
                return isReportInActiveDistrict(r);
              }
              const distance = getDistanceKm(coords.lat, coords.lng, r.latitude, r.longitude);
              return distance <= 10;
            }).sort((a, b) => (b.pollVotes || 0) - (a.pollVotes || 0));

            const formatCategoryName = (cat: string, customLabel?: string) => {
              if (cat === "other" && customLabel) return customLabel;
              return cat
                .split("_")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            };

            const getTimeRemaining = (nominatedAtStr?: string) => {
              if (!nominatedAtStr) return "N/A";
              const nominatedTime = new Date(nominatedAtStr).getTime();
              const msLeft = (7 * 24 * 3600 * 1000) - (Date.now() - nominatedTime);
              if (msLeft <= 0) return "Expired";
              const daysLeft = Math.floor(msLeft / (24 * 3600 * 1000));
              const hoursLeft = Math.floor((msLeft % (24 * 3600 * 1000)) / (3600 * 1000));
              if (daysLeft > 0) return `${daysLeft}d ${hoursLeft}h left`;
              return `${hoursLeft}h left`;
            };

            return (
              <motion.div
                key="polls-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/20 p-4 border border-zinc-900 rounded-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-accent-alert/10 text-accent-alert border border-accent-alert/20">
                        <Vote className="w-5 h-5 stroke-[2px]" />
                      </div>
                      <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">Community Priority Polls</h2>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      All nearby or district users vote on nominated issues. The community votes help municipal dispatchers identify which issues should be prioritized for rapid field repair first.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 self-start md:self-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-zinc-900 px-2.5 py-1 rounded-sm border border-zinc-800 text-text-muted uppercase">
                      <MapPin className="w-3 h-3 text-accent-alert" />
                      GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                    <div className="flex bg-zinc-900 p-0.5 rounded-sm border border-zinc-800 select-none text-[9px]">
                      <button
                        onClick={() => setShowAllDistricts(false)}
                        className={`px-2.5 py-1 font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                          !showAllDistricts
                            ? "bg-accent-alert text-white font-black shadow-md"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                        title="Show polls within 10km of your coordinates"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Nearby Only (10km)</span>
                      </button>
                      <button
                        onClick={() => setShowAllDistricts(true)}
                        className={`px-2.5 py-1 font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                          showAllDistricts
                            ? "bg-accent-alert text-white font-black shadow-md"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                        title="Show polls for your entire district"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{currentDistrict || getDistrictFromAddress(address)}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gamification Reminder banner */}
                <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-sm">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-zinc-300">
                    <span className="text-amber-400 font-bold">Earn Civic Rep Points:</span> Nominate unresolved issues for <span className="font-bold text-white">+15 XP</span> or cast your prioritization votes for <span className="font-bold text-white">+5 XP</span>.
                  </p>
                </div>

                {/* Poll Section Title */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-text-muted">
                    Currently Featured ({activePolls.length})
                  </span>
                  {activePolls.length > 0 && (
                    <span className="text-[10px] text-accent-alert font-bold bg-accent-alert/5 px-2 py-0.5 rounded-sm border border-accent-alert/10 animate-pulse">
                      ● Active Polling Cycle
                    </span>
                  )}
                </div>

                {/* Poll entries list */}
                {isUsingIpFallback ? (
                  <div className="text-center py-12 bg-bg-card border border-zinc-800 rounded-sm p-6 space-y-4">
                    <MapPin className="w-10 h-10 text-accent-alert mx-auto animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-text-primary">Precise Location Required</p>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                        Enter your precise location to view and vote on priority civic polls in your local community.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto">
                      <button
                        onClick={handleUseCurrentLocation}
                        className="w-full bg-accent-alert hover:bg-accent-alert/85 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                      >
                        Use GPS / Locate Me
                      </button>
                      <button
                        onClick={() => setShowManualLocationModal(true)}
                        className="w-full bg-zinc-900 hover:bg-zinc-850 text-text-primary border border-zinc-800 text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                      >
                        Enter Address Manually
                      </button>
                    </div>
                  </div>
                ) : activePolls.length === 0 ? (
                  <div className="bg-bg-card border border-dashed border-zinc-800 p-8 text-center rounded-sm space-y-4 shadow-inner">
                    <div className="w-12 h-12 bg-zinc-900/80 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                      <Vote className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">No Active Priority Polls Nearby</h3>
                      <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                        There are no nominated community issues within a 10km radius of your current coordinates. You can nominate any active issue you find in the feed!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFeedFilter("all");
                        setActiveTab("my-reports");
                      }}
                      className="inline-flex items-center gap-2 bg-accent-alert hover:bg-accent-alert/90 text-white font-display font-bold uppercase text-xs tracking-wider px-4 py-2 rounded-sm active:scale-95 transition-all cursor-pointer shadow-md shadow-accent-alert/20"
                    >
                      <Globe className="w-4 h-4 stroke-[2px]" />
                      <span>Explore District Feed</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePolls.map((report, index) => {
                      const isVoted = currentUser && report.pollVotedUserIds?.includes(currentUser.id);
                      const distance = getDistanceKm(coords.lat, coords.lng, report.latitude, report.longitude);
                      const timeLeftText = getTimeRemaining(report.nominatedAt);
                      
                      return (
                        <div 
                          key={report.id}
                          className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center relative overflow-hidden"
                        >
                          {/* Rank badge */}
                          <div className="absolute top-0 left-0 bg-zinc-900 border-r border-b border-zinc-800 text-[10px] font-mono font-bold px-2 py-0.5 text-text-muted rounded-br-sm">
                            Rank #{index + 1}
                          </div>

                          {/* Thumbnail image */}
                          <div className="w-full sm:w-24 h-24 shrink-0 rounded-sm overflow-hidden bg-zinc-950 border border-zinc-900 relative mt-2 sm:mt-0">
                            <img 
                              src={getReportImage(report.imageData, report.category)} 
                              alt={report.category}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-zinc-300 font-medium px-1 rounded-sm bg-black/40">
                              {isUsingIpFallback ? "— km" : `${distance.toFixed(1)} km`}
                            </span>
                          </div>

                          {/* Main description section */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="text-sm font-bold text-white uppercase font-display tracking-wide">
                                {formatCategoryName(report.category, report.customCategoryLabel)}
                              </h3>
                              
                              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
                                report.severity === "Critical" 
                                  ? "bg-accent-alert/10 text-accent-alert border-accent-alert/20 animate-pulse" 
                                  : report.severity === "High"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : report.severity === "Medium"
                                  ? "bg-accent-info/10 text-accent-info border-accent-info/20"
                                  : "bg-zinc-800 text-text-muted border-zinc-700"
                              }`}>
                                {report.severity || "Medium"} Priority
                              </span>

                              <span className="text-[9px] font-mono text-zinc-500">
                                #{report.id.replace("REP-", "")}
                              </span>
                            </div>

                            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                              {report.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-mono">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-600" />
                                <span className="truncate max-w-[180px]" title={report.address}>
                                  {report.address ? report.address.split(",")[0] : "GPS Coordinates"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
                                <Clock className="w-3 h-3" />
                                {timeLeftText}
                              </span>
                              <span className="flex items-center gap-1 text-accent-info">
                                <Sliders className="w-3 h-3" />
                                Status: {report.status}
                              </span>
                            </div>
                          </div>

                          {/* Voting Widget (Vouch/Vote styling) */}
                          <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-zinc-900 pt-3 sm:pt-0 sm:pl-4 gap-3">
                            <div className="flex flex-col sm:items-center">
                              <span className="text-xs font-mono font-bold text-text-muted uppercase">Priority Votes</span>
                              <span className="text-2xl font-display font-black text-white leading-none mt-1 sm:text-center">
                                {report.pollVotes || 1}
                              </span>
                            </div>

                            <button
                              onClick={() => handlePollVote(report.id)}
                              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm font-semibold text-xs tracking-wider uppercase font-display cursor-pointer transition-all border w-full sm:w-32 ${
                                isVoted
                                  ? "bg-accent-success/10 text-accent-success border-accent-success/30 cursor-default"
                                  : "bg-accent-alert/10 text-accent-alert border-accent-alert/20 hover:bg-accent-alert hover:text-white hover:shadow-[0_0_12px_rgba(255,59,48,0.3)] hover:-translate-y-0.5 active:scale-95"
                              }`}
                              title={isVoted ? "You have already voted for this issue in this priority poll cycle" : "Cast your community priority vote"}
                              disabled={!!isVoted}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? "fill-accent-success text-accent-success" : ""}`} />
                              <span>{isVoted ? "Vote Cast" : "Vote"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* GAMIFICATION TAB */}
          {activeTab === "gamification" && (
            <motion.div
              key="gamification-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-glow {
                  0%, 100% {
                    box-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
                  }
                  50% {
                    box-shadow: 0 0 12px rgba(245, 158, 11, 0.85);
                  }
                }
                .pulse-glow-1 {
                  animation: pulse-glow 2.5s infinite ease-in-out;
                }
              `}} />

              {currentUser?.id === "J3mM82uxvxR1ZwhYH4aTL8DbD0v2" || currentUser?.id === "USR-1782557260903-153" || currentUser?.email?.toLowerCase() === "tonysanap.145@gmail.com" ? (
                <AdminDashboardView
                  token={authToken || ""}
                  onLogout={handleLogout}
                />
              ) : selectedProfileId ? (
                <UserProfileView
                  userId={selectedProfileId}
                  onBack={() => setSelectedProfileId(null)}
                  reports={reports}
                  dbUsers={dbUsers}
                  leaderboardTab={leaderboardTab}
                  nearbyLeaderboard={nearbyLeaderboard}
                  districtLeaderboard={districtLeaderboard}
                />
              ) : (
                <>
                  {/* Local Leaderboard Scoreboard (Main Content) */}
                  <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 space-y-4 shadow-sm animate-fadeIn">
                    
                    {/* Header with Title and Week Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-text-primary tracking-wider uppercase font-mono">Civic League Leaderboard</span>
                        <span className="text-[10px] text-text-muted font-light font-sans">
                          {leaderboardTab === "nearby" ? "Based on 10km radius activity" : "Bounded within current administrative boundary"}
                        </span>
                      </div>
                      <span className="text-[9px] text-accent-alert font-mono bg-accent-alert/10 px-2 py-0.5 border border-accent-alert/20 rounded font-bold">Week 25</span>
                    </div>

                    {/* Interactive Sub-tab Toggle */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/80 rounded-sm border border-zinc-900">
                      <button
                        onClick={() => setLeaderboardTab("nearby")}
                        className={`py-1.5 px-3 rounded-sm text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 outline-none ${
                          leaderboardTab === "nearby"
                            ? "bg-zinc-800 text-accent-alert shadow-sm border border-zinc-700/50"
                            : "text-text-muted hover:text-text-primary hover:bg-zinc-900/40 border border-transparent"
                        }`}
                        id="leaderboard-tab-nearby"
                      >
                        <span className="uppercase tracking-wider font-mono text-[10px]">Nearby</span>
                        <span className="text-[9px] opacity-75 font-normal truncate max-w-full">
                          Within 10km
                        </span>
                      </button>
                      <button
                        onClick={() => setLeaderboardTab("district")}
                        className={`py-1.5 px-3 rounded-sm text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 outline-none ${
                          leaderboardTab === "district"
                            ? "bg-zinc-800 text-accent-alert shadow-sm border border-zinc-700/50"
                            : "text-text-muted hover:text-text-primary hover:bg-zinc-900/40 border border-transparent"
                        }`}
                        id="leaderboard-tab-district"
                      >
                        <span className="uppercase tracking-wider font-mono text-[10px]">District-Wide</span>
                        <span className="text-[9px] opacity-75 font-normal truncate max-w-full">
                          {currentDistrict || getDistrictFromAddress(address)}
                        </span>
                      </button>
                    </div>

                    {/* Active Leaderboard List */}
                    <div className="divide-y divide-zinc-900">
                      {isUsingIpFallback ? (
                        <div className="text-center py-8 bg-bg-card border border-zinc-800 rounded-sm p-5 space-y-3.5">
                          <MapPin className="w-8 h-8 text-accent-alert mx-auto animate-pulse" />
                          <div>
                            <p className="text-xs font-bold text-text-primary">Precise Location Required</p>
                            <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                              Enter your precise location to view contributors in your local area and district rankings.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto">
                            <button
                              onClick={handleUseCurrentLocation}
                              className="w-full bg-accent-alert hover:bg-accent-alert/85 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                            >
                              Use GPS
                            </button>
                            <button
                              onClick={() => setShowManualLocationModal(true)}
                              className="w-full bg-zinc-900 hover:bg-zinc-850 text-text-primary border border-zinc-800 text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm transition-all active:scale-95 cursor-pointer font-mono"
                            >
                              Enter Address
                            </button>
                          </div>
                        </div>
                      ) : (leaderboardTab === "nearby" ? nearbyLeaderboard : districtLeaderboard).length === 0 ? (
                        <div className="py-8 text-center text-text-muted text-xs font-mono">
                          No active contributors in this {leaderboardTab === "nearby" ? "10km radius" : "district"} yet.
                        </div>
                      ) : (
                        (leaderboardTab === "nearby" ? nearbyLeaderboard : districtLeaderboard).map((user, index) => {
                          const rank = index + 1;
                          const isRank1 = rank === 1;
                          const isRank2 = rank === 2;
                          const isRank3 = rank === 3;

                          let rankColorClass = "text-text-muted";
                          if (isRank1) rankColorClass = "text-accent-alert font-bold";
                          else if (isRank2) rankColorClass = "text-text-muted font-bold";
                          else if (isRank3) rankColorClass = "text-accent-info font-bold";

                          let gradientRingClass = "";
                          if (isRank1) {
                            gradientRingClass = "bg-accent-alert pulse-glow-1";
                          } else if (isRank2) {
                            gradientRingClass = "bg-zinc-500";
                          } else if (isRank3) {
                            gradientRingClass = "bg-accent-info";
                          } else {
                            gradientRingClass = user.isCurrentUser 
                              ? "bg-accent-info"
                              : "bg-zinc-800";
                          }

                          let rowStyles = "flex items-center justify-between py-2.5 text-xs transition-all duration-300 relative my-1 px-2 rounded-sm ";
                          if (isRank1) {
                            rowStyles += "scale-[1.02] bg-accent-alert/5 border border-accent-alert/20 shadow-md shadow-accent-alert/5 ";
                          } else if (isRank2) {
                            rowStyles += "bg-zinc-900/50 border border-zinc-800 ";
                          } else if (isRank3) {
                            rowStyles += "bg-accent-info/5 border border-accent-info/10 ";
                          } else if (user.isCurrentUser) {
                            rowStyles += "bg-accent-info/5 border border-accent-info/20 ";
                          } else {
                            rowStyles += "hover:bg-zinc-950/40 border border-transparent ";
                          }

                          return (
                            <motion.div 
                              layout
                              key={user.id} 
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              className={rowStyles}
                            >
                              <div className="flex items-center gap-3 w-[60%] shrink-0">
                                <span className={`font-bold font-mono w-4 text-center ${rankColorClass}`}>#{rank}</span>
                                
                                <button
                                  onClick={() => setSelectedProfileId(user.id)}
                                  className="relative cursor-pointer hover:scale-105 active:scale-95 transition-transform outline-none focus:ring-2 focus:ring-accent-alert/50 rounded-full shrink-0"
                                  title={`View ${user.name}'s Profile`}
                                  id={`leaderboard-avatar-${user.id}`}
                                >
                                  <div className={`w-8 h-8 rounded-full p-[2px] flex items-center justify-center ${gradientRingClass}`}>
                                    <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center overflow-hidden">
                                      {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />
                                      ) : (
                                        <span className={`text-[10px] font-bold font-mono ${user.isCurrentUser ? "text-accent-info" : "text-text-muted"}`}>
                                          {user.initials}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isRank1 && (
                                    <div className="absolute -top-1 -right-1 bg-accent-alert text-white rounded-full p-0.5 shadow-sm z-10">
                                      <Crown className="w-2.5 h-2.5 fill-current text-white" />
                                    </div>
                                  )}
                                  {isRank2 && (
                                    <div className="absolute -top-1 -right-1 bg-zinc-500 text-white rounded-full p-0.5 shadow-sm z-10">
                                      <Medal className="w-2.5 h-2.5 fill-current text-zinc-100" />
                                    </div>
                                  )}
                                  {isRank3 && (
                                    <div className="absolute -top-1 -right-1 bg-accent-info text-white rounded-full p-0.5 shadow-sm z-10">
                                      <Medal className="w-2.5 h-2.5 fill-current text-accent-info" />
                                    </div>
                                  )}
                                </button>

                                <div className="flex flex-col min-w-0">
                                  <span 
                                    onClick={() => setSelectedProfileId(user.id)}
                                    className={`cursor-pointer hover:underline uppercase font-display tracking-wide truncate ${user.isCurrentUser ? "font-bold text-accent-info" : "font-semibold text-text-primary"}`}
                                  >
                                    {user.name}
                                  </span>
                                  <span className="text-[9px] text-text-muted font-mono font-light uppercase truncate">
                                    {getUserDistrict(user)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 relative">
                                <span className={`font-mono font-bold ${user.isCurrentUser ? "text-accent-info" : "text-text-muted"}`}>
                                  {user.points.toLocaleString()} pt
                                </span>

                                {/* Floating score changes notifications */}
                                {user.isCurrentUser && floatingPoints.map(fp => (
                                  <motion.span
                                    key={fp.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -20, scale: 1.1 }}
                                    exit={{ opacity: 0, y: -40 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="absolute right-0 bg-accent-info text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded shadow pointer-events-none z-30"
                                  >
                                    +{fp.amount} pts
                                  </motion.span>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Weekly Challenger Quests Section */}
                  <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 shadow-sm space-y-3">
                    <button 
                      onClick={() => setIsQuestsExpanded(!isQuestsExpanded)}
                      className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                      id="toggle-quests-widget"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-accent-alert" />
                        <span className="text-[11px] font-bold text-text-primary tracking-wider uppercase font-mono">
                          Weekly Challenger Quests
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-accent-alert/10 text-accent-alert px-2 py-0.5 border border-accent-alert/20 rounded-sm">
                          {completedQuestsCount} / 3 Complete
                        </span>
                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isQuestsExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isQuestsExpanded && (
                      <div className="space-y-2.5 pt-3 border-t border-zinc-900/80">
                        {!currentUser && (
                          <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-sm text-center space-y-2 mb-1.5">
                            <p className="text-[10px] text-text-muted">
                              Sign in to track your personal quest progress and earn reputation points!
                            </p>
                            <button
                              onClick={() => {
                                setAuthMode("login");
                                setAuthError("Please sign in to track your weekly quests and earn points.");
                                setAuthModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-accent-alert hover:underline cursor-pointer"
                            >
                              Sign In with Google
                            </button>
                          </div>
                        )}

                        {/* Quest 1 */}
                        <div className="bg-zinc-950/40 p-3 rounded-sm flex items-center justify-between gap-3 border border-zinc-900/60">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-text-primary">The Spotlight Spotter</h4>
                            <p className="text-[10px] text-text-muted">Log at least 1 public infrastructure hazard.</p>
                            <span className="text-[9px] font-semibold text-accent-success block mt-1 font-mono">
                              {quest1Complete ? "✓ Quest Complete (+100 XP)" : `Progress: ${quest1Progress} / 1`}
                            </span>
                          </div>
                          <div className={`p-1.5 rounded-sm border shrink-0 ${quest1Complete ? "bg-accent-success/10 text-accent-success border-accent-success/20" : "bg-zinc-950 text-text-muted border-zinc-900"}`}>
                            {quest1Complete ? <Check className="w-4 h-4 stroke-[3]" /> : <Award className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Quest 2 */}
                        <div className="bg-zinc-950/40 p-3 rounded-sm flex items-center justify-between gap-3 border border-zinc-900/60">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-text-primary">Community Vett Hero</h4>
                            <p className="text-[10px] text-text-muted">Vouch for 3 neighbors' reported issues.</p>
                            <span className="text-[9px] font-semibold text-accent-success block mt-1 font-mono">
                              {quest2Complete ? "✓ Quest Complete (+50 XP)" : `Progress: ${quest2Progress} / 3`}
                            </span>
                          </div>
                          <div className={`p-1.5 rounded-sm border shrink-0 ${quest2Complete ? "bg-accent-success/10 text-accent-success border-accent-success/20" : "bg-zinc-950 text-text-muted border-zinc-900"}`}>
                            {quest2Complete ? <Check className="w-4 h-4 stroke-[3]" /> : <ThumbsUp className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Quest 3 */}
                        <div className="bg-zinc-950/40 p-3 rounded-sm flex items-center justify-between gap-3 border border-zinc-900/60">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-display font-bold uppercase tracking-wide text-text-primary">City Hygiene Watch</h4>
                            <p className="text-[10px] text-text-muted">Register a Pothole or Garbage Overflow event.</p>
                            <span className="text-[9px] font-semibold text-accent-success block mt-1 font-mono">
                              {quest3Complete ? "✓ Quest Complete (+120 XP)" : `Progress: ${quest3Progress} / 1`}
                            </span>
                          </div>
                          <div className={`p-1.5 rounded-sm border shrink-0 ${quest3Complete ? "bg-accent-success/10 text-accent-success border-accent-success/20" : "bg-zinc-950 text-text-muted border-zinc-900"}`}>
                            {quest3Complete ? <Check className="w-4 h-4 stroke-[3]" /> : <Award className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badges Case (Compact Section Underneath) */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-[11px] font-bold text-text-muted tracking-wider uppercase font-mono">Civic Badge Case</label>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Badge 1 */}
                      <div className={`p-3 rounded-sm border text-center space-y-1.5 transition-all shadow-sm ${isFirstRespEarned ? "bg-accent-success/10 border-accent-success/20 text-accent-success" : "bg-zinc-950/40 border-zinc-900 opacity-40 text-text-muted"}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${isFirstRespEarned ? "bg-accent-success/10 text-accent-success" : "bg-zinc-900 text-text-muted"}`}>
                          <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <h5 className="text-[9px] font-bold leading-tight truncate font-display uppercase tracking-wider">First Resp</h5>
                        <span className="text-[8px] text-text-muted block font-medium">Logged Issue</span>
                      </div>

                      {/* Badge 2 */}
                      <div className={`p-3 rounded-sm border text-center space-y-1.5 transition-all shadow-sm ${isCivicVettEarned ? "bg-accent-alert/10 border-accent-alert/20 text-accent-alert" : "bg-zinc-950/40 border-zinc-900 opacity-40 text-text-muted"}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${isCivicVettEarned ? "bg-accent-alert/10 text-accent-alert" : "bg-zinc-900 text-text-muted"}`}>
                          <ThumbsUp className="w-4 h-4 fill-current" />
                        </div>
                        <h5 className="text-[9px] font-bold leading-tight truncate font-display uppercase tracking-wider">Civic Vett</h5>
                        <span className="text-[8px] text-text-muted block font-medium">1+ Vouch</span>
                      </div>

                      {/* Badge 3 */}
                      <div className={`p-3 rounded-sm border text-center space-y-1.5 transition-all shadow-sm ${isFixHeroEarned ? "bg-accent-success/10 border-accent-success/20 text-accent-success" : "bg-zinc-950/40 border-zinc-900 opacity-40 text-text-muted"}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${isFixHeroEarned ? "bg-accent-success/10 text-accent-success" : "bg-zinc-900 text-text-muted"}`}>
                          <Sparkles className="w-4 h-4 fill-current" />
                        </div>
                        <h5 className="text-[9px] font-bold leading-tight truncate font-display uppercase tracking-wider">Fix Hero</h5>
                        <span className="text-[8px] text-text-muted block font-medium">1+ Solved</span>
                      </div>

                      {/* Badge 4 */}
                      <div className={`p-3 rounded-sm border text-center space-y-1.5 transition-all shadow-sm ${isOverlordEarned ? "bg-accent-info/10 border-accent-info/20 text-accent-info" : "bg-zinc-950/40 border-zinc-900 opacity-40 text-text-muted"}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${isOverlordEarned ? "bg-accent-info/10 text-accent-info" : "bg-zinc-900 text-text-muted"}`}>
                          <Award className="w-4 h-4 fill-current" />
                        </div>
                        <h5 className="text-[9px] font-bold leading-tight truncate font-display uppercase tracking-wider">Overlord</h5>
                        <span className="text-[8px] text-text-muted block font-medium">3+ Logged</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-display font-black uppercase tracking-wider text-text-primary">Preferences & Settings</h2>
                <p className="text-xs text-text-muted mt-1">Configure user themes, simulation nodes, and clear local state.</p>
              </div>

              {/* Citizen Profile Settings Panel */}
              {currentUser ? (
                <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 space-y-3.5 shadow-sm">
                  <label className="block text-xs font-bold text-text-muted tracking-wider uppercase font-mono">Citizen Profile Details</label>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-text-muted font-mono">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-sm text-xs font-medium focus:ring-1 focus:ring-accent-alert text-text-primary outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-text-muted font-mono">Profile Photo URL (Optional)</label>
                      <input
                        type="text"
                        value={profilePhoto}
                        onChange={(e) => setProfilePhoto(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-sm text-xs font-medium focus:ring-1 focus:ring-accent-alert text-text-primary outline-none"
                      />
                    </div>

                    <button
                      onClick={handleUpdateProfile}
                      disabled={profileUpdating}
                      className="w-full bg-accent-info hover:bg-accent-info/85 text-white text-xs font-bold py-2.5 rounded-sm transition-all active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {profileUpdating ? "Saving Changes..." : "Save Profile Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-accent-alert/5 border border-accent-alert/20 rounded-sm p-4 text-center text-xs text-accent-alert font-mono">
                  Please sign in to customize your profile details, earn points, and view achievements.
                </div>
              )}

              {/* Theme Settings Panel */}
              <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 space-y-3.5">
                <label className="block text-xs font-bold text-text-muted tracking-wider uppercase font-mono">Visual Theme Preference</label>
                
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "auto"] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setThemeMode(mode)}
                      className={`py-2 px-3 rounded-sm text-xs font-semibold capitalize border flex flex-col items-center gap-1.5 transition-all ${
                        themeMode === mode
                          ? "bg-accent-alert border-accent-alert text-white"
                          : "bg-zinc-950 border-zinc-800 text-text-muted hover:text-text-primary"
                      }`}
                      id={`theme-btn-${mode}`}
                    >
                      {mode === "light" && <Sun className="w-4 h-4" />}
                      {mode === "dark" && <Moon className="w-4 h-4" />}
                      {mode === "auto" && <Smartphone className="w-4 h-4" />}
                      <span>{mode === "auto" ? "System" : mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Developer Controls Panel */}
              <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 space-y-4 text-text-primary">
                <label className="block text-xs font-bold text-text-muted tracking-wider uppercase font-mono">Platform & AI Config</label>
                
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="block font-semibold">Gemini Server Connection</strong>
                      <span className="text-[10px] text-text-muted">
                        {serverKeyStatus ? "Live API Secret found" : "No server secret present"}
                      </span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${serverKeyStatus ? "bg-accent-success animate-pulse" : "bg-accent-alert"}`} />
                  </div>

                  <div className="flex items-start justify-between text-xs pt-3 border-t border-zinc-900">
                    <div>
                      <strong className="block font-semibold">Bypass Verification API (Simulator)</strong>
                      <p className="text-[10px] text-text-muted">Run local mock AI engine instead of calling live backend Gemini API.</p>
                    </div>
                    <div>
                      <input 
                        type="checkbox" 
                        checked={simulationMode} 
                        onChange={(e) => setSimulationMode(e.target.checked)}
                        className="rounded border-zinc-800 text-accent-alert focus:ring-accent-alert accent-accent-alert"
                        id="simulation-mode-checkbox"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Tasks Column */}
              <div className="bg-bg-card border border-zinc-800/80 rounded-sm p-4 space-y-3.5">
                <label className="block text-xs font-bold text-text-muted tracking-wider uppercase font-mono">Maintenance Tasks</label>
                
                <button
                  onClick={() => {
                    if (confirm("Proceed with clearing all locally saved and cached civic reports?")) {
                      localStorage.removeItem("civic-reporter-reports");
                      setReports([]);
                      showAlert("Cache purged successfully.");
                    }
                  }}
                  className="bg-accent-alert/10 text-accent-alert hover:bg-accent-alert/15 p-2.5 rounded-sm text-xs font-bold w-full border border-accent-alert/20 flex items-center justify-center gap-1.5 transition-all"
                  id="wipe-local-reports"
                >
                  <Trash2 className="w-4 h-4" /> Purge Local Data Cache
                </button>
              </div>

              {/* Legal information & About disclosure */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-sm space-y-2">
                <h4 className="text-xs font-display font-bold uppercase tracking-wide flex items-center gap-1.5 text-text-primary">
                  <Info className="w-4 h-4 text-accent-alert" /> About CityFix
                </h4>
                <p className="text-[11px] text-text-muted leading-relaxed font-light">
                  This public utility operates as an open-source, mobile-first dispatch prototype. Visual categorizations and location pins are logged locally on-device. All server operations persist dynamically in-memory.
                </p>
                <div className="text-[10px] text-text-muted pt-1 border-t border-zinc-900">
                  Built for the deep community-focused Smart City initiative.
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Bottom Mobile Navigation Bar for One-Thumb use (YouTube styled) */}
      <BottomNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        badges={{ unreadFeedCount: unreadFeedCount, hasCivicPending: true }}
        isAdmin={currentUser?.id === "J3mM82uxvxR1ZwhYH4aTL8DbD0v2" || currentUser?.id === "USR-1782557260903-153" || currentUser?.email?.toLowerCase() === "tonysanap.145@gmail.com"}
      />



      {/* AUTH MODAL */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="auth-modal-screen">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAuthModalOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                }}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"
                id="close-auth-modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 pt-2">
                <div className="mx-auto w-10 h-10 rounded-sm bg-accent-alert/10 text-accent-alert flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                
                <h3 className="text-md font-display font-black uppercase tracking-wider mt-2">
                  Sign In / Register
                </h3>
                
                <p className="text-[10px] text-text-muted max-w-[240px] mx-auto leading-relaxed">
                  Access your saved reports, view dispatch alerts, and earn citizen response badges.
                </p>
              </div>

              {authError && (
                <div className="p-2.5 bg-accent-alert/5 border border-accent-alert/20 rounded-sm text-center text-[10px] font-semibold text-accent-alert relative font-mono">
                  ⚠️ {authError}
                </div>
              )}

              <div className="space-y-4 pt-4">
                {/* Google Sign-In Button Only */}
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white border border-slate-300 dark:border-slate-800 font-display font-bold uppercase tracking-wider py-3 rounded-lg text-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm font-mono disabled:opacity-50"
                  id="google-signin-btn"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2.5 animate-spin text-slate-500" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING SMS ASSISTANT CHATBOT HUB --- */}
      <SmsDispatchBot 
        onSubmitReport={handleSmsReportSubmit} 
        currentUser={currentUser}
        onOpenAuth={(mode?: "login" | "signup", errorMsg?: string) => {
          setAuthMode(mode || "login");
          setAuthError(errorMsg || "");
          setAuthModalOpen(true);
        }}
      />

      {/* --- MOCK ADMIN RESOLUTION MODAL OVERLAY --- */}
      <AnimatePresence>
        {resolvingId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResolvingId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-150 z-50 text-left"
            >
              <h3 className="text-sm font-bold font-display">Resolve Civic Work-Order</h3>
              <p className="text-[10px] text-slate-500">
                Logged as municipality field engineer. Specify repair notes and provide an optional After photo link.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Resolution Status Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe how the pothole was patched/repaired..."
                    className="w-full bg-slate-55 dark:bg-black/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                    value={resolvingNote}
                    onChange={(e) => setResolvingNote(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">After-image URL / Mock Payload</label>
                  <input
                    type="text"
                    placeholder="Enter an after photo link, or leave empty for mock"
                    className="w-full bg-slate-55 dark:bg-black/30 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                    value={resolvingAfterImage}
                    onChange={(e) => setResolvingAfterImage(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!resolvingNote.trim()) {
                        showAlert("Please supply structural notes before resolving.");
                        return;
                      }
                      handleAdminResolve();
                    }}
                    className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition-all active:scale-95 text-center cursor-pointer"
                  >
                    Authorize Resolution
                  </button>
                  <button
                    onClick={() => setResolvingId(null)}
                    className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 bg-transparent px-3 rounded-xl text-xs active:scale-95 transition-all outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MANUAL LOCATION FALLBACK MODAL --- */}
      <AnimatePresence>
        {showManualLocationModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowManualLocationModal(false);
                setManualLocationError(null);
                setManualLocationInput("");
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
              id="manual-location-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 z-50 text-left font-mono"
              id="manual-location-modal-panel"
            >
              <div className="flex items-center gap-2 text-[#ff453a] dark:text-[#ff453a]">
                <MapPin className="w-5 h-5 shrink-0 animate-bounce" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">Specify Your Area</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                We couldn't retrieve your current GPS coordinates automatically. Please enter your neighborhood, city, or address manually so we can focus the map and show nearby reported issues.
              </p>
              
              <form onSubmit={handleManualGeocodeSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={manualLocationInput}
                    onChange={(e) => {
                      setManualLocationInput(e.target.value);
                      setShowManualSuggestionsDropdown(true);
                    }}
                    onFocus={() => setShowManualSuggestionsDropdown(true)}
                    onBlur={() => {
                      // Slight delay to allow item click to register
                      setTimeout(() => setShowManualSuggestionsDropdown(false), 200);
                    }}
                    placeholder="e.g., Mission District, San Francisco or Seattle, WA"
                    disabled={manualLocationLoading}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 py-2.5 px-3.5 pr-10 text-xs rounded-lg focus:ring-1 focus:ring-[#ff453a] focus:border-[#ff453a] font-mono outline-none"
                    autoFocus
                  />
                  {manualLocationLoading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#ff453a] border-t-transparent" />
                    </div>
                  )}

                  {/* Dropdown panel */}
                  {showManualSuggestionsDropdown && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-[150] max-h-56 overflow-y-auto">
                      {/* 1. Show Nominatim Suggestions */}
                      {manualLocationInput.trim().length >= 3 && manualSuggestions.length > 0 && (
                        <div className="py-1">
                          <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                            Matching Suggestions
                          </div>
                          {manualSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectManualSuggestion(suggestion);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all font-mono truncate flex items-center gap-2 border-b border-slate-50 dark:border-slate-900/50 last:border-0"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#ff453a] shrink-0" />
                              <span className="truncate">{suggestion.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 2. Show Recent Searches */}
                      {(!manualLocationInput.trim() || manualSuggestions.length === 0) && recentSearches.length > 0 && (
                        <div className="py-1">
                          <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Recent Searches
                          </div>
                          {recentSearches.map((search, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectRecentSearchInModal(search);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all font-mono truncate flex items-center gap-2 border-b border-slate-50 dark:border-slate-900/50 last:border-0"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{search}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {manualLocationInput.trim().length >= 3 && manualSuggestions.length === 0 && !manualLocationLoading && (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No match suggestions found.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {manualLocationError && (
                  <p className="text-[11px] text-red-500 font-bold leading-normal">
                    ⚠️ {manualLocationError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualLocationModal(false);
                      setManualLocationError(null);
                      setManualLocationInput("");
                      fetchIpLocation();
                    }}
                    disabled={manualLocationLoading}
                    className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all outline-none"
                  >
                    Skip & Use Default
                  </button>
                  <button
                    type="submit"
                    disabled={manualLocationLoading}
                    className="bg-[#ff453a] hover:bg-[#ff3b30] text-white font-bold py-2 px-5 rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {manualLocationLoading ? "Searching..." : "Set Location"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MANUAL CLASSIFICATION FALLBACK MODAL --- */}
      <AnimatePresence>
        {showManualClassificationModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4" id="manual-classification-fallback-screen">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowManualClassificationModal(false);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
              id="manual-classification-backdrop"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 z-50 text-left font-mono"
              id="manual-classification-modal-panel"
            >
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">AI Analysis Offline / Unclear</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-light normal-case">
                We encountered an issue during automatic image analysis (or confidence was low). To make sure your report gets processed, please select the category of the civic hazard manually.
              </p>

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] block text-slate-400 font-bold tracking-wide uppercase">Select Hazard Category</label>
                  <select
                    value={manualCategory || "pothole"}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 py-2.5 px-3 text-xs rounded-lg font-mono outline-none cursor-pointer"
                    id="fallback-manual-category-picker"
                  >
                    <option value="pothole">Pothole</option>
                    <option value="streetlight_issue">Streetlight Issue</option>
                    <option value="water_leakage">Water Leakage</option>
                    <option value="garbage_overflow">Garbage Overflow</option>
                    <option value="broken_pavement">Broken Pavement</option>
                    <option value="other_infrastructure">Other Public Infrastructure</option>
                    <option value="other">Other (Specify Custom Name)</option>
                  </select>
                </div>

                {manualCategory === "other" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] block text-slate-400 font-bold tracking-wide uppercase">Custom Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Fallen Tree, Broken Bench, Graffiti"
                      value={customCategoryText}
                      onChange={(e) => setCustomCategoryText(e.target.value)}
                      maxLength={50}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 py-2.5 px-3 text-xs rounded-lg font-sans placeholder-slate-600 focus:outline-none focus:border-red-500 outline-none"
                      id="fallback-manual-custom-text"
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">Max 50 characters.</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualClassificationModal(false);
                    }}
                    className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmManualClassification}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    Confirm Classification
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM APP ALERTS/TOAST MODAL OVERLAY --- */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setToastMessage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-150 z-50 text-left"
            >
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Info className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold font-display">System Notification</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                {toastMessage}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setToastMessage(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LOCATION SAVED FLOATING TOAST --- */}
      <AnimatePresence>
        {locationToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-4 w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={() => setLocationToast(null)}
              className="cursor-pointer flex items-center gap-3 bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Success</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{locationToast}</p>
              </div>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM SAVE PERMANENT LOCATION MODAL --- */}
      <AnimatePresence>
        {currentUser && pendingConfirmLocation && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingConfirmLocation(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
              id="confirm-location-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 z-50 text-left font-mono"
              id="confirm-location-modal-panel"
            >
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">Save Base Location?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                Do you want to save <span className="font-bold text-slate-800 dark:text-white">"{pendingConfirmLocation.address.split(",")[0]}"</span> permanently as your primary profile base location?
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-bold">Coordinates:</span> {pendingConfirmLocation.lat.toFixed(5)}, {pendingConfirmLocation.lng.toFixed(5)}
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Just keep it for session (coords/address are already updated!)
                    setPendingConfirmLocation(null);
                    setLocationToast("Location updated for this session only");
                  }}
                  className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all outline-none"
                >
                  Session Only
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Save to backend using same profile sync logic
                    await saveLocationToBackend(pendingConfirmLocation.address, pendingConfirmLocation.lat, pendingConfirmLocation.lng);
                    setPendingConfirmLocation(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  Save Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM SPAM FLAG MODAL --- */}
      <AnimatePresence>
        {flagConfirmation && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFlagConfirmation(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
              id="confirm-flag-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 z-50 text-left font-mono"
              id="confirm-flag-modal-panel"
            >
              <div className="flex items-center gap-2 text-amber-500">
                <Flag className="w-5 h-5 shrink-0 fill-amber-500" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                  {flagConfirmation.isRemoval ? "Remove Spam Flag?" : "Flag as Spam?"}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                {flagConfirmation.isRemoval 
                  ? "Remove your spam flag for this report?" 
                  : "Flag this report as spam? This helps moderators review inaccurate or fake reports."
                }
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagConfirmation(null)}
                  className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    executeFlagReport(flagConfirmation.reportId, flagConfirmation.isRemoval);
                    setFlagConfirmation(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM VOUCH REMOVAL MODAL --- */}
      <AnimatePresence>
        {vouchConfirmation && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVouchConfirmation(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
              id="confirm-vouch-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 z-50 text-left font-mono"
              id="confirm-vouch-modal-panel"
            >
              <div className="flex items-center gap-2 text-emerald-500">
                <ThumbsUp className="w-5 h-5 shrink-0 fill-emerald-500 text-emerald-500" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                  Remove Vouch?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                Remove your vouch for this report?
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setVouchConfirmation(null)}
                  className="border border-slate-300 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    executeVouchReport(vouchConfirmation.reportId, true);
                    setVouchConfirmation(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FULL VIEWPORT DEVICE CAMERA OVERLAY --- */}
      <AnimatePresence>
        {isCapturing && (
          <div className="fixed inset-0 w-full h-full z-[10000] bg-black select-none overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* Top gradient overlay */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

            {/* Top controls */}
            <div className="absolute top-6 inset-x-0 px-6 flex items-center justify-between z-10">
              <button
                onClick={stopCamera}
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                id="camera-cancel"
                title="Cancel camera capture"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="px-4 py-2 rounded-full bg-black/40 border border-white/20 text-white text-[11px] font-mono font-bold tracking-widest uppercase backdrop-blur-md">
                {facingMode === "environment" ? "Rear Lens" : "Front Lens"}
              </div>

              <button
                onClick={toggleCamera}
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                id="camera-toggle-lens"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-10 inset-x-0 px-6 flex flex-col items-center gap-5 z-10">
              <span className="text-[10px] text-white/90 font-mono tracking-widest uppercase bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-xs">
                Capture Grounding Evidence
              </span>
              <div className="flex items-center justify-center gap-8 w-full mt-2">
                <button
                  onClick={capturePhoto}
                  className="group relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  id="camera-snap"
                  title="Snap Photo"
                >
                  <span className="w-16 h-16 bg-white group-hover:bg-slate-100 rounded-full block transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
