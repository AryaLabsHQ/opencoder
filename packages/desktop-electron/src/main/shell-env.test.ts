import { describe, expect, test } from "bun:test"

import { buildUnixShellCommand, readEnvironmentFromLoginShell, resolveShell, syncShellPath } from "./shell-env"

describe("resolveShell", () => {
  test("uses SHELL when present", () => {
    expect(resolveShell({ SHELL: "/opt/homebrew/bin/fish" }, "darwin")).toBe("/opt/homebrew/bin/fish")
  })

  test("defaults to zsh on macOS", () => {
    expect(resolveShell({}, "darwin")).toBe("/bin/zsh")
  })

  test("defaults to sh on non-macOS unix", () => {
    expect(resolveShell({}, "linux")).toBe("/bin/sh")
  })
})

describe("readEnvironmentFromLoginShell", () => {
  test("extracts values between markers", () => {
    const execFile = () => "__OPENCODE_ENV_PATH_START__\n/a:/b\n__OPENCODE_ENV_PATH_END__\n"
    expect(readEnvironmentFromLoginShell("/bin/zsh", ["PATH"], execFile)).toEqual({ PATH: "/a:/b" })
  })

  test("ignores shell startup noise around markers", () => {
    const execFile = () =>
      ["hello", "__OPENCODE_ENV_PATH_START__", "/a:/b", "__OPENCODE_ENV_PATH_END__", "bye"].join("\n")

    expect(readEnvironmentFromLoginShell("/bin/zsh", ["PATH"], execFile)).toEqual({ PATH: "/a:/b" })
  })

  test("omits missing or empty values", () => {
    const execFile = () =>
      [
        "__OPENCODE_ENV_PATH_START__",
        "/a:/b",
        "__OPENCODE_ENV_PATH_END__",
        "__OPENCODE_ENV_SSH_AUTH_SOCK_START__",
        "__OPENCODE_ENV_SSH_AUTH_SOCK_END__",
      ].join("\n")

    expect(readEnvironmentFromLoginShell("/bin/zsh", ["PATH", "SSH_AUTH_SOCK"], execFile)).toEqual({
      PATH: "/a:/b",
    })
  })

  test("rejects invalid env names", () => {
    expect(() => readEnvironmentFromLoginShell("/bin/zsh", ["PATH-NAME"], () => "")).toThrow(
      "Unsupported environment variable name: PATH-NAME",
    )
  })
})

describe("syncShellPath", () => {
  test("updates PATH on macOS", () => {
    const env: NodeJS.ProcessEnv = { SHELL: "/bin/zsh", PATH: "/usr/bin" }
    const readEnvironment = () => ({ PATH: "/opt/homebrew/bin:/usr/bin" })

    expect(syncShellPath(env, "darwin", readEnvironment)).toEqual({
      shell: "/bin/zsh",
      entries: 2,
      updated: true,
    })
    expect(env.PATH).toBe("/opt/homebrew/bin:/usr/bin")
  })

  test("does nothing outside macOS", () => {
    const env: NodeJS.ProcessEnv = { SHELL: "/bin/zsh", PATH: "/usr/bin" }
    const readEnvironment = () => ({ PATH: "/opt/homebrew/bin:/usr/bin" })

    expect(syncShellPath(env, "linux", readEnvironment)).toBeNull()
    expect(env.PATH).toBe("/usr/bin")
  })

  test("leaves PATH unchanged when the shell omits it", () => {
    const env: NodeJS.ProcessEnv = { SHELL: "/bin/zsh", PATH: "/usr/bin" }
    const readEnvironment = () => ({})

    expect(syncShellPath(env, "darwin", readEnvironment)).toEqual({
      shell: "/bin/zsh",
      entries: 0,
      updated: false,
    })
    expect(env.PATH).toBe("/usr/bin")
  })
})

describe("buildUnixShellCommand", () => {
  test("uses a login shell command on unix", () => {
    expect(buildUnixShellCommand("serve --port 1", "/tmp/opencode-cli", "/bin/zsh")).toEqual({
      cmd: "/bin/zsh",
      cmdArgs: ["-l", "-c", "\"/tmp/opencode-cli\" serve --port 1"],
    })
  })

  test("uses nushell escaping when needed", () => {
    expect(buildUnixShellCommand("serve --port 1", "/tmp/opencode-cli", "/opt/homebrew/bin/nu")).toEqual({
      cmd: "/opt/homebrew/bin/nu",
      cmdArgs: ["-l", "-c", "^\"/tmp/opencode-cli\" serve --port 1"],
    })
  })
})
