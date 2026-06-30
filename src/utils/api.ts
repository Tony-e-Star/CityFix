/**
 * Utility to construct fully qualified API URLs for fetch requests.
 * This supports standard relative paths in development/preview modes,
 * and external API base URLs (e.g. VITE_API_URL) when deployed on Netlify.
 */
export const getApiUrl = (path: string): string => {
  let envUrl = (import.meta as any).env.VITE_API_URL;
  
  // If we are not on the same-origin Cloud Run URL (i.e. we are on netlify.app, localhost, etc.)
  // and VITE_API_URL is not set, automatically fall back to the primary Cloud Run backend.
  if (!envUrl && typeof window !== "undefined") {
    const isSameOrigin = window.location.hostname.endsWith(".run.app");
    if (!isSameOrigin) {
      envUrl = "https://ais-pre-d7mgkxp3mivfkjvlsqlbsc-1033877112442.asia-southeast1.run.app";
    }
  }
  
  const baseUrl = envUrl ? (envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl) : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
