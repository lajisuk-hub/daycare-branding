// 보육철학 인터뷰 답변 → 원훈·핵심가치·교육목표·보육철학 선언문 생성
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

const SYSTEM = `당신은 어린이집 원장님과 인터뷰한 내용을 바탕으로 그 어린이집의 보육철학을 정리해 주는 전문가입니다.
따뜻하면서도 품위 있는 존댓말로, 부모와 교사가 읽고 신뢰가 생기도록 씁니다.

좋은 보육철학의 결은 다음과 같습니다(참고 — 실제 좋은 어린이집들의 결):
- 아이답게 놀고, 아이답게 자라는 곳. 아이의 마음과 저마다의 속도를 존중함
- 아이를 존중받아야 할 온전한 존재로 바라보고, 발달을 기다려 줌
- 놀이 속에서 스스로 자라도록 도움
- 교사는 가르치기보다 곁에서 함께하고 기다려 주는 사람
- 부모와 교사가 함께 아이를 키움(공동육아의 마음)
위 결은 참고일 뿐, 반드시 원장님의 인터뷰 내용에서 나온 이 어린이집만의 색으로 씁니다.

작성 원칙:
- 반드시 원장님이 주신 인터뷰 내용(사실과 마음)만 사용합니다. 없는 시설·경력을 지어내지 않습니다.
- 원장님 답이 짧아도, 그 진심을 존중하며 자연스러운 문장으로 풀어 씁니다.
- 큰따옴표(")는 절대 사용하지 않습니다.
- 추상적 미사여구 나열이 아니라, 이 어린이집만의 구체적인 색이 느껴지게 씁니다.

반드시 아래 JSON 하나만 출력합니다. 다른 말은 쓰지 않습니다.
{
  "wonHun": "원훈(어린이집의 슬로건). 짧고 마음에 남는 한 문장",
  "coreValues": [
    { "name": "핵심가치 이름(2~5자)", "desc": "그 가치를 우리 원이 어떻게 실천하는지 한 문장" }
  ],
  "goals": ["교육목표 3~4개. 아이가 이렇게 자라기를 바란다는 형태의 한 문장씩"],
  "declaration": "보육철학 선언문. 3~4개 문단, 부모와 교사에게 보여줄 진심 어린 글. 아동관→놀이·배움→교사의 역할→부모와의 동행 흐름이 자연스럽게 녹아들게.",
  "shortPhilosophy": "이 어린이집 보육철학을 한 문장으로 압축(다른 자료에 재사용할 용도)"
}
coreValues는 3개를 기본으로 합니다.`;

export async function POST(req) {
  try {
    const a = await req.json();
    if (!process.env.ANTHROPIC_API_KEY) return json({ error: '서버에 AI 열쇠(ANTHROPIC_API_KEY)가 설정되지 않았습니다.' }, 500);

    const info = [
      `어린이집 이름/지역: ${a.centerName || '(미입력)'}`,
      `다니는 연령: ${a.ageRange || '(미입력)'}`,
      `어린이집을 시작한 마음 / 아이들이 어떤 사람으로 자라길 바라는지: ${a.origin || '(미입력)'}`,
      `아이를 어떤 존재로 바라보는지(아동관): ${a.childView || '(미입력)'}`,
      `놀이와 배움에 대한 생각: ${a.playView || '(미입력)'}`,
      `교사의 역할에 대한 생각: ${a.teacherRole || '(미입력)'}`,
      `부모와 어떤 관계이고 싶은지: ${a.parentRelation || '(미입력)'}`,
      `가장 소중히 여기는 가치: ${(a.values || []).join(', ') || '(미입력)'}`,
      `꼭 담고 싶은 한마디: ${a.extra || '(미입력)'}`,
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
        max_tokens: 2500,
        thinking: { type: 'disabled' },
        system: SYSTEM,
        messages: [{ role: 'user', content: `다음 인터뷰 내용으로 우리 어린이집 보육철학을 정리해 주세요.\n\n${info}` }],
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
