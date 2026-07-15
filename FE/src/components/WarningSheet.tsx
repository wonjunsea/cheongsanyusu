import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';

const CHECKS = [
  '손익이 지수의 2배로 움직인다는 걸 이해했어요',
  '장기 보유 시 음의 복리로 손실이 날 수 있음을 알아요',
  '대출·빚이 아닌, 잃어도 되는 여윳돈으로 투자해요',
];

export default function WarningSheet({ open, product }: { open: boolean; product: string }) {
  const { closeWarning, openOrder } = useApp();
  const [checks, setChecks] = useState([false, false, false]);

  useEffect(() => {
    if (open) setChecks([false, false, false]);
  }, [open]);

  const allChecked = checks.every(Boolean);
  const toggle = (i: number) =>
    setChecks((c) => c.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className={'sheet' + (open ? ' open' : '')}>
      <div className="dim" onClick={closeWarning} />
      <div className="spanel">
        <div className="grabber" />
        <div className="warn-scroll">
          <span className="warn-badge">⚠ 빚투 위험 안내</span>
          <h2 className="warn-title">지금 고르신 건<br /><b>{product}</b>이에요.<br />투자 전에 꼭 확인하세요.</h2>
          <p className="warn-lead">레버리지·인버스 상품은 지수 움직임의 <b>2배로 손익이 커지는</b> 고위험 상품이에요. 특히 대출·빚으로 투자하면 손실이 감당하기 어려워질 수 있어요.</p>
          <div className="fact"><div className="fic">📈</div><div><div className="ft">변동성이 2배예요</div><div className="fd">지수가 3% 내리면 이 상품은 약 6% 내려요.</div></div></div>
          <div className="fact"><div className="fic">🌀</div><div><div className="ft">오래 들수록 불리해요 (음의 복리)</div><div className="fd">오르락내리락만 해도 원금이 깎여요. '음의 복리 체험'에서 직접 확인해보세요.</div></div></div>
          <div className="fact"><div className="fic">💳</div><div><div className="ft">빚으로 투자하면 위험이 배가돼요</div><div className="fd">신용·미수로 산 뒤 하락하면 반대매매로 원금 이상 잃을 수 있어요.</div></div></div>
          <div className="check">
            <div className="ck-title">아래 내용을 이해했는지 확인해주세요</div>
            {CHECKS.map((c, i) => (
              <div key={i} className={'ck' + (checks[i] ? ' on' : '')} onClick={() => toggle(i)}>
                <div className="box">✓</div><div>{c}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 8 }} />
        </div>
        <div className="cta">
          <button
            className="btn btn-primary"
            disabled={!allChecked}
            onClick={() => { closeWarning(); openOrder(product, '고위험 레버리지 상품'); }}
          >
            이해했어요, 계속하기
          </button>
          <button className="btn btn-ghost" onClick={closeWarning}>돌아가기</button>
        </div>
      </div>
    </div>
  );
}
