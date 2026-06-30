import React, { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Smartphone, 
  Radio, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Check,
  Paperclip,
  Camera
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";

interface SmsDispatchBotProps {
  onSubmitReport: (
    category: string,
    description: string,
    location: string,
    severity: "Low" | "Medium" | "High" | "Critical",
    imageData?: string,
    imageHash?: string,
    confidence?: number
  ) => Promise<any>;
  currentUser: any;
  onOpenAuth: (mode?: "login" | "signup", errorMsg?: string) => void;
}

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  time: string;
  isSystem?: boolean;
}

export const SmsDispatchBot: React.FC<SmsDispatchBotProps> = ({ 
  onSubmitReport,
  currentUser,
  onOpenAuth
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      sender: "bot", 
      text: "Hello! I am your AI Civic Dispatch assistant. Describe the issue you see in your neighborhood (e.g. 'There is a massive water leak near Central Square'), and I'll help you file a formal municipal ticket.", 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // States for verified photo requirement
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageHash, setUploadedImageHash] = useState<string | null>(null);
  const [uploadedImageConfidence, setUploadedImageConfidence] = useState<number | null>(null);

  // Extracted draft states stored within the chatbot for rendering / persistence
  const [draft, setDraft] = useState<{
    category: string | null;
    description: string | null;
    location: string | null;
    severity: "Low" | "Medium" | "High" | "Critical";
    isReadyToSubmit: boolean;
    isSubmitted: boolean;
  }>({
    category: null,
    description: null,
    location: null,
    severity: "Medium",
    isReadyToSubmit: false,
    isSubmitted: false
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Retrieve the API Key
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  const isKeyMissing = !apiKey;

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Helper to format timestamps
  const getFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Reset helper
  const handleReset = () => {
    setMessages([
      { 
        sender: "bot", 
        text: "Conversation restarted. Describe the new neighborhood issue to get started!", 
        time: getFormattedTime() 
      }
    ]);
    setDraft({
      category: null,
      description: null,
      location: null,
      severity: "Medium",
      isReadyToSubmit: false,
      isSubmitted: false
    });
    setUploadedImage(null);
    setUploadedImageHash(null);
    setUploadedImageConfidence(null);
    setErrorState(null);
  };

  // Handle bot photo upload & verification
  const handleBotImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessages(prev => [
      ...prev,
      { sender: "user", text: `📎 Attaching photo for verification: ${file.name}...`, time: getFormattedTime() }
    ]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) {
        setIsLoading(false);
        return;
      }

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "🔍 Running Gemini AI vision verification & safety scoring on photo...", time: getFormattedTime() }
      ]);

      try {
        const res = await fetch(getApiUrl("/api/verify-image"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Data,
            mimeType: "image/jpeg",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isConfigError) {
            // Server missing key fallback simulation
            const mockCategories = ["pothole", "streetlight_issue", "water_leakage", "garbage_overflow", "broken_pavement"];
            const index = Math.floor(Math.random() * mockCategories.length);
            const category = mockCategories[index];
            const confidence = Math.floor(Math.random() * 30) + 70;
            const simHash = "simhash_" + Math.random().toString(36).substring(7);
            const autoDescription = `A verified ${category.replace("_", " ")} spotted in public space.`;

            setUploadedImage(base64Data);
            setUploadedImageHash(simHash);
            setUploadedImageConfidence(confidence);

            setDraft(prev => ({
              ...prev,
              category: category,
              description: autoDescription,
            }));

            setMessages(prev => [
              ...prev,
              { 
                sender: "bot", 
                text: `✅ [SIMULATION MODE] Photo verified successfully!\n• Category: ${getCategoryLabel(category)}\n• AI Confidence: ${confidence}%\n• Details: ${autoDescription}\n\nWhere is this issue located? (Please state the street name or nearby landmark)`, 
                time: getFormattedTime() 
              }
            ]);
            setIsLoading(false);
            return;
          }

          if (data.category === "not_a_civic_issue") {
            setMessages(prev => [
              ...prev,
              { 
                sender: "bot", 
                text: `❌ Photo rejected: Non-civic or spam detected (AI Confidence: ${data.confidence}%).\nReason: ${data.explanation || "No physical hazard or civic damage detected."}\nPlease upload a valid photo of public infrastructure damage to proceed.`, 
                time: getFormattedTime() 
              }
            ]);
          } else {
            setUploadedImage(base64Data);
            setUploadedImageHash(data.imageHash || "sms_" + Date.now());
            setUploadedImageConfidence(data.confidence || 90);

            setDraft(prev => ({
              ...prev,
              category: data.category || prev.category,
              description: data.autoDescription || data.explanation || prev.description,
            }));

            setMessages(prev => [
              ...prev,
              { 
                sender: "bot", 
                text: `✅ Photo verified successfully!\n• Category: ${getCategoryLabel(data.category)}\n• AI Confidence: ${data.confidence}%\n• Details: ${data.autoDescription || data.explanation || "Verified public hazard spotted."}\n\nWhere is this issue located? (Please state the street name or nearby landmark)`, 
                time: getFormattedTime() 
              }
            ]);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          setMessages(prev => [
            ...prev,
            { sender: "bot", text: `⚠️ Verification failed: ${errorData.error || "Server error. Please try another image."}`, time: getFormattedTime() }
          ]);
        }
      } catch (err: any) {
        console.error("Bot photo verification failed:", err);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "⚠️ Network error occurred during image verification. Please try again.", time: getFormattedTime() }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input;

    // Check if user is authenticated before allowing processing
    if (!currentUser) {
      setMessages(prev => [
        ...prev,
        { sender: "user", text: userMessageText, time: getFormattedTime() }
      ]);
      setInput("");
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            sender: "bot", 
            text: "⚠️ Authentication Required — Please sign in with Google to file public reports.", 
            time: getFormattedTime() 
          }
        ]);
        setIsLoading(false);
        onOpenAuth("login", "You must sign in with Google to submit a civic report.");
      }, 650);
      return;
    }

    setMessages(prev => [...prev, { sender: "user", text: userMessageText, time: getFormattedTime() }]);
    setInput("");
    setIsLoading(true);
    setErrorState(null);

    // CRITICAL SECURITY WARNING FOR CLIENT-SIDE GEMINI API CALLS
    // -------------------------------------------------------------
    // Note: This API call is made directly from the client side as requested by the user.
    // In production environments, client-side exposure of the API key is highly discouraged.
    // It is recommended to route all LLM interaction safely through server-side APIs.
    // -------------------------------------------------------------

    try {
      if (isKeyMissing) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in environment variables.");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Prepare context/conversation transcript for Gemini
      const photoNotice = uploadedImage
        ? "[SYSTEM CONTEXT: A verified photo has already been uploaded by the user. Do NOT ask for a photo upload. You can proceed with finalizing and asking the citizen to confirm by replying YES.]"
        : "[SYSTEM CONTEXT: NO photo has been uploaded yet. Remind the citizen they must click the paperclip attachment icon to upload a photo of the issue so we can run AI verification before we can file any report. Do NOT set isReadyToSubmit or isSubmitted to true until they have uploaded a photo.]";

      const conversationTranscript = messages
        .map(msg => `${msg.sender === "user" ? "Citizen" : "Assistant"}: ${msg.text}`)
        .join("\n") + `\n${photoNotice}\nCitizen: ${userMessageText}`;

      const systemPrompt = `You are a professional, helpful, and friendly AI Civic Issue Intake Assistant for CityFix.
Your goal is to converse naturally with the citizen to gather 3 essential pieces of information to file a municipal repair ticket:
1. Category: One of ['pothole', 'streetlight_issue', 'water_leakage', 'garbage_overflow', 'broken_pavement', 'other_infrastructure']
2. Description: Clear details of the issue.
3. Location/Landmark: Specific location details or landmarks where the issue was spotted.

Instructions:
- Analyze the citizen's latest input within the context of the conversation.
- If they have specified an issue, classify it and estimate the details.
- Politely prompt for missing details (such as the location or a landmark if they haven't mentioned it). Keep your reply natural and helpful.
- Note: A verified photo upload is strictly REQUIRED for all reports. If a photo has not been uploaded yet, politely explain that they must click the paperclip/attachment icon next to the chat input to upload a photo of the issue so we can run AI structural verification. Do NOT set 'isReadyToSubmit' to true or confirm submission until a photo is uploaded.
- If both category, description, and location are successfully gathered, and the photo is uploaded, summarize the draft and ask the user to confirm/submit by saying YES or similar.
- If they explicitly confirm (saying YES, confirm, absolutely, etc.), mark 'isSubmitted' as true and state that the report is officially filed.
- Always respond in the JSON format specified below. Do not include any other text except valid JSON.`;

      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 3; // 1 initial + 2 retries
        while (attempts < maxAttempts) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: [
                { text: systemPrompt },
                { text: conversationTranscript }
              ],
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    replyText: {
                      type: Type.STRING,
                      description: "Conversational, natural response to show the user. Summarize or ask follow-up questions."
                    },
                    category: {
                      type: Type.STRING,
                      description: "Classified category. Must be one of: 'pothole', 'streetlight_issue', 'water_leakage', 'garbage_overflow', 'broken_pavement', 'other_infrastructure'. Use null if unknown."
                    },
                    description: {
                      type: Type.STRING,
                      description: "Detailed description of the issue. Use null if unknown."
                    },
                    location: {
                      type: Type.STRING,
                      description: "Extracted landmark or street address. Use null if unknown."
                    },
                    severity: {
                      type: Type.STRING,
                      description: "Severity of issue. Must be one of: 'Low', 'Medium', 'High', 'Critical'."
                    },
                    isReadyToSubmit: {
                      type: Type.BOOLEAN,
                      description: "True if category, description, and location have all been extracted and we are awaiting confirmation from the user."
                    },
                    isSubmitted: {
                      type: Type.BOOLEAN,
                      description: "True if the user has explicitly confirmed/agreed to file the ticket."
                    }
                  },
                  required: ["replyText", "category", "description", "location", "severity", "isReadyToSubmit", "isSubmitted"]
                }
              }
            });
            if (response) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            attempts++;
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
            
            if (isTransient && attempts < maxAttempts) {
              const delay = Math.pow(2, attempts - 1) * 1500; // 1.5s, 3s
              console.info(`[Gemini Info] Model ${modelName} returned status ${errStatus || 'busy'}. Retrying attempt ${attempts}/${maxAttempts - 1} in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              break; // Try next model fallback
            }
          }
        }
        if (response) {
          break;
        }
      }

      if (!response) {
        throw lastError || new Error("All Gemini model fallback options failed.");
      }

      const parsedData = JSON.parse(response.text?.trim() || "{}");

      if (parsedData.replyText) {
        let finalReplyText = parsedData.replyText;

        // If newly submitted or ready, but no image uploaded, block it!
        if ((parsedData.isReadyToSubmit || parsedData.isSubmitted) && !uploadedImage) {
          parsedData.isReadyToSubmit = false;
          parsedData.isSubmitted = false;
          finalReplyText = "⚠️ Before we can proceed with preparing or submitting this report, we require a verified photo. Please click the paperclip attachment icon next to the message field to upload a photo of the issue first!";
        }

        setMessages(prev => [...prev, { sender: "bot", text: finalReplyText, time: getFormattedTime() }]);
        
        // Update draft states
        const updatedDraft = {
          category: parsedData.category || draft.category,
          description: parsedData.description || draft.description,
          location: parsedData.location || draft.location,
          severity: (parsedData.severity as any) || draft.severity,
          isReadyToSubmit: !!parsedData.isReadyToSubmit && !!uploadedImage,
          isSubmitted: !!parsedData.isSubmitted && !!uploadedImage
        };
        setDraft(updatedDraft);

        // If newly submitted, dispatch it!
        if (updatedDraft.isSubmitted && !draft.isSubmitted && uploadedImage) {
          const finalCategory = updatedDraft.category || "other_infrastructure";
          const finalDescription = updatedDraft.description || userMessageText;
          const finalLocation = updatedDraft.location || "SMS Specified location";
          const finalSeverity = updatedDraft.severity || "Medium";

          await onSubmitReport(
            finalCategory, 
            finalDescription, 
            finalLocation, 
            finalSeverity,
            uploadedImage,
            uploadedImageHash || undefined,
            uploadedImageConfidence || undefined
          );

          setMessages(prev => [
            ...prev,
            { 
              sender: "bot", 
              text: `🎉 Ticket dispatched successfully! A work order has been routed to the appropriate department. Thank you for making our neighborhood safer!`, 
              time: getFormattedTime() 
            }
          ]);
        }
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err: any) {
      console.error("Gemini SMS Chatbot Error:", err);
      const errMsg = (err?.message || "").toLowerCase();
      const errStatus = err?.status || err?.statusCode || 0;
      const isTransient = errStatus === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("busy") || errMsg.includes("overloaded") || errMsg.includes("resource_exhausted") || errMsg.includes("limit");

      const friendlyText = isTransient 
        ? "Our verification service is busy right now — please try again in a moment"
        : "Sorry, I couldn't process that — try rephrasing or check if your API key is correctly set.";

      setErrorState(friendlyText);
      setMessages(prev => [
        ...prev, 
        { 
          sender: "bot", 
          text: friendlyText, 
          time: getFormattedTime() 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return "N/A";
    return cat.replace("_", " ").toUpperCase();
  };

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-accent-alert/10 text-accent-alert border-accent-alert/20";
      case "High": return "bg-accent-alert/10 text-accent-alert border-accent-alert/10";
      case "Medium": return "bg-accent-info/10 text-accent-info border-accent-info/20";
      default: return "bg-zinc-800 text-text-muted border-zinc-700/50";
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-[75]" id="sms-chatbot-container">
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative bg-accent-alert hover:bg-accent-alert/90 text-white p-3.5 rounded-full shadow-[0_8px_30px_rgba(255,59,48,0.3)] hover:shadow-[0_8px_30px_rgba(255,59,48,0.5)] active:scale-95 transition-all flex items-center justify-center border border-accent-alert/20 cursor-pointer"
        title="Open AI SMS Citizen Assistant"
        id="sms-chatbot-trigger-btn"
      >
        <MessageSquare className="w-5 h-5 stroke-[2.2]" />
        {messages.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-accent-alert w-2.5 h-2.5 rounded-full ring-2 ring-bg-primary animate-pulse" />
        )}
      </button>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute right-0 bottom-16 w-[340px] max-w-[90vw] bg-bg-card border border-zinc-800 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col text-left z-50"
            id="sms-chatbot-popup"
          >
            {/* Redesigned Premium Header */}
            <div className="px-4 py-3.5 bg-zinc-950 text-white border-b border-zinc-900 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                {/* Friendly Avatar Icon with Pulsing Online Dot */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent-alert shadow-inner">
                    <Radio className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  {/* Pulsing online indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-success rounded-full border-2 border-zinc-950 shadow-sm animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-display font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    SMS Dispatch Bot
                    <Sparkles className="w-3 h-3 text-accent-alert" />
                  </h3>
                  <p className="text-[10px] text-accent-alert font-mono uppercase tracking-widest font-bold">Auto-Intake Division</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-full text-text-muted hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                  title="Restart Conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-text-muted hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                  title="Minimize"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Draft Status Panel */}
            {(draft.category || draft.location) && (
              <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-900 text-[10px] flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-muted font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-alert animate-pulse" />
                  <span>Draft Progress:</span>
                  {draft.category && (
                    <span className="bg-accent-info/10 px-1.5 py-0.5 rounded text-accent-info font-mono font-bold border border-accent-info/20">
                      {getCategoryLabel(draft.category)}
                    </span>
                  )}
                  {draft.location && (
                    <span className="bg-zinc-900 px-1.5 py-0.5 rounded text-text-primary max-w-[100px] truncate">
                      📍 {draft.location}
                    </span>
                  )}
                </div>
                {draft.isReadyToSubmit && !draft.isSubmitted && (
                  <span className="text-[9px] font-black tracking-wider text-accent-alert flex items-center gap-1 uppercase font-mono">
                    <AlertCircle className="w-3 h-3 text-accent-alert" /> Confirmation Awaited
                  </span>
                )}
                {draft.isSubmitted && (
                  <span className="text-[9px] font-black tracking-wider text-accent-success flex items-center gap-1 uppercase font-mono">
                    <CheckCircle className="w-3 h-3 text-accent-success" /> Submitted
                  </span>
                )}
              </div>
            )}

            {/* Security Notice for transparency */}
            {isKeyMissing && (
              <div className="bg-accent-alert/5 px-3.5 py-2 border-b border-accent-alert/15 text-[10px] text-accent-alert flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-accent-alert" />
                <p className="leading-tight">
                  <strong>API Key Missing:</strong> Set <code>VITE_GEMINI_API_KEY</code> in environment variables to enable the AI dispatch system.
                </p>
              </div>
            )}

            {/* Messages body with Custom Styled Chat Bubbles */}
            <div className="p-4 h-72 overflow-y-auto space-y-4 flex flex-col text-xs bg-zinc-950/20">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`p-3 rounded-sm border transition-all ${
                      msg.sender === "user"
                        ? "bg-accent-info text-white rounded-tr-none border-accent-info/20"
                        : "bg-bg-card text-text-primary rounded-tl-none border-zinc-800"
                    }`}
                  >
                    <p className="leading-relaxed font-normal whitespace-pre-wrap">{msg.text}</p>
                  </motion.div>
                  {/* Timestamp */}
                  <span className="text-[9px] text-text-muted mt-1 px-1 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.time}
                  </span>
                </div>
              ))}

              {/* Redesigned Typing Indicator */}
              {isLoading && (
                <div className="flex flex-col self-start items-start max-w-[85%]">
                  <div className="bg-bg-card text-text-primary p-3 rounded-sm border border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-1.5 px-1 py-0.5">
                      <span className="w-2 h-2 bg-accent-info rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-accent-info rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-accent-info rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                  <span className="text-[8px] text-text-muted mt-1 flex items-center gap-1">
                    SMS bot is typing...
                  </span>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Uploaded Photo Preview Bar */}
            {uploadedImage && (
              <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <img 
                    src={uploadedImage} 
                    alt="Verified civic report" 
                    className="w-8 h-8 rounded border border-zinc-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-accent-success font-mono font-bold block">✓ VERIFIED PHOTO</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Confidence: {uploadedImageConfidence}%</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedImageHash(null);
                    setUploadedImageConfidence(null);
                    setDraft(prev => ({ ...prev, isReadyToSubmit: false, isSubmitted: false }));
                  }}
                  className="text-[9px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Pill-shaped Input & Send Bar */}
            <div className="p-3 border-t border-zinc-900 bg-bg-card">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 rounded-sm pl-3.5 pr-1.5 py-1.5 focus-within:ring-1 focus-within:ring-accent-alert/30 focus-within:border-accent-alert transition-all">
                <input
                  type="text"
                  placeholder={draft.isReadyToSubmit ? "Type 'YES' to confirm..." : "Describe the neighborhood issue..."}
                  className="flex-grow bg-transparent border-none outline-none text-xs text-text-primary placeholder-zinc-700"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                
                {/* Paperclip Upload Button */}
                <label className="p-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-zinc-850 shrink-0" title="Upload Photo">
                  <Paperclip className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBotImageUpload}
                    disabled={isLoading}
                  />
                </label>

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-sm transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                    input.trim() && !isLoading
                      ? "bg-accent-info hover:bg-accent-info/90 text-white shadow-sm"
                      : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                  }`}
                  id="send-sms-msg-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-[8px] text-text-muted font-mono uppercase tracking-widest font-semibold">
                  Powered by Gemini Flash AI • Natural Intake Engine
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmsDispatchBot;
