export type EnsureAgentRunRequest = {
  projectId: string
  harness: string
  harnessSessionId: string
  agentHandle: string
  status: string
}

export type EnsureAgentRunResponse = {
  runId: string
}

export type ListInboxRequest = {
  projectId: string
  runId: string
  limit?: number
}

export type GetMailInboxResponse = Array<{
  id: string
  updatedAt: string
  lastReadAt?: string | null
  subject?: string | null
  createdByRun: {
    agent: {
      handle: string
    }
  }
}>

export type ListMessagesRequest = {
  threadId: string
  limit?: number
}

export type GetMailThreadsByThreadIdMessagesResponse = Array<{
  id: string
  createdAt: string
  subject?: string | null
  body?: string | null
  priority?: number | null
  senderRun: {
    agent: {
      handle: string
    }
  }
}>

type ClientConfig = {
  apiKey: string
  organizationId: string
  baseUrl?: string
}

const request = <T>(config: ClientConfig, path: string, body: unknown) => {
  const base = (config.baseUrl ?? "").replace(/\/+$/, "")
  const url = base ? `${base}${path}` : path

  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
      "x-organization-id": config.organizationId,
    },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`agni request failed: ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`)
    }
    return res.json() as Promise<T>
  })
}

export const createAgentClient = (config: ClientConfig) => {
  return {
    agentRuns: {
      ensure: (body: EnsureAgentRunRequest) => request<EnsureAgentRunResponse>(config, "/agentRuns/ensure", body),
    },
    mail: {
      inbox: {
        list: (body: ListInboxRequest) => request<GetMailInboxResponse>(config, "/mail/inbox/list", body),
      },
      messages: {
        list: (body: ListMessagesRequest) =>
          request<GetMailThreadsByThreadIdMessagesResponse>(config, "/mail/messages/list", body),
      },
    },
  }
}
