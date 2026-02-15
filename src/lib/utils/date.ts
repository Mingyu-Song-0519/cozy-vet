import { addDays, format, parseISO } from "date-fns";

export function formatDate(date: string | Date, pattern = "yyyy-MM-dd") {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, pattern);
}

export function plusDays(date: string, days: number) {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}
