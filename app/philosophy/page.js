"use client";

import { useEffect, useState } from "react";
import { loadProfile, saveProfile } from "../lib/store";
import { TopNav, Field, NextStepBox, Loading, ResultBlock } from "../lib/ui";

const VALUE_OPTIONS = [
  "존중", "기다림", "놀이", "자연", "안전", "정서안정",
  "자율성", "관계·소통", "건강한 먹거리", "부모와 동행", "따뜻함",
];

const EMPTY = {
  centerName: "", ageRange: "", origin: "", childView: "",
  playView: "", teacherRole: "", parentRelation: "", values: [], extra: "",
};

export default function PhilosophyPage() {
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const p = loadProfile();
    setForm((f) => ({
      ...f,
      centerName: p.centerName || f.centerName,
      ageRange: p.ageRange || f.ageRange,
    }));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleValue(v) {
    setForm((s) => ({
      ...s,
      values: s.values.includes(v) ? s.values.filter((x) => x !== v) : [...s.values, v],
    }));
  }

  async function generate() {
    if (!form.origin.trim() && !form.childView.trim() && form.values.length === 0) {
      setError("적어도 '시작한 마음'이나 '아이를 보는 시선', 소중한 가치 중 하나는 담아 주세요.");
      return;
    }
    setLoading("원장님의 마음을 보육철학으로 정리하고 있어요…"); setError("");
    try {
      const res = await fetch("/api/philosophy", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "작성 실패");
      setResult(data);
      // 다음 단계로 이어주기 (선언문 요약을 philosophy로 저장)
      saveProfile({
        centerName: form.centerName, ageRange: form.ageRange,
        philosophy: data.shortPhilosophy || form.childView || form.origin,
        wonHun: data.wonHun || "",
        values: (data.coreValues || []).map((c) => c.name),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "작성 중 문제가 생겼어요.");
    } finally { setLoading(""); }
  }

  return (
    <div className="wrap">
      <TopNav />
      <div className="header">
        <h1>🌱 2단계 · 우리 원 보육철학 세우기</h1>
        <p>인터뷰에 답하다 보면 원훈·교육목표·보육철학 선언문이 완성돼요.</p>
      </div>

      {loading && <Loading text={loading} />}

      {!loading && result && (
        <>
          <div className="card">
            <h2 className="sec">✨ {form.centerName || "우리 어린이집"} 보육철학이 완성됐어요</h2>

            <div className="philo-hero">{result.wonHun}</div>

            {result.coreValues?.length > 0 && (
              <>
                <h3 className="blk-title">핵심 가치</h3>
                <div className="value-grid">
                  {result.coreValues.map((c, i) => (
                    <div key={i} className="value-item">
                      <b>{c.name}</b>
                      <span>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.goals?.length > 0 && (
              <>
                <h3 className="blk-title">교육 목표</h3>
                <ul className="goal-list">
                  {result.goals.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </>
            )}

            <h3 className="blk-title">보육철학 선언문</h3>
            <ResultBlock title="복사해서 소개 게시물·홈페이지·가정통신문에 쓰세요" text={result.declaration} />
          </div>

          <div className="card">
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setResult(null)}>답변 고치기</button>
              <button className="btn primary" onClick={generate}>다시 만들기</button>
            </div>
            <NextStepBox href="/post" label="✍️ 이 철학으로 인스타 게시글 만들기 →" />
            <NextStepBox href="/program" label="🎨 3단계 · 특색 프로그램 소개로 이어가기 →" />
          </div>
        </>
      )}

      {!loading && !result && (
        <div className="card">
          <h2 className="sec">원장님의 마음을 들려주세요</h2>
          <p className="desc">정답은 없어요. 떠오르는 대로, 아는 만큼만 편하게 적어 주세요. 빈칸이 있어도 괜찮아요.</p>

          <Field label="어린이집 이름 + 지역">
            <input type="text" value={form.centerName} onChange={(e) => set("centerName", e.target.value)} placeholder="예) 강북구 한올어린이집" />
          </Field>
          <Field label="어린이집을 시작한 마음" hint="왜, 아이들이 어떤 사람으로 자라길 바라나요">
            <textarea value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="예) 아이들이 사랑받는 기억 속에서, 자기다움을 잃지 않고 자라기를 바라는 마음으로 시작했습니다." />
          </Field>
          <Field label="아이를 어떤 존재로 바라보나요" hint="아동관">
            <textarea value={form.childView} onChange={(e) => set("childView", e.target.value)} placeholder="예) 아이는 스스로 배우고 자라는 힘을 이미 가진 존재라고 믿습니다." />
          </Field>
          <Field label="놀이와 배움에 대한 생각">
            <textarea value={form.playView} onChange={(e) => set("playView", e.target.value)} placeholder="예) 놀이가 곧 배움이라 여겨, 아이가 몰입할 시간을 충분히 지켜 줍니다." />
          </Field>
          <Field label="교사의 역할은 무엇이라 생각하나요">
            <textarea value={form.teacherRole} onChange={(e) => set("teacherRole", e.target.value)} placeholder="예) 앞서 가르치기보다, 곁에서 기다리고 살펴 주는 사람이라 생각합니다." />
          </Field>
          <Field label="부모와 어떤 관계이고 싶은가요">
            <textarea value={form.parentRelation} onChange={(e) => set("parentRelation", e.target.value)} placeholder="예) 아이를 함께 키우는 동행자로서 마음을 나누고 싶습니다." />
          </Field>
          <Field label="가장 소중히 여기는 가치" hint="눌러서 여러 개 선택 가능">
            <div className="chips">
              {VALUE_OPTIONS.map((v) => (
                <span key={v} className={"chip" + (form.values.includes(v) ? " on" : "")} onClick={() => toggleValue(v)}>{v}</span>
              ))}
            </div>
          </Field>
          <Field label="꼭 담고 싶은 한마디" hint="선택">
            <textarea value={form.extra} onChange={(e) => set("extra", e.target.value)} placeholder="예) 오늘 하루도 아이답게, 마음껏." />
          </Field>

          <button className="btn primary" onClick={generate}>🌱 보육철학 만들기</button>
          {error && <div className="err">{error}</div>}
        </div>
      )}

      <div className="footnote">2단계에서 세운 보육철학은 1·3단계 소개글에도 자연스럽게 이어져요 🌿</div>
    </div>
  );
}
