import { createOpencodeClient, type OpencodeClient, type OpencodeClientConfig } from "@opencoder-ai/sdk/v2/client"
import type { ServerConnection } from "@/context/server"

type ServerSdkConfig = Omit<OpencodeClientConfig & { directory?: string }, "baseUrl"> & {
  server: ServerConnection.HttpBase
}

export function createSdkForServer({
  server,
  ...config
}: ServerSdkConfig): OpencodeClient {
  const auth = (() => {
    if (!server.password) return
    return {
      Authorization: `Basic ${btoa(`${server.username ?? "opencode"}:${server.password}`)}`,
    }
  })()

  return createOpencodeClient({
    ...config,
    headers: { ...config.headers, ...auth },
    baseUrl: server.url,
  })
}
