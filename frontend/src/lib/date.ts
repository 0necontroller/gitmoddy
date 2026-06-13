import { format, formatDistanceToNow } from "date-fns";

export function parseGitDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  
  let cleaned = dateStr.trim();
  // Try normal constructor first
  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  // Convert "2026-06-13 17:16:11 +0300" -> "2026-06-13T17:16:11+03:00"
  cleaned = cleaned.replace(" ", "T");
  cleaned = cleaned.replace(" ", "");
  
  const tzMatch = cleaned.match(/([+-])(\d{2})(\d{2})$/);
  if (tzMatch) {
    cleaned = cleaned.replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3");
  }
  
  d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  
  return new Date(dateStr);
}

/**
 * Format date to MMMM dd, yyyy at hh:mm a
 * @param date - The date to format
 * @param formatLayout - The format layout (date-fns formats)
 * @returns The formatted date
 * e.g. January 01, 2023 at 12:34 PM
 * */
export function formatDate(
  date: string,
  formatLayout: string = "MMMM dd, yyyy 'at' hh:mm a",
): string {
  const createdAtDate = parseGitDate(date);

  if (isNaN(createdAtDate.getTime())) {
    return "----";
  }

  return format(createdAtDate, formatLayout);
}

/**
 * Format date to hh:mm a MM/dd/yyyy
 * @param date - The date to format
 * @returns The formatted date
 * e.g. 12:34 PM 01/01/2023
 * */
export function formatMessageDate(date: string): string {
  const createdAtDate = parseGitDate(date);

  if (isNaN(createdAtDate.getTime())) {
    return "----";
  }

  return format(createdAtDate, "hh:mm a MM/dd/yyyy");
}

/**
 * Format date to distance from now
 * @param date - The date to format
 * @returns The distance from now
 * e.g. 2 days ago
 * */
export function dateDistance(date: string): string {
  const createdAtDate = parseGitDate(date);
  if (isNaN(createdAtDate.getTime())) {
    return "Never";
  }

  const result = formatDistanceToNow(createdAtDate, { addSuffix: true });

  // Check if it says 2023 years ago
  if (result.includes("over 2023 years ago")) {
    return "Never";
  }

  return result;
}

/**
 * Convert days to months
 * @param days - The number of days
 * @returns The number of months and remaining days
 * e.g. 32 days to 1 month 2 days
 * */
export function daysToMonths(days: number): string {
  if (days < 30) {
    return days + " days";
  }

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  return `${months} months ${remainingDays} days`;
}
