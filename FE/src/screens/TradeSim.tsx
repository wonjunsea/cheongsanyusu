import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

interface SimState {
  price: number; day: number; cash: number; qty: number; avg: number; hist: number[]; chg: number;
}
const INIT: SimState = { price: 10000, day: 0, cash: 1000000, qty: 0, avg: 0, hist: [10000], chg: 0 };

export default function TradeSim() {
  const { go, toast } = useApp();
  const [s, setS] = useState<SimState>({ ...INIT, hist: [10000] });
  const [log, setLog] = useState<string[]>(['모의투자 시작 · 현금 100만원']);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pushLog = (html: string) => setLog((l) => [html, ...l]);

  const nextDay = () => {
    setS((prev) => {
      const idxMove = (Math.random() * 10 - 5) / 100;
      const levMove = idxMove * 2;
      const price = Math.max(500, prev.price * (1 + levMove));
      const hist = [...prev.hist, price].slice(-30);
      const day = prev.day + 1;
      const tag = levMove >= 0
        ? `<span class="win">+${(levMove * 100).toFixed(1)}%</span>`
        : `<span class="lose">${(levMove * 100).toFixed(1)}%</span>`;
      pushLog(`Day ${day} · 지수 ${(idxMove * 100).toFixed(1)}% → 레버리지 ${tag} · 가격 ${fmt(price)}원`);
      return { ...prev, price, hist, day, chg: levMove * 100 };
    });
  };

  const buy = () => {
    setS((prev) => {
      const cost = prev.price * 10;
      if (prev.cash < cost) { toast('현금이 부족해요'); return prev; }
      const avg = (prev.avg * prev.qty + cost) / (prev.qty + 10);
      pushLog(`🔴 매수 10주 @${fmt(prev.price)}원`);
      return { ...prev, avg, qty: prev.qty + 10, cash: prev.cash - cost };
    });
  };

  const sell = () => {
    setS((prev) => {
      if (prev.qty < 10) { toast('보유수량이 부족해요'); return prev; }
      const gain = prev.price * 10;
      const realized = (prev.price - prev.avg) * 10;
      pushLog(`🟢 매도 10주 @${fmt(prev.price)}원 · 실현손익 ${(realized >= 0 ? '+' : '') + fmt(realized)}`);
      const qty = prev.qty - 10;
      return { ...prev, qty, cash: prev.cash + gain, avg: qty === 0 ? 0 : prev.avg };
    });
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const draw = () => {
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const a = s.hist;
      let min = Math.min(...a), max = Math.max(...a);
      const pad = 10, gap = max - min || 1; min -= gap * 0.12; max += gap * 0.12;
      const X = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(a.length - 1, 1);
      const Y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
      const rising = a[a.length - 1] >= a[0];
      const col = rising ? '#F04452' : '#3182F6';
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, rising ? 'rgba(240,68,82,.18)' : 'rgba(49,130,246,.18)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); a.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
      ctx.lineTo(X(a.length - 1), h - pad); ctx.lineTo(X(0), h - pad); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); a.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(a.length - 1), Y(a[a.length - 1]), 3.5, 0, 7); ctx.fill();
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [s.hist]);

  const pnl = (s.price - s.avg) * s.qty;

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('home')}>‹</button><div className="title">모의투자 · KODEX 레버리지</div></div>
      <div className="scroll">
        <div className="simhead">
          <div className="snm">KODEX 레버리지 <span className="tag-risk" style={{ marginLeft: 4 }}>2X</span></div>
          <div className="sp">{fmt(s.price)}원</div>
          <div className="sc" style={{ color: s.chg > 0 ? 'var(--red)' : s.chg < 0 ? 'var(--blue)' : 'var(--sub2)' }}>
            {(s.chg >= 0 ? '+' : '') + s.chg.toFixed(1)}% (오늘)
          </div>
        </div>
        <div className="chartwrap" style={{ height: 150, background: '#fff', borderRadius: 16, padding: '8px 6px', margin: '0 2px 12px' }}>
          <canvas ref={canvasRef} />
        </div>

        <div className="simstat">
          <div><div className="l">현금</div><div className="v">{fmt(s.cash)}</div></div>
          <div><div className="l">보유수량</div><div className="v">{s.qty}주</div></div>
          <div><div className="l">평가손익</div><div className="v" style={{ color: pnl > 0 ? 'var(--red)' : pnl < 0 ? 'var(--blue)' : 'var(--ink)' }}>{(pnl > 0 ? '+' : '') + fmt(pnl)}</div></div>
        </div>

        <button className="day-btn" onClick={nextDay}>⏭ 하루 지나기</button>
        <div className="trade-row">
          <button className="btn-red" onClick={buy}>매수 (10주)</button>
          <button className="btn-green" onClick={sell}>매도 (10주)</button>
        </div>

        <div className="simlog">
          {log.map((h, i) => <div key={i} dangerouslySetInnerHTML={{ __html: h }} />)}
        </div>
        <div className="simnote">실제 돈이 아닌 모의 자금이에요. '하루 지나기'를 누르면 지수 ±α의 <b>2배</b>로 가격이 움직입니다. 며칠 돌려보면 왜 위험한지 몸으로 느껴져요.</div>
        <div style={{ height: 16 }} />
      </div>
    </section>
  );
}
