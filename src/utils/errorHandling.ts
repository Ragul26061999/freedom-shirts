import { toast } from 'sonner';

export const ErrorCodes = {
  NO_ROWS_RETURNED: 'NOT_FOUND',
  RLS_VIOLATION: 'PERMISSION_DENIED',
};

/** Substring in messages from {@link toUserFacingQueryError} for unreachable API/DB. */
export const UNABLE_TO_REACH_DATABASE = 'Unable to reach the database';

interface QueryErrorLike {
  message?: string;
  code?: string;
}

/**
 * Maps a data-layer error to an Error for React Query.
 * Does not log — keeps dev terminal clean; show errors in UI instead.
 */
export function toUserFacingQueryError(
  subject: string,
  error: QueryErrorLike
): Error {
  const raw = error.message ?? '';
  if (
    raw.includes('Failed to fetch') ||
    raw.includes('NetworkError') ||
    raw.includes('Load failed') ||
    raw.includes('unavailable')
  ) {
    return new Error(
      `${UNABLE_TO_REACH_DATABASE}. Check your connection and try again.`
    );
  }
  if (error.code === ErrorCodes.RLS_VIOLATION) {
    return new Error('You do not have permission to view this data.');
  }
  if (raw) {
    return new Error(`${subject}: ${raw}`);
  }
  return new Error(`${subject} could not be loaded.`);
}

/** Check if an error represents a missing row/document. */
export function isNoRowsError(error: QueryErrorLike | null): boolean {
  return error?.code === ErrorCodes.NO_ROWS_RETURNED;
}

/** Check if an error represents a permission failure. */
export function isRLSViolationError(error: QueryErrorLike | null): boolean {
  return (
    error?.code === ErrorCodes.RLS_VIOLATION ||
    error?.code === 'permission-denied'
  );
}

export function isProfileAccessError(error: QueryErrorLike | null): boolean {
  return isNoRowsError(error) || isRLSViolationError(error);
}

/**
 * Handle common data-layer errors.
 * @returns boolean indicating if the error was handled
 */
export function handleCommonErrors(
  error: unknown,
  options: {
    context?: string;
    showToast?: boolean;
    silentOnNoRows?: boolean;
  } = {}
): boolean {
  const {
    context = 'operation',
    showToast = true,
    silentOnNoRows = true,
  } = options;

  if (!error) return false;

  if (isQueryErrorLike(error)) {
    if (isNoRowsError(error)) {
      if (!silentOnNoRows) {
        console.warn(`No rows returned for ${context}`);
        if (showToast) toast.error('No data found.');
      }
      return true;
    }

    if (isRLSViolationError(error)) {
      console.error(`Permission error in ${context}:`, error);
      if (showToast) {
        toast.error('Permission denied to access this data.');
      }
      return true;
    }

    console.error(`Database error in ${context}:`, error);
    if (showToast) toast.error(`Database error: ${error.message}`);
    return true;
  }

  if (error instanceof Error) {
    console.error(`Error in ${context}:`, error);
    if (showToast) toast.error(error.message || 'An error occurred');
    return true;
  }

  console.error(`Unknown error in ${context}:`, error);
  if (showToast) toast.error('An unexpected error occurred');
  return true;
}

function isQueryErrorLike(error: unknown): error is QueryErrorLike {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function logError(context: string, error: unknown): void {
  console.error(`Error in ${context}:`, error);
}

export async function trySafe<T>(
  fn: () => Promise<T>,
  options: {
    context?: string;
    showToast?: boolean;
    fallbackValue?: T;
  }
): Promise<T | null> {
  const {
    context = 'operation',
    showToast = true,
    fallbackValue = null,
  } = options;

  try {
    return await fn();
  } catch (error) {
    handleCommonErrors(error, { context, showToast });
    return fallbackValue as T;
  }
}
