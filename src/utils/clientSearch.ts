export function clientMatchesNameQuery(fullName: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) {
    return true
  }
  return fullName.toLowerCase().includes(q)
}
