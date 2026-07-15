import { useApp } from '../app/AppContext';

// ETF 케이스 — 아직 내용 미정. 랜덤으로 뽑혔을 때 보여주는 자리표시 화면.
export default function EtfPlaceholder() {
  const { go } = useApp();
  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('mentor')}>‹</button><div className="title">ETF 체험</div></div>
      <div className="scroll">
        <div style={{ textAlign: 'center', padding: '60px 20px 20px' }}>
          <div style={{ fontSize: 56 }}>🚧</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '18px 0 10px' }}>ETF 체험 준비 중</h2>
          <p style={{ fontSize: 14, color: 'var(--sub2)', lineHeight: 1.65, margin: '0 16px' }}>
            ETF 관련 위험 체험은 곧 추가될 예정이에요.<br />
            (급등주 · 음의 복리 체험은 지금 바로 해볼 수 있어요!)
          </p>
        </div>
      </div>
      <div className="cta">
        <button className="btn btn-primary" onClick={() => go('list')}>주식앱으로 돌아가기</button>
      </div>
    </section>
  );
}
