/**
 * Host authentification
 * @param username host user name
 * @param invId the initation id
 * @returns 
 */
export function hostEmailFrom(username: string, invId: string) {
  const clean = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return `${clean(username)}__${clean(invId)}@hosts.viva`;
}