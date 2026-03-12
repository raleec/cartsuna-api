import type { Pagination } from "@cartsuna/types";
import { RRule } from "rrule";

export function buildPagination(page: number, perPage: number, total: number): Pagination {
  const totalPages = Math.ceil(total / perPage);
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function pageToOffset(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatLocalDate(ts: Date | string, timezone: string, locale = "en"): string {
  const date = typeof ts === "string" ? new Date(ts) : ts;
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function isWithinRruleWindow(
  ts: Date,
  rruleStr: string,
  start: Date,
  end: Date,
  _timezone: string
): boolean {
  try {
    const rule = RRule.fromString(rruleStr);
    const occurrences = rule.between(start, end, true);
    return occurrences.some((occ) => occ.getTime() === ts.getTime());
  } catch {
    return false;
  }
}
