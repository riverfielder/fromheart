// Use current origin by default (empty string), enabling reverse proxying
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export async function askQuestion(question: string, deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, device_hash: deviceHash }),
  });
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getHistory(deviceHash: string) {
  const res = await fetch(`${API_BASE}/api/history?device_hash=${deviceHash}`);
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getDivination(id: number) {
  const res = await fetch(`${API_BASE}/api/divination/${id}`);
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}

export async function getDailyPoem() {
  const res = await fetch(`${API_BASE}/api/poem`);
  if (!res.ok) {
    throw new Error("request failed");
  }
  return res.json();
}
