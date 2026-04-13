const LAST_WORKSPACE_SLUG_KEY = 'last_workspace_slug';

export function getLastWorkspaceSlug(): string | null {
  return localStorage.getItem(LAST_WORKSPACE_SLUG_KEY);
}

export function setLastWorkspaceSlug(slug: string): void {
  localStorage.setItem(LAST_WORKSPACE_SLUG_KEY, slug);
}

export function clearLastWorkspaceSlug(): void {
  localStorage.removeItem(LAST_WORKSPACE_SLUG_KEY);
}
