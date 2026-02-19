import type { Event } from "@opencoder-ai/sdk/v2/client"
import { createSimpleContext } from "@opencoder-ai/ui/context"
import { createGlobalEmitter } from "@solid-primitives/event-bus"
import { type Accessor, createEffect, createMemo, onCleanup } from "solid-js"
import { useGlobalSDK } from "./global-sdk"

type SDKEventMap = {
  [key in Event["type"]]: Extract<Event, { type: key }>
}

type GlobalSDK = ReturnType<typeof useGlobalSDK>

type SDKContext = {
  directory: string
  client: ReturnType<GlobalSDK["createClient"]>
  event: ReturnType<typeof createGlobalEmitter<SDKEventMap>>
  url: string
  createClient: (opts: Parameters<GlobalSDK["createClient"]>[0]) => ReturnType<GlobalSDK["createClient"]>
}

const ctx = createSimpleContext<SDKContext, { directory: Accessor<string> }>({
  name: "SDK",
  init: (props) => {
    const globalSDK = useGlobalSDK()

    const directory = createMemo(props.directory)
    const client = createMemo(() =>
      globalSDK.createClient({
        directory: directory(),
        throwOnError: true,
      }),
    )

    const emitter = createGlobalEmitter<SDKEventMap>()

    createEffect(() => {
      const unsub = globalSDK.event.on(directory(), (event) => {
        emitter.emit(event.type, event)
      })
      onCleanup(unsub)
    })

    return {
      get directory() {
        return directory()
      },
      get client() {
        return client()
      },
      event: emitter,
      get url() {
        return globalSDK.url
      },
      createClient(opts: Parameters<typeof globalSDK.createClient>[0]) {
        return globalSDK.createClient(opts)
      },
    }
  },
})

export const useSDK = ctx.use
export const SDKProvider = ctx.provider
