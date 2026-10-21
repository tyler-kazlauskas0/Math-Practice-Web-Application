import { addArchiveBreakdowns, buildMistakePatternsFromAttempts } from './migrations'
import { readText, writeText } from './storage'

/**
 * The version of the saved data's format. Increase it whenever the format changes, and add
 * a migration that upgrades data from the previous version.
 */
export const CURRENT_SCHEMA_VERSION = 3

export const SCHEMA_VERSION_KEY = 'schema-version'

/** Upgrades saved data by one version. Must only change this app's own keys. */
type Migration = () => void

/**
 * `MIGRATIONS[n]` upgrades data from version `n` to `n + 1`. Each runs once, in order.
 *
 * Version 0 is data saved before versioning was added. It only ever held settings, which are
 * already in the version 1 format, so there is nothing to change.
 */
export const MIGRATIONS: Record<number, Migration> = {
  0: () => {},
  1: addArchiveBreakdowns,
  2: buildMistakePatternsFromAttempts,
}

export type MigrationResult =
  /** Data was already on the current version. */
  | 'up-to-date'
  | 'migrated'
  /** Data is from a newer version of the app. It's left exactly as it is. */
  | 'newer-version'
  | 'unavailable'
  /** A migration failed. Data is left at the last version that succeeded. */
  | 'failed'

/** The saved data's version: 0 if none is saved (or it's unreadable), or `null` if storage can't be used. */
export function readSchemaVersion(): number | null {
  const saved = readText(SCHEMA_VERSION_KEY)
  if (saved.status === 'unavailable') return null
  if (saved.status !== 'ok') return 0
  const version = Number(saved.value)
  return Number.isInteger(version) && version >= 0 ? version : 0
}

/**
 * Brings saved data up to `CURRENT_SCHEMA_VERSION`. Safe to call on every start: it does
 * nothing when data is already current. It never deletes data it doesn't recognize.
 */
export function migrateStorage(
  migrations: Record<number, Migration> = MIGRATIONS,
  targetVersion = CURRENT_SCHEMA_VERSION,
): MigrationResult {
  let version = readSchemaVersion()
  if (version === null) return 'unavailable'
  if (version === targetVersion) return 'up-to-date'
  if (version > targetVersion) return 'newer-version'

  while (version < targetVersion) {
    const migrate = migrations[version]
    if (!migrate) return 'failed'
    try {
      migrate()
    } catch {
      return 'failed'
    }
    version += 1
    // Record each step, so a later failure doesn't repeat the steps that worked.
    if (!writeText(SCHEMA_VERSION_KEY, String(version)).ok) return 'failed'
  }
  return 'migrated'
}
