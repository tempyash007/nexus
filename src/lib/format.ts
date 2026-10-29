import { format, formatDistanceToNowStrict } from "date-fns";

export function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 45_000) return "just now";
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function formatTimestamp(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy · HH:mm:ss");
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "HH:mm:ss");
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), "MMM d");
}

export const numberFormat = new Intl.NumberFormat("en-US");
