/**
 * Utility to construct fully qualified API URLs for fetch requests.
 * This supports standard relative paths in development/preview modes,
 * and external API base URLs (e.g. VITE_API_URL) when deployed on Netlify.
 */
export const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  const baseUrl = envUrl ? (envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl) : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
