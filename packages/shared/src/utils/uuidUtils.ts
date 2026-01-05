/**
 * UUID Validation and Utility Functions
 * 
 * Supports the UUID migration strategy (v1.1.0+) with backward compatibility
 * for both ObjectId and UUID formats during the transition period.
 * 
 * @see /docs/UUID_MIGRATION_GUIDE.md for migration details
 */

// UUID v4 regex pattern (36 characters with hyphens)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// MongoDB ObjectId regex pattern (24 hex characters)
const OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates if a string is a valid UUID v4 format
 * @param id - The ID string to validate
 * @returns boolean - true if valid UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validates if a string is a valid MongoDB ObjectId format
 * @param id - The ID string to validate
 * @returns boolean - true if valid ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return OBJECTID_REGEX.test(id);
}

/**
 * Validates if an ID is in either UUID or ObjectId format
 * (useful during migration period when both formats may be present)
 * @param id - The ID string to validate
 * @returns boolean - true if valid in either format
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return isValidUUID(id) || isValidObjectId(id);
}

/**
 * Determines the format of an ID
 * @param id - The ID string to analyze
 * @returns 'uuid' | 'objectid' | 'unknown'
 */
export function getIdFormat(id: string): 'uuid' | 'objectid' | 'unknown' {
  if (isValidUUID(id)) return 'uuid';
  if (isValidObjectId(id)) return 'objectid';
  return 'unknown';
}

/**
 * Normalizes user ID handling
 * Returns the 'userUuid' field (primary identifier)
 * @param user - User object with userUuid field
 * @returns string - normalized user ID
 */
export function normalizeUserId(user: { userUuid: string }): string {
  return user.userUuid;
}

/**
 * Normalizes product ID handling
 * Prefers 'productUuid' field over legacy 'productId' when available
 * @param product - Product object with productUuid and/or productId fields
 * @returns string - normalized product ID
 */
export function normalizeProductId(product: { productUuid?: string; productId?: string }): string {
  // Prefer 'productUuid' field if available and valid
  if (product.productUuid && isValidId(product.productUuid)) {
    return product.productUuid;
  }

  // Fall back to legacy 'productId' field
  if (product.productId) {
    return product.productId;
  }

  throw new Error('Product object must have either productUuid or productId field');
}

/**
 * Normalizes order ID handling during migration period
 * @param order - Order object with id field
 * @returns string - normalized order ID
 */
export function normalizeOrderId(order: { id: string }): string {
  return order.id;
}

/**
 * Safe ID comparison that works across different ID formats
 * @param id1 - First ID to compare
 * @param id2 - Second ID to compare
 * @returns boolean - true if IDs are equal
 */
export function compareIds(id1: string, id2: string): boolean {
  if (!id1 || !id2) return false;
  return id1 === id2;
}

/**
 * Migration period helper: detects if system is returning UUID-based responses
 * @param response - API response object with id field
 * @returns boolean - true if response uses UUID format
 */
export function isUUIDMigrated(response: { id?: string }): boolean {
  return !!(response.id && isValidUUID(response.id));
}

/**
 * Validation helper for API responses
 * Ensures ID field exists and is in valid format
 * Supports 'userUuid', 'productUuid', and legacy 'id' fields for compatibility
 * @param obj - Object with userUuid, productUuid, or id field
 * @param fieldName - Name of the field being validated (for error messages)
 * @throws Error if ID is invalid
 */
export function validateResponseId(obj: { id?: string; userUuid?: string; productUuid?: string }, fieldName: string = 'object'): void {
  const id = obj.userUuid || obj.productUuid || obj.id;

  if (!id) {
    throw new Error(`${fieldName} response missing required 'userUuid', 'productUuid', or 'id' field`);
  }

  if (!isValidId(id)) {
    throw new Error(`${fieldName} has invalid ID format: ${id}`);
  }
}

/**
 * Debug helper: logs ID format information
 * @param id - ID to analyze
 * @param context - Context description for logging
 */
export function debugIdFormat(id: string, context: string = 'ID'): void {
  const format = getIdFormat(id);
  const length = id.length;
  
  console.debug(`[UUID Migration] ${context}: "${id}" (format: ${format}, length: ${length})`);
}

// Export type definitions for better TypeScript integration
export type IdFormat = 'uuid' | 'objectid' | 'unknown';
export type ValidId = string; // Type alias for documentation purposes