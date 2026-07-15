import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

interface Candle { o: number; h: number; l: number; c: number; crash?: boolean; }
interface Bid { price: number; qty: number; }
interface G {
  price: number; holdings: number; avg: number;
  bids: Bid[]; candles: Candle[];
  attempts: number; filledQty: number; filledValue: number; ended: boolean;
}

// 급등(18,200 → 29,480) 후 악재로 24,100까지 하락한 캔들 히스토리(초봉 느낌)
function seedCandles(): Candle[] {
  const pts = [18200, 19800, 21500, 23200, 25400, 27600, 29480, 28900, 27200, 25600, 24100];
  const cs: Candle[] = [];
  for (let i = 1; i < pts.length; i++) {
    const o = pts[i - 1], c = pts[i];
    cs.push({ o, h: Math.max(o, c) * 1.008, l: Math.min(o, c) * 0.992, c });
  }
  return cs;
}
// 매수호가(bids): 잔량이 얇음 — 100주 던지면 여러 호가를 잡아먹으며 급락
const INIT_BIDS: Bid[] = [
  { price: 24050, qty: 15 }, { price: 23800, qty: 20 }, { price: 23400, qty: 16 },
  { price: 22900, qty: 18 }, { price: 22300, qty: 14 }, { price: 21400, qty: 22 }, { price: 20200, qty: 15 },
];
// 매도호가(asks): 표시용 고정
const ASKS: Bid[] = [
  { price: 24100, qty: 640 }, { price: 24150, qty: 2100 }, { price: 24250, qty: 890 },
  { price: 24400, qty: 1800 }, { price: 24550, qty: 3200 },
];

