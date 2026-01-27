// Use current origin by default (empty string), enabling reverse proxying
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

let token: string | null = null;

if (typeof window !== "undefined") {
  token = localStorage.getItem("token");
}

export function setAuthToken(t: string | null) {
  token = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }
}

function getHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function register(username: string, password: string) {
    const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const error = await res.json(); 
        throw new Error(error.error || "Register failed");
    }
    return res.json();
}

export async function login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        throw new Error("Invalid credentials");
    }
    return res.json();
}

export async function getMe() {
    const res = await fetch(`${API_BASE}/api/me`, { headers: getHeaders() }); 
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
}

export async function askQuestion(question: string, deviceHash: string, secret?: string) {
  const res = await fetch(`${API_BASE}/api/question`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ question, device_hash: deviceHash, secret }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("daily_limit_reached");
    }
    throw new Error("request failed");
  }
  return res.json();
}

export async function getHistory(deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/history?device_hash=${deviceHash}`, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getDivination(id: number) {
  const res = await fetch(`${API_BASE}/api/divination/${id}`, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getDailyPoem() {
  const res = await fetch(`${API_BASE}/api/poem`, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getUsage(deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/usage?device_hash=${deviceHash}`, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getBlessing() {
  const res = await fetch(`${API_BASE}/api/blessing`);
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getAdminQuestions(secret: string) {
  const res = await fetch(`${API_BASE}/api/admin/questions`, {
    headers: {
      "X-Admin-Secret": secret,
    }
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

export async function getAllQuestions(adminSecret: string) {
    const res = await fetch(`${API_BASE}/api/admin/questions`,{
      headers: {
        ...getHeaders(),
        "X-Admin-Secret": adminSecret
      }
    });

    if (!res.ok) throw new Error("Failed to fetch questions");
    return res.json();
}

export interface ChatMessage {
  role: string;
  content: string;
}

export async function chat(id: number, message: string, history: ChatMessage[]) {
  const res = await fetch(`${API_BASE}/api/divination/${id}/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    throw new Error("Chat request failed");
  }
  return res.json();
}
