/**
 * Utility function to generate consistent user initials.
 * Grabs the first letter of the first name and the first letter of the last name.
 * If only one name is provided, returns its first two letters.
 * If no name is provided, falls back to the email.
 */
export function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const cleanName = name.trim();
    // Split by spaces, removing empty segments
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const firstLetter = parts[0][0];
      const lastLetter = parts[parts.length - 1][0];
      return (firstLetter + lastLetter).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  
  if (email && email.trim()) {
    const cleanEmail = email.trim();
    const handle = cleanEmail.split("@")[0];
    // Try to split email handle by dot, underscore, or dash
    const parts = handle.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return handle.slice(0, 2).toUpperCase();
  }
  
  return "U";
}
