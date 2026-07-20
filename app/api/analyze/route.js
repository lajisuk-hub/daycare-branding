// 업로드한 프로필 캡쳐를 AI가 읽고, 잘된 점 / 부족한 점을 분석 + 아는 정보 미리 채우기
// 필요한 환경변수: ANTHROPIC_API_KEY
import { callClaudeJson } from '../../lib/ai';

export const maxDuration = 60;

const SYSTEM = `당신은 어린이집 인스타그램 프로필(소개글)을 진단하는 브랜딩 전문가입니다.
좋은 어린이집 프로필은 다음 요소를 갖춥니다:
1) 이름줄: 지역 + 어린이집 이름 + 한 줄 정체성
2) 마음을 울리는 한 문장(캐치프레이즈)
3) 이모지 불릿으로 정리된 핵심 특징 3~6개 (교사대아동 비율/소수정예, 자연·숲놀이·나들이, 건강한 먹거리, 놀이 중심 배움, 선생님의 태도나 경력, 부모와 함께 등)
4) 다니는 연령(예: 3세~7세, 만0~2세) 또는 모집 정보
5) 위치(동네·주소)
6) 연락처 또는 상담 링크

사용자가 올린 프로필 캡쳐 이미지를 보고 위 기준으로 진단하세요.

당신의 응답 전체는 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나여야 합니다. 인사말·설명·코드블록을 붙이지 마세요.
큰따옴표(") 안에서 큰따옴표를 또 쓰지 마세요.
{
  "goodPoints": ["이미 잘 담겨 있는 점 (부드럽고 구체적으로, 2~4개)"],
  "missingPoints": ["추가하면 더 좋을 점 (권유하듯 부드럽게, 2~4개)"],
  "prefill": {
    "centerName": "이미지에서 읽은 지역+어린이집 이름 (없으면 빈 문자열)",
    "ageRange": "다니는 연령 (없으면 빈 문자열)",
    "features": ["이미지에 이미 드러난 특징 키워드들 (예: 자연놀이, 건강한 먹거리, 소수정예). 없으면 빈 배열"],
    "location": "위치 (없으면 빈 문자열)",
    "contact": "연락처/링크 (없으면 빈 문자열)"
  }
}
이미지가 어린이집 프로필이 아니거나 읽기 어려우면 goodPoints는 빈 배열로 두고 missingPoints에 그 사실을 부드럽게 적으세요.`;

export async function POST(req) {
  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) return json({ error: '이미지가 없습니다.' }, 400);

    const parsed = await callClaudeJson({
      system: SYSTEM,
      userContent: [
        { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/png', data: imageBase64 } },
        { type: 'text', text: '이 어린이집 프로필 캡쳐를 진단해 주세요.' },
      ],
      maxTokens: 1500,
    });
    return json(parsed);
  } catch (e) {
    return json({ error: (e.noKey ? '' : '사진 분석 중 문제가 생겼습니다: ') + (e.message || '알 수 없는 오류') }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
