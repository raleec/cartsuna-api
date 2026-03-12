import { RRule } from "rrule";
export function buildPagination(page, perPage, total) {
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
export function pageToOffset(page, perPage) {
    return (page - 1) * perPage;
}
export function toSlug(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export function formatLocalDate(ts, timezone, locale = "en") {
    const date = typeof ts === "string" ? new Date(ts) : ts;
    return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "short",
    }).format(date);
}
export function isWithinRruleWindow(ts, rruleStr, start, end, _timezone) {
    try {
        const rule = RRule.fromString(rruleStr);
        const occurrences = rule.between(start, end, true);
        return occurrences.some((occ) => occ.getTime() === ts.getTime());
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=index.js.map