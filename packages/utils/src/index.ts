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
  timezone: string
): boolean {
  try {
    // RRule library works in UTC internally; we pass tzid for DST-aware expansion
    const rule = RRule.fromString(rruleStr);
    // If the rrule string doesn't already include TZID, set it via options
    const options = rule.options;
    if (!options.tzid && timezone) {
      options.tzid = timezone;
    }
    const tzRule = new RRule(options);
    const occurrences = tzRule.between(start, end, true);
    return occurrences.some((occ) => Math.abs(occ.getTime() - ts.getTime()) < 1000);
  } catch {
    return false;
  }
}
