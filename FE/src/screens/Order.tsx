import { useApp } from '../app/AppContext';

export default function Order() {
  const { go, toast, order } = useApp();
  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('list')}>‹</button><div className="title">{order.name}</div></div>
      <div className="scroll">
        <div style={{ textAlign: 'center', padding: '34px 0 10px' }}>
          <div style={{ fontSize: 52 }}>🧾</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '14px 0 6px' }}>{order.name}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--sub2)', lineHeight: 1.6, margin: '0 24px' }}>{order.desc}</p>
        </div>
        <div className="panelbox" style={{ background: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)', marginBottom: 6 }}>💡 알아두기</div>
          <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>
            이 화면은 데모예요. 고위험 상품은 주문 전에 <b>금융 멘토 안내</b>가 먼저 떠요.
          </div>
        </div>
      </div>
      <div className="cta"><button className="btn btn-primary" onClick={() => toast('데모: 주문이 접수되었어요')}>매수하기</button></div>
    </section>
  );
}
