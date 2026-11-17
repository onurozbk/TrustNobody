import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn: koşullu class'ları birleştirip çakışan Tailwind sınıflarını ayıklar. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
