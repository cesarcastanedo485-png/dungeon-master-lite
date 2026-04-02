import { clsx, type ClassValue } from "clsx"
import { format, isValid } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Avoids date-fns throwing when API/offline returns bad timestamps. */
export function safeFormatDate(
  value: string | number | Date | null | undefined,
  fmt: string,
  fallback = "—",
): string {
  if (value == null || value === "") return fallback
  const d = value instanceof Date ? value : new Date(value)
  return isValid(d) ? format(d, fmt) : fallback
}
