// 완성된 글(게시글/프로그램) → 이미지 게시글(카드뉴스) 페이지별 프롬프트 생성
// 각 페이지: 슬라이드에 넣을 문구 + 이미지 생성용 프롬프트
// 필요한 환경변수: ANTHROPIC_API_KEY
import { callClaudeJson } from '../../lib/ai';

export const maxDuration = 60;

const SYSTEM = `당신은 어린이집 인스타그램 카드뉴스(여러 장의 이미지로 넘겨 보는 게시글)를 기획하는 전문가입니다.
사용자가 준 글을 바탕으로, 이미지 게시글을 만들 수 있도록 페이지(장)별로 나눠 기획합니다.

# 만드는 방법
- 전체를 표지 1장 + 내용 여러 장 + 마무리(안내) 1장으로, 보통 5~8장으로 나눕니다.
- 각 장은 한눈에 읽히도록 문구를 아주 짧고 굵게 뽑습니다(핵심 한 문장, 길면 두 줄).
- 각 장마다 그 장에 어울리는 이미지를 만들 수 있는 이미지 생성 프롬프트를 함께 줍니다.
- 이미지 프롬프트는 한국어로, 장면·분위기·색감·구도를 구체적으로 묘사합니다. 따뜻하고 감성적인 느낌(자연광, 파스텔/내추럴 톤, 어린이집 정서).
- 개인정보 보호: 특정 아이의 얼굴을 식별할 수 있게 묘사하지 말고, 뒷모습·손·실루엣·분위기 위주로 묘사합니다.
- 사용자가 준 내용의 사실만 사용하고, 없는 활동·시설을 지어내지 않습니다.
- 큰따옴표(")는 절대 사용하지 않습니다.

당신의 응답 전체는 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나여야 합니다. 인사말·설명·코드블록을 붙이지 마세요.
{
  "pages": [
    {
      "page": 1,
      "label": "표지 또는 이 장의 역할(예: 표지, 내용, 마무리)",
      "text": "슬라이드에 크게 넣을 문구(짧게)",
      "imagePrompt": "이 장의 이미지를 만들기 위한 프롬프트. 장면·분위기·색감·구도를 구체적으로."
    }
  ],
  "tip": "이 카드뉴스를 더 잘 만들기 위한 한 줄 팁"
}`;

export async function POST(req) {
  try {
    const a = await req.json();
    if (!a.source || !a.source.trim()) return json({ error: '바탕이 될 내용이 없습니다.' }, 400);

    const info = [
      `어린이집 이름/지역: ${a.centerName || '(미입력)'}`,
      `카드뉴스 종류: ${a.kind || '어린이집 소개 게시글'}`,
      `바탕이 될 내용:\n${a.source}`,
    ].join('\n');

    const parsed = await callClaudeJson({
      system: SYSTEM,
      userContent: `다음 내용으로 인스타그램 카드뉴스(이미지 게시글)를 페이지별로 기획해 주세요.\n\n${info}`,
      maxTokens: 2500,
    });
    return json(parsed);
  } catch (e) {
    return json({ error: (e.noKey ? '' : '카드뉴스 프롬프트 작성 중 문제가 생겼습니다: ') + (e.message || '알 수 없는 오류') }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
