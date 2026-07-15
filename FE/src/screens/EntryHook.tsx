import { useApp } from '../app/AppContext';
import { HOOK_LINES } from '../lib/mentor';

const HOOK_EMOJI: Record<string, string> = {
  surge: '🚀',
  compound: '📉',
  etf: '🔄',
};

export default function EntryHook() {
  const { go, caseType } = useApp();

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('list')}>‹</button><div className="title">잠깐!</div></div>

      <div className="scroll" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="hook" style={{ width: '100%', padding: '40px 24px', textAlign: 'center' }}>
          <div className="tag">투자 전 꼭 확인하세요</div>
          <h2 className="big" style={{ display: 'block', fontSize: 30, margin: '18px 0' }}>
            {HOOK_LINES[caseType]}
          </h2>
          <p>30초만 투자하면 왜 그런지 알 수 있어요</p>
          <div className="emoji">{HOOK_EMOJI[caseType]}</div>
        </div>
      </div>

      <div className="cta">
        <button className="btn btn-primary" onClick={() => go('mentor')}>확인하러 가기 →</button>
      </div>
    </section>
  );
}
