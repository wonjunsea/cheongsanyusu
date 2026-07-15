import { createContext, useContext } from 'react';
import type { CaseType } from '../lib/mentor';

export type ScreenId =
  | 'list'   // 주식앱 (랜딩)
  | 'home'   // 체험 허브
  | 'neg'    // 음의 복리 체험(슬라이더) — 허브 전용
  | 'quiz'   // 주식 용어 퀴즈
  | 'sim'    // 모의투자 시뮬
  | 'hook'   // 진입 훅 (멘토 채팅 진입 전, 케이스별 문구를 크게 보여줌)
  | 'mentor' // 금융 멘토 채팅 (LLM)
  | 'game2'  // 급등주 호가창 게임
  | 'game3'  // 음의 복리(흔들림 장세) 체험
  | 'game4'  // ETF (준비 중)
  | 'order'; // 주문(데모)

/** caseType -> 멘토 대화 후 이어질 체험 화면 (클릭당 랜덤 1개) */
export const CASE_EXPERIENCE: Record<CaseType, ScreenId> = {
  surge: 'game2',    // 급등주 호가창
  compound: 'game3', // 음의 복리(흔들림 장세)
  etf: 'game4',      // ETF (준비 중)
};

export interface AppApi {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  toast: (msg: string) => void;
  /** 이번에 진행 중인 케이스 (종목별 고정 매핑) */
  caseType: CaseType;
  /** 고위험 종목 클릭 시: 해당 종목의 케이스로 멘토 진입 */
  enterMentor: (product: string, caseType: CaseType) => void;
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
