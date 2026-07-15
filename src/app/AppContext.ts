import { createContext, useContext } from 'react';
import type { CaseType } from '../lib/mentor';

export type ScreenId =
  | 'list'   // 주식앱 (랜딩)
  | 'home'   // 체험 허브
  | 'neg'    // 음의 복리 체험 (case: compound 체험)
  | 'quiz'   // 주식 용어 퀴즈
  | 'sim'    // 모의투자 시뮬
  | 'mentor' // 금융 멘토 채팅 (LLM)
  | 'game2'  // 급등주 타이밍 게임 (case: surge 체험)
  | 'game3'  // 흔들림 장세 복리 체험 (case: shake 체험)
  | 'order'; // 주문(데모)

/** caseType -> 멘토 대화 후 이어질 체험 화면 */
export const CASE_EXPERIENCE: Record<CaseType, ScreenId> = {
  surge: 'game2',    // 급등주 타이밍 게임
  compound: 'neg',   // 음의 복리 체험
  shake: 'game3',    // 흔들림 장세 복리 체험
};

export interface AppApi {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  toast: (msg: string) => void;
  /** 현재 진행 중인 랜덤 케이스 */
  caseType: CaseType;
  /** 고위험 종목 클릭 시: 랜덤 케이스 선택 후 멘토 채팅으로 진입 */
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
