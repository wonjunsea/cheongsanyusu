/* =====================================================================
 * 금융 멘토 대화 모듈  ── ⭐ 실제 LLM 연결 지점 (LLM SWAP POINT) ⭐
 * ---------------------------------------------------------------------
 * 지금은 백엔드가 없어서 "목(mock) 응답"으로 동작합니다.
 * 나중에 BE(LLM 프록시)가 준비되면, 아래 sendMentorMessage 안의
 *   [MOCK] 블록을 지우고 [REAL] 블록의 주석을 해제하면 됩니다.
 * 그 외의 코드(화면/컴포넌트)는 하나도 바꿀 필요가 없습니다.
 *
 * BE가 만들 엔드포인트 스펙(제안):
 *   POST /api/mentor
 *   req  body : { system: string, caseType: CaseType, messages: ChatMessage[] }
 *   res  body : { reply: string, canProceed: boolean }
 * =================================================================== */

import { MENTOR_SYSTEM_PROMPT } from '../data/mentorPrompt';

/** 랜덤으로 뜨는 3가지 고위험 케이스 */
export type CaseType = 'surge' | 'compound' | 'shake';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MentorReply {
  content: string;
  /** true 가 되면 "직접 체험하기" 버튼이 나타납니다. */
  canProceed: boolean;
}

/** 케이스별 멘토 첫 인사 */
export const MENTOR_GREETINGS: Record<CaseType, string> = {
  surge:
    '안녕하세요, 저는 금융 멘토예요 🧑‍🏫\n' +
    "'에코비트'가 5일 만에 +142% 급등했네요. 지금 사고 싶은 마음, 이해해요. 솔직히 왜 사고 싶으세요?",
  compound:
    '안녕하세요, 저는 금융 멘토예요 🧑‍🏫\n' +
    "'KODEX 레버리지' 같은 2배 ETF에 관심 있으시군요. 하나만 여쭤볼게요 — 지수가 내렸다가 다시 제자리로 오면, 2배 ETF도 제자리일까요?",
  shake:
    '안녕하세요, 저는 금융 멘토예요 🧑‍🏫\n' +
    '요즘 장이 위아래로 크게 흔들리죠. 이렇게 출렁이는 장에서 2배 ETF를 들고 있으면 어떻게 될 것 같으세요?',
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendMentorMessage(
  history: ChatMessage[],
  caseType: CaseType,
): Promise<MentorReply> {
  /* ---------------------------------------------------------------
   * [REAL]  ── 실제 LLM 연결 시 이 블록을 사용하세요 (지금은 주석)
   * ---------------------------------------------------------------
   * const res = await fetch(import.meta.env.VITE_MENTOR_API ?? '/api/mentor', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ system: MENTOR_SYSTEM_PROMPT, caseType, messages: history }),
   * });
   * const data = await res.json();
   * return { content: data.reply, canProceed: !!data.canProceed };
   * --------------------------------------------------------------- */

  /* ---------------------------------------------------------------
   * [MOCK]  ── 백엔드 없이 동작하는 더미 응답 (실제 연결 시 삭제)
   * --------------------------------------------------------------- */
  void MENTOR_SYSTEM_PROMPT;
  await delay(500 + Math.random() * 500);
  return mockReply(history, caseType);
}

/* ============ 아래는 전부 MOCK 전용 (실제 연결 시 통째로 삭제 가능) ============ */

const PROCEED: Record<CaseType, string> = {
  surge:
    '좋아요, 이제 직접 느껴볼 차례예요. 급락이 언제 올지 모르는 상황에서 매수·매도 타이밍을 직접 잡아보면, 왜 대부분이 고점에 물리는지 몸으로 알게 될 거예요. 아래 버튼으로 시작해봐요.',
  compound:
    '좋아요, 백문이 불여일견이죠. 지수가 제자리로 돌아와도 2배 ETF는 왜 못 돌아오는지, 직접 값을 조절해보며 확인해봐요. 아래 버튼으로 시작해봐요.',
  shake:
    '좋아요, 직접 흔들어봅시다. 출렁임 강도를 바꿔가며 본주와 2배 ETF를 20일간 비교해보면, 흔들릴수록 왜 손해가 쌓이는지 눈에 보일 거예요. 아래 버튼으로 시작해봐요.',
};

function mockReply(history: ChatMessage[], caseType: CaseType): MentorReply {
  const userTurns = history.filter((m) => m.role === 'user').length;
  const last = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
  const t = last.toLowerCase();

  // 2~3번 대화하면 체험으로 유도
  if (userTurns >= 3) {
    return { content: PROCEED[caseType], canProceed: true };
  }

  if (/(다들|남들|놓칠|fomo|포모|늦)/.test(t)) {
    return { content: '그 마음이 바로 FOMO예요. 몰릴 때가 오히려 가장 위험한 순간이기도 하죠. 만약 지금 샀는데 내일 크게 빠지면, 어떻게 하실 거예요?', canProceed: false };
  }
  if (/(제자리|돌아|회복|같|똑같)/.test(t)) {
    return { content: '많은 분들이 그렇게 생각해요. 그런데 2배 ETF는 매일 배율을 다시 계산해서, 오르내림만 반복해도 원금이 조금씩 깎여요. 왜 그런지 직접 보실래요?', canProceed: false };
  }
  if (/(더|오를|간다|상승|수익|벌)/.test(t)) {
    return { content: '더 오를 수도 있어요. 근데 문제는 방향이 아니라 흔들림이에요. 출렁일수록 레버리지가 불리해지거든요. 얼마나 흔들리면 손해가 나는지, 궁금하지 않으세요?', canProceed: false };
  }
  if (/(손절|팔|매도|버틴|존버|기다)/.test(t)) {
    return { content: '말은 쉬운데, 실제 상황에선 타이밍을 놓치기 쉬워요. 정말 그런지, 직접 체험으로 확인해보는 게 제일 빨라요.', canProceed: false };
  }
  return { content: '음, 그렇군요. 레버리지·2배 ETF에서 제일 중요한 건 방향보다 흔들림이에요. 왜 그런지 하나만 더 여쭤볼게요 — 지금 이 상품, 무엇을 보고 사려고 하세요?', canProceed: false };
}
