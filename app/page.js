"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile } from "./lib/store";

const STAGES = [
  {
    href: "/profile",
    no: "1단계",
    emoji: "📷",
    title: "인스타 프로필 소개글 만들기",
    desc: "우리 원의 '얼굴'. 지금 프로필을 진단하고, 마음이 담긴 소개글을 만들어요.",
  },
  {
    href: "/philosophy",
    no: "2단계",
    emoji: "🌱",
    title: "우리 원 보육철학 세우기",
    desc: "인터뷰에 답하다 보면 원훈·교육목표·보육철학 선언문이 완성돼요.",
  },
  {
    href: "/program",
    no: "3단계",
    emoji: "🎨",
    title: "우리 원 특색 프로그램 소개",
    desc: "숲놀이·오감놀이처럼 자랑하는 활동을 부모·홍보용 소개글로 만들어요.",
  },
];

export default function Home() {
  const [name, setName] = useState("");
  useEffect(() => {
    const p = loadProfile();
    if (p.centerName) setName(p.centerName);
  }, []);

  return (
    <div className="wrap">
      <div className="header">
        <h1>🌿 어린이집 브랜딩 구축하기</h1>
        <p>우리 어린이집만의 이야기를, 세 단계로 차근차근 세워 드려요.</p>
      </div>

      {name && (
        <div className="card" style={{ padding: "14px 18px", textAlign: "center" }}>
          지금 <b>{name}</b> 브랜딩을 만들고 있어요. 이어서 아래 단계를 진행하세요 🙂
        </div>
      )}

      <div className="stage-list">
        {STAGES.map((s) => (
          <Link key={s.href} href={s.href} className="stage-card">
            <div className="stage-emoji">{s.emoji}</div>
            <div className="stage-body">
              <div className="stage-no">{s.no}</div>
              <div className="stage-title">{s.title}</div>
              <div className="stage-desc">{s.desc}</div>
            </div>
            <div className="stage-arrow">→</div>
          </Link>
        ))}
      </div>

      <div className="footnote">
        앞 단계에서 적은 어린이집 이름·보육철학은 다음 단계에 자동으로 이어져요.<br />
        순서대로 1 → 2 → 3단계로 진행하시면 가장 잘 어울리는 브랜딩이 됩니다 🌷
      </div>
    </div>
  );
}
