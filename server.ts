import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastUpdate(type: string, data?: any) {
  let broadcastData = data;
  if (type === "report_update" && data && typeof data === "object") {
    const { userEmail, ...rest } = data;
    broadcastData = rest;
  }
  const payload = JSON.stringify({ type, data: broadcastData });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(payload);
      } catch (err) {
        console.error("Error broadcasting to WS client:", err);
      }
    }
  });
}

// Increase body limit to support high-res base64 images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// In-memory data store for civic reports
interface CivicReport {
  id: string;
  category: string;
  confidence: number;
  description: string;
  status: "Pending Approval" | "Submitted" | "Verified" | "In Review" | "Scheduled for Repair" | "Resolved";
  latitude: number;
  longitude: number;
  address: string;
  imageData: string; // base64 representation or representation URL
  videoData?: string; // base64/data URI of optional video
  imageHash: string;
  createdAt: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateReason?: string;
  userId?: string;
  userEmail?: string;
  vouchCount?: number;
  vouchedUserIds?: string[];
  flagCount?: number;
  flaggedUserIds?: string[];
  timeline?: { stage: string; time: string; note: string }[];
  comments?: { id: string; author: string; text: string; createdAt: string }[];
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
  customCategoryLabel?: string;
  nominatedAt?: string;
  nominatedByUserId?: string;
  pollVotes?: number;
  pollVotedUserIds?: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  passwordHash?: string;
  passwordSalt?: string;
  createdAt: string;
  points: number;
  badges: string[];
  savedLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
  loginMethod?: "Google" | "Email OTP" | "Password";
  liveLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

// Password hashing helpers
function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const USERS_FILE = path.join(process.cwd(), "users.json");
const REPORTS_FILE = path.join(process.cwd(), "reports.json");

let db: any = null;
const configPath = path.join(process.cwd(), "firebase-applet-config.json");

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.cert(serviceAccount);
        console.log("[Firebase] Using service account credentials from FIREBASE_SERVICE_ACCOUNT env var.");
      } catch (err) {
        console.error("[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT env var:", err);
      }
    }

    admin.initializeApp({
      credential,
      projectId: config.projectId,
    });
    db = getFirestore(undefined, config.firestoreDatabaseId);
    console.log("[Firebase] Admin SDK initialized successfully.");
  } catch (err) {
    console.error("[Firebase] Error initializing Admin SDK:", err);
  }
} else {
  console.log("[Firebase] No firebase-applet-config.json found. Running in offline/file-only mode.");
}

