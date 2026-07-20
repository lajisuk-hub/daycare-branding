"use client";

import Link from "next/link";
import { useState } from "react";

export function TopNav() {
  return (
    <div className="topnav"><Link href="/" className="home-link">← 홈으로</Link></div>
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
