# Backend (BE)

금융 멘토 롤플레잉의 LLM 프록시 서버입니다. Node.js + Express.

## 실행

```bash
npm install
cp .env.example .env   # OPENAI_API_KEY 채우기
npm run dev            # http://localhost:8787
```

## 구성

- `server.js` — Express 앱, `POST /api/mentor` 마운트, CORS 설정
- `routes/mentor.js` — 멘토 턴 생성 (OpenAI `gpt-4o-mini`, JSON 모드)
- `db.js` — SQLite(`better-sqlite3`)로 대화 기록 저장/조회

## API

```
POST /api/mentor
Body: {
  system: string,                 // FE의 buildMentorSystemPrompt(caseType)
  caseType: "surge"|"compound"|"etf",
  user_id: string,
  answeredTurns: { turn: QuestionTurn, chosenChoiceId: string }[]  // 첫 호출은 []
}
Response: { turn: MentorTurn, inferred_state: InferredState }
```

정확히 4턴(질문 1~3 + 최종 1)으로 진행되는 객관식 롤플레잉이다. 자유 텍스트 채팅이 아니다.

- `MentorTurn`은 둘 중 하나:
  - `{ turn_type: "question", question_axis, hint, prompt, choices }` — 객관식 선택지 2~4개
  - `{ turn_type: "final", summary_of_user_state, final_explanation, final_actions }` — 요약/설명/행동 선택지
- `answeredTurns.length`가 곧 턴 인덱스: 0~2는 질문 턴, 3부터는 최종 턴(`routes/mentor.js`의 `QUESTION_TURNS`)
- `InferredState`: `{ mental_model, risk_belief, market_frame, confusion_point, confidence_level }` — 매 턴 LLM이 내부적으로 갱신, 사용자에게는 노출하지 않음
- 질문 축은 5W1H(what/why/when/how/where/who) 중 케이스에 맞는 것만 사용
- 매 요청마다 직전 턴에서 사용자가 고른 답변을 SQLite(`db.js`)에 `user_id` + `case_type` 기준으로 저장
