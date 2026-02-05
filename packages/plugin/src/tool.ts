import { z } from "zod"
import type { FilePart } from "@opencoder-ai/sdk"

export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  model?: { providerID: string; modelID: string }
  /**
   * Current project directory for this session.
   * Prefer this over process.cwd() when resolving relative paths.
   */
  directory: string
  /**
   * Project worktree root for this session.
   * Useful for generating stable relative paths (e.g. path.relative(worktree, absPath)).
   */
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Promise<void>
}

type AskInput = {
  permission: string
  patterns: string[]
  always: string[]
  metadata: { [key: string]: any }
}

/**
 * Structured result for plugin tools.
 *
 * Return this instead of a plain string to provide rich metadata
 * that integrates with streaming updates.
 */
export interface ToolResult {
  /** Title displayed in the UI */
  title: string
  /** Arbitrary metadata passed to tool.execute.after hooks */
  metadata: Record<string, unknown>
  /** The text output returned to the model */
  output: string
  /** Optional file attachments to include with the result */
  attachments?: FilePart[]
}

export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string | ToolResult>
}) {
  return input
}
tool.schema = z

export type ToolDefinition = ReturnType<typeof tool>
