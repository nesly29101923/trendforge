async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const getJSON = <T>(url: string) => fetch(url, { cache: "no-store" }).then((r) => parse<T>(r));

export const postJSON = <T>(url: string, body?: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => parse<T>(r));

export const uploadFile = (url: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(url, { method: "POST", body: form }).then((r) => parse<{ url: string }>(r));
};

/** sessionStorage wrapper that never throws (private mode, blocked storage). */
export const session = {
  get<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
