// 인터뷰 답변 → 어린이집 인스타 프로필 소개글(짧은 버전 + 긴 버전) 생성
// 필요한 환경변수: ANTHROPIC_API_KEY

export const maxDuration = 60;

function parseAiJson(raw) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI 응답에서 결과를 찾지 못했습니다');
  const text = m[0];
  try { return JSON.parse(text); } catch (e) { /* 보정 후 재시도 */ }
  return JSON.parse(repairAiJson(text));
}
function repairAiJson(s) {
  let out = ''; let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!inStr) { if (c === '"') inStr = true; out += c; continue; }
    if (c === '\\') { out += c + (s[i + 1] || ''); i++; continue; }
    if (c === '\n') { out += '\\n'; continue; }
    if (c === '\r') { out += '\\r'; continue; }
    if (c === '\t') { out += '\\t'; continue; }
    if (c === '"') {
      let j = i + 1; while (j < s.length && /\s/.test(s[j])) j++;
      const n = s[j];
      if (n === ',' || n === '}' || n === ']' || n === ':' || j >= s.length) { inStr = false; out += c; }
      else out += '\\"';
      continue;
    }
    out += c;
  }
  return out;
}

const SYSTEM = `당신은 어린이집 인스타그램 프로필(소개글)을 써 주는 따뜻한 브랜딩 카피라이터입니다.

아래는 실제로 잘 쓰인 어린이집 프로필의 본보기입니다. 이 톤과 형식을 참고하세요.
- 강북구 한올어린이집 | 아이의 지금을 존중합니다 / | 놀이 속에서 배우고, 기다림 속에서 자랍니다 / | 영유아의 발달과 속도를 이해하는 보육 / | 작은 공간, 깊은 경험
- 꿈샘어린이집 | 아이답게 놀고, 아이답게 자라는 곳 / 🍼낮은 교사 대 아동 비율의 소수 케어 / 🌱자연놀이·건강한 먹거리 / ♡기다려주는 선생님 / 🧡부모와 교사가 함께 키웁니다
- 소리나는어린이집 | 🌳매일 나들이 숲놀이 / 🍎유기농 제철 먹거리 / ▪️교사대 아동비율 1:3
- 키즈별어린이집 | 🧸작은 별들의 반짝이는 하루 / ❤️아이 마음을 먼저 이해하는 보육 / 🔲놀이로 배우고 사랑으로 자라요

작성 원칙:
- 반드시 사용자가 준 정보(사실)만 사용합니다. 없는 시설·경력·수치를 지어내지 않습니다.
- 맨 처음에는 그 어린이집의 교육관이 느껴지는, 마음을 울리는 한 문장(캐치프레이즈)을 놓습니다.
- 핵심 특징은 이모지 불릿(한 줄에 하나)으로 정리합니다. 이모지는 내용에 어울리게 자연스럽게 고릅니다.
- 따뜻하고 진심이 느껴지되 과장·미사여구 남발은 피합니다.
- 큰따옴표(")는 절대 사용하지 않습니다.
- 연령·위치·연락처 정보가 있으면 아래쪽에 자연스럽게 넣습니다.

두 가지 버전을 만듭니다:
- shortBio: 인스타그램 프로필 소개칸용. 공백 포함 150자 이내로 아주 압축. 이름줄 캐치프레이즈 + 이모지 불릿 3~4개 정도.
- longBio: 게시물이나 소개 페이지용. 캐치프레이즈 + 이모지 불릿 5~7개 + 연령/위치/연락처. 한올어린이집처럼 교육관이 잘 드러나게 조금 더 풍성하게.

반드시 아래 JSON 하나만 출력합니다. 다른 말은 쓰지 않습니다.
{
  "shortBio": "짧은 버전 (줄바꿈 포함)",
  "longBio": "긴 버전 (줄바꿈 포함)",
  "tip": "이 어린이집이 프로필에서 더 강조하면 좋을 한 가지 조언을 한 문장으로"
}`;

export async function POST(req) {
  try {
    const a = await req.json();
    if (!process.env.ANTHROPIC_API_KEY) return json({ error: '서버에 AI 열쇠(ANTHROPIC_API_KEY)가 설정되지 않았습니다.' }, 500);

    const info = [
      `어린이집 이름/지역: ${a.centerName || '(미입력)'}`,
      `다니는 연령: ${a.ageRange || '(미입력)'}`,
      `가장 소중히 여기는 교육관/철학: ${a.philosophy || '(미입력)'}`,
      `아이·부모에게 전하고 싶은 마음 한마디: ${a.heartMessage || '(미입력)'}`,
      `자랑거리·특징: ${(a.features || []).join(', ') || '(미입력)'}`,
      `교사 대 아동 비율: ${a.ratio || '(미입력)'}`,
      `모집 상황: ${a.recruiting || '(미입력)'}`,
      `위치: ${a.location || '(미입력)'}`,
      `연락처·상담 링크: ${a.contact || '(미입력)'}`,
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        thinking: { type: 'disabled' },
        system: SYSTEM,
        messages: [{ role: 'user', content: `다음 정보로 어린이집 프로필 소개글을 만들어 주세요.\n\n${info}` }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ error: 'AI 작성 요청이 실패했습니다.', detail: t.slice(0, 400) }, 502);
    }
    const data = await res.json();
    const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const parsed = parseAiJson(raw);
    return json(parsed);
  } catch (e) {
    return json({ error: '작성 중 문제가 생겼습니다: ' + (e.message || '알 수 없는 오류') }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
