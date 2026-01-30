// Use current origin by default (empty string), enabling reverse proxying
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// Deprecated: Token is now handled via HttpOnly cookies
// Keeping this for backward compatibility during migration if needed, but it does nothing now.
export function setAuthToken(t: string | null) {
  // No-op
}

function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
  return match ? match[2] : null;
}

function getHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = getCsrfToken();
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }
  return headers;
}

// Common fetch options for credentialed requests
const fetchOptions: RequestInit = {
    credentials: "include", // This is crucial for sending/receiving Cookies
};

export async function register(username: string, password: string) {
    const res = await fetch(`${API_BASE}/api/register`, {
        ...fetchOptions,
        method: "POST",
        headers: getHeaders(), // CSRF token might be needed if we set it on initial load
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
        ...fetchOptions,
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        throw new Error("Invalid credentials");
    }
    return res.json();
}

export async function logout() {
    await fetch(`${API_BASE}/api/logout`, {
        ...fetchOptions,
        method: "POST",
        headers: getHeaders(),
    });
}

export async function getMe() {
    const res = await fetch(`${API_BASE}/api/me`, { ...fetchOptions, headers: getHeaders() }); 
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    return data.user;
}

type Divination = {
  ID: number;
  BenGua: string;
  BianGua: string;
  CreatedAt: string;
};

export type HistoryItem = {
    id: number;
    type: 'divination' | 'love';
    title: string;
    date: string; // ISO
    summary: string;
}

export async function askQuestion(question: string, deviceHash: string, secret?: string) {
  const res = await fetch(`${API_BASE}/api/question`, {
    ...fetchOptions,
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

export async function getHistory(deviceHash: string): Promise<{ items: HistoryItem[] }> {
  const res = await fetch(`${API_BASE}/api/history?device_hash=${deviceHash}`, { ...fetchOptions, headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getLoveDetail(id: number, deviceHash: string) {
    const res = await fetch(`${API_BASE}/api/love/${id}?device_hash=${deviceHash}`, { ...fetchOptions, headers: getHeaders() });
    if (!res.ok) throw new Error("Fetch failed");
    return res.json(); 
}

export async function chatLove(id: number, message: string, history: {role: string, content: string}[]) {
    const res = await fetch(`${API_BASE}/api/love/${id}/chat`, {
        ...fetchOptions,
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message, history })
    });
    if (!res.ok) throw new Error("Chat failed");
    return res.json();
}

export async function chatLoveStream(
    id: number, 
    message: string, 
    history: {role: string, content: string}[],
    onChunk: (text: string) => void
) {
    const res = await fetch(`${API_BASE}/api/love/${id}/chat/stream`, {
        ...fetchOptions,
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message, history })
    });

    if (!res.ok) throw new Error("Chat failed");
    if (!res.body) throw new Error("No body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") return;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        onChunk(parsed.content);
                    }
                } catch (e) {
                    // ignore
                }
            }
        }
    }
}

export async function getDivination(id: number, deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/divination/${id}?device_hash=${deviceHash}`, { ...fetchOptions, headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getDailyPoem() {
  const res = await fetch(`${API_BASE}/api/poem`, { ...fetchOptions, headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getUsage(deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/usage?device_hash=${deviceHash}`, { ...fetchOptions, headers: getHeaders() });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getBlessing() {
  const res = await fetch(`${API_BASE}/api/blessing`, { ...fetchOptions });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getAdminQuestions(secret: string) {
  const res = await fetch(`${API_BASE}/api/admin/questions`, {
    ...fetchOptions,
    headers: {
      "X-Admin-Secret": secret,
      ...getHeaders() // Add CSRF if needed for Get (usually not, but consistency)
    }
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

export async function getAllQuestions(adminSecret: string) {
    const res = await fetch(`${API_BASE}/api/admin/questions`,{
      ...fetchOptions,
      headers: {
        ...getHeaders(),
        "X-Admin-Secret": adminSecret
      }
    });

    if (!res.ok) throw new Error("Failed to fetch questions");
    return res.json();
}

export async function getAllLoveProbes(adminSecret: string) {
  const res = await fetch(`${API_BASE}/api/admin/love`, {
    ...fetchOptions,
    headers: {
      ...getHeaders(),
      "X-Admin-Secret": adminSecret
    }
  });
  if (!res.ok) throw new Error("Failed to fetch love probes");
  return res.json();
}

export interface ChatMessage {
  role: string;
  content: string;
}

export async function chat(id: number, message: string, history: ChatMessage[]) {
  const res = await fetch(`${API_BASE}/api/divination/${id}/chat`, {
    ...fetchOptions,
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    throw new Error("Chat request failed");
  }
  return res.json();
}

export async function updateProfile(data: {
  birth_date?: string;
  gender?: string;
  mbti?: string;
  zodiac?: string;
}) {
  const res = await fetch(`${API_BASE}/api/me`, {
    ...fetchOptions,
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export interface Wish {
  id: number;
  content: string;
  type: string;
  blessing_count: number;
  created_at: string;
}

export async function getWishes() {
  const res = await fetch(`${API_BASE}/api/wishes`, { 
    ...fetchOptions, 
    headers: getHeaders(),
    cache: "no-store" // Ensure fresh data
  });
  if (!res.ok) throw new Error("Failed to fetch wishes");
  return res.json() as Promise<Wish[]>;
}

export async function createWish(content: string, type: string, deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/wishes`, {
    ...fetchOptions,
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ content, type, device_hash: deviceHash }),
  });
  if (!res.ok) throw new Error("Failed to create wish");
  return res.json();
}

export async function blessWish(id: number) {
  const res = await fetch(`${API_BASE}/api/wishes/${id}/bless`, {
    ...fetchOptions,
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to bless wish");
}

export interface LoveProbeRequest {
  device_hash: string;
  name_a: string;
  gender_a: string;
  birth_date_a: string; // YYYY-MM-DD HH:mm
  name_b: string;
  gender_b: string;
  birth_date_b: string;
  story: string;
}

export interface LoveProbeResponse {
  id: number;
  analysis: {
    score: number;
    keyword: string;
    bazi_analysis: string;
    hexagram_analysis: string;
    story_interpretation: string;
    advice: string[];
    poem: string;
  };
  hexagram: string;
}

export async function submitLoveProbe(req: Omit<LoveProbeRequest, 'device_hash'> & { deviceHash: string }) {
    const { deviceHash, ...rest } = req;
    const res = await fetch(`${API_BASE}/api/love`, {
      ...fetchOptions,
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ device_hash: deviceHash, ...rest }),
    });
    if (!res.ok) {
        throw new Error("Failed to submit love probe");
    }
    return res.json() as Promise<LoveProbeResponse>;
}
