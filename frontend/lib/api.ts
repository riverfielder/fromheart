const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

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