import { format, formatDistance, formatRelative, parseISO } from "date-fns";

export const formatDate = (date: string | Date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
};

export const formatDateTime = (date: string | Date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy HH:mm");
};

export const formatTime = (date: string | Date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
};

export const formatDistanceToNow = (date: string | Date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
};

export const formatRelativeDate = (date: string | Date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatRelative(d, new Date());
};
