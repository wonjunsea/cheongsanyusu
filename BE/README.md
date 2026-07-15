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
Body: { system, caseType, user_id, answeredTurns }
Response: { turn, inferred_state }
```

턴 구조와 스키마 자세한 설명은 루트 `CLAUDE.md` 참고.
