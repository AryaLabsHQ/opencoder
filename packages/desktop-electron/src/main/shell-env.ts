import { execFileSync } from "node:child_process"

const ENV_NAME_PATTERN = /^[A-Z0-9_]+$/

type ExecFileSyncLike = (
  file: string,
  args: ReadonlyArray<string>,
  options: { encoding: "utf8"; timeout: number },
) => string

export type PathSync = {
  shell: string
  entries: number
  updated: boolean
}

export function buildUnixShellCommand(args: string, sidecar: string, shell: string) {
  const line = shell.endsWith("/nu") ? `^\"${sidecar}\" ${args}` : `\"${sidecar}\" ${args}`
  return { cmd: shell, cmdArgs: ["-l", "-c", line] }
}

export function resolveShell(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
) {
  const shell = env.SHELL?.trim()
  if (shell) return shell
  if (platform === "darwin") return "/bin/zsh"
  if (platform === "win32") return env.COMSPEC?.trim() || "cmd.exe"
  return "/bin/sh"
}

function envCaptureStart(name: string): string {
  return `__OPENCODE_ENV_${name}_START__`
}

function envCaptureEnd(name: string): string {
  return `__OPENCODE_ENV_${name}_END__`
}

function buildCaptureCommand(names: ReadonlyArray<string>): string {
  return names
    .map((name) => {
      if (!ENV_NAME_PATTERN.test(name)) {
        throw new Error(`Unsupported environment variable name: ${name}`)
      }

      return [
        `printf '%s\\n' '${envCaptureStart(name)}'`,
        `printenv ${name} || true`,
        `printf '%s\\n' '${envCaptureEnd(name)}'`,
      ].join("; ")
    })
    .join("; ")
}

function extractValue(output: string, name: string): string | undefined {
  const startMarker = envCaptureStart(name)
  const endMarker = envCaptureEnd(name)
  const startIdx = output.indexOf(startMarker)
  if (startIdx === -1) return undefined

  const valueStart = startIdx + startMarker.length
  const endIdx = output.indexOf(endMarker, valueStart)
  if (endIdx === -1) return undefined

  let value = output.slice(valueStart, endIdx)
  if (value.startsWith("\n")) value = value.slice(1)
  if (value.endsWith("\n")) value = value.slice(0, -1)

  return value.length > 0 ? value : undefined
}

export function readEnvironmentFromLoginShell(
  shell: string,
  names: ReadonlyArray<string>,
  execFile: ExecFileSyncLike = execFileSync,
): Partial<Record<string, string>> {
  if (names.length === 0) return {}

  const output = execFile(shell, ["-ilc", buildCaptureCommand(names)], {
    encoding: "utf8",
    timeout: 5000,
  })

  const environment: Partial<Record<string, string>> = {}
  for (const name of names) {
    const value = extractValue(output, name)
    if (value !== undefined) {
      environment[name] = value
    }
  }

  return environment
}

/**
 * On macOS, Electron apps launched from Finder/Dock inherit a minimal launchd
 * PATH (/usr/bin:/bin:/usr/sbin:/sbin). Most users configure PATH in ~/.zshrc
 * which is only sourced by interactive shells. This resolves the full
 * interactive login shell PATH and applies it to process.env so the sidecar
 * and all child processes see the user's installed tools.
 */
export function syncShellPath(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  readEnvironment: typeof readEnvironmentFromLoginShell = readEnvironmentFromLoginShell,
): PathSync | null {
  if (platform !== "darwin") return null

  const shell = resolveShell(env, platform)
  const result = readEnvironment(shell, ["PATH"])
  if (!result.PATH) {
    return { shell, entries: 0, updated: false }
  }

  env.PATH = result.PATH
  return {
    shell,
    entries: result.PATH.split(":").length,
    updated: true,
  }
}
