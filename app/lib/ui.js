"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "🏠 홈" },
  { href: "/profile", label: "1. 프로필" },
  { href: "/philosophy", label: "2. 보육철학" },
  { href: "/program", label: "3. 프로그램" },
  { href: "/post", label: "4. 게시글" },
];

export function TopNav() {
  const path = usePathname();
  return (
    <nav className="stagenav">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={"stagenav-link" + (path === n.href ? " active" : "")}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}{hint && <span className="hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

export function NextStepBox({ href, label }) {
  return <Link href={href} className="next-step">{label}</Link>;
}

export function Loading({ text }) {
  return <div className="card"><div className="loading"><div className="spinner" />{text}</div></div>;
}

export function ResultBlock({ title, text, showCount }) {
  const [done, setDone] = useState(false);
  const len = (text || "").replace(/\s/g, "").length;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setDone(true); setTimeout(() => setDone(false), 1600);
    } catch {}
  }
  return (
    <div className="result-block">
      <div className="rtitle">
        <b>{title}</b>
        <button className={"copy-btn" + (done ? " done" : "")} onClick={copy}>{done ? "복사됨 ✓" : "복사"}</button>
      </div>
      <div className="result-text">{text}</div>
      {showCount && <div className="count" style={{ marginTop: 6 }}>공백 제외 {len}자</div>}
    </div>
  );
}

function CopyLine({ label, text }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text || ""); setDone(true); setTimeout(() => setDone(false), 1500); } catch {}
  }
  return (
    <div className="copy-line">
      <div className="copy-line-head">
        <span className="copy-line-label">{label}</span>
        <button className={"copy-btn" + (done ? " done" : "")} onClick={copy}>{done ? "복사됨 ✓" : "복사"}</button>
      </div>
      <div className="copy-line-text">{text}</div>
    </div>
  );
}

// 완성된 글(게시글/프로그램)로 이미지 게시글(카드뉴스) 페이지별 프롬프트 만들기
export function CardNewsMaker({ source, centerName, kind }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function make() {
    if (!source || !source.trim()) { setError("먼저 위에서 글을 완성해 주세요."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/cardnews", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, centerName, kind }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "작성 실패");
      setData(d);
    } catch (e) {
      setError(e.message || "카드뉴스 프롬프트 작성 중 문제가 생겼어요.");
    } finally { setLoading(false); }
  }

  return (
    <div className="cardnews">
      <h3 className="blk-title">📱 이미지 게시글(카드뉴스) 만들기</h3>
      <p className="desc">위 내용을 여러 장의 이미지로 만들 수 있게, 장(페이지)별로 나눠 드려요. 각 장의 문구와 이미지 프롬프트를 복사해 쓰세요.</p>

      {!data && (
        <button className="btn primary" onClick={make} disabled={loading}>
          {loading ? "장별로 나누는 중…" : "🖼️ 페이지별로 나눠서 이미지 프롬프트 만들기"}
        </button>
      )}
      {error && <div className="err">{error}</div>}

      {data && (
        <>
          <div className="cardnews-help">
            💡 사용법: 각 장의 <b>이미지 프롬프트</b>를 AI 이미지 도구(예: 챗지피티 이미지, 캔바 등)에 붙여 그림을 만들고,
            그 위에 <b>슬라이드 문구</b>를 얹으면 이미지 게시글 한 장이 완성돼요. 장 순서대로 여러 장을 올리면 됩니다.
          </div>
          {(data.pages || []).map((p, i) => (
            <div key={i} className="cardnews-page">
              <div className="cardnews-page-head">
                <span className="cardnews-page-no">{p.page || i + 1}장</span>
                {p.label && <span className="cardnews-page-label">{p.label}</span>}
              </div>
              <CopyLine label="슬라이드 문구" text={p.text} />
              <CopyLine label="이미지 프롬프트" text={p.imagePrompt} />
            </div>
          ))}
          {data.tip && <div className="tag-good" style={{ marginTop: 4 }}>💡 {data.tip}</div>}
          <button className="btn gray" style={{ marginTop: 12 }} onClick={make} disabled={loading}>
            {loading ? "다시 나누는 중…" : "다시 만들기"}
          </button>
        </>
      )}
    </div>
  );
}
