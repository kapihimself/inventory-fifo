/**
 * Lightweight input validation helpers used in every API route.
 * Keeps validation logic in one place so rules stay consistent across endpoints.
 * No external library needed — plain TypeScript guards.
 */

import { NextResponse } from "next/server";

// Valid Prisma enum values for RequestStatus
const VALID_REQUEST_STATUSES = ["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"] as const;
type RequestStatus = (typeof VALID_REQUEST_STATUSES)[number];

export function isValidRequestStatus(value: unknown): value is RequestStatus {
  return VALID_REQUEST_STATUSES.includes(value as RequestStatus);
}

// Validate that a string looks like a Prisma cuid (26 chars, alphanumeric)
// This stops garbage IDs from ever hitting the database
export function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 20 && value.length <= 30 && /^[a-z0-9]+$/i.test(value);
}

// Validate a positive integer quantity
export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Validate a price (positive number, can be decimal)
export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && isFinite(value);
}

// Clamp the `limit` query param so callers can't request 999 999 rows
export function clampLimit(raw: string | null, defaultVal = 50, max = 100): number {
  const n = parseInt(raw ?? String(defaultVal), 10);
  if (!isFinite(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

// Standard 400 response with a descriptive message
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Standard 404 response
export function notFound(resource: string) {
  return NextResponse.json({ error: `${resource} tidak ditemukan` }, { status: 404 });
}

// Validate the `items` array that comes in distribution/request payloads
export function validateItemsArray(
  items: unknown
): items is { itemId: string; quantity?: number; quantityRequested?: number }[] {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.every(
    (i) =>
      i !== null &&
      typeof i === "object" &&
      "itemId" in i &&
      typeof (i as any).itemId === "string"
  );
}
