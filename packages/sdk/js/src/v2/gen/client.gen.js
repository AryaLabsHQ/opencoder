import { createClient, createConfig } from "./client/index.js"
export const client = createClient(createConfig({ baseUrl: "http://localhost:4096" }))
