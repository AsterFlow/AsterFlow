import pkg from '../../package.json'

const REGISTRY_URL = 'https://registry.npmjs.org'
const FETCH_TIMEOUT_MS = 5000

const [CLI_MAJOR, CLI_MINOR] = pkg.version.split('.').map(Number) as [number, number]

async function fetchPublishedVersions(packageName: string): Promise<string[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(`${REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
      signal: controller.signal,
      // Abbreviated metadata (what npm/corepack request internally) - just
      // dist-tags/versions/engines, no readme - smaller and faster than the full packument.
      headers: { Accept: 'application/vnd.npm.install-v1+json' }
    })
    if (!response.ok) return []

    const data = await response.json() as { versions?: Record<string, unknown> }
    return Object.keys(data.versions ?? {})
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolves the safest install range for an AsterFlow-ecosystem package: the latest
 * published patch within this CLI's own major.minor line, e.g. `^2.0.4` when the CLI
 * itself is `2.0.1`. Every asterflow package moves in lockstep (see VERSIONING.md) and
 * only the patch digit (Z) is guaranteed to carry zero API/type surface impact - a
 * minor bump can break types, a major can break runtime - so floating past the CLI's
 * own X.Y would risk reintroducing the exact cross-package mismatch (e.g. scaffolding
 * `asterflow@0.0.5` next to `@asterflow/fs@1.0.7`) this resolver exists to prevent.
 * Falls back to the CLI's own version when the registry can't be reached, so scaffolding
 * still works offline - just without picking up any patch released since this CLI build.
 */
export async function resolveAsterflowVersion(packageName: string): Promise<string> {
  const versions = await fetchPublishedVersions(packageName)

  let latestPatch = -1
  for (const version of versions) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
    if (!match) continue // skip prereleases/build metadata - never scaffold onto those
    const [, majorStr, minorStr, patchStr] = match
    if (Number(majorStr) !== CLI_MAJOR || Number(minorStr) !== CLI_MINOR) continue
    latestPatch = Math.max(latestPatch, Number(patchStr))
  }

  const resolvedVersion = latestPatch >= 0 ? `${CLI_MAJOR}.${CLI_MINOR}.${latestPatch}` : pkg.version
  return `^${resolvedVersion}`
}
