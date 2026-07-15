# 빚투 STOP — 레버리지 상품 교육 파이프라인

## 목표

주식앱에서 고위험 상품(레버리지/인버스/급등주) 매수 직전 사용자를 인터셉트해서,
AI 금융 멘토와의 대화로 이해도·투자 성향을 파악하고, 이어서 맞춤형 체험(게임/시뮬레이션)으로 연결하는 교육 데모.

---

## 현재 구현 상태 (실제 코드 기준)

- **FE**: React 19 + TypeScript + Vite (SPA, 라우터 없이 `App.tsx`의 `screen` 상태로 화면 전환)
- **BE**: `BE/` — Node.js/Express, `POST /api/mentor`에서 OpenAI(`gpt-4o-mini`)를 호출해 멘토 응답을 생성
- **LLM 연결**: 연결됨. `FE/src/lib/mentor.ts`의 `fetchNextTurn()`이 `/api/mentor`를 호출하고, Vite dev 서버가 `/api` 요청을 BE(`http://localhost:8787`)로 프록시한다.
- 저장소 구조: `BE/`(Node.js/Express)와 `FE/`(React+Vite)가 리포 루트에 나란히 있는 모노레포. 각자 독립된 `package.json`/`node_modules`를 가진다.

> 원본 설계 문서(Next.js App Router + OpenAI API + SQLite, `[대화 종료]` 토큰 기반 종료, `extractProfile` JSON 추출, 오케스트레이터의 `explanationLevel`/`gameType` 분기)는 **개념적으로만 참고**한다. 실제 스택은 Vite SPA + (미정) 백엔드이며, 아래는 그 설계 의도를 지금 코드 구조에 맞게 재정리한 것이다.

---

## 실제 화면 흐름

```
[StockList] 투자 종목 리스트 (랜딩)
     │
     ├─ 일반 종목 클릭 → [Order] 주문 화면(데모)
     │
     ├─ 배너 클릭 → [Hub] 체험 허브
     │                 ├─ 음의 복리 체험 → [NegCompound]
     │                 ├─ 주식 용어 퀴즈 → [Quiz]
     │                 ├─ 모의투자 시뮬레이션 → [TradeSim]
     │                 └─ 위험 상품 안내 다시보기 → [WarningSheet]
     │
     └─ 고위험 종목 클릭 (레버리지/인버스/급등주) — 종목별로 caseType 고정
              → enterMentor(product, caseType)
                    에코비트           → surge
                    KODEX 레버리지     → compound
                    200선물인버스2X    → etf
              → [MentorChat] AI 금융 멘토 롤플레잉 — 객관식 4턴 (질문1→질문2→질문3→최종)
                    → 최종 턴의 행동 선택지 클릭 시 진행
              → CASE_EXPERIENCE[caseType] 로 이동
                    surge    → [SurgeGame]       급등주 타이밍 게임
                    compound → [CompoundRisk]    음의 복리(흔들림 장세) 체험
                    etf      → [EtfPlaceholder]  ETF 체험 (준비 중)
```

화면 라우팅은 `FE/src/app/AppContext.ts`의 `ScreenId` / `CASE_EXPERIENCE`가 정의하고,
실제 전환은 `FE/src/App.tsx`의 `screen` state + `go()`로 처리한다(별도 라우터 없음).

---

## 프로젝트 구조

```
cheongsanyusu/
├── BE/
│   ├── server.js          # Express 앱, /api/mentor 마운트
│   ├── routes/mentor.js   # POST /api/mentor — OpenAI 호출
│   ├── db.js              # SQLite 저장/조회
│   ├── package.json
│   └── .env.example       # OPENAI_API_KEY, PORT, CORS_ORIGIN
├── FE/
│   ├── package.json
│   ├── vite.config.ts     # /api → BE(8787) 프록시
│   └── src/
│       ├── App.tsx            # 화면 전환 루트, AppContext.Provider
│       ├── app/
│       │   └── AppContext.ts  # ScreenId, CASE_EXPERIENCE, AppApi(go/toast/enterMentor 등)
│       ├── components/
│       │   └── WarningSheet.tsx
│       ├── data/
│       │   └── mentorPrompt.ts   # buildMentorSystemPrompt(caseType) — 케이스별 롤플레잉 시스템 프롬프트
│       ├── lib/
│       │   └── mentor.ts         # LLM 연결 지점 (fetchNextTurn) — BE 실제 호출, 턴 타입 정의
│       └── screens/
│           ├── StockList.tsx   # 랜딩, 상품 리스트
│           ├── Hub.tsx         # 체험 허브
│           ├── MentorChat.tsx  # AI 멘토 채팅 (엔트리 훅 이후 진입)
│           ├── Quiz.tsx        # 정적 5문항 퀴즈 (LLM 아님, 하드코딩)
│           ├── NegCompound.tsx # 음의 복리 체험 (허브 전용 슬라이더)
│           ├── SurgeGame.tsx   # 급등주 호가창 게임
│           ├── CompoundRisk.tsx# 음의 복리(흔들림 장세) 체험 — compound 케이스 체험 화면
│           ├── EtfPlaceholder.tsx # ETF 케이스 체험 (준비 중)
│           ├── TradeSim.tsx    # 모의투자 시뮬레이션
│           └── Order.tsx       # 주문 데모 화면
└── CLAUDE.md
```

