export const queryKeyJsonReplacer = (_key, value) => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return
  }
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}
export const stringifyToJsonValue = (input) => {
  try {
    const json = JSON.stringify(input, queryKeyJsonReplacer)
    if (json === undefined) {
      return
    }
    return JSON.parse(json)
  } catch {
    return
  }
}
const isPlainObject = (value) => {
  if (value === null || typeof value !== "object") {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
const serializeSearchParams = (params) => {
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const result = {}
  for (const [key, value] of entries) {
    const existing = result[key]
    if (existing === undefined) {
      result[key] = value
      continue
    }
    if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      result[key] = [existing, value]
    }
  }
  return result
}
export const serializeQueryKeyValue = (value) => {
  if (value === null) {
    return null
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return
  }
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (Array.isArray(value)) {
    return stringifyToJsonValue(value)
  }
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return serializeSearchParams(value)
  }
  if (isPlainObject(value)) {
    return stringifyToJsonValue(value)
  }
  return
}
