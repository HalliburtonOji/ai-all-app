/**
 * Portfolio username derivation. Phase 4a keeps the schema lean: no
 * `username` column on auth.users — instead, the URL `/p/[username]`
 * is resolved at render time by sanitising every user's email prefix
 * the same way and matching.
 *
 * Rules:
 *   - take the part before "@"
 *   - lowercase
 *   - drop everything outside [a-z0-9_]
 *
 * Examples:
 *   "John.Doe+work@x.com"  -> "johndoework"
 *   "mary_smith@x.com"     -> "mary_smith"
 *   "halli@aiallapp.test"  -> "halli"
 */
export function deriveUsername(email: string): string {
  const at = email.indexOf("@");
  const prefix = at === -1 ? email : email.slice(0, at);
  return prefix.toLowerCase().replace(/[^a-z0-9_]/g, "");
}