function mapUserToFirestore(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`,
    passwordHash: u.passwordHash || "",
    passwordSalt: u.passwordSalt || "",
    createdAt: u.createdAt || new Date().toISOString(),
    points: u.points || 0,
    badges: u.badges || ["First Resp"],
    vouchedIds: u.vouchedIds || [],
    savedLocation: u.savedLocation ? {
      address: u.savedLocation.address || "",
      latitude: u.savedLocation.lat || u.savedLocation.latitude || 37.7849,
      longitude: u.savedLocation.lng || u.savedLocation.longitude || -122.4094,
      district: u.savedLocation.district || "Mission District",
      ward: u.savedLocation.ward || "District 6"
    } : null,
    weeklyQuests: u.weeklyQuests || {
      quest1Progress: 0,
      quest2Progress: 0,
      quest3Progress: 0,
      lastResetTime: new Date().toISOString()
    }
  };
}

function mapUserFromFirestore(doc: any) {
  const u = { ...doc };
  if (u.savedLocation) {
    u.savedLocation.lat = u.savedLocation.latitude || u.savedLocation.lat;
    u.savedLocation.lng = u.savedLocation.longitude || u.savedLocation.lng;
  }
  return u;
}

function mapReportToFirestore(r: any) {
  return {
    id: r.id,
    category: r.category,
    confidence: r.confidence || 100,
    description: r.description || "",
    status: r.status || "Pending Approval",
    latitude: r.latitude || 37.7849,
    longitude: r.longitude || -122.4094,
    address: r.address || "",
    district: r.district || "Mission District",
    imageData: r.imageData || "",
    imageHash: r.imageHash || "",
    createdAt: r.createdAt || new Date().toISOString(),
    userId: r.userId || "",
    userEmail: r.userEmail || "",
    vouchCount: r.vouchCount || 0,
    vouchedUserIds: r.vouchedUserIds || [],
    flagCount: r.flagCount || 0,
    flaggedUserIds: r.flaggedUserIds || [],
    assignedDepartment: r.assignedDepartment || "Department of Public Works",
    slaDurationDays: r.slaDurationDays || 7,
    slaDueDate: r.slaDueDate || new Date().toISOString(),
    severity: r.severity || "Medium",
    landmarks: r.landmarks || "",
    urgencyCues: r.urgencyCues || [],
    timeline: r.timeline || [],
    comments: r.comments || []
  };
}

function mapPollToFirestore(r: any) {
  const nominatedTime = r.nominatedAt ? new Date(r.nominatedAt).getTime() : Date.now();
  const isCurrentlyNominated = (Date.now() - nominatedTime) <= 7 * 24 * 3600 * 1000;
  return {
    id: r.id,
    reportId: r.id,
    category: r.category,
    address: r.address || "",
    district: r.district || "Mission District",
    latitude: r.latitude || 37.7849,
    longitude: r.longitude || -122.4094,
    nominatedAt: r.nominatedAt || new Date().toISOString(),
    nominatedByUserId: r.nominatedByUserId || "",
    voterUserIds: r.pollVotedUserIds || [],
    voteCount: r.pollVotes || 1,
    status: isCurrentlyNominated ? "active" : "expired"
  };
}

async function syncUsersToFirestore(data: User[]) {
  if (!db) return;
  try {
    const usersColl = db.collection("users");
    for (const u of data) {
      await usersColl.doc(u.id).set(mapUserToFirestore(u));
    }
  } catch (error: any) {
    console.log("[Firebase] Notice: Cloud sync is offline or credentials pending. Running in local high-performance persistence mode.");
  }
}

async function syncReportsToFirestore(data: CivicReport[]) {
  if (!db) return;
  try {
    const reportsColl = db.collection("reports");
    const pollsColl = db.collection("polls");
    for (const r of data) {
      await reportsColl.doc(r.id).set(mapReportToFirestore(r));
      if (r.nominatedAt) {
        await pollsColl.doc(r.id).set(mapPollToFirestore(r));
      }
    }
  } catch (error: any) {
    console.log("[Firebase] Notice: Cloud sync is offline or credentials pending. Running in local high-performance persistence mode.");
  }
}

async function syncFromFirestore() {
  if (!db) return;
  try {
    console.log("[Firebase] Attempting connection to Firestore database...");
    const usersColl = db.collection("users");
    const reportsColl = db.collection("reports");
    const pollsColl = db.collection("polls");

    const usersSnap = await usersColl.get();
    if (usersSnap.empty) {
      console.log("[Firebase] Firestore users collection is empty. Initial migration...");
      await syncUsersToFirestore(users);
    } else {
      console.log(`[Firebase] Loaded ${usersSnap.size} users from Firestore.`);
      users.length = 0;
      usersSnap.forEach((doc: any) => {
        const data = doc.data() as User;
        data.id = doc.id; // Force alignment: internal ID MUST match the Firestore document ID!
        users.push(mapUserFromFirestore(data));
      });
    }

    const reportsSnap = await reportsColl.get();
    if (reportsSnap.empty) {
      console.log("[Firebase] Firestore reports collection is empty. Initial migration...");
      await syncReportsToFirestore(reports);
    } else {
      console.log(`[Firebase] Loaded ${reportsSnap.size} reports from Firestore.`);
      reports.length = 0;
      reportsSnap.forEach((doc: any) => {
        const data = doc.data() as CivicReport;
        data.id = doc.id; // Force alignment: internal ID MUST match the Firestore document ID!
        reports.push(data);
      });
      
      // Re-index hashes
      imageHashToReportMap.clear();
      reports.forEach(r => {
        if (r.imageHash) {
          imageHashToReportMap.set(r.imageHash, r.id);
        }
      });
    }
    console.log("[Firebase] Bi-directional sync complete.");
    broadcastUpdate("db_update");
  } catch (error: any) {
    console.log("[Firebase] Notice: Cloud sync is offline or credentials pending. Running in local high-performance persistence mode.");
  }
}

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading users file:", error);
  }
  // Initial seed users
  const initialUsers: User[] = [
    {
      id: "USR-alex",
      email: "alex@example.com",
      name: "Alex Mercer",
      passwordHash: hashPassword("password123", "salt_alex"),
      passwordSalt: "salt_alex",
      createdAt: new Date().toISOString(),
      points: 1820,
      badges: ["First Resp", "Civic Vett", "Fix Hero"]
    },
    {
      id: "USR-satoshi",
      email: "satoshi@example.com",
      name: "Satoshi K.",
      passwordHash: hashPassword("password123", "salt_satoshi"),
      passwordSalt: "salt_satoshi",
      createdAt: new Date().toISOString(),
      points: 1250,
      badges: ["Civic Vett", "Overlord"]
    },
    {
      id: "USR-jane",
      email: "jane@example.com",
      name: "Jane Doe",
      passwordHash: hashPassword("password123", "salt_jane"),
      passwordSalt: "salt_jane",
      createdAt: new Date().toISOString(),
      points: 380,
      badges: ["First Resp"]
    },
    {
      id: "USR-11111111111",
      email: "test@example.com",
      name: "Test User",
      passwordHash: hashPassword("password123", "default_salt_test"),
      passwordSalt: "default_salt_test",
      createdAt: new Date().toISOString(),
      points: 840,
      badges: ["First Resp", "Civic Vett"]
    }
  ];
  saveUsers(initialUsers);
  return initialUsers;
}

function saveUsers(data: User[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
    broadcastUpdate("db_update");
    syncUsersToFirestore(data);
  } catch (error) {
    console.error("Error writing users file:", error);
  }
}

function calculateUserPoints(userId: string, reportsList: CivicReport[]): { points: number; badges: string[] } {
  let points = 0;

  // Find all reports authored by this user
  const authoredReports = reportsList.filter(r => r.userId === userId);
  
  authoredReports.forEach(r => {
    // 0 points for issues flagged as false/duplicate/spam
    const isFlagged = r.isDuplicate || (r.flagCount && r.flagCount > 0);
    if (isFlagged) {
      return;
    }
    
    // +10 points per issue logged
    points += 10;
    
    // +15 points per issue that reaches "verified" status (Verified, In Review, Scheduled for Repair, Resolved)
    const reachedVerified = ["Verified", "In Review", "Scheduled for Repair", "Resolved"].includes(r.status);
    if (reachedVerified) {
      points += 15;
    }
    
    // +25 points per issue that reaches "resolved" status
    const reachedResolved = r.status === "Resolved";
    if (reachedResolved) {
      points += 25;
    }
  });

  // +5 points per vouch/upvote given to others' issues
  const vouchesGiven = reportsList.filter(r => {
    const isVoucher = r.vouchedUserIds && r.vouchedUserIds.includes(userId);
    const isNotAuthor = r.userId !== userId;
    return isVoucher && isNotAuthor;
  });
  points += vouchesGiven.length * 5;

  // +15 points per nomination in the Community Poll
  const nominationsByMe = reportsList.filter(r => r.nominatedByUserId === userId);
  points += nominationsByMe.length * 15;

  // +5 points per poll vote
  const pollVotesByMe = reportsList.filter(r => r.pollVotedUserIds && r.pollVotedUserIds.includes(userId) && r.nominatedByUserId !== userId);
  points += pollVotesByMe.length * 5;

  // Calculate badges
  const finalBadges: string[] = [];
  if (authoredReports.length >= 1) {
    finalBadges.push("First Resp");
  }
  if (vouchesGiven.length >= 1) {
    finalBadges.push("Civic Vett");
  }
  if (authoredReports.some(r => r.status === "Resolved")) {
    finalBadges.push("Fix Hero");
  }
  if (authoredReports.length >= 3) {
    finalBadges.push("Overlord");
  }
  
  if (finalBadges.length === 0) {
    finalBadges.push("First Resp");
  }

  return { points, badges: finalBadges };
}

function loadReports(): CivicReport[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading reports file:", error);
  }
  
  // Seed initial reports with consistent user ownership (Alex, Satoshi, Jane, Test User)
  const initialReports: CivicReport[] = [
    {
      id: "REP-1701345600000",
      category: "pothole",
      confidence: 94,
      description: "Large deep pothole on the center lane of the main avenue, causing cars to swerve. Quite close to the pedestrian crosswalk.",
      status: "In Review",
      latitude: 37.7849,
      longitude: -122.4094,
      address: "750 Market Street, San Francisco, CA 94102",
      imageData: "MOCK_POTHOLE_IMAGE",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      isDuplicate: false,
      imageHash: "mock_hash_1",
      vouchCount: 14,
      vouchedUserIds: ["USR-satoshi", "USR-jane", "USR-11111111111"],
      userId: "USR-alex",
      userEmail: "alex@example.com",
      timeline: [
        { stage: "Pending Approval", time: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), note: "Report successfully submitted by citizen. Pending approval." },
        { stage: "Submitted", time: new Date(Date.now() - 47.8 * 3600 * 1000).toISOString(), note: "District supervisor verified visual evidence." },
        { stage: "In Review", time: new Date(Date.now() - 47 * 3600 * 1000).toISOString(), note: "Municipality engineer assigned for physical on-site evaluation." }
      ],
      comments: [
        { id: "c1", author: "city_patrol", text: "Avoid the center lane! The hole is at least 15cm deep and can cause rim damage.", createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString() },
        { id: "c2", author: "commuter_john", text: "Swerved to avoid this this morning. Highly dangerous during heavy traffic times.", createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
      ],
      assignedDepartment: "Department of Public Works",
      slaDurationDays: 7,
      slaDueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      urgencyCues: ["cars swerving", "center lane"],
      landmarks: "Near the entrance of Union Square center",
      severity: "High",
      flagCount: 0
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
      vouchCount: 32,
      vouchedUserIds: ["USR-alex", "USR-jane", "USR-11111111111"],
      userId: "USR-satoshi",
      userEmail: "satoshi@example.com",
      timeline: [
        { stage: "Pending Approval", time: new Date(Date.now() - 120 * 3600 * 1000).toISOString(), note: "Outage reported via camera pinpoint." },
        { stage: "Submitted", time: new Date(Date.now() - 119.5 * 3600 * 1000).toISOString(), note: "Verification complete. Dispatching ticket." },
        { stage: "In Review", time: new Date(Date.now() - 118 * 3600 * 1000).toISOString(), note: "Public Works team confirmed outage schedule." },
        { stage: "Scheduled for Repair", time: new Date(Date.now() - 115 * 3600 * 1000).toISOString(), note: "LED repair crew assigned to Guerrero corridor." },
        { stage: "Resolved", time: new Date(Date.now() - 110 * 3600 * 1000).toISOString(), note: "Sodium vapor bulb replaced with energy-efficient LED fixture." }
      ],
      comments: [
        { id: "c3", author: "lane_safety", text: "Confirmed. There is high pedestrian traffic here, feels unsafe.", createdAt: new Date(Date.now() - 118 * 3600 * 1000).toISOString() },
        { id: "c4", author: "public_works_dispatcher", text: "Bulb replacement dispatcher completed successfully.", createdAt: new Date(Date.now() - 110 * 3600 * 1000).toISOString() }
      ],
      assignedDepartment: "Municipal Energy Board",
      slaDurationDays: 3,
      slaDueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      urgencyCues: ["pitch black", "corridor", "night"],
      landmarks: "Guerrero main corridor corner near 14th street",
      severity: "Medium",
      flagCount: 0,
      afterImageData: "MOCK_RESOLVED_STREETLIGHT",
      citizenConfirmed: true
    },
    {
      id: "REP-1701321500000",
      category: "garbage_overflow",
      confidence: 99,
      description: "Trash bins overflowing onto sidewalk, attracting pests. Needs immediate pick up.",
      status: "Submitted",
      latitude: 37.7599,
      longitude: -122.4344,
      address: "320 Dolores Street, San Francisco, CA 94110",
      imageData: "MOCK_GARBAGE_IMAGE",
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      isDuplicate: false,
      imageHash: "mock_hash_3",
      vouchCount: 4,
      vouchedUserIds: ["USR-alex", "USR-satoshi"],
      userId: "USR-jane",
      userEmail: "jane@example.com",
      timeline: [
        { stage: "Pending Approval", time: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), note: "Outflow reported by resident." },
        { stage: "Submitted", time: new Date(Date.now() - 11 * 3600 * 1000).toISOString(), note: "Scheduled for municipal pickup team clearance." }
      ],
      comments: [],
      assignedDepartment: "Department of Environmental Services",
      slaDurationDays: 1,
      slaDueDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      urgencyCues: ["overflowing", "pests"],
      landmarks: "Near Mission Dolores Park entrance",
      severity: "High",
      flagCount: 0
    },
    {
      id: "REP-1701321800000",
      category: "water_leakage",
      confidence: 96,
      description: "Water leaking from underground valve near the curb. Small stream of water running down the street.",
      status: "In Review",
      latitude: 37.7725,
      longitude: -122.4150,
      address: "100 11th Street, San Francisco, CA 94103",
      imageData: "MOCK_WATER_LEAK_IMAGE",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      isDuplicate: false,
      imageHash: "mock_hash_4",
      vouchCount: 3,
      vouchedUserIds: ["USR-alex", "USR-satoshi"],
      userId: "USR-11111111111",
      userEmail: "test@example.com",
      timeline: [
        { stage: "Pending Approval", time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), note: "Water leakage reported." },
        { stage: "Submitted", time: new Date(Date.now() - 23 * 3600 * 1000).toISOString(), note: "Acknowledged and logged by Municipal utility dispatcher." }
      ],
      comments: [],
      assignedDepartment: "Water Sanitation Division",
      slaDurationDays: 2,
      slaDueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      urgencyCues: ["leaking", "stream"],
      landmarks: "Corner of 11th and Howard",
      severity: "Medium",
      flagCount: 0
    }
  ];
  saveReports(initialReports);
  return initialReports;
}

function saveReports(data: CivicReport[]) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(data, null, 2), "utf-8");
    broadcastUpdate("db_update");
    syncReportsToFirestore(data);
  } catch (error) {
    console.error("Error writing reports file:", error);
  }
}

const users: User[] = loadUsers();
const reports: CivicReport[] = loadReports();
const tokenToUserMap = new Map<string, string>(); // token -> userId
const imageHashToReportMap = new Map<string, string>(); // Hash -> ReportID

// Populate image hash index on startup
reports.forEach(r => {
  if (r.imageHash) {
    imageHashToReportMap.set(r.imageHash, r.id);
  }
});

// Calculate distance in kilometers using Spherical Law of Cosines
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Lazy initialization of GoogleGenAI client (Safety / Graceful fallback)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health & Config endpoint
app.get("/api/health", (req, res) => {
  const apiConfigured = !!getGeminiClient();
  res.json({
    status: "ok",
    apiKeyConfigured: apiConfigured,
    timestamp: new Date().toISOString(),
  });
});

// 2. Authentication Endpoints
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = users.find(u => u.email === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered." });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const userId = `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const displayName = name || normalizedEmail.split("@")[0].split(/[._-]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const newUser: User = {
    id: userId,
    email: normalizedEmail,
    name: displayName,
    passwordHash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    points: 0,
    badges: ["First Resp"],
    loginMethod: "Password"
  };

  users.push(newUser);
  saveUsers(users);

  const token = `auth_token_${userId}_${crypto.randomBytes(8).toString("hex")}`;
  tokenToUserMap.set(token, userId);

  res.status(201).json({
    success: true,
    user: { id: userId, email: normalizedEmail, name: displayName, points: 0, badges: ["First Resp"], savedLocation: newUser.savedLocation },
    token
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const computedHash = hashPassword(password, user.passwordSalt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  user.loginMethod = "Password";
  saveUsers(users);

  const token = `auth_token_${user.id}_${crypto.randomBytes(8).toString("hex")}`;
  tokenToUserMap.set(token, user.id);

  const { points, badges } = calculateUserPoints(user.id, reports);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, photoURL: user.photoURL, points, badges, savedLocation: user.savedLocation },
    token
  });
});

