import { useEffect, useRef, useState } from 'react';
import { useApp, CASE_EXPERIENCE } from '../app/AppContext';
import { sendMentorMessage, MENTOR_GREETINGS, type ChatMessage } from '../lib/mentor';

export default function MentorChat() {
  const { go, caseType } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: MENTOR_GREETINGS[caseType] },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지마다 아래로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setTyping(true);
    // ⭐ 여기서 멘토(LLM)에게 답변 요청 — 실제 연결 지점은 src/lib/mentor.ts
    const reply = await sendMentorMessage(next, caseType);
    setTyping(false);
    setMessages([...next, { role: 'assistant', content: reply.content }]);
    if (reply.canProceed) setCanProceed(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  };

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('list')}>‹</button><div className="title">🧑‍🏫 금융 멘토</div></div>

      <div className="scroll chatscroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + (m.role === 'assistant' ? 'bot' : 'user')}>
            {m.role === 'assistant' && <div className="av">🧑‍🏫</div>}
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {typing && (
          <div className="msg bot typing">
            <div className="av">🧑‍🏫</div>
            <div className="bubble"><span className="dots">● ● ●</span></div>
          </div>
        )}
      </div>

      {canProceed && (
        <div className="chat-cta">
          <button className="btn btn-primary" onClick={() => go(CASE_EXPERIENCE[caseType])}>다음 · 직접 체험하기 →</button>
        </div>
      )}

      <div className="chat-input">
        <input
          type="text"
          placeholder="답장을 입력하세요…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button className="send" onClick={send} disabled={typing || !input.trim()}>전송</button>
      </div>
    </section>
  );
}
