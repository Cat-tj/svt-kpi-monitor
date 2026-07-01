/**
 * Legacy file — server operations now use /lib/db directly.
 * Kept for import compatibility.
 */
export function createServerSupabaseClient() {
  // Return a minimal compat object for auth callback
  return {
    auth: {
      async exchangeCodeForSession(_code: string) {
        return { error: null };
      },
    },
  };
}
