"use client";

import { useEffect, useState } from "react";
import { loadProfile, saveProfile } from "../lib/store";
import { TopNav, Field, Loading, ResultBlock } from "../lib/ui";

const TOPIC_OPTIONS = [
  "우리 원 철학 소개 (입소 안내)",
  "우리 아이들의 놀이 이야기",
  "우리 원의 하루",
  "계절·자연 이야기",
  "자유 주제 (직접 입력)",
];

const LENGTH_OPTIONS = ["짧게", "보통", "길게(에세이형)"];

const EMPTY = {
  centerName: "", philosophy: "", wonHun: "",
  coop: false, topic: TOPIC_OPTIONS[0], topicFree: "",
  length: "보통", hashtags: true, cta: "",
};

export default function PostPage() {
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
      wonHun: p.wonHun || f.wonHun,
      philosophy: p.declaration || p.philosophy || p.shortPhilosophy || f.philosophy,
    }));
    if (p.declaration || p.philosophy || p.wonHun) setCarried(true);
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function generate() {
    if (!form.philosophy.trim()) {
      setError("게시글의 바탕이 될 보육철학·전하고 싶은 내용을 적어 주세요. (2단계를 먼저 하시면 자동으로 채워져요.)");
      return;
    }
    setLoading("보육철학을 담은 인스타그램 게시글을 쓰고 있어요…"); setError("");
    try {
      const topic = form.topic === "자유 주제 (직접 입력)" ? (form.topicFree || "자유 주제") : form.topic;
      const res = await fetch("/api/post", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, topic }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "작성 실패");
      setResult(data);
      saveProfile({ centerName: form.centerName });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "작성 중 문제가 생겼어요.");
    } finally { setLoading(""); }
  }

  const hashtagText = (result?.hashtags || []).join(" ");

  return (
    <div className="wrap">
      <TopNav />
      <div className="header">
        <h1>✍️ 4단계 · 인스타그램 게시글 쓰기</h1>
        <p>우리 원 보육철학을 담은, 마음을 울리는 피드 글을 만들어 드려요.</p>
      </div>

      {loading && <Loading text={loading} />}

      {!loading && result && (
        <>
          <div className="card">
            <h2 className="sec">🎉 게시글이 완성됐어요</h2>
            <p className="desc">복사해서 인스타그램 게시물에 그대로 붙여넣으세요. 사진과 함께 올리면 더 좋아요.</p>
            <ResultBlock title="게시글 본문 (복사해서 붙여넣기)" text={result.post} />
            {hashtagText && (
              <>
                <h3 className="blk-title">해시태그</h3>
                <ResultBlock title="복사해서 게시글 맨 아래에 붙이세요" text={hashtagText} />
              </>
            )}
          </div>
          <div className="card">
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setResult(null)}>내용 고치기</button>
              <button className="btn primary" onClick={generate}>다시 만들기</button>
            </div>
            <p className="desc" style={{ textAlign: "center", margin: "12px 0 0" }}>
              주제를 바꿔가며 여러 게시글을 만들어 꾸준히 올려보세요 🌿
            </p>
          </div>
        </>
      )}

      {!loading && !result && (
        <div className="card">
          <h2 className="sec">어떤 게시글을 만들까요?</h2>
          <p className="desc">2단계 보육철학을 하셨다면 아래 내용이 자동으로 채워져 있어요. 자유롭게 고쳐도 됩니다.</p>

          {carried && (
            <div className="tag-good" style={{ marginBottom: 16 }}>
              2단계 보육철학을 이어받았어요. 이 내용을 바탕으로 게시글을 씁니다.
            </div>
          )}

          <Field label="어린이집 이름 + 지역">
            <input type="text" value={form.centerName} onChange={(e) => set("centerName", e.target.value)} placeholder="예) 부산 남구 공동육아 꿈샘어린이집" />
          </Field>

          <Field label="게시글의 바탕이 될 보육철학·전하고 싶은 내용" hint="핵심">
            <textarea style={{ minHeight: 140 }} value={form.philosophy} onChange={(e) => set("philosophy", e.target.value)} placeholder="예) 아이를 빨리 가르쳐야 할 대상으로 보지 않습니다. 아이마다 속도와 방식이 다르다고 믿고, 먼저 바라보고 기다립니다. 빠른 학습보다 충분한 놀이를, 성과보다 아이의 속도를 소중히 여깁니다." />
          </Field>

          <Field label="게시글 주제">
            <select value={form.topic} onChange={(e) => set("topic", e.target.value)}>
              {TOPIC_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {form.topic === "자유 주제 (직접 입력)" && (
            <Field label="자유 주제 내용">
              <input type="text" value={form.topicFree} onChange={(e) => set("topicFree", e.target.value)} placeholder="예) 봄 텃밭에 씨앗을 심은 날 이야기" />
            </Field>
          )}

          <Field label="글 길이">
            <div className="chips">
              {LENGTH_OPTIONS.map((l) => (
                <span key={l} className={"chip" + (form.length === l ? " on" : "")} onClick={() => set("length", l)}>{l}</span>
              ))}
            </div>
          </Field>

          <Field label="추가 선택">
            <div className="chips">
              <span className={"chip" + (form.coop ? " on" : "")} onClick={() => set("coop", !form.coop)}>공동육아 어린이집</span>
              <span className={"chip" + (form.hashtags ? " on" : "")} onClick={() => set("hashtags", !form.hashtags)}>해시태그 넣기</span>
            </div>
          </Field>

          <Field label="마무리에 넣을 상담·연락 안내" hint="선택">
            <input type="text" value={form.cta} onChange={(e) => set("cta", e.target.value)} placeholder="예) 입소 상담: 프로필 링크 / 010-0000-0000" />
          </Field>

          <button className="btn primary" onClick={generate}>✍️ 게시글 만들기</button>
          {error && <div className="err">{error}</div>}
        </div>
      )}

      <div className="footnote">2단계 보육철학이 탄탄할수록 게시글이 더 깊고 진심 있게 나와요 🌿</div>
    </div>
  );
}
