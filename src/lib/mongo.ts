import { Types } from "mongoose";

export function toId(value: Types.ObjectId | string): string {
  return typeof value === "string" ? value : value.toString();
}

export function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

export function serializeDates<T extends { createdAt?: Date; updatedAt?: Date }>(
  doc: T,
): T & { createdAt?: string; updatedAt?: string } {
  return {
    ...doc,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}
