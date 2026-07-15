/* =====================================================================
 * 금융 멘토 롤플레잉 모듈 — BE(/BE)의 POST /api/mentor 호출
 *
 * 턴 구조(roleplay-agent-schema.md):
 *   질문 1~3 (turn_type: "question", 객관식 선택지)
 *   최종 턴  (turn_type: "final",    요약 + 설명 + 행동 선택지)
 * =================================================================== */

import { buildMentorSystemPrompt } from '../data/mentorPrompt';
import { getUserId } from './userId';

/** 종목별로 고정된 케이스 (surge/compound: 완성, etf: 준비 중 placeholder) */
export type CaseType = 'surge' | 'compound' | 'etf';

/** 진행 순서 */
export const CASE_ORDER: CaseType[] = ['surge', 'compound', 'etf'];

export type QuestionAxis = 'what' | 'why' | 'when' | 'how' | 'where' | 'who';

export interface Choice {
  id: string;
  label: string;
  text: string;
}

export interface InferredState {
  mental_model: string;
  risk_belief: string;
  market_frame: string;
  confusion_point: string;
  confidence_level: 'low' | 'medium' | 'high';
}

export interface QuestionTurn {
  turn_type: 'question';
  question_axis: QuestionAxis;
  hint: string;
  prompt: string;
  choices: Choice[];
}

export interface FinalTurn {
  turn_type: 'final';
  summary_of_user_state: string[];
  final_explanation: string[];
  final_actions: Choice[];
}

export type MentorTurn = QuestionTurn | FinalTurn;

/** 사용자가 이미 답한 질문 턴 + 고른 선택지 id */
export interface AnsweredTurn {
  turn: QuestionTurn;
  chosenChoiceId: string;
}

export interface MentorTurnResponse {
  turn: MentorTurn;
  inferred_state: InferredState;
}

/** answeredTurns 다음에 이어질 턴을 BE에 요청한다. 첫 호출은 answeredTurns: [] */
export async function fetchNextTurn(
  caseType: CaseType,
  answeredTurns: AnsweredTurn[],
): Promise<MentorTurnResponse> {
  const res = await fetch(import.meta.env.VITE_MENTOR_API ?? '/api/mentor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: buildMentorSystemPrompt(caseType),
      caseType,
      user_id: getUserId(),
      answeredTurns,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `멘토 응답 실패 (${res.status})`);
  }

  return res.json();
}