export default function SurgeGame() {
  const { go, toast, nextCase, hasNextCase } = useApp();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const gRef = useRef<G | null>(null);
  const [, setTick] = useState(0);
  const rerender = () => setTick((x) => x + 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const clear = () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = undefined; };
  useEffect(() => () => clear(), []);

  const pushCandle = (g: G, o: number, c: number, crash = false) => {
    const h = Math.max(o, c) * (1 + Math.random() * 0.004);
    const l = Math.min(o, c) * (1 - Math.random() * 0.004);
    g.candles.push({ o, h, l, c, crash });
    if (g.candles.length > 26) g.candles.shift();
  };

  const start = () => {
    gRef.current = {
      price: 24100, holdings: 100, avg: 18200,
      bids: INIT_BIDS.map((b) => ({ ...b })), candles: seedCandles(),
      attempts: 0, filledQty: 0, filledValue: 0, ended: false,
    };
    setPhase('play');
    rerender();
    clear();
    timerRef.current = window.setInterval(() => {
      const g = gRef.current; if (!g || g.ended) return;
      const prev = g.candles[g.candles.length - 1].c;
      const c = prev * (1 + (Math.random() * 0.006 - 0.004)); // 악재로 살짝 하락 편향
      pushCandle(g, prev, c);
      g.price = c;
      rerender();
    }, 1200);
  };

  const sell = () => {
    const g = gRef.current; if (!g || g.ended) return;
    if (g.holdings <= 0) { toast('보유 수량이 없어요'); return; }
    const before = g.price;
    let remaining = g.holdings;
    let lastPrice = g.price;
    for (const b of g.bids) {
      if (remaining <= 0) break;
      if (b.qty <= 0) continue;
      const take = Math.min(remaining, b.qty);
      b.qty -= take; remaining -= take;
      g.filledQty += take; g.filledValue += take * b.price;
      lastPrice = b.price;
    }
    g.holdings = remaining;
    g.price = lastPrice;
    g.attempts++;
    pushCandle(g, before, lastPrice, true); // 급락 캔들 (한 캔들이 크게 내려감)
    rerender();
    if (g.holdings <= 0 || g.bids.every((b) => b.qty <= 0)) endGame();
  };

  const endGame = () => {
    const g = gRef.current; if (!g) return;
    g.ended = true; clear();
    setPhase('result'); rerender();
  };

  // 캔들차트 그리기
  useEffect(() => {
    const g = gRef.current; const cv = canvasRef.current;
    if (!g || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cs = g.candles;
    const hi = Math.max(...cs.map((k) => k.h)), lo = Math.min(...cs.map((k) => k.l));
    const pad = 10, range = hi - lo || 1;
    const Y = (v: number) => pad + (1 - (v - lo) / range) * (h - 2 * pad);
    const n = cs.length, cw = (w - 2 * pad) / n, bw = Math.min(cw * 0.6, 12);
    cs.forEach((k, i) => {
      const x = pad + i * cw + cw / 2;
      const up = k.c >= k.o;
      const col = k.crash ? '#F04452' : up ? '#F04452' : '#3182F6';
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
      const yo = Y(k.o), yc = Y(k.c);
      const top = Math.min(yo, yc), bh = Math.max(Math.abs(yc - yo), 1.5);
      ctx.fillRect(x - bw / 2, top, bw, bh);
    });
  });

  const g = gRef.current;
  const pnl = g ? ((g.price - g.avg) / g.avg) * 100 : 0;
  const avgFill = g && g.filledQty ? g.filledValue / g.filledQty : 0;

  return (
    <section className="screen active" id="game2">
      <div className="topbar"><button className="back" onClick={() => { clear(); go('mentor'); }}>‹</button><div className="title">호가창 탈출</div></div>
      <div className="gamewrap" style={{ overflowY: 'auto' }}>
        {phase === 'intro' && (
          <div className="g-overlay">
            <div className="g-badge">급등주 유동성 위험 체험</div>
            <h2 className="g-title">지금 팔면<br />될 것 같나요?</h2>
            <p className="g-desc">급등주는 팔고 싶을 때 <b>항상 팔 수 있는 게 아니에요.</b> ㈜모바일히어로 100주(+62%)를 들고 있는데 악재가 터졌어요. 시장가로 팔아보고 무슨 일이 벌어지는지 직접 겪어보세요.</p>
            <button className="btn btn-primary" onClick={start}>게임 시작 →</button>
          </div>
        )}

        {(phase === 'play' || phase === 'result') && g && (
          <div className="ob-wrap">
            <div className="ob-news">🚨 감사원 회계 의혹 · 기관 매도 · 개인 패닉 매도</div>

            <div className="ob-chartbox">
              <div className="ob-chart-t">모바일히어로 초봉 차트</div>
              <div className="ob-chartwrap"><canvas ref={canvasRef} /></div>
            </div>

            <div className="ob-stats">
              <div><div className="l">매수가</div><div className="v">{fmt(g.avg)}</div></div>
              <div><div className="l">현재가</div><div className="v" style={{ color: '#F04452' }}>{fmt(g.price)}</div></div>
              <div><div className="l">평가손익</div><div className="v" style={{ color: pnl >= 0 ? '#12B886' : '#3182F6' }}>{(pnl >= 0 ? '+' : '') + pnl.toFixed(1)}%</div></div>
            </div>

            <div className="ob-book">
              <div className="ob-row ob-head"><span>잔량</span><span>호가</span></div>
              {ASKS.map((a, i) => (
                <div key={'a' + i} className="ob-row ob-ask"><span>{fmt(a.qty)}</span><span>{fmt(a.price)}</span></div>
              ))}
              <div className="ob-row ob-spread"><span>스프레드</span><span>{fmt(ASKS[0].price - g.bids[0].price)}원</span></div>
              {g.bids.map((b, i) => (
                <div key={'b' + i} className={'ob-row ob-bid' + (b.qty <= 0 ? ' empty' : '')}><span>{fmt(b.price)}</span><span>{b.qty <= 0 ? '—' : fmt(b.qty)}</span></div>
              ))}
            </div>

            {phase === 'play' && (
              <div className="ob-order">
                <div className="ob-order-t">매도 주문</div>
                <div className="ob-tabs"><button className="on">시장가</button><button disabled>지정가</button><button disabled>최유리</button></div>
                <div className="ob-qty">수량 <b>{g.holdings}주 (전량)</b></div>
                <button className="ob-sell" onClick={sell}>⚡ 시장가 매도 실행</button>
                <div className="ob-fill">
                  <div><div className="l">시도</div><div className="v">{g.attempts}회</div></div>
                  <div><div className="l">체결</div><div className="v" style={{ color: '#12B886' }}>{g.filledQty}주</div></div>
                  <div><div className="l">미체결</div><div className="v">{g.holdings}주</div></div>
                </div>
              </div>
            )}

            {phase === 'result' && (
              <div className="ob-result">
                <div className="g-badge" style={{ color: '#F04452' }}>💥 유동성 함정</div>
                <h2 className="g-title" style={{ fontSize: 22 }}>팔긴 팔았는데…</h2>
                <div className="res-cards">
                  <div className="res-c"><div className="rc-l">평균 체결가</div><div className="rc-v" style={{ color: '#F04452' }}>{fmt(avgFill)}</div><div className="rc-t">호가창 급락</div></div>
                  <div className="res-c"><div className="rc-l">기대(시작가)</div><div className="rc-v">24,100</div><div className="rc-t">팔릴 줄 알았던 값</div></div>
                  <div className="res-c"><div className="rc-l">유동성 손실</div><div className="rc-v" style={{ color: '#F04452' }}>{fmt((24100 - avgFill) * g.filledQty)}</div><div className="rc-t">원</div></div>
                </div>
                <p className="g-desc">시장가로 던지는 순간 얇은 매수 호가를 다 잡아먹으며 <b>가격이 급락</b>했어요. 급등주는 "지금 팔면 되겠지"가 안 통해요 — <b>팔 사람이 없으면 원하는 값에 못 팝니다.</b></p>
                <button className="btn btn-primary" onClick={nextCase}>{hasNextCase ? '다음 체험 →' : '완료'}</button>
                <button className="btn btn-ghost" onClick={start}>다시 해보기</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
