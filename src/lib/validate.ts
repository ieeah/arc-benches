import type { CheckboxAction, ItemRequirement, List, ListLevel, ListType, Profile } from '../types';

/**
 * Runtime validation / sanitization at the deserialization boundary.
 *
 * Everything that enters the app from an untrusted source — localStorage (which the user, an
 * extension, or another tab can tamper with) and imported JSON files — passes through here before
 * touching the store. Hand-rolled guards (no dependency: same zero-lockfile-risk rationale as cn()).
 *
 * Policy: be lenient on load (drop bad entries, keep the good ones so a partially-corrupt profile
 * still opens) and structurally strict on import (reject a malformed file wholesale, but sanitize
 * its contents). The same guards will validate remote sync payloads later.
 */

// ── primitives ──────────────────────────────────────────────────────────────

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Finite number ≥ min (default 0), else null. */
const asNonNegInt = (v: unknown, min = 0): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min ? Math.floor(v) : null;

const asNonEmptyString = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

// ── record sanitizers (keep only valid entries) ──────────────────────────────

/** `Record<string, number>` keeping finite values ≥ 0 (inventory, hideoutLevels). */
export const sanitizeNumberRecord = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    const n = asNonNegInt(val);
    if (n !== null) out[k] = n;
  }
  return out;
};

/** `Record<string, number[]>` keeping arrays of finite ints ≥ 0 (targetLevels). */
export const sanitizeNumberArrayRecord = (v: unknown): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    if (!Array.isArray(val)) continue;
    const nums = val.map(n => asNonNegInt(n)).filter((n): n is number => n !== null);
    out[k] = nums;
  }
  return out;
};

/** `Record<string, boolean>` keeping boolean values (activeModules). */
export const sanitizeBoolRecord = (v: unknown): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'boolean') out[k] = val;
  }
  return out;
};

export const sanitizeStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

// ── domain shapes ────────────────────────────────────────────────────────────

const validateRequirement = (v: unknown): ItemRequirement | null => {
  if (!isObject(v)) return null;
  const itemId = asNonEmptyString(v.itemId);
  const quantity = asNonNegInt(v.quantity);
  if (itemId === null || quantity === null) return null;
  return { itemId, quantity };
};

const validateAction = (v: unknown): CheckboxAction | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const label = typeof v.label === 'string' ? v.label : null;
  if (id === null || label === null) return null;
  return { id, label };
};

const validateLevel = (v: unknown): ListLevel | null => {
  if (!isObject(v)) return null;
  const level = asNonNegInt(v.level, 1);
  if (level === null) return null;
  const requirementItemIds = Array.isArray(v.requirementItemIds)
    ? v.requirementItemIds.map(validateRequirement).filter((r): r is ItemRequirement => r !== null)
    : [];
  const actions = Array.isArray(v.actions)
    ? v.actions.map(validateAction).filter((a): a is CheckboxAction => a !== null)
    : undefined;
  const out: ListLevel = { level, requirementItemIds };
  if (actions && actions.length > 0) out.actions = actions;
  return out;
};

const LIST_TYPES: ListType[] = ['workbench', 'project', 'quest', 'custom'];

/** Validate a full `List` definition. Returns null if structurally unusable. */
export const validateList = (v: unknown): List | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const name = typeof v.name === 'string' ? v.name : null;
  if (id === null || name === null) return null;

  const levels = Array.isArray(v.levels)
    ? v.levels.map(validateLevel).filter((l): l is ListLevel => l !== null)
    : [];
  if (levels.length === 0) return null;

  const maxFromLevels = Math.max(...levels.map(l => l.level));
  const maxLevel = asNonNegInt(v.maxLevel, 1) ?? maxFromLevels;

  const out: List = { id, name, maxLevel, levels };
  if (v.custom === true) out.custom = true;
  if (v.shared === true) out.shared = true;
  if (typeof v.listType === 'string' && LIST_TYPES.includes(v.listType as ListType)) {
    out.listType = v.listType as ListType;
  }
  return out;
};

export const validateProfile = (v: unknown): Profile | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const name = typeof v.name === 'string' ? v.name : null;
  if (id === null || name === null) return null;
  return { id, name };
};