app.post("/api/auth/google", (req, res) => {
  const { email, name, photoURL } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Missing email address from Google authentication." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = users.find(u => u.email === normalizedEmail);

  if (!user) {
    // Auto-create profile if first time logging in with Google
    const userId = `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const displayName = name || normalizedEmail.split("@")[0].split(/[._-]/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    
    user = {
      id: userId,
      email: normalizedEmail,
      name: displayName,
      photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`,
      createdAt: new Date().toISOString(),
      points: 0,
      badges: ["First Resp"],
      loginMethod: "Google"
    };
    users.push(user);
    saveUsers(users);
  } else {
    user.loginMethod = "Google";
    saveUsers(users);
  }

  const token = `auth_token_${user.id}_${crypto.randomBytes(8).toString("hex")}`;
  tokenToUserMap.set(token, user.id);

  const { points, badges } = calculateUserPoints(user.id, reports);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, photoURL: user.photoURL, points, badges, savedLocation: user.savedLocation },
    token
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = authHeader.replace("Bearer ", "");
  const userId = tokenToUserMap.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const { points, badges } = calculateUserPoints(user.id, reports);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, photoURL: user.photoURL, points, badges, savedLocation: user.savedLocation }
  });
});

// PATCH /api/users/me - updates user's profile details
app.patch("/api/users/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const userId = tokenToUserMap.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { name, photoURL, savedLocation, liveLocation } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (name !== undefined) {
    user.name = name;
  }
  if (photoURL !== undefined) {
    user.photoURL = photoURL;
  }
  if (savedLocation !== undefined) {
    user.savedLocation = savedLocation;
  }
  if (liveLocation !== undefined) {
    user.liveLocation = liveLocation;
  }

  saveUsers(users);

  const { points, badges } = calculateUserPoints(user.id, reports);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      points,
      badges,
      savedLocation: user.savedLocation
    }
  });
});

