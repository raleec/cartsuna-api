export interface Pagination {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface ErrorResponse {
    error: string;
    message: string;
}
export interface TemplateFields {
    status: string;
    createdTs: Date;
    createdBy: string;
    updatedTs: Date;
    updatedBy: string;
}
export interface Customer extends TemplateFields {
    customerId: string;
    name: string;
    location: string | null;
    description: string | null;
    tags: string[] | null;
}
export interface Merchant extends TemplateFields {
    merchantId: string;
    name: string;
    location: string | null;
    schedule: string | null;
    quota: number | null;
    description: string | null;
    tags: string[] | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    welcomeMessage: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    websiteUrl: string | null;
    socialLinks: Record<string, string> | null;
    isPrivate: boolean;
    tier: string | null;
    countryCode: string | null;
}
export interface Item {
    itemId: string;
    merchantId: string;
    inventoryId: string | null;
    name: string;
    desc: string | null;
    image: string | null;
    unitPrice: number | null;
    tax: number | null;
    tags: string[] | null;
    status: string;
}
export interface ItemAvailability extends TemplateFields {
    availabilityId: string;
    itemId: string;
    merchantId: string;
    locationName: string | null;
    locationAddr: string | null;
    startTs: Date;
    endTs: Date;
    timezone: string;
    rrule: string | null;
    recurrenceEnd: Date | null;
    quota: number | null;
    booked: number;
    unitPrice: number | null;
    tax: number | null;
    tags: string[] | null;
    status: string;
}
export interface Inventory extends TemplateFields {
    inventoryId: string;
    barcode: string | null;
    name: string;
    description: string | null;
    tags: string[] | null;
}
export interface Order {
    orderId: string;
    itemId: string;
    itemCount: number;
    memo: string | null;
    state: string;
    availabilityId: string | null;
}
export interface Request {
    requestId: string;
    customerId: string;
    orderId: string | null;
    merchantId: string;
    title: string;
    desc: string | null;
    eta: Date | null;
    status: string;
}
export interface Event extends TemplateFields {
    eventId: string;
    title: string;
    image: string | null;
    quota: number | null;
    cron: string | null;
    duration: number | null;
    tags: string[] | null;
    status: string;
}
export interface Review extends TemplateFields {
    reviewId: string;
    customerId: string;
    itemId: string;
    merchantId: string;
    rating: number;
    body: string | null;
}
export interface Favorite extends TemplateFields {
    favoriteId: string;
    customerId: string;
    itemId: string;
}
export interface Punchcard extends TemplateFields {
    punchcardId: string;
    customerId: string;
    merchantId: string;
    punches: number;
    maxPunches: number;
}
export interface Bid extends TemplateFields {
    bidId: string;
    itemId: string;
    customerId: string;
    amount: number;
    state: string;
}
export interface MerchantInvite {
    inviteId: string;
    merchantId: string;
    codeHash: string;
    label: string | null;
    maxUses: number | null;
    useCount: number;
    expiresAt: Date | null;
    isActive: boolean;
    createdTs: Date;
    createdBy: string;
}
export interface BluetoothSession {
    sessionId: string;
    merchantId: string;
    customerId: string | null;
    state: string;
    createdTs: Date;
    updatedTs: Date;
}
export interface TierConfig extends TemplateFields {
    tierConfigId: string;
    countryCode: string;
    tier: string;
    maxCustomersPerMonth: number | null;
    maxOrdersPerMonth: number | null;
}
export interface SearchResult {
    type: string;
    id: string;
    name: string;
    description: string | null;
    score: number;
}
//# sourceMappingURL=index.d.ts.map