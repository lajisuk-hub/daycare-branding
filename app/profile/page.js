"use client";

import { useEffect, useState, useRef } from "react";
import { loadProfile, saveProfile } from "../lib/store";
import { TopNav, Field, NextStepBox, ResultBlock } from "../lib/ui";

const FEATURE_OPTIONS = [
  "낮은 교사 대 아동 비율(소수정예)",
  "자연·숲놀이·매일 나들이",
  "건강한 먹거리(유기농·제철)",
  "놀이 중심 배움",
  "기다려주는 선생님",
  "전공·경력 있는 교사",
  "부모와 함께 키움",
  "안전한 환경",
  "감성·정서 놀이",
];

const RECRUIT_OPTIONS = ["신입원아 모집 중", "입소 대기 등록 가능", "해당 없음 / 미입력"];

const EMPTY = {
  centerName: "", ageRange: "", philosophy: "", heartMessage: "",
  features: [], ratio: "", recruiting: "", location: "", contact: "",
};

export default function ProfilePage() {
  const [step, setStep] = useState("upload"); // upload | questions | result
  const [preview, setPreview] = useState("");
  const [imgData, setImgData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // 앞 단계에서 이어진 정보 미리 채우기
  useEffect(() => {
    const p = loadProfile();
    setForm((f) => ({
      ...f,
      centerName: p.centerName || f.centerName,
      ageRange: p.ageRange || f.ageRange,
      philosophy: p.philosophy || p.shortPhilosophy || f.philosophy,
      location: p.location || f.location,
      contact: p.contact || f.contact,
      features: Array.isArray(p.features) ? p.features : f.features,
    }));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function toggleFeature(f) {
    setForm((s) => ({
      ...s,
      features: s.features.includes(f) ? s.features.filter((x) => x !== f) : [...s.features, f],
    }));
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("사진 파일만 올릴 수 있어요."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setImgData({ base64: String(dataUrl).split(",")[1], mediaType: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imgData) return;
    setLoading("사진을 읽고 있어요…"); setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: imgData.base64, mediaType: imgData.mediaType }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "분석 실패");
      setAnalysis(data);
      const p = data.prefill || {};
      setForm((f) => ({
        ...f,
        centerName: p.centerName || f.centerName,
        ageRange: p.ageRange || f.ageRange,
        location: p.location || f.location,
        contact: p.contact || f.contact,
        features: mergeFeatures(f.features, p.features || []),
      }));
      setStep("questions");
    } catch (e) {
      setError(e.message || "분석 중 문제가 생겼어요.");
    } finally { setLoading(""); }
  }

  function skipUpload() { setAnalysis(null); setStep("questions"); setError(""); }

  async function generate() {
    if (!form.centerName.trim() && !form.philosophy.trim()) {
      setError("어린이집 이름과 소중히 여기는 교육관 정도는 적어 주셔야 좋은 글이 나와요.");
      return;
    }
    setLoading("우리 어린이집만의 소개글을 쓰고 있어요…"); setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "작성 실패");
      setResult(data);
      // 다음 단계로 정보 이어주기
      saveProfile({
        centerName: form.centerName, ageRange: form.ageRange, philosophy: form.philosophy,
        features: form.features, location: form.location, contact: form.contact,
      });
      setStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "작성 중 문제가 생겼어요.");
    } finally { setLoading(""); }
  }

  function restart() {
    setStep("upload"); setPreview(""); setImgData(null); setAnalysis(null);
    setResult(null); setError("");
  }

  return (
    <div className="wrap">
      <TopNav />
      <div className="header">
        <h1>📷 1단계 · 인스타 프로필 소개글</h1>
        <p>우리 어린이집의 마음이 담긴 프로필 소개글을 만들어 드려요.</p>
      </div>

      <div className="steps">
        <span className={"step-dot" + (step === "upload" ? " active" : "")}>1. 캡쳐 올리기</span>
        <span className={"step-dot" + (step === "questions" ? " active" : "")}>2. 질문에 답하기</span>
        <span className={"step-dot" + (step === "result" ? " active" : "")}>3. 소개글 받기</span>
      </div>

      {loading && <div className="card"><div className="loading"><div className="spinner" />{loading}</div></div>}

      {!loading && step === "upload" && (
        <div className="card">
          <h2 className="sec">지금 쓰고 계신 프로필을 보여 주세요</h2>
          <p className="desc">인스타그램 프로필 화면을 캡쳐해서 올려 주시면, 어떤 점이 잘 되어 있고 무엇을 더하면 좋을지 먼저 짚어 드릴게요.</p>
          <div className="drop" onClick={() => fileRef.current?.click()}>
            <div className="big">📷</div>
            <div className="t">여기를 눌러 캡쳐 사진 올리기</div>
            <div className="s">휴대폰·컴퓨터에 저장한 프로필 화면 사진</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          {preview && <img className="preview-img" src={preview} alt="올린 프로필 미리보기" />}
          <div className="btn-row">
            <button className="btn ghost" onClick={skipUpload}>사진 없이 시작</button>
            <button className="btn primary" disabled={!imgData} onClick={analyze}>이 프로필 분석하기</button>
          </div>
          {error && <div className="err">{error}</div>}
        </div>
      )}

      {!loading && step === "questions" && (
        <>
          {analysis && (
            <div className="card analysis-box">
              <h2 className="sec">지금 프로필 진단 결과</h2>
              {analysis.goodPoints?.length > 0 && (
                <>
                  <h3>이미 잘 하고 계신 점</h3>
                  {analysis.goodPoints.map((g, i) => <span key={i} className="tag-good">{g}</span>)}
                </>
              )}
              {analysis.missingPoints?.length > 0 && (
                <>
                  <h3>이 부분을 더하면 더 좋아요</h3>
                  {analysis.missingPoints.map((m, i) => <span key={i} className="tag-miss">{m}</span>)}
                </>
              )}
              <p className="desc" style={{ marginTop: 14, marginBottom: 0 }}>아래 질문에 답해 주시면, 부족한 부분까지 채워 소개글을 만들어 드릴게요. (아는 것은 미리 채워 뒀어요.)</p>
            </div>
          )}

          <div className="card">
            <h2 className="sec">우리 어린이집 이야기를 들려주세요</h2>
            <p className="desc">빈칸은 비워 두셔도 괜찮아요. 아는 만큼만 적어 주세요.</p>

            <Field label="어린이집 이름 + 지역">
              <input type="text" value={form.centerName} onChange={(e) => set("centerName", e.target.value)} placeholder="예) 강북구 한올어린이집" />
            </Field>
            <Field label="다니는 연령" hint="몇 세부터 몇 세까지">
              <input type="text" value={form.ageRange} onChange={(e) => set("ageRange", e.target.value)} placeholder="예) 만 0세 ~ 만 2세 / 3세~7세 통합" />
            </Field>
            <Field label="가장 소중히 여기는 교육관·철학" hint="운영하며 제일 중요한 것">
              <textarea value={form.philosophy} onChange={(e) => set("philosophy", e.target.value)} placeholder="예) 아이의 지금 이 순간과 저마다의 속도를 존중하며, 놀이 속에서 스스로 자라도록 기다려 줍니다." />
            </Field>
            <Field label="아이·부모에게 전하고 싶은 마음 한마디" hint="마음을 울리는 문장">
              <textarea value={form.heartMessage} onChange={(e) => set("heartMessage", e.target.value)} placeholder="예) 오늘 하루도 아이답게, 마음껏 자라나기를 바랍니다." />
            </Field>
            <Field label="우리 어린이집의 자랑거리·특징" hint="해당되는 것을 눌러 주세요">
              <div className="chips">
                {FEATURE_OPTIONS.map((f) => (
                  <span key={f} className={"chip" + (form.features.includes(f) ? " on" : "")} onClick={() => toggleFeature(f)}>{f}</span>
                ))}
              </div>
            </Field>
            <Field label="교사 대 아동 비율" hint="소수정예라면">
              <input type="text" value={form.ratio} onChange={(e) => set("ratio", e.target.value)} placeholder="예) 1:3" />
            </Field>
            <Field label="지금 모집 상황">
              <select value={form.recruiting} onChange={(e) => set("recruiting", e.target.value)}>
                <option value="">선택 안 함</option>
                {RECRUIT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="위치" hint="동네나 주소">
              <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="예) 강북구 번동 삼성아파트 관리동" />
            </Field>
            <Field label="연락처·상담 링크">
              <input type="text" value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="예) 010-0000-0000 / 카톡오픈채팅 링크" />
            </Field>

            <button className="btn primary" onClick={generate}>✍️ 소개글 만들기</button>
            <div className="btn-row"><button className="btn gray" onClick={restart}>처음으로</button></div>
            {error && <div className="err">{error}</div>}
          </div>
        </>
      )}

      {!loading && step === "result" && result && (
        <>
          <div className="card">
            <h2 className="sec">완성됐어요! 마음에 드는 걸 복사해서 프로필에 붙여넣으세요</h2>
            <p className="desc">인스타 프로필 소개칸에는 짧은 버전을, 소개 게시물에는 긴 버전을 추천해요.</p>
            <ResultBlock title="① 짧은 버전 (프로필 소개칸용 · 150자 이내)" text={result.shortBio} showCount />
            <ResultBlock title="② 긴 버전 (소개 게시물·페이지용)" text={result.longBio} />
            {result.tip && <div className="tag-good" style={{ marginTop: 6 }}>💡 브랜딩 팁: {result.tip}</div>}
          </div>
          <div className="card">
            <div className="btn-row">
              <button className="btn ghost" onClick={() => setStep("questions")}>답변 고치기</button>
              <button className="btn primary" onClick={generate}>다시 만들기</button>
            </div>
            <NextStepBox href="/philosophy" label="2단계 · 보육철학 세우기로 이어가기 →" />
          </div>
        </>
      )}

      <div className="footnote">우리 어린이집의 진짜 이야기를 담을수록 더 좋은 소개글이 나와요 🌿</div>
    </div>
  );
}

function mergeFeatures(current, incoming) {
  const merged = [...current];
  (incoming || []).forEach((kw) => {
    const hit = FEATURE_OPTIONS.find((opt) => opt.includes(kw) || kw.includes(opt.slice(0, 2)));
    if (hit && !merged.includes(hit)) merged.push(hit);
  });
  return merged;
}
