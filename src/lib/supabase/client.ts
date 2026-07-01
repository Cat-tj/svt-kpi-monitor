/**
 * Supabase Client Compatibility Layer
 * Mimics Supabase JS client but calls our MySQL-backed API routes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

async function apiQuery(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/data/query?${qs}`);
  const body = await res.json();
  if (!res.ok) return { data: null, error: { message: body.error || "Query failed" } };
  return { data: body.data || [], error: null };
}

async function apiMutate(payload: any) {
  const res = await fetch("/api/data/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) return { data: null, error: { message: body.error || "Operation failed" } };
  return { data: body.data ?? null, error: null };
}

class QueryBuilder {
  private _table: string;
  private _select: string = "*";
  private _filters: any[] = [];
  private _order: any = null;
  private _limit: number | null = null;
  private _single = false;
  private _action: "select" | "insert" | "update" | "delete" = "select";
  private _payload: any = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns: string = "*"): this {
    this._select = columns;
    this._action = "select";
    return this;
  }

  insert(data: any): this {
    this._action = "insert";
    this._payload = data;
    return this;
  }

  update(data: any): this {
    this._action = "update";
    this._payload = data;
    return this;
  }

  delete(): this {
    this._action = "delete";
    return this;
  }

  eq(column: string, value: any): this {
    this._filters.push({ type: "eq", col: column, val: value });
    return this;
  }

  neq(column: string, value: any): this {
    this._filters.push({ type: "neq", col: column, val: value });
    return this;
  }

  gte(column: string, value: any): this {
    this._filters.push({ type: "gte", col: column, val: value });
    return this;
  }

  lte(column: string, value: any): this {
    this._filters.push({ type: "lte", col: column, val: value });
    return this;
  }

  not(column: string, operator: string, value: any): this {
    this._filters.push({ type: "not_" + operator, col: column, val: value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this._order = { col: column, asc: options?.ascending ?? true };
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  single(): this {
    this._single = true;
    this._limit = 1;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason?: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (e) {
      if (reject) reject(e);
    }
  }

  private async _execute(): Promise<any> {
    switch (this._action) {
      case "select": {
        const params: Record<string, string> = { table: this._table, select: this._select };
        if (this._filters.length) params.filters = JSON.stringify(this._filters);
        if (this._order) params.order = JSON.stringify(this._order);
        if (this._limit) params.limit = String(this._limit);
        if (this._single) params.single = "1";

        const result = await apiQuery(params);
        if (this._single) {
          return { data: result.data?.[0] || null, error: result.error };
        }
        return result;
      }
      case "insert": {
        return apiMutate({ action: "insert", table: this._table, data: this._payload });
      }
      case "update": {
        return apiMutate({ action: "update", table: this._table, data: this._payload, filters: this._filters });
      }
      case "delete": {
        return apiMutate({ action: "delete", table: this._table, filters: this._filters });
      }
    }
  }
}

class FakeAuth {
  async getUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return { data: { user: null } };
      const body = await res.json();
      return { data: { user: body.user ? { id: body.user.id, email: body.user.email } : null } };
    } catch {
      return { data: { user: null } };
    }
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      return { error: { message: body.error || "Login failed" } };
    }
    return { error: null };
  }

  async signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
  }

  async resetPasswordForEmail(_email: string, _opts?: any) {
    return { error: { message: "Password reset is handled by admin. Contact IT." } };
  }

  async updateUser(_data: any) {
    return { error: { message: "Use profile page to update your info." } };
  }

  async exchangeCodeForSession(_url: string) {
    return { error: null };
  }
}

class FakeStorageBucket {
  async upload(_path: string, _file: any, _opts?: any) {
    return { error: { message: "File upload coming soon" } };
  }
  getPublicUrl(path: string) {
    return { data: { publicUrl: `/uploads/${path}` } };
  }
}

class FakeStorage {
  from(_bucket: string) {
    return new FakeStorageBucket();
  }
}

class SupabaseCompatClient {
  auth = new FakeAuth();
  storage = new FakeStorage();

  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }
}

export function createClient(): any {
  return new SupabaseCompatClient();
}
