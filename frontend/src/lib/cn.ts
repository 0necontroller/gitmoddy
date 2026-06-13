import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

/**
 * Combine multiple classes together
 * @param inputs - The classes to combine
 * @returns The combined classes
 * @example cn('text-center font-medium', {"w-5 py-2":isLoading})
 * */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
