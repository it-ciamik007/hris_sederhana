import { z } from "zod";

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function parseDateOnly(value: string) {
  const parsed = dateStringSchema.parse(value);
  return new Date(`${parsed}T00:00:00`);
}

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function eachDateBetween(startDate: Date, endDate: Date) {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
