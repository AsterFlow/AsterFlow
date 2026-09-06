import validateNpmPackageName from 'validate-npm-package-name'

export type ValidateProjectNameResult =
  | { valid: true }
  | { valid: false, problems: string[] }

export function validateProjectName(name: string): ValidateProjectNameResult {
  const validation = validateNpmPackageName(name)
  if (validation.validForNewPackages) return { valid: true }

  return {
    valid: false,
    problems: [...(validation.errors ?? []), ...(validation.warnings ?? [])]
  }
}
