import { API_BASE } from "./constants";

async function request(path, options) {
  const res = await fetch(`${API_BASE}/${path}`, options);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${path.split("?")[0]} failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return res;
}

export const apiGet = async (path, options) => (await request(path, options)).json();

export const apiPost = async (path, body) =>
  (await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })).text();
