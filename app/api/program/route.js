// 특색 프로그램 인터뷰 답변 → 우리 원 프로그램 소개글 생성
// 필요한 환경변수: ANTHROPIC_API_KEY
import { callClaudeJson } from '../../lib/ai';

export const maxDuration = 60;

const SYSTEM = `당신은 어린이집의 특색 프로그램(자랑하는 활동)을 부모와 예비 학부모에게 매력적으로 소개하는 글을 써 주는 카피라이터입니다.
따뜻하고 신뢰가 느껴지는 존댓말로 씁니다.

참고 — 실제 좋은 어린이집 프로그램 소개의 결:
- 아이도 부모도 교사도 행복한 어린이집이라는 마음
- 자유놀이·놀이 중심, 텃밭과 자연·숲 체험, 유기농 건강한 식단
- 관계와 생태를 배우는 활동, 부모가 함께하는 모임(공동육아)
- 활동을 통해 아이의 주체성·협동심·정서발달·사회성이 자라남을 강조
이 결은 참고일 뿐, 반드시 원장님이 준 실제 활동만으로 이 어린이집만의 색을 살려 씁니다.

작성 원칙:
- 반드시 원장님이 준 활동과 정보(사실)만 사용합니다. 없는 활동이나 효과를 지어내지 않습니다.
- 각 프로그램은 단순 나열이 아니라, 그 활동이 아이에게 어떤 의미와 성장으로 이어지는지가 느껴지게 씁니다.
- 어린이집의 보육철학이 주어지면, 프로그램이 그 철학과 어떻게 이어지는지 자연스럽게 녹입니다.
- 큰따옴표(")는 절대 사용하지 않습니다. 과장된 홍보 문구는 피하고 진정성 있게 씁니다.

당신의 응답 전체는 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나여야 합니다. 인사말·설명·코드블록을 붙이지 마세요.
{
  "programs": [
    { "name": "프로그램 이름", "emoji": "어울리는 이모지 1개", "oneLiner": "한 줄 소개", "description": "2~3문장 소개. 어떻게 진행되고 아이에게 무엇이 좋은지" }
  ],
  "introText": "전체를 엮은 소개글. 도입 한 문단(우리 원 프로그램을 관통하는 마음) + 각 프로그램을 자연스럽게 이은 글. 부모·홍보용으로 게시물이나 안내문에 바로 쓸 수 있게.",
  "shortIntro": "인스타 게시물 첫머리에 쓸 짧은 소개(2~3문장)"
}`;

export async function POST(req) {
  try {
    const a = await req.json();
    const info = [
      `어린이집 이름/지역: ${a.centerName || '(미입력)'}`,
      `우리 원 보육철학(있으면 프로그램에 녹여 주세요): ${a.philosophy || '(미입력)'}`,
      `원훈: ${a.wonHun || '(미입력)'}`,
      `자랑하는 특색 활동/프로그램 목록: ${a.programNames || '(미입력)'}`,
      `각 활동을 왜 하는지 / 아이에게 좋은 점: ${a.programWhy || '(미입력)'}`,
      `진행 빈도나 방식(있으면): ${a.frequency || '(미입력)'}`,
      `꼭 강조하고 싶은 점: ${a.extra || '(미입력)'}`,
    ].join('\n');

    const parsed = await callClaudeJson({
      system: SYSTEM,
      userContent: `다음 정보로 우리 어린이집 특색 프로그램 소개글을 만들어 주세요.\n\n${info}`,
      maxTokens: 2500,
    });
    return json(parsed);
  } catch (e) {
    return json({ error: (e.noKey ? '' : '프로그램 소개글 작성 중 문제가 생겼습니다: ') + (e.message || '알 수 없는 오류') }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
