import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validePdfFile(fileType: string) {
  return fileType.includes("pdf")
}

export function valideExcelFile(fileType: string) {
  return fileType.includes("excel") || fileType.includes("spreadsheetml")
}