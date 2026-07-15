# 빚투 STOP — FE (React + TypeScript + Vite)

청년 금융 리터러시 체험 데모의 **프론트엔드**입니다.
주식앱에서 고위험 상품을 선택하면 **금융 멘토(AI)와 대화**하고, 이어서 그 종목에 맞는
**체험 시뮬레이션**을 직접 해보는 흐름이에요. (테마: 초록/teal)

## 받아서 실행하기

```bash
# 1) 저장소 클론
git clone https://github.com/wonjunsea/cheongsanyusu.git
cd cheongsanyusu/FE

# 2) 의존성 설치 & 실행
npm install
npm run dev        # 개발 서버: http://localhost:5173, /api/*는 ../BE로 프록시
```

BE(`../BE`)도 같이 띄워야 멘토 채팅이 동작합니다. API 계약은 `BE/README.md` 참고.

기타 명령어:

```bash
npm run build      # 타입체크(tsc) + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## 화면 흐름

- **투자(랜딩)** → 상단 배너 클릭 시 **체험 허브**(음의 복리 · 용어 퀴즈 · 모의투자)
- **고위험 종목 클릭**(레버리지 / 인버스 / 급등주 🚀) → 종목별로 고정된 케이스:
  1. **에코비트(급등주)** → 금융 멘토 채팅(객관식 4턴) → 급등주 타이밍 게임
  2. **KODEX 레버리지** → 금융 멘토 채팅(객관식 4턴) → 음의 복리(흔들림 장세) 체험
  3. **200선물인버스2X** → 금융 멘토 채팅(객관식 4턴) → ETF 체험 (준비 중)
- 일반 종목 → 주문(데모)

## ⭐ LLM 연결 지점

멘토 대화는 `BE/`(Node.js/Express)를 통해 OpenAI(`gpt-4o-mini`)와 실제로 연결되어 있습니다.

- `src/lib/mentor.ts` — `fetchNextTurn()`이 `POST /api/mentor`를 호출
- `src/data/mentorPrompt.ts` — 케이스별 멘토 시스템 프롬프트

BE 실행 방법과 턴 기반 JSON 계약은 `BE/README.md` 참고.

## 폴더 구조

```
src/
├── App.tsx                # 화면 라우팅 + 폰 프레임 + 경고 시트/토스트
├── app/AppContext.ts      # 화면 이동/토스트/케이스 등 공용 API
├── lib/mentor.ts          # ⭐ 멘토 롤플레잉 (LLM 연결 지점, BE 실제 호출)
├── data/mentorPrompt.ts   # 케이스별 멘토 시스템 프롬프트
├── screens/
│   ├── StockList.tsx      # 주식앱(랜딩)
│   ├── Hub.tsx            # 체험 허브
│   ├── NegCompound.tsx    # 음의 복리 체험(슬라이더)
│   ├── Quiz.tsx           # 용어 퀴즈
│   ├── TradeSim.tsx       # 모의투자 시뮬
│   ├── MentorChat.tsx     # 금융 멘토 채팅(객관식 4턴)
│   ├── SurgeGame.tsx      # 급등주 타이밍 게임
│   ├── CompoundRisk.tsx   # 음의 복리(흔들림 장세) 체험
│   ├── EtfPlaceholder.tsx # ETF 케이스 (준비 중)
│   └── Order.tsx          # 주문(데모)
├── components/WarningSheet.tsx
└── styles.css             # 초록 테마 스타일
```

## 참고

- 실제 돈이 아닌 **교육용 모의 데이터**입니다. 특정 상품을 추천하지 않습니다.
