"use client";

// 단계 사이에 정보를 이어주는 저장소 (브라우저 localStorage)
// 로그인/서버 없이도 1→2→3단계 답이 자연스럽게 이어지게 함
const KEY = "dcb_profile_v1";

export function loadProfile() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProfile(patch) {
  const cur = loadProfile();
  const next = { ...cur, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}