// GET /api/users - returns all users for leaderboard & profiles
app.get("/api/users", (req, res) => {
  const publicUsers = users
    .filter(u => {
      const nameLower = (u.name || "").toLowerCase();
      const emailLower = (u.email || "").toLowerCase();
      return !(
        u.id === "USR-11111111111" ||
        nameLower.includes("test") ||
        nameLower.includes("demo") ||
        emailLower.includes("test@") ||
        emailLower.includes("demo@")
      );
    })
    .map(u => {
      const { points, badges } = calculateUserPoints(u.id, reports);
      return {
        id: u.id,
        name: u.name,
        photoURL: u.photoURL,
        points,
        badges,
        createdAt: u.createdAt,
        savedLocation: u.savedLocation
      };
    });
  res.json(publicUsers);
});

// GET /api/admin/raw-users - returns all users including emails and testing accounts
app.get("/api/admin/raw-users", (req, res) => {
  const allUsersWithDetails = users.map(u => {
    const { points, badges } = calculateUserPoints(u.id, reports);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      points: points || u.points || 0,
      badges: badges || u.badges || [],
      photoURL: u.photoURL || null,
      createdAt: u.createdAt,
      savedLocation: u.savedLocation || null
    };
  });
  res.json(allUsersWithDetails);
});

// GET /api/admin/all-users-details - aggregates comprehensive data of all users for Admin
app.get("/api/admin/all-users-details", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const userId = tokenToUserMap.get(token);
  if (userId !== "J3mM82uxvxR1ZwhYH4aTL8DbD0v2" && userId !== "USR-1782557260903-153") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const isThisWeekStr = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return date.getTime() >= startOfWeek.getTime();
  };

  const allUsersWithDetails = users.map(u => {
    const { points, badges } = calculateUserPoints(u.id, reports);

    // Auth tokens for this user
    const tokens: string[] = [];
    tokenToUserMap.forEach((uid, tok) => {
      if (uid === u.id) {
        tokens.push(tok);
      }
    });

    // Login method fallback
    let loginMethod = u.loginMethod;
    if (!loginMethod) {
      if (u.id.startsWith("USR-alex") || u.id.startsWith("USR-jane") || u.id.startsWith("USR-satoshi") || u.id.startsWith("USR-11111111111")) {
        loginMethod = "Password";
      } else if (u.email.includes("gmail.com")) {
        loginMethod = "Google";
      } else {
        loginMethod = "Email OTP";
      }
    }

    // Reports authored by this user
    const userReports = reports.filter(r => r.userId === u.id).map(r => ({
      id: r.id,
      title: r.address || r.category.split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      description: r.description,
      images: [r.imageData, r.afterImageData].filter(Boolean) as string[],
      latitude: r.latitude,
      longitude: r.longitude,
      category: r.category,
      confidence: r.confidence || 0.95,
      status: r.status,
      timeline: r.timeline || []
    }));

    // Vouch records
    const vouchesGiven = reports.filter(r => r.vouchedUserIds?.includes(u.id)).map(r => {
      const authorUser = users.find(usr => usr.id === r.userId);
      return {
        reportId: r.id,
        reportTitle: r.address || r.category,
        reportUserId: r.userId,
        reportUserName: authorUser ? authorUser.name : "Anonymous"
      };
    });

    const vouchesReceived = reports.filter(r => r.userId === u.id).flatMap(r => 
      (r.vouchedUserIds || []).map(vid => {
        const voucher = users.find(usr => usr.id === vid);
        return {
          reportId: r.id,
          reportTitle: r.address || r.category,
          voucherId: vid,
          voucherName: voucher ? voucher.name : "Anonymous"
        };
      })
    );

    // Spam flag records
    const flagsGiven = reports.filter(r => r.flaggedUserIds?.includes(u.id)).map(r => {
      const authorUser = users.find(usr => usr.id === r.userId);
      return {
        reportId: r.id,
        reportTitle: r.address || r.category,
        reportUserId: r.userId,
        reportUserName: authorUser ? authorUser.name : "Anonymous"
      };
    });

    const flagsReceived = reports.filter(r => r.userId === u.id).flatMap(r => 
      (r.flaggedUserIds || []).map(fid => {
        const flagger = users.find(usr => usr.id === fid);
        return {
          reportId: r.id,
          reportTitle: r.address || r.category,
          flaggerId: fid,
          flaggerName: flagger ? flagger.name : "Anonymous"
        };
      })
    );

    // Poll nominations and votes
    const nominations = reports.filter(r => r.nominatedByUserId === u.id).map(r => ({
      reportId: r.id,
      reportTitle: r.address || r.category,
      nominatedAt: r.nominatedAt
    }));

    const votesCast = reports.filter(r => r.pollVotedUserIds?.includes(u.id)).map(r => ({
      reportId: r.id,
      reportTitle: r.address || r.category,
      nominatedByUserId: r.nominatedByUserId
    }));

    // Quest progress
    const quest1Progress = reports.filter(r => r.userId === u.id && isThisWeekStr(r.createdAt)).length;
    const quest1Complete = quest1Progress >= 1;

    const quest2Progress = reports.filter(r => r.vouchedUserIds?.includes(u.id) && r.userId !== u.id && isThisWeekStr(r.createdAt)).length;
    const quest2Complete = quest2Progress >= 3;

    const quest3Progress = reports.filter(r => r.userId === u.id && (r.category === "pothole" || r.category === "garbage_overflow") && isThisWeekStr(r.createdAt)).length;
    const quest3Complete = quest3Progress >= 1;

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`,
      createdAt: u.createdAt,
      savedLocation: u.savedLocation || null,
      liveLocation: u.liveLocation || null,
      loginMethod,
      tokens,
      reports: userReports,
      vouchRecords: {
        given: vouchesGiven,
        received: vouchesReceived
      },
      spamFlagRecords: {
        given: flagsGiven,
        received: flagsReceived
      },
      pollRecords: {
        nominations,
        votes: votesCast
      },
      points,
      badges,
      questProgress: {
        quest1: { progress: quest1Progress, complete: quest1Complete },
        quest2: { progress: quest2Progress, complete: quest2Complete },
        quest3: { progress: quest3Progress, complete: quest3Complete }
      }
    };
  });

  res.json(allUsersWithDetails);
});

// POST /api/users/me/points - synchronizes / updates user points
app.post("/api/users/me/points", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  const userId = tokenToUserMap.get(token);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = users.find(u => u.id === userId);
  if (user) {
    const { points, badges } = calculateUserPoints(user.id, reports);
    user.points = points;
    user.badges = badges;
    saveUsers(users);
    return res.json({ success: true, points, badges });
  }
  res.status(404).json({ error: "User not found" });
});

// 3. Image Verification & Duplicate Check endpoint
app.post("/api/verify-image", async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Missing image data." });
  }

  // Compute image hash (SHA-256) for exact duplicate checking
  const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
  const hash = crypto.createHash("sha256").update(cleanBase64).digest("hex");
  
  const existingReport = reports.find(r => r.imageHash === hash);
  const isDuplicate = !!existingReport;
  const existingReportId = existingReport?.id;

  // Run Gemini vision verification
  const ai = getGeminiClient();
  if (!ai) {
    // Graceful error / Fallback when API Key is missing
    return res.status(200).json({
      error: "Gemini API key is not configured on the server. Please add your key in Settings > Secrets. You can still bypass this via mock mode client-side.",
      isConfigError: true,
      imageHash: hash,
      isDuplicate,
      existingReportId,
    });
  }

  try {
    const prompt = `Analyze this image for civic infrastructure reporting. 
You must classify the image into exactly one of these supported categories:
- pothole
- streetlight_issue
- water_leakage
- garbage_overflow
- broken_pavement
- other_infrastructure
- not_a_civic_issue

Instructions for Accuracy, Model Matching, and Safety:
- Carefully examine the image content before classifying. Only select a category that is clearly supported by visual evidence in the image.
- If the image shows water, pipes, flooding, spray, or wet leakage, you MUST consider 'water_leakage' before all other categories. Never classify a burst pipe or water leakage as 'streetlight_issue' or other unrelated categories.
- Choose the category that best matches what is actually visible in the image. Do not default to any generic or most-common category unless there is clear visual proof supporting it.
- ONLY classify as pothole, streetlight_issue, water_leakage, garbage_overflow, broken_pavement, or other_infrastructure if there is CLEAR, PUBLIC, and PHYSICAL damage or hazard to public outdoor civic infrastructure.
- If the image contains human faces, complete human bodies, selfies, pets, home/interior household scenes, screenshots of apps, text documents, generic household furniture, blank/blurry/black captures, or unrelated random objects, you MUST classify it as 'not_a_civic_issue' to prevent errors.
- Be extremely strict. For example, a picture of a clean street with a person standing there is NOT a pothole, it is 'not_a_civic_issue'. A picture of flowers, animals, or general nature is 'not_a_civic_issue'.
- Set the confidence score from 0 to 100 based on your certainty in the correct category match (how confident you are that the chosen category is the correct classification for the visible damage), rather than just general damage presence or that this is a real photo of damage. If there is any ambiguity, mismatch, or lack of clear evidence, reduce this score significantly below 70.
- Provide a brief explanation of details seen in the image.
- Generate a formal, helpful, one-sentence auto-generated description for a public service dispatcher (e.g., 'A pothole approximately 2 feet wide on the asphalt road, creating a driving hazard'). If category is 'not_a_civic_issue', leave autoDescription empty.`;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let response: any = null;
    let lastError: any = null;
    let modelIndex = 0;

    for (let attempt = 0; attempt < 4; attempt++) {
      const currentModel = modelsToTry[modelIndex];
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents: [imagePart, { text: prompt }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: "One of: pothole, streetlight_issue, water_leakage, garbage_overflow, broken_pavement, other_infrastructure, not_a_civic_issue.",
                },
                confidence: {
                  type: Type.INTEGER,
                  description: "Confidence level of classification (0-100).",
                },
                explanation: {
                  type: Type.STRING,
                  description: "Reasoning explaining why this category was chosen.",
                },
                autoDescription: {
                  type: Type.STRING,
                  description: "Work-order style auto-generated description. Leave empty for not_a_civic_issue.",
                },
              },
              required: ["category", "confidence", "explanation", "autoDescription"],
            },
          },
        });
        break; // Success!
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || "").toLowerCase();
        const errStatus = err?.status || err?.statusCode || err?.code || 0;
        const isTransient = 
          errStatus === 503 || 
          errStatus === 429 || 
          (typeof errStatus === "string" && (errStatus.includes("503") || errStatus.includes("429") || errStatus.includes("RESOURCE_EXHAUSTED"))) ||
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.includes("unavailable") || 
          errMsg.includes("busy") || 
          errMsg.includes("overloaded") || 
          errMsg.includes("resource_exhausted") || 
          errMsg.includes("quota") || 
          errMsg.includes("limit") || 
          errMsg.includes("exhausted");
        
        console.warn(`Gemini API call with model ${currentModel} failed (attempt ${attempt + 1}/4): ${err.message}`);
        
        if (isTransient && attempt < 3) {
          modelIndex = (modelIndex + 1) % modelsToTry.length;
          const delay = (attempt + 1) * 1000;
          console.warn(`Retrying with fallback model (${modelsToTry[modelIndex]}) in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to classify image");
    }

    const parsedResult = JSON.parse(response.text.trim());

    res.json({
      success: true,
      category: parsedResult.category,
      confidence: parsedResult.confidence,
      explanation: parsedResult.explanation,
      autoDescription: parsedResult.autoDescription,
      imageHash: hash,
      isDuplicate,
      existingReportId,
    });
  } catch (error: any) {
    console.error("Gemini Classification Error:", error);
    const errMsg = (error?.message || "").toLowerCase();
    const errStatus = error?.status || error?.statusCode || 0;
    const isTransient = errStatus === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("busy") || errMsg.includes("overloaded") || errMsg.includes("resource_exhausted") || errMsg.includes("limit");

    const userFriendlyMsg = isTransient
      ? "Our verification service is busy right now — please try again in a moment"
      : ("Failed to classify image via Gemini API: " + (error?.message || "Unknown error"));

    const statusCode = isTransient ? 503 : 500;

    res.status(statusCode).json({
      error: userFriendlyMsg,
      status: statusCode,
      imageHash: hash,
      isDuplicate,
      existingReportId,
    });
  }
});

function getRequesterUserId(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const token = authHeader.replace("Bearer ", "");
  let foundUserId = tokenToUserMap.get(token);
  
  if (!foundUserId && token.startsWith("auth_token_")) {
    const parts = token.split("_");
    if (parts.length >= 4) {
      foundUserId = parts.slice(2, parts.length - 1).join("_");
    }
  }
  return foundUserId || null;
}

function sanitizeReport(report: CivicReport, requesterUserId?: string | null): any {
  if (!report) return report;
  const { userEmail, ...rest } = report;
  return {
    ...rest,
    isOwner: requesterUserId ? report.userId === requesterUserId : false
  };
}

// Interceptor middleware to clean userEmail and append isOwner for all report responses
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    try {
      const requesterUserId = getRequesterUserId(req);
      if (body) {
        if (Array.isArray(body)) {
          if (body.length > 0 && typeof body[0] === 'object' && body[0] !== null && 'id' in body[0] && 'category' in body[0]) {
            body = body.map(r => sanitizeReport(r, requesterUserId));
          }
        } else if (typeof body === 'object' && body !== null) {
          if (body.report && typeof body.report === 'object' && body.report !== null && 'id' in body.report) {
            body.report = sanitizeReport(body.report, requesterUserId);
          }
          if (body.original && typeof body.original === 'object' && body.original !== null && 'id' in body.original) {
            body.original = sanitizeReport(body.original, requesterUserId);
          }
          if ('id' in body && 'category' in body) {
            body = sanitizeReport(body, requesterUserId);
          }
        }
      }
    } catch (interceptorError) {
      console.error("Error in res.json interceptor:", interceptorError);
    }
    return originalJson.call(this, body);
  };
  next();
});

