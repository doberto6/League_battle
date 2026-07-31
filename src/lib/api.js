const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  health() {
    return request("/api/health");
  },
  listMatches() {
    return request("/api/matches");
  },
  saveMatch(payload) {
    return request("/api/matches", { method: "POST", body: JSON.stringify(payload) });
  },
  clearMatches() {
    return request("/api/matches", { method: "DELETE" });
  },
  listSprites() {
    return request("/api/sprites");
  },
  saveSprite(championId, dataUri) {
    return request(`/api/sprites/${championId}`, { method: "PUT", body: JSON.stringify({ dataUri }) });
  },
  deleteSprite(championId) {
    return request(`/api/sprites/${championId}`, { method: "DELETE" });
  },
};
