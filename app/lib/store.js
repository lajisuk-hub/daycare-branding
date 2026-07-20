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

// 각 단계에서 적은 답변·결과를 그 단계 이름으로 통째로 저장/복원
const STEP_PREFIX = "dcb_step_";
const STEP_NAMES = ["profile", "philosophy", "program", "post"];

export function loadStep(name) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STEP_PREFIX + name) || "null");
  } catch {
    return null;
  }
}

export function saveStep(name, data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STEP_PREFIX + name, JSON.stringify(data));
  } catch {}
}

// 저장된(직접 적은) 내용이 조금이라도 있는지 — 홈에서 "이어서 하기/비우기" 노출 판단용
const CONTENT_FIELDS = {
  profile: ["centerName", "philosophy", "heartMessage", "ratio", "location", "contact"],
  philosophy: ["centerName", "origin", "childView", "playView", "teacherRole", "parentRelation", "extra"],
  program: ["centerName", "programNames", "programWhy", "frequency", "extra"],
  post: ["centerName", "philosophy", "topicFree", "cta"],
};

export function hasAnyContent() {
  if (typeof window === "undefined") return false;
  const p = loadProfile();
  if ((p.centerName || "").trim() || (p.wonHun || "").trim()) return true;
  return STEP_NAMES.some((n) => {
    const s = loadStep(n);
    if (!s) return false;
    if (s.result) return true;
    const form = s.form || {};
    const hasText = (CONTENT_FIELDS[n] || []).some((k) => (form[k] || "").toString().trim().length > 0);
    const hasChips =
      (Array.isArray(form.values) && form.values.length > 0) ||
      (Array.isArray(form.features) && form.features.length > 0);
    return hasText || hasChips;
  });
}

// 다른 어린이집으로 새로 시작할 때: 저장된 모든 내용 비우기
export function clearAll() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    STEP_NAMES.forEach((n) => localStorage.removeItem(STEP_PREFIX + n));
  } catch {}
}