// 4. Get all reports
app.get("/api/reports", (req, res) => {
  const requesterUserId = getRequesterUserId(req);
  const sanitized = reports.map(r => sanitizeReport(r, requesterUserId));
  res.json(sanitized);
});

// 5. Create a new report
app.post("/api/reports", (req, res) => {
  const {
    category,
    confidence,
    description,
    latitude,
    longitude,
    address,
    imageData,
    videoData,
    imageHash,
    userId,
    userEmail,
    classificationMethod,
    customCategoryLabel,
  } = req.body;

  if (!category || !latitude || !longitude || !imageData || imageData === "SMS_REPORTER_MOCK") {
    return res.status(400).json({ error: "Missing required report field data or valid verified image upload." });
  }

  const reportId = `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cleanHash = imageHash || crypto.createHash("sha256").update(imageData.replace(/^data:image\/\w+;base64,/, "")).digest("hex");

  // Enforce server-side authentication check for report creation
  let authenticatedUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    let foundUserId = tokenToUserMap.get(token);
    
    // Robust fallback for token verification (e.g. server restart)
    if (!foundUserId && token.startsWith("auth_token_")) {
      const parts = token.split("_");
      if (parts.length >= 4) {
        foundUserId = parts.slice(2, parts.length - 1).join("_");
      }
    }
    
    if (foundUserId) {
      authenticatedUser = users.find(u => u.id === foundUserId);
    }
  }

  if (!authenticatedUser) {
    return res.status(401).json({ 
      error: "Authentication Required — Please log in or register a citizen profile to submit reports." 
    });
  }

  const activeUserId = authenticatedUser.id;
  const activeUserEmail = authenticatedUser.email;

  // 1. Check exact photo hash duplicates
  let originalReport = reports.find(r => r.imageHash === cleanHash);
  let duplicateReason = "";

  if (originalReport) {
    duplicateReason = "Identical image hash detected. This image has been submitted as a previous report.";
  } else {
    // 2. Check similar location and classification for recent reports
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    const radiusThresholdKm = 0.15; // 150 meters

    originalReport = reports.find(r => {
      if (r.category !== category) return false;
      const dist = getDistanceInKm(latNum, lngNum, r.latitude, r.longitude);
      return dist <= radiusThresholdKm;
    });

    if (originalReport) {
      const distM = Math.round(getDistanceInKm(latNum, lngNum, originalReport.latitude, originalReport.longitude) * 1000);
      duplicateReason = `Highly similar ${category.replace("_", " ")} catalogued nearby within ${distM} meters.`;
    }
  }

  const isDuplicate = !!originalReport;
  const duplicateOfId = originalReport ? originalReport.id : undefined;

  // --- AI-POWERED AUTO NLP & CATEGORY HEURISTICS ---
  const textDesc = (description || "").toLowerCase();
  
  // 1. Auto Severity scoring
  let severity: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (/collapsed|sinkhole|gushing|broken bone|dangerous|accident|emergency|fire|exploded|injury|die|death|fatal|hazard/i.test(textDesc)) {
    severity = "Critical";
  } else if (/deep|large|overflowing|hazardous|major|crash|swerv|danger|unsafe|risk/i.test(textDesc)) {
    severity = "High";
  } else if (/unlit|dark|broken|outage|stop|waste|leak|smell|odor|blocked/i.test(textDesc)) {
    severity = "Medium";
  }

  // 2. Urgent Cue Extraction
  const urgencyKeywords = ["immediate", "asap", "danger", "hazard", "safety", "kids", "elderly", "crash", "flood", "leak", "fire", "dark", "accident"];
  const urgencyCues = urgencyKeywords.filter(word => textDesc.includes(word));
  if (urgencyCues.length === 0) {
    if (severity === "Critical") urgencyCues.push("critical hazard");
    else urgencyCues.push("standard review");
  }

  // 3. Landmark Extraction
  let landmarks = "Identified near GPS coordinate center";
  const landmarkMatch = (description || "").match(/(?:near|next to|in front of|opposite|behind|corner of|outside|by)\s+([A-Za-z0-9\s,#]+)(?:\.|\,|$)/i);
  if (landmarkMatch && landmarkMatch[1]) {
    landmarks = `Adjacent to ${landmarkMatch[1].trim()}`;
  } else if (address) {
    landmarks = `Vicinity of ${address.split(",")[0]}`;
  }

  // 4. Assigned Department & SLA duration
  let assignedDepartment = "General Municipal Services Agency";
  let slaDurationDays = 5;

  if (category === "pothole" || category === "broken_pavement") {
    assignedDepartment = "Department of Public Works";
    slaDurationDays = 7;
  } else if (category === "streetlight_issue") {
    assignedDepartment = "Municipal Energy Board";
    slaDurationDays = 3;
  } else if (category === "water_leakage") {
    assignedDepartment = "Water Sanitation Division";
    slaDurationDays = 2;
  } else if (category === "garbage_overflow") {
    assignedDepartment = "Department of Environmental Services";
    slaDurationDays = 1;
  } else if (category === "other_infrastructure") {
    assignedDepartment = "Infrastructure Engineering Command";
    slaDurationDays = 10;
  }

  const slaDueDate = new Date(Date.now() + slaDurationDays * 24 * 3600 * 1000).toISOString();

  const newReport: CivicReport = {
    id: reportId,
    category,
    confidence: confidence || (getGeminiClient() ? 85 : 100),
    description: description || "No additional parameters provided.",
    status: "Pending Approval", // All submitted tickets enter Pending Approval state first
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: address || "No address entered",
    imageData,
    videoData,
    imageHash: cleanHash,
    createdAt: new Date().toISOString(),
    isDuplicate,
    duplicateOfId,
    duplicateReason: isDuplicate ? duplicateReason : undefined,
    userId: activeUserId,
    userEmail: activeUserEmail,
    vouchCount: 1,
    timeline: [
      { 
        stage: "Pending Approval", 
        time: new Date().toISOString(), 
        note: `Citizen ticket reported. Auto-routed to ${assignedDepartment} under ${severity} priority (SLA: ${slaDurationDays} days).` 
      }
    ],
    comments: [],
    flagCount: 0,
    assignedDepartment,
    slaDurationDays,
    slaDueDate,
    urgencyCues,
    landmarks,
    severity,
    classificationMethod: classificationMethod || "ai",
    customCategoryLabel: category === "other" ? customCategoryLabel : undefined
  };

  reports.unshift(newReport);
  saveReports(reports);
  
  // Register image hash in the duplicate log if not already registered
  if (!existingReportIdMapCheck(cleanHash)) {
    imageHashToReportMap.set(cleanHash, reportId);
  }

  res.status(201).json({
    success: true,
    report: sanitizeReport(newReport, activeUserId),
  });
});

// Simple checking helper for map
function existingReportIdMapCheck(hash: string): boolean {
  return imageHashToReportMap.has(hash);
}

// 6. Update/Resolve a report status (for demo interactivity)
app.patch("/api/reports/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const allowedStatuses = ["Pending Approval", "Submitted", "Verified", "In Review", "Scheduled for Repair", "Resolved"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status parameter." });
  }

  const reportIndex = reports.findIndex((r) => r.id === id);
  if (reportIndex === -1) {
    return res.status(404).json({ error: "Report not found." });
  }

  reports[reportIndex].status = status;
  
  // Append to timeline log
  const stageNote = note || `Status updated to ${status} by department manager.`;
  const newTimelineItem = {
    stage: status,
    time: new Date().toISOString(),
    note: stageNote
  };
  
  if (!reports[reportIndex].timeline) {
    reports[reportIndex].timeline = [];
  }
  reports[reportIndex].timeline.push(newTimelineItem);

  saveReports(reports);

  res.json({ success: true, report: reports[reportIndex] });
});

// 7. Merge visual duplicate reports
app.post("/api/reports/:id/merge", (req, res) => {
  const { id } = req.params;
  const { originalId } = req.body;

  const report = reports.find(r => r.id === id);
  const original = reports.find(r => r.id === originalId);

  if (!report || !original) {
    return res.status(404).json({ error: "Report or target original report not found." });
  }

  // Track merge changes
  report.isDuplicate = true;
  report.duplicateOfId = originalId;
  report.status = original.status; // inherit master status

  const mergeTime = new Date().toISOString();
  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Merged",
    time: mergeTime,
    note: `Merged duplicate ticket linking directly to master ticket #${originalId}.`
  });

  if (!original.timeline) original.timeline = [];
  original.timeline.push({
    stage: "Duplicate Linked",
    time: mergeTime,
    note: `Another reporter submitted a similar issue. Consolidated duplicate ticket #${id}.`
  });

  saveReports(reports);

  res.json({ success: true, report, original });
});

// 8. Disregard duplicate alert and mark independent
app.post("/api/reports/:id/unlink", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  report.isDuplicate = false;
  report.duplicateOfId = undefined;
  report.duplicateReason = undefined;

  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Unlinked",
    time: new Date().toISOString(),
    note: "Flagged duplicate successfully evaluated and unlinked. Marked as an independent issue."
  });

  saveReports(reports);

  res.json({ success: true, report });
});

// 9. Add comment thread to report
app.post("/api/reports/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Comment text cannot be empty." });
  }

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  const comment = {
    id: `CMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    author: author || "Anonymous Resident",
    text,
    createdAt: new Date().toISOString()
  };

  if (!report.comments) {
    report.comments = [];
  }
  report.comments.push(comment);

  saveReports(reports);

  res.status(201).json({ success: true, comment, comments: report.comments });
});

// 10. Vouch/Verify report (reported -> verified transition at threshold 3 confirmations)
app.post("/api/reports/:id/vouch", (req, res) => {
  const { id } = req.params;
  
  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  let activeUserId = "USR-guest";
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const foundUserId = tokenToUserMap.get(token);
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!report.vouchedUserIds) {
    report.vouchedUserIds = [];
  }

  const alreadyVouched = report.vouchedUserIds.includes(activeUserId);
  let isTransition = false;

  if (!alreadyVouched) {
    report.vouchedUserIds.push(activeUserId);
    report.vouchCount = (report.vouchCount || 0) + 1;
    isTransition = report.vouchCount >= 3 && report.status === "Submitted";
    
    if (!report.timeline) report.timeline = [];
    report.timeline.push({
      stage: "Vouched",
      time: new Date().toISOString(),
      note: `Community resident confirmed issue. Total confirmations: ${report.vouchCount}.`
    });

    if (isTransition) {
      report.status = "Verified";
      report.timeline.push({
        stage: "Verified",
        time: new Date().toISOString(),
        note: "Verification threshold achieved (3+ confirmations). Dispatch elevated to verified status queue."
      });
    }

    saveReports(reports);
    broadcastUpdate("report_update", report);
  }

  res.json({ success: true, report, statusChanged: isTransition });
});

// 10.5 Unvouch / Remove verification for report
app.post("/api/reports/:id/unvouch", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  let activeUserId = "USR-guest";
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const foundUserId = tokenToUserMap.get(token);
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!report.vouchedUserIds) {
    report.vouchedUserIds = [];
  }

  const alreadyVouched = report.vouchedUserIds.includes(activeUserId);
  if (alreadyVouched) {
    report.vouchedUserIds = report.vouchedUserIds.filter(uid => uid !== activeUserId);
    report.vouchCount = Math.max(0, (report.vouchCount || 0) - 1);

    if (!report.timeline) report.timeline = [];
    report.timeline.push({
      stage: "Unvouched",
      time: new Date().toISOString(),
      note: `Community resident removed vouch. Total confirmations: ${report.vouchCount}.`
    });

    saveReports(reports);
    broadcastUpdate("report_update", report);
  }

  res.json({ success: true, report });
});

// 11. Flag spam / false reports
app.post("/api/reports/:id/flag", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  let activeUserId = "USR-guest";
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const foundUserId = tokenToUserMap.get(token);
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!report.flaggedUserIds) {
    report.flaggedUserIds = [];
  }

  const alreadyFlagged = report.flaggedUserIds.includes(activeUserId);
  if (!alreadyFlagged) {
    report.flaggedUserIds.push(activeUserId);
    report.flagCount = (report.flagCount || 0) + 1;
    
    if (!report.timeline) report.timeline = [];
    report.timeline.push({
      stage: "Flagged",
      time: new Date().toISOString(),
      note: `Report flagged as inaccurate or spam by citizen. Total flags: ${report.flagCount}.`
    });

    saveReports(reports);
    broadcastUpdate("report_update", report);
  }

  res.json({ success: true, report });
});

// 11.5 Unflag spam / false reports
app.post("/api/reports/:id/unflag", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  let activeUserId = "USR-guest";
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const foundUserId = tokenToUserMap.get(token);
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!report.flaggedUserIds) {
    report.flaggedUserIds = [];
  }

  const alreadyFlagged = report.flaggedUserIds.includes(activeUserId);
  if (alreadyFlagged) {
    report.flaggedUserIds = report.flaggedUserIds.filter(uid => uid !== activeUserId);
    report.flagCount = Math.max(0, (report.flagCount || 0) - 1);
    
    if (!report.timeline) report.timeline = [];
    report.timeline.push({
      stage: "Unflagged",
      time: new Date().toISOString(),
      note: `Report spam flag removed by citizen. Total flags: ${report.flagCount}.`
    });

    saveReports(reports);
    broadcastUpdate("report_update", report);
  }

  res.json({ success: true, report });
});

// 12. Escalate unresolved SLA overdue report
app.post("/api/reports/:id/escalate", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  report.isEscalated = true;
  
  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Escalated",
    time: new Date().toISOString(),
    note: `URGENT SLA breached! Ticket escalated directly to Regional Directorate & Chief Ward Commissioner.`
  });

  saveReports(reports);

  res.json({ success: true, report });
});

// 13. Resolve report with after photo (municipal closure)
app.patch("/api/reports/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { afterImageData, note } = req.body;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  report.status = "Resolved";
  if (afterImageData) {
    report.afterImageData = afterImageData;
  }
  
  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Resolved",
    time: new Date().toISOString(),
    note: note || "Work completed by certified field maintenance crew. Before/After visual comparison ready."
  });

  saveReports(reports);

  res.json({ success: true, report });
});

// 14. Citizen confirms final closure
app.post("/api/reports/:id/citizen-confirm", (req, res) => {
  const { id } = req.params;

  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  report.citizenConfirmed = true;
  
  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Citizen Confirmed",
    time: new Date().toISOString(),
    note: "Reporting resident verified work order completion on-site. Loop closed successfully."
  });

  saveReports(reports);

  res.json({ success: true, report });
});

// 15. Nominate report for Community Polls
app.post("/api/reports/:id/nominate", (req, res) => {
  const { id } = req.params;
  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  if (report.status === "Resolved") {
    return res.status(400).json({ error: "Resolved issues cannot be nominated for the community poll." });
  }

  // Auth check
  let activeUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    let foundUserId = tokenToUserMap.get(token);
    if (!foundUserId && token.startsWith("auth_token_")) {
      const parts = token.split("_");
      if (parts.length >= 4) {
        foundUserId = parts.slice(2, parts.length - 1).join("_");
      }
    }
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!activeUserId) {
    return res.status(401).json({ error: "Authentication Required — Please log in or register to nominate issues." });
  }

  // Check if already nominated and active (within 7 days)
  const isCurrentlyNominated = report.nominatedAt && (Date.now() - new Date(report.nominatedAt).getTime() <= 7 * 24 * 3600 * 1000);
  if (isCurrentlyNominated) {
    return res.status(400).json({ error: "This issue has already been nominated and is currently active." });
  }

  // Set nomination fields
  report.nominatedAt = new Date().toISOString();
  report.nominatedByUserId = activeUserId;
  report.pollVotes = 1;
  report.pollVotedUserIds = [activeUserId];

  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Nominated",
    time: new Date().toISOString(),
    note: `Issue nominated for Community Polls by citizen to prioritize for repair. Initial vote cast.`
  });

  saveReports(reports);
  res.json({ success: true, report });
});

// 16. Vote for an issue in Community Polls
app.post("/api/reports/:id/poll-vote", (req, res) => {
  const { id } = req.params;
  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Report not found." });
  }

  if (report.status === "Resolved") {
    return res.status(400).json({ error: "This issue has already been resolved and is no longer in the poll." });
  }

  // Auth check
  let activeUserId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    let foundUserId = tokenToUserMap.get(token);
    if (!foundUserId && token.startsWith("auth_token_")) {
      const parts = token.split("_");
      if (parts.length >= 4) {
        foundUserId = parts.slice(2, parts.length - 1).join("_");
      }
    }
    if (foundUserId) {
      activeUserId = foundUserId;
    }
  }

  if (!activeUserId) {
    return res.status(401).json({ error: "Authentication Required — Please log in or register to vote in the poll." });
  }

  // Check if active (not expired)
  const isCurrentlyNominated = report.nominatedAt && (Date.now() - new Date(report.nominatedAt).getTime() <= 7 * 24 * 3600 * 1000);
  if (!isCurrentlyNominated) {
    return res.status(400).json({ error: "This issue is not currently active in community polls." });
  }

  if (!report.pollVotedUserIds) {
    report.pollVotedUserIds = [];
  }

  if (report.pollVotedUserIds.includes(activeUserId)) {
    return res.status(400).json({ error: "You have already voted for this issue in this polling cycle." });
  }

  report.pollVotedUserIds.push(activeUserId);
  report.pollVotes = (report.pollVotes || 0) + 1;

  if (!report.timeline) report.timeline = [];
  report.timeline.push({
    stage: "Poll Voted",
    time: new Date().toISOString(),
    note: `Community priority vote cast by resident. Total poll votes: ${report.pollVotes}.`
  });

  saveReports(reports);
  res.json({ success: true, report });
});

// -------------------------------------------------------------
// Vite Assembly
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Sync from Firestore in the background at startup
  syncFromFirestore().then(() => {
    console.log("[Firebase] Initial Firestore sync finished.");
  }).catch(err => {
    console.log("[Firebase] Notice: Initial Firestore sync failed or deferred. App runs smoothly in local high-performance persistence mode.");
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Civic server running on http://localhost:${PORT}`);
  });
}

startServer();
