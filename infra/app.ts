export const domain = (() => {
  if ($app.stage === "production") return "opencode.ai"
  if ($app.stage === "dev") return "dev.opencode.ai"
  return `${$app.stage}.dev.opencode.ai`
})()

new sst.cloudflare.x.Astro("Web", {
  domain,
  path: "packages/web",
  environment: {
    VITE_API_URL: api.url,
  },
})
