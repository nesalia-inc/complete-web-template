import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000"
}

export function getAuthUrl() {
  return getBaseUrl() + "/api/auth"
}