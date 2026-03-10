import { client } from "./client.gen.js"
import { buildClientParams } from "./client/index.js"

class HeyApiClient {
  client
  constructor(args) {
    this.client = args?.client ?? client
  }
}

class HeyApiRegistry {
  defaultKey = "default"
  instances = new Map()
  get(key) {
    const instance = this.instances.get(key ?? this.defaultKey)
    if (!instance) {
      throw new Error(`No SDK client found. Create one with "new OpencodeClient()" to fix this error.`)
    }
    return instance
  }
  set(value, key) {
    this.instances.set(key ?? this.defaultKey, value)
  }
}

export class Config extends HeyApiClient {
  get(options) {
    return (options?.client ?? this.client).get({ url: "/global/config", ...options })
  }
  update(parameters, options) {
    const params = buildClientParams([parameters], [{ args: [{ key: "config", map: "body" }] }])
    return (options?.client ?? this.client).patch({
      url: "/global/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Global extends HeyApiClient {
  health(options) {
    return (options?.client ?? this.client).get({ url: "/global/health", ...options })
  }
  event(options) {
    return (options?.client ?? this.client).sse.get({ url: "/global/event", ...options })
  }
  dispose(options) {
    return (options?.client ?? this.client).post({ url: "/global/dispose", ...options })
  }
  _config
  get config() {
    return (this._config ??= new Config({ client: this.client }))
  }
}

export class Auth extends HeyApiClient {
  remove(parameters, options) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "providerID" }] }])
    return (options?.client ?? this.client).delete({
      url: "/auth/{providerID}",
      ...options,
      ...params,
    })
  }
  set(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { key: "auth", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put({
      url: "/auth/{providerID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Project extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/project",
      ...options,
      ...params,
    })
  }
  current(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/project/current",
      ...options,
      ...params,
    })
  }
  initGit(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/project/git/init",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "icon" },
            { in: "body", key: "commands" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch({
      url: "/project/{projectID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Pty extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/pty",
      ...options,
      ...params,
    })
  }
  create(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
            { in: "body", key: "args" },
            { in: "body", key: "cwd" },
            { in: "body", key: "title" },
            { in: "body", key: "env" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/pty",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  remove(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }
  get(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "size" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  connect(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/pty/{ptyID}/connect",
      ...options,
      ...params,
    })
  }
}

export class Config2 extends HeyApiClient {
  get(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/config",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "config", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch({
      url: "/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  providers(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/config/providers",
      ...options,
      ...params,
    })
  }
}

export class Tool extends HeyApiClient {
  ids(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/tool/ids",
      ...options,
      ...params,
    })
  }
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "provider" },
            { in: "query", key: "model" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/tool",
      ...options,
      ...params,
    })
  }
}

export class Workspace extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/workspace",
      ...options,
      ...params,
    })
  }
  create(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "id" },
            { in: "body", key: "type" },
            { in: "body", key: "branch" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/experimental/workspace",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  remove(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "id" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/experimental/workspace/{id}",
      ...options,
      ...params,
    })
  }
}

export class Session extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "cursor" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
            { in: "query", key: "archived" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/session",
      ...options,
      ...params,
    })
  }
}

export class Resource extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/resource",
      ...options,
      ...params,
    })
  }
}

export class Experimental extends HeyApiClient {
  _workspace
  get workspace() {
    return (this._workspace ??= new Workspace({ client: this.client }))
  }
  _session
  get session() {
    return (this._session ??= new Session({ client: this.client }))
  }
  _resource
  get resource() {
    return (this._resource ??= new Resource({ client: this.client }))
  }
}

