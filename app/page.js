"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile } from "./lib/store";

export default function Home() {
  const [profile, setProfile] = useState({});
  useEffect(() => { setProfile(loadProfile()); }, []);
  const started = !!(profile.centerName || profile.wonHun);

  return (
    <div className="wrap">
      <div className="header">
        <h1>🌿 어린이집 브랜딩 구축하기</h1>
        <p>순서대로 어린이집 브랜딩을 구축해요.</p>
      </div>

      <div className="lead-line">
        먼저 <b>1단계</b>부터 시작해요 🙂
      </div>

      <Link href="/profile" className="stage-card hero-card">
        <div className="stage-emoji">📷</div>
        <div className="stage-body">
          <div className="stage-no">1단계</div>
          <div className="stage-title">인스타그램 프로필 꾸미기!</div>
          <div className="stage-desc">우리 원의 '얼굴'. 지금 프로필을 진단하고, 마음이 담긴 소개글을 만들어요.</div>
        </div>
        <div className="stage-arrow">→</div>
      </Link>

      {started && profile.centerName && (
        <div className="card" style={{ padding: "14px 18px", textAlign: "center" }}>
          지금 <b>{profile.centerName}</b> 브랜딩을 만들고 있어요 🌱
        </div>
      )}

      <div className="footnote">
        프로필을 완성하면 <b>2단계 보육철학</b>, <b>3단계 특색 프로그램</b>으로 자연스럽게 이어져요.<br />
        한 단계씩 차근차근 하시면 가장 잘 어울리는 브랜딩이 됩니다 🌷
      </div>

      {started && (
        <div className="continue-row">
          <span>이미 시작하셨다면 이어서 하기</span>
          <div className="continue-links">
            <Link href="/philosophy">🌱 2단계 보육철학</Link>
            <Link href="/program">🎨 3단계 프로그램</Link>
            <Link href="/post">✍️ 4단계 게시글 쓰기</Link>
          </div>
        </div>
      )}
    </div>
  );
}
