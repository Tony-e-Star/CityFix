/**
 * Utility to construct fully qualified API URLs for fetch requests.
 * This supports standard relative paths in development/preview modes,
 * and external API base URLs (e.g. VITE_API_URL) when deployed on Netlify.
 */
export const getApiUrl = (path: string): string => {
  let envUrl = (import.meta as any).env.VITE_API_URL;
  
  // On Netlify, we have a proxy redirect rule configured in netlify.toml for "/api/*".
  // Therefore, we should use relative paths ("") to leverage this proxy, which avoids CORS issues completely.
  if (!envUrl && typeof window !== "undefined") {
    const isSameOrigin = window.location.hostname.endsWith(".run.app");
    const isNetlify = window.location.hostname.endsWith("netlify.app");
    if (!isSameOrigin && !isNetlify) {
      envUrl = "https://ais-pre-d7mgkxp3mivfkjvlsqlbsc-1033877112442.asia-southeast1.run.app";
    }
  }
  
  const baseUrl = envUrl ? (envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl) : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