---

## 멘토 롤플레잉 스키마 (구현됨)

턴 구조와 출력 계약은 `roleplay-agent-schema.md` / `volatility-decay-explainer.md`를 따른다.
자유 텍스트 채팅이 아니라 **정확히 4턴(질문 1~3 + 최종 1)의 객관식 인터랙션**이다.

```
POST /api/mentor
Body: {
  system: string,                 // buildMentorSystemPrompt(caseType)
  caseType: "surge"|"compound"|"etf",
  user_id: string,
  answeredTurns: { turn: QuestionTurn, chosenChoiceId: string }[]  // 첫 호출은 []
}
Response: { turn: MentorTurn, inferred_state: InferredState }
```

- `MentorTurn`은 `{ turn_type: "question", question_axis, hint, prompt, choices }` 또는
  `{ turn_type: "final", summary_of_user_state, final_explanation, final_actions }` (타입은 `FE/src/lib/mentor.ts`)
- `answeredTurns.length`가 곧 턴 인덱스: 0~2는 질문 턴, 3부터는 최종 턴 (BE `routes/mentor.js`의 `QUESTION_TURNS`)
- 질문 축(5W1H)과 상태 라벨(`mental_model`/`risk_belief`/`market_frame`)은 케이스별로 `FE/src/data/mentorPrompt.ts`의 `CASE_CONTENT`에 정의 — `compound`는 `volatility-decay-explainer.md`를 그대로 반영, `surge`/`etf`는 같은 스키마로 새로 작성 (`etf`는 인버스 ETF의 음의 복리 착각을 다룸)
- `enterMentor(product, caseType)`가 종목별로 caseType을 고정 지정한다(`StockList.tsx`) — 예전의 랜덤 케이스 선택 방식에서 변경됨
- `case-generator-template.md`(새 케이스 문서를 LLM으로 저작하는 메타 템플릿)는 콘텐츠 저작 워크플로우용 문서라 런타임 코드에는 반영하지 않음 — 향후 케이스를 추가할 때 `mentorPrompt.ts`의 `CASE_CONTENT` 항목을 채우는 데 참고용으로만 사용
- BE 실행 전 `BE/.env.example`을 `BE/.env`로 복사하고 `OPENAI_API_KEY`를 채워야 함 (`cd BE && npm install && npm run dev`)
- Vite dev 서버는 `FE/vite.config.ts`의 `server.proxy['/api']`로 요청을 `http://localhost:8787`(BE)에 위임하므로, FE 코드는 `/api/mentor` 상대 경로만 알면 됨
- DB(`BE/db.js`, SQLite)에 매 턴의 질문/선택 답변이 `user_id`+`case_type` 기준으로 저장됨

---

## 실행

```bash
# BE
cd BE && npm install
cp .env.example .env   # OPENAI_API_KEY 채우기
npm run dev            # http://localhost:8787

# FE (별도 터미널)
cd FE && npm install
npm run dev             # http://localhost:5173, /api/* 는 BE로 프록시됨
```

## 주의사항

- BE가 꺼져 있거나 `OPENAI_API_KEY`가 없으면 `MentorChat`은 에러 메시지를 대화창에 표시한다(`FE/src/screens/MentorChat.tsx`의 catch 블록).
- `Quiz.tsx`는 LLM 기반이 아니라 하드코딩된 5문항 — 별도 기능이니 멘토 롤플레잉과 혼동하지 말 것.
- 멘토 프롬프트(`mentorPrompt.ts`)에는 "훈계·겁주기 금지, 이해를 돕는 톤" 원칙이 명시되어 있으므로, 프롬프트 수정 시 이 톤을 유지한다.
- `final_actions`는 현재 UI에서 몇 개를 고르든 동일하게 `CASE_EXPERIENCE[caseType]`로 이동한다(선택지 자체는 사용자 사고방식을 드러내는 용도이지, 분기 로직은 아직 없음).
