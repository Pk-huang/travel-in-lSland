import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 合併 Tailwind class（shadcn 慣例）：clsx 處理條件、twMerge 去除衝突。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
