import { Router } from 'express';
import OpenAI from 'openai';
import { saveMessage } from '../db.js';

const router = Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' });
const MODEL = 'gpt-4o-mini';

/** 질문 턴 개수 (이후 한 턴은 항상 최종 턴) */
const QUESTION_TURNS = 3;

const INFERRED_STATE_SCHEMA =
  '"inferred_state":{"mental_model":"string","risk_belief":"string","market_frame":"string","confusion_point":"string","confidence_level":"low|medium|high"}';

function turnInstruction(turnIndex) {
  if (turnIndex >= QUESTION_TURNS) {
    return (
      `이번에 만들 턴은 ${turnIndex + 1}번째이며 마지막(최종) 턴입니다. ` +
      '다른 텍스트 없이 아래 JSON 형식으로만 응답하세요.\n' +
      `{"turn_type":"final","summary_of_user_state":["string"],"final_explanation":["string"],` +
      `"final_actions":[{"id":"string","label":"A","text":"string"}],${INFERRED_STATE_SCHEMA}}`
    );
  }
  return (
    `이번에 만들 턴은 ${turnIndex + 1}번째 질문 턴입니다 (총 ${QUESTION_TURNS}개 중). ` +
    '다른 텍스트 없이 아래 JSON 형식으로만 응답하세요.\n' +
    `{"turn_type":"question","question_axis":"what|why|when|how|where|who","hint":"string",` +
    `"prompt":"string","choices":[{"id":"string","label":"A","text":"string"}],${INFERRED_STATE_SCHEMA}}`
  );
}

router.post('/', async (req, res) => {
  const { system, caseType, user_id: userId, answeredTurns } = req.body ?? {};

  if (!system || !Array.isArray(answeredTurns)) {
    return res.status(400).json({ error: 'system과 answeredTurns(배열)가 필요합니다.' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'user_id가 필요합니다.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되어 있지 않습니다. BE/.env를 확인하세요.' });
  }

  // 방금 사용자가 고른 답변만 저장한다 (해당 질문 턴 자체는 지난 응답에서 이미 저장됨)
  const lastAnswered = answeredTurns[answeredTurns.length - 1];
  if (lastAnswered) {
    const chosenText =
      lastAnswered.turn.choices.find((c) => c.id === lastAnswered.chosenChoiceId)?.text ??
      lastAnswered.chosenChoiceId;
    saveMessage(userId, caseType, 'user', chosenText);
  }

  const turnIndex = answeredTurns.length;
  const conversation = answeredTurns.flatMap(({ turn, chosenChoiceId }) => {
    const chosenText = turn.choices.find((c) => c.id === chosenChoiceId)?.text ?? chosenChoiceId;
    return [
      { role: 'assistant', content: JSON.stringify(turn) },
      { role: 'user', content: chosenText },
    ];
  });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        ...conversation,
        { role: 'user', content: turnInstruction(turnIndex) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const { inferred_state, ...turn } = JSON.parse(raw);

    saveMessage(userId, caseType, 'assistant', JSON.stringify(turn));
    res.json({ turn, inferred_state });
  } catch (err) {
    console.error(`[mentor] caseType=${caseType} turnIndex=${turnIndex}`, err);
    res.status(502).json({ error: 'LLM 호출에 실패했습니다.' });
  }
});

export default router;
