// 서버 전용: Claude 호출 + JSON 파싱(따옴표 보정 + 파싱 실패 시 자동 재시도)
// claude-sonnet-5는 assistant 프리필을 지원하지 않으므로, 프롬프트로 JSON을 강제하고
// 혹시 형식이 어긋나면 한 번 더 요청해 안정성을 높인다.

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

// system: 시스템 프롬프트, userContent: 문자열 또는 content 배열(이미지 포함 가능)
export async function callClaudeJson({ system, userContent, maxTokens = 2000 }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('서버에 AI 열쇠(ANTHROPIC_API_KEY)가 설정되지 않았습니다.');
    err.noKey = true;
    throw err;
  }

  const baseUser = { role: 'user', content: userContent };
  const nudge = {
    role: 'user',
    content: '방금 응답이 형식에 맞지 않았습니다. 인사말·설명·코드블록 없이, 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나만 다시 출력해 주세요.',
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    // 첫 시도는 사용자 메시지만, 재시도는 형식 강조 메시지를 덧붙임
    const messages = attempt === 0 ? [baseUser] : [baseUser, { role: 'assistant', content: '알겠습니다.' }, nudge];
    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: maxTokens,
          thinking: { type: 'disabled' },
          system,
          messages,
        }),
      });
    } catch (e) {
      lastErr = new Error('AI 서버 연결에 실패했습니다.');
      continue;
    }

    if (!res.ok) {
      const t = await res.text();
      lastErr = new Error('AI 요청이 거절되었습니다: ' + t.slice(0, 300));
      continue;
    }

    const data = await res.json();
    const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    try {
      return parseAiJson(raw);
    } catch (e) {
      lastErr = e; // 형식 어긋남 → 재시도
    }
  }
  throw lastErr || new Error('AI 응답을 처리하지 못했습니다.');
}
