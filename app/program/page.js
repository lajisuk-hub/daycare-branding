"use client";

import { useEffect, useState } from "react";
import { loadProfile, saveProfile } from "../lib/store";
import { TopNav, Field, Loading, ResultBlock, NextStepBox } from "../lib/ui";

const EMPTY = {
  centerName: "", philosophy: "", wonHun: "",
  programNames: "", programWhy: "", frequency: "", extra: "",
};

export default function ProgramPage() {
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [carried, setCarried] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setForm((f) => ({
      ...f,
      centerName: p.centerName || f.centerName,
      philosophy: p.philosophy || f.philosophy,
      wonHun: p.wonHun || f.wonHun,
    }));
    if (p.philosophy || p.wonHun) setCarried(true);
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function generate() {
    if (!form.programNames.trim()) {
      setError("자랑하는 활동(프로그램) 이름을 한 가지라도 적어 주세요.");
      return;
    }
    setLoading("우리 원 프로그램을 매력적인 소개글로 엮고 있어요…"); setError("");
    try {
      const res = await fetch("/api/program", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "작성 실패");
      setResult(data);
      // 4단계 게시글에서 쓰도록 프로그램 내용 저장
      const programsText = [
        data.introText,
        ...(data.programs || []).map((p) => `- ${p.name}: ${p.oneLiner}. ${p.description}`),
      ].filter(Boolean).join("\n");
      saveProfile({ centerName: form.centerName, programsText, programNames: form.programNames });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "작성 중 문제가 생겼어요.");
    } finally { setLoading(""); }
  }

  return (
    <div className="wrap">
      <TopNav />
      <div className="header">
        <h1>🎨 3단계 · 우리 원 특색 프로그램 소개</h1>
        <p>자랑하는 활동을 부모·홍보용 소개글로 만들어 드려요.</p>
      </div>

      {loading && <Loading text={loading} />}

      {!loading && result && (
        <>
          <div className="card">
            <h2 className="sec">🎉 {form.centerName || "우리 어린이집"} 프로그램 소개가 완성됐어요</h2>

            {result.programs?.length > 0 && (
              <div className="prog-grid">
                {result.programs.map((p, i) => (
                  <div key={i} className="prog-item">
                    <div className="prog-top"><span className="prog-emoji">{p.emoji}</span><b>{p.name}</b></div>
                    <div className="prog-one">{p.oneLiner}</div>
                    <div className="prog-desc">{p.description}</div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="blk-title">게시물용 짧은 소개</h3>
            <ResultBlock title="복사해서 인스타 게시물 첫머리에 쓰세요" text={result.shortIntro} />

            <h3 className="blk-title">전체 소개글</h3>
            <ResultBlock title="복사해서 소개 게시물·안내문·홈페이지에 쓰세요" text={result.introText} />
          </div>

          <div className="card">
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setResult(null)}>답변 고치기</button>
              <button className="btn primary" onClick={generate}>다시 만들기</button>
            </div>
            <NextStepBox href="/post?src=program" label="✍️ 이 프로그램으로 인스타 게시글 만들기 →" />
            <div className="done-box">
              🌷 홈에서 언제든 각 단계를 다시 열어 다듬을 수 있어요.
            </div>
          </div>
        </>
      )}

      {!loading && !result && (
        <div className="card">
          <h2 className="sec">우리 원이 자랑하는 활동을 들려주세요</h2>
          <p className="desc">숲놀이, 오감놀이, 텃밭 가꾸기처럼 우리 원만의 특별한 활동을 편하게 적어 주세요.</p>

          {carried && (
            <div className="tag-good" style={{ marginBottom: 16 }}>
              앞 단계 보육철학을 이어받았어요. 프로그램 소개에 자연스럽게 녹여 드릴게요.
            </div>
          )}

          <Field label="어린이집 이름 + 지역">
            <input type="text" value={form.centerName} onChange={(e) => set("centerName", e.target.value)} placeholder="예) 강북구 한올어린이집" />
          </Field>
          <Field label="자랑하는 특색 활동·프로그램" hint="여러 개면 쉼표로 나눠 주세요">
            <textarea value={form.programNames} onChange={(e) => set("programNames", e.target.value)} placeholder="예) 매일 숲 나들이, 오감 놀이, 텃밭 가꾸기, 그림책 놀이" />
          </Field>
          <Field label="각 활동을 왜 하나요 / 아이에게 어떤 점이 좋은가요" hint="한 번에 편하게">
            <textarea value={form.programWhy} onChange={(e) => set("programWhy", e.target.value)} placeholder="예) 숲에서 오감을 마음껏 쓰며 몸과 마음이 튼튼해지고, 텃밭에서 기다림과 생명의 소중함을 배웁니다." />
          </Field>
          <Field label="진행 빈도나 방식" hint="선택">
            <input type="text" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} placeholder="예) 매일 오전 / 주 2회 / 계절마다" />
          </Field>
          <Field label="꼭 강조하고 싶은 점" hint="선택">
            <textarea value={form.extra} onChange={(e) => set("extra", e.target.value)} placeholder="예) 모든 활동은 아이의 속도에 맞춰 강요 없이 이루어집니다." />
          </Field>

          <button className="btn primary" onClick={generate}>🎨 프로그램 소개글 만들기</button>
          {error && <div className="err">{error}</div>}
        </div>
      )}

      <div className="footnote">우리 원만의 진짜 활동을 담을수록 부모님의 마음에 더 가닿아요 🌿</div>
    </div>
  );
}
