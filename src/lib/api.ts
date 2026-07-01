/**
 * Client-side API helper
 * Replaces Supabase SDK calls with fetch to our own API routes
 */

export async function apiGet<T = any>(path: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error || `Request failed (${res.status})` };
    }
    const body = await res.json();
    return { data: body.data ?? body, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Network error" };
  }
}

export async function apiPost<T = any>(path: string, body: any): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: json.error || `Request failed (${res.status})` };
    }
    return { data: json.data ?? json, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Network error" };
  }
}

export async function apiPut<T = any>(path: string, body: any): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: json.error || `Request failed (${res.status})` };
    }
    return { data: json.data ?? json, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Network error" };
  }
}

export async function apiDelete(path: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(path, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: json.error || `Request failed (${res.status})` };
    }
    return { error: null };
  } catch (e: any) {
    return { error: e.message || "Network error" };
  }
}
