import { useApp } from '../app/AppContext';

// 3번 케이스(ETF) — 아직 내용 미정. 순서(1→2→3) 유지를 위한 자리표시 화면.
export default function EtfPlaceholder() {
  const { go, nextCase } = useApp();
  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('mentor')}>‹</button><div className="title">ETF 체험</div></div>
      <div className="scroll">
        <div style={{ textAlign: 'center', padding: '60px 20px 20px' }}>
          <div style={{ fontSize: 56 }}>🚧</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '18px 0 10px' }}>ETF 체험 준비 중</h2>
          <p style={{ fontSize: 14, color: 'var(--sub2)', lineHeight: 1.65, margin: '0 16px' }}>
            세 번째 체험(ETF 관련 위험)은 곧 추가될 예정이에요.<br />
            지금은 급등주 · 음의 복리 체험까지 완료했어요!
          </p>
        </div>
      </div>
      <div className="cta">
        <button className="btn btn-primary" onClick={nextCase}>완료 · 주식앱으로</button>
      </div>
    </section>
  );
}
