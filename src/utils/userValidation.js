export function isValidUser (data) {
  if (!data) return false
  if (!data.username || typeof data.username !== 'string') return false
  if (!data.email || typeof data.email !== 'string') return false
  if (!data.password || typeof data.password !== 'string') return false
  if (!data.fullName || typeof data.fullName !== 'string') return false
  return true
}