export class Worktree extends HeyApiClient {
  remove(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeRemoveInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/experimental/worktree",
      ...options,
      ...params,
    })
  }
  create(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeCreateInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  reset(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeResetInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/experimental/worktree/reset",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Todo extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}/todo",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "todos" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put({
      url: "/session/{sessionID}/todo",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Session2 extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session",
      ...options,
      ...params,
    })
  }
  create(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "parentID" },
            { in: "body", key: "title" },
            { in: "body", key: "permission" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  status(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/status",
      ...options,
      ...params,
    })
  }
  delete(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }
  get(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "time" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch({
      url: "/session/{sessionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  children(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}/children",
      ...options,
      ...params,
    })
  }
  init(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "modelID" },
            { in: "body", key: "providerID" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/init",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  fork(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/fork",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  abort(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/abort",
      ...options,
      ...params,
    })
  }
  unshare(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }
  share(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }
  diff(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}/diff",
      ...options,
      ...params,
    })
  }
  summarize(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "providerID" },
            { in: "body", key: "modelID" },
            { in: "body", key: "auto" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/summarize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  messages(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
    })
  }
  prompt(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  deleteMessage(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }
  message(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }
  promptAsync(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/prompt_async",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  command(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "arguments" },
            { in: "body", key: "command" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  shell(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/shell",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  revert(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "partID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/revert",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  unrevert(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/unrevert",
      ...options,
      ...params,
    })
  }
  _todo
  get todo() {
    return (this._todo ??= new Todo({ client: this.client }))
  }
}

export class Part extends HeyApiClient {
  delete(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
    })
  }
  update(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "part", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Permission extends HeyApiClient {
  respond(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "permissionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "response" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/session/{sessionID}/permissions/{permissionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  reply(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "reply" },
            { in: "body", key: "message" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/permission/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/permission",
      ...options,
      ...params,
    })
  }
}

export class Question extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/question",
      ...options,
      ...params,
    })
  }
  reply(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "answers" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/question/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  reject(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/question/{requestID}/reject",
      ...options,
      ...params,
    })
  }
}

export class Oauth extends HeyApiClient {
  authorize(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/provider/{providerID}/oauth/authorize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  callback(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/provider/{providerID}/oauth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Provider extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/provider",
      ...options,
      ...params,
    })
  }
  auth(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/provider/auth",
      ...options,
      ...params,
    })
  }
  _oauth
  get oauth() {
    return (this._oauth ??= new Oauth({ client: this.client }))
  }
}

export class Find extends HeyApiClient {
  text(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "pattern" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/find",
      ...options,
      ...params,
    })
  }
  files(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
            { in: "query", key: "dirs" },
            { in: "query", key: "type" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/find/file",
      ...options,
      ...params,
    })
  }
  symbols(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/find/symbol",
      ...options,
      ...params,
    })
  }
}

export class File extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/file",
      ...options,
      ...params,
    })
  }
  read(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/file/content",
      ...options,
      ...params,
    })
  }
  status(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/file/status",
      ...options,
      ...params,
    })
  }
}

export class Auth2 extends HeyApiClient {
  remove(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }
  start(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }
  callback(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp/{name}/auth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  authenticate(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp/{name}/auth/authenticate",
      ...options,
      ...params,
    })
  }
}

export class Mcp extends HeyApiClient {
  status(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/mcp",
      ...options,
      ...params,
    })
  }
  add(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "config" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  connect(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp/{name}/connect",
      ...options,
      ...params,
    })
  }
  disconnect(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/mcp/{name}/disconnect",
      ...options,
      ...params,
    })
  }
  _auth
  get auth() {
    return (this._auth ??= new Auth2({ client: this.client }))
  }
}

export class Control extends HeyApiClient {
  next(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/tui/control/next",
      ...options,
      ...params,
    })
  }
  response(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/control/response",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Tui extends HeyApiClient {
  appendPrompt(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "text" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/append-prompt",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  openHelp(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/open-help",
      ...options,
      ...params,
    })
  }
  openSessions(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/open-sessions",
      ...options,
      ...params,
    })
  }
  openThemes(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/open-themes",
      ...options,
      ...params,
    })
  }
  openModels(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/open-models",
      ...options,
      ...params,
    })
  }
  submitPrompt(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/submit-prompt",
      ...options,
      ...params,
    })
  }
  clearPrompt(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/clear-prompt",
      ...options,
      ...params,
    })
  }
  executeCommand(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/execute-command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  showToast(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "message" },
            { in: "body", key: "variant" },
            { in: "body", key: "duration" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/show-toast",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  publish(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/publish",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  selectSession(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "sessionID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/tui/select-session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  _control
  get control() {
    return (this._control ??= new Control({ client: this.client }))
  }
}

export class Instance extends HeyApiClient {
  dispose(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/instance/dispose",
      ...options,
      ...params,
    })
  }
}

export class Path extends HeyApiClient {
  get(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/path",
      ...options,
      ...params,
    })
  }
}

export class Vcs extends HeyApiClient {
  get(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/vcs",
      ...options,
      ...params,
    })
  }
}

export class Command extends HeyApiClient {
  list(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/command",
      ...options,
      ...params,
    })
  }
}

export class App extends HeyApiClient {
  log(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "service" },
            { in: "body", key: "level" },
            { in: "body", key: "message" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post({
      url: "/log",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
  agents(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/agent",
      ...options,
      ...params,
    })
  }
  skills(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/skill",
      ...options,
      ...params,
    })
  }
}

export class Lsp extends HeyApiClient {
  status(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/lsp",
      ...options,
      ...params,
    })
  }
}

export class Formatter extends HeyApiClient {
  status(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get({
      url: "/formatter",
      ...options,
      ...params,
    })
  }
}

export class Event extends HeyApiClient {
  subscribe(parameters, options) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).sse.get({
      url: "/event",
      ...options,
      ...params,
    })
  }
}

export class OpencodeClient extends HeyApiClient {
  static __registry = new HeyApiRegistry()
  constructor(args) {
    super(args)
    OpencodeClient.__registry.set(this, args?.key)
  }
  _global
  get global() {
    return (this._global ??= new Global({ client: this.client }))
  }
  _auth
  get auth() {
    return (this._auth ??= new Auth({ client: this.client }))
  }
  _project
  get project() {
    return (this._project ??= new Project({ client: this.client }))
  }
  _pty
  get pty() {
    return (this._pty ??= new Pty({ client: this.client }))
  }
  _config
  get config() {
    return (this._config ??= new Config2({ client: this.client }))
  }
  _tool
  get tool() {
    return (this._tool ??= new Tool({ client: this.client }))
  }
  _experimental
  get experimental() {
    return (this._experimental ??= new Experimental({ client: this.client }))
  }
  _worktree
  get worktree() {
    return (this._worktree ??= new Worktree({ client: this.client }))
  }
  _session
  get session() {
    return (this._session ??= new Session2({ client: this.client }))
  }
  _part
  get part() {
    return (this._part ??= new Part({ client: this.client }))
  }
  _permission
  get permission() {
    return (this._permission ??= new Permission({ client: this.client }))
  }
  _question
  get question() {
    return (this._question ??= new Question({ client: this.client }))
  }
  _provider
  get provider() {
    return (this._provider ??= new Provider({ client: this.client }))
  }
  _find
  get find() {
    return (this._find ??= new Find({ client: this.client }))
  }
  _file
  get file() {
    return (this._file ??= new File({ client: this.client }))
  }
  _mcp
  get mcp() {
    return (this._mcp ??= new Mcp({ client: this.client }))
  }
  _tui
  get tui() {
    return (this._tui ??= new Tui({ client: this.client }))
  }
  _instance
  get instance() {
    return (this._instance ??= new Instance({ client: this.client }))
  }
  _path
  get path() {
    return (this._path ??= new Path({ client: this.client }))
  }
  _vcs
  get vcs() {
    return (this._vcs ??= new Vcs({ client: this.client }))
  }
  _command
  get command() {
    return (this._command ??= new Command({ client: this.client }))
  }
  _app
  get app() {
    return (this._app ??= new App({ client: this.client }))
  }
  _lsp
  get lsp() {
    return (this._lsp ??= new Lsp({ client: this.client }))
  }
  _formatter
  get formatter() {
    return (this._formatter ??= new Formatter({ client: this.client }))
  }
  _event
  get event() {
    return (this._event ??= new Event({ client: this.client }))
  }
}
