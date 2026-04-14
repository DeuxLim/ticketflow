export function selectorCoverageHint(loadedCount: number, totalCount?: number | null, itemLabel = 'items'): string | null {
  if (typeof totalCount !== 'number' || totalCount <= loadedCount) {
    return null;
  }

  return `Showing first ${loadedCount} of ${totalCount} ${itemLabel}.`;
}
