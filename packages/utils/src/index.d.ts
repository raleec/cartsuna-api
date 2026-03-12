import type { Pagination } from "@cartsuna/types";
export declare function buildPagination(page: number, perPage: number, total: number): Pagination;
export declare function pageToOffset(page: number, perPage: number): number;
export declare function toSlug(input: string): string;
export declare function formatLocalDate(ts: Date | string, timezone: string, locale?: string): string;
export declare function isWithinRruleWindow(ts: Date, rruleStr: string, start: Date, end: Date, _timezone: string): boolean;
//# sourceMappingURL=index.d.ts.map