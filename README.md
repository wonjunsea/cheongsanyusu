# 빚투 STOP — FE (React + TypeScript + Vite)

청년 금융 리터러시 체험 데모의 **프론트엔드**입니다.
주식앱에서 고위험 상품을 선택하면 **금융 멘토(AI)와 대화**하고, 이어서 그 종목에 맞는
**체험 시뮬레이션**을 직접 해보는 흐름이에요. (테마: 초록/teal)

> 이 코드는 `new1` 저장소의 **`fe-demo` 브랜치**에 올라가 있어요.
> (main과는 히스토리가 분리돼 있습니다.)

## 받아서 실행하기

```bash
# 1) 저장소 클론
git clone https://github.com/wonjunsea/new1.git
cd new1

# 2) FE 브랜치로 전환
git checkout fe-demo

# 3) 의존성 설치 & 실행
npm install
npm run dev        # 개발 서버: http://localhost:5173
```

이미 클론해둔 사람은 아래로 최신 브랜치만 받으면 돼요:

```bash
git fetch origin
git checkout fe-demo
git pull
```

기타 명령어:

```bash
npm run build      # 타입체크(tsc) + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

## 화면 흐름

- **투자(랜딩)** → 상단 배너 클릭 시 **체험 허브**(음의 복리 · 용어 퀴즈 · 모의투자)
- **고위험 종목 클릭**(레버리지 / 인버스 / 급등주 🚀) → **랜덤으로 3가지 케이스 중 하나**:
  1. **급등주** → 금융 멘토 채팅 → 급등주 타이밍 게임
  2. **음의 복리** → 금융 멘토 채팅 → 음의 복리 체험(슬라이더)
  3. **흔들림 장세 복리** → 금융 멘토 채팅 → 본주 vs 2배 ETF 20일 비교 시뮬
- 일반 종목 → 주문(데모)

## ⭐ LLM 연결 지점 (BE 담당)

지금 멘토 대화는 **백엔드 없이 목(mock) 응답**으로 동작합니다.
실제 LLM을 붙일 때 **딱 한 파일만** 바꾸면 됩니다:

- `src/lib/mentor.ts` — `sendMentorMessage()` 안의 **`[MOCK]` 블록을 지우고 `[REAL]` 블록 주석을 해제**하세요.
- `src/data/mentorPrompt.ts` — 멘토의 **시스템 프롬프트**. BE로 그대로 전달하면 됩니다.

BE가 만들 엔드포인트(제안):

```
POST /api/mentor
  req  { system: string, caseType: 'surge'|'compound'|'shake', messages: {role, content}[] }
  res  { reply: string, canProceed: boolean }
        - reply      : 멘토의 다음 답변
        - canProceed : true 가 되면 "직접 체험하기" 버튼이 나타남
```

프론트는 `sendMentorMessage()`가 `{ content, canProceed }`만 돌려주면 되므로,
BE 응답 형태만 맞춰주면 화면 코드는 수정 불필요합니다.
엔드포인트 URL은 환경변수 `VITE_MENTOR_API`로 지정할 수 있어요(미지정 시 `/api/mentor`).

## 폴더 구조

```
src/
├── App.tsx                # 화면 라우팅 + 폰 프레임 + 경고 시트/토스트
├── app/AppContext.ts      # 화면 이동/토스트/케이스 등 공용 API
├── lib/mentor.ts          # ⭐ 멘토 대화 (LLM 연결 지점, 지금은 mock)
├── data/mentorPrompt.ts   # 멘토 시스템 프롬프트
├── screens/
│   ├── StockList.tsx      # 주식앱(랜딩)
│   ├── Hub.tsx            # 체험 허브
│   ├── NegCompound.tsx    # 음의 복리 체험(슬라이더)
│   ├── Quiz.tsx           # 용어 퀴즈
│   ├── TradeSim.tsx       # 모의투자 시뮬
│   ├── MentorChat.tsx     # 금융 멘토 채팅(자유 입력)
│   ├── SurgeGame.tsx      # 급등주 타이밍 게임
│   ├── CompoundRisk.tsx   # 흔들림 장세 복리 체험(본주 vs 2배 ETF)
│   └── Order.tsx          # 주문(데모)
├── components/WarningSheet.tsx
└── styles.css             # 초록 테마 스타일
```

## 참고

- 실제 돈이 아닌 **교육용 모의 데이터**입니다. 특정 상품을 추천하지 않습니다.
- 멘토 응답은 현재 mock이라 정해진 톤으로만 답합니다 (LLM 연결 전).
