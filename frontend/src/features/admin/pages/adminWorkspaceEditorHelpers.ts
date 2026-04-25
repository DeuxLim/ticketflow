import { ApiError } from '@/services/api/client';

export type DraftValueType = 'string' | 'number' | 'boolean';

export type DraftRow = {
  id: number;
  key: string;
  type: DraftValueType;
  value: string;
};

export type WorkspaceEditorKind = 'limits' | 'featureFlags';

let nextDraftRowId = 1;

function createEmptyDraftRow(): DraftRow {
  return { id: nextDraftRowId++, key: '', type: 'string', value: '' };
}

function valueTypeFromUnknown(value: unknown): DraftValueType {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  return 'string';
}

function valueStringFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || typeof value === 'undefined') {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function createDraftRows(source: Record<string, unknown> | null | undefined): DraftRow[] {
  const entries = Object.entries(source ?? {});

  if (entries.length === 0) {
    return [createEmptyDraftRow()];
  }

  return entries.map(([key, value]) => ({
    id: nextDraftRowId++,
    key,
    type: valueTypeFromUnknown(value),
    value: valueStringFromUnknown(value),
  }));
}

export function parseDraftRows(rows: DraftRow[]): { data?: Record<string, unknown>; error?: string } {
  const parsed: Record<string, unknown> = {};

  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      continue;
    }

    if (Object.hasOwn(parsed, key)) {
      return { error: `Duplicate key "${key}" is not allowed.` };
    }

    if (row.type === 'number') {
      const numericValue = Number(row.value);
      if (!Number.isFinite(numericValue)) {
        return { error: `Value for "${key}" must be a valid number.` };
      }

      parsed[key] = numericValue;
      continue;
    }

    if (row.type === 'boolean') {
      parsed[key] = row.value === 'true';
      continue;
    }

    parsed[key] = row.value;
  }

  return { data: parsed };
}

export function buildWorkspaceEditorMutationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const fieldErrorEntries = Object.entries(error.fieldErrors);
  if (fieldErrorEntries.length > 0) {
    const [field, messages] = fieldErrorEntries[0];
    const firstMessage = messages[0];

    if (firstMessage) {
      return `${field}: ${firstMessage}`;
    }
  }

  return error.message || fallback;
}
