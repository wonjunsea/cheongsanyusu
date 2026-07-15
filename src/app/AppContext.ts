import { createContext, useContext } from 'react';
import type { CaseType } from '../lib/mentor';

export type ScreenId =
  | 'list'   // 주식앱 (랜딩)
  | 'home'   // 체험 허브
  | 'neg'    // 음의 복리 체험(슬라이더) — 허브 전용
  | 'quiz'   // 주식 용어 퀴즈
  | 'sim'    // 모의투자 시뮬
  | 'mentor' // 금융 멘토 채팅 (LLM)
  | 'game2'  // 1. 급등주 호가창 게임
  | 'game3'  // 2. 음의 복리(흔들림 장세) 체험
  | 'game4'  // 3. ETF (준비 중)
  | 'order'; // 주문(데모)

/** caseType -> 멘토 대화 후 이어질 체험 화면 */
export const CASE_EXPERIENCE: Record<CaseType, ScreenId> = {
  surge: 'game2',    // 급등주 호가창
  compound: 'game3', // 음의 복리(흔들림 장세)
  etf: 'game4',      // ETF (준비 중)
};

export interface AppApi {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  toast: (msg: string) => void;
  /** 현재 진행 중인 케이스 (1→2→3 순서) */
  caseType: CaseType;
  /** 다음 케이스가 남아있는지 */
  hasNextCase: boolean;
  /** 다음 케이스의 멘토로 진행 (마지막이면 주식앱으로) */
  nextCase: () => void;
  /** 고위험 종목 클릭 시: 첫 케이스(급등주)부터 순서대로 시작 */
  enterMentor: (product: string) => void;
  /** 일반 상품 클릭 시: 주문 화면 */
  openOrder: (name: string, desc: string) => void;
  openWarning: (product: string) => void;
  closeWarning: () => void;
  order: { name: string; desc: string };
}

export const AppContext = createContext<AppApi | null>(null);

export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
