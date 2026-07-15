import { useEffect, useRef, useState } from 'react';
import { useApp, CASE_EXPERIENCE } from '../app/AppContext';
import { fetchNextTurn, type AnsweredTurn, type MentorTurn } from '../lib/mentor';

export default function MentorChat() {
  const { go, caseType } = useApp();
  const [answeredTurns, setAnsweredTurns] = useState<AnsweredTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<MentorTurn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNextTurn(caseType, [])
      .then((res) => setCurrentTurn(res.turn))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [currentTurn, loading]);

  const choose = async (choiceId: string) => {
    if (!currentTurn || currentTurn.turn_type !== 'question' || loading) return;
    const next: AnsweredTurn[] = [...answeredTurns, { turn: currentTurn, chosenChoiceId: choiceId }];
    setAnsweredTurns(next);
    setCurrentTurn(null);
    setLoading(true);
    try {
      const res = await fetchNextTurn(caseType, next);
      setCurrentTurn(res.turn);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('list')}>‹</button><div className="title">🧑‍🏫 금융 멘토</div></div>

      <div className="scroll chatscroll" ref={scrollRef}>
        {answeredTurns.map((a, i) => (
          <div key={i}>
            <div className="msg bot">
              <div className="av">🧑‍🏫</div>
              <div className="bubble">{a.turn.prompt}</div>
            </div>
            <div className="msg user">
              <div className="bubble">
                {a.turn.choices.find((c) => c.id === a.chosenChoiceId)?.text}
              </div>
            </div>
          </div>
        ))}

        {currentTurn?.turn_type === 'question' && (
          <div className="msg bot">
            <div className="av">🧑‍🏫</div>
            <div className="bubble">{currentTurn.prompt}</div>
          </div>
        )}

        {currentTurn?.turn_type === 'final' && (
          <div className="msg bot">
            <div className="av">🧑‍🏫</div>
            <div className="bubble">
              {[...currentTurn.summary_of_user_state, ...currentTurn.final_explanation].join('\n\n')}
            </div>
          </div>
        )}

        {loading && (
          <div className="msg bot typing">
            <div className="av">🧑‍🏫</div>
            <div className="bubble"><span className="dots">● ● ●</span></div>
          </div>
        )}

        {error && (
          <div className="msg bot">
            <div className="av">🧑‍🏫</div>
            <div className="bubble">멘토 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.</div>
          </div>
        )}
      </div>

      {currentTurn?.turn_type === 'question' && !loading && (
        <div className="scroll" style={{ flex: 'none', maxHeight: '40%' }}>
          {currentTurn.choices.map((c) => (
            <div key={c.id} className="opt" onClick={() => choose(c.id)}>
              <div className="ob">{c.label}</div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {currentTurn?.turn_type === 'final' && !loading && (
        <div className="chat-cta" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentTurn.final_actions.map((a) => (
            <button key={a.id} className="btn btn-primary" onClick={() => go(CASE_EXPERIENCE[caseType])}>
              {a.text}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
