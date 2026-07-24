import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRemaining(expiresAt: string | Date, now = Date.now()): string {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export function mediaUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) return path;
  return `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatLastSeen(date?: string | null): string {
  if (!date) return "";
  const now = new Date();
  const last = new Date(date);
  const diffMs = now.getTime() - last.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);

  if (mins < 1) return "Online";
  if (mins < 60) return `Last seen ${mins} ${mins === 1 ? "minute" : "minutes"} ago`;

  // Calendar day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const dayDiff = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);

  if (hours < 24) return `Last seen ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (dayDiff === 0) return "Last seen today";
  if (dayDiff === 1) return "Last seen yesterday";
  if (dayDiff < 7) return "Last seen within a week";
  if (dayDiff < 31) return "Last seen within a month";
  return "Last seen a long time ago";
}

export function getErrorMessage(err: any, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) return "Unable to connect to server. Please check your connection.";
  if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  return fallback;
}
