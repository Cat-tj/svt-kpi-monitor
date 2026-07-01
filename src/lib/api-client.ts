/**
 * Client-side API helper for fetching data from our own API routes.
 * Replaces Supabase client calls.
 */

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error || `Request failed (${res.status})` };
    }

    const body = await res.json();
    return { data: body.data ?? body, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}

export async function apiPost<T = any>(
  path: string,
  body: any
): Promise<{ data: T | null; error: string | null }> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut<T = any>(
  path: string,
  body: any
): Promise<{ data: T | null; error: string | null }> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(
  path: string
): Promise<{ error: string | null }> {
  const { error } = await apiFetch(path, { method: "DELETE" });
  return { error };
}
