import { format, formatDistanceToNow } from "date-fns";

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
  const createdAtDate = new Date(date);

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
  const createdAtDate = new Date(date);

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
  const createdAtDate = new Date(date);

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
