export function makeStamp(action, username) {
  const now  = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return `${action} ${username} ${date} ${time}`
}