import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

interface Candle { o: number; h: number; l: number; c: number; crash?: boolean; }
interface Bid { price: number; qty: number; }
interface TP { label: string; price: number; kind: 'buy' | 'seed' | 'fill' | 'fail'; }
interface G {
  price: number; holdings: number; avg: number;
  bids: Bid[]; candles: Candle[]; timeline: TP[];
  attempts: number; filledQty: number; exhausted: boolean; ended: boolean;
}

const PEAK = 29480;

// 급등(18,200 → 29,480) 후 악재로 24,100까지 하락한 초봉 캔들
function seedCandles(): Candle[] {
  const pts = [18200, 19800, 21500, 23200, 25400, 27600, 29480, 28900, 27200, 25600, 24100];
  const cs: Candle[] = [];
  for (let i = 1; i < pts.length; i++) {
    const o = pts[i - 1], c = pts[i];
    cs.push({ o, h: Math.max(o, c) * 1.008, l: Math.min(o, c) * 0.992, c });
  }
  return cs;
}
function seedTimeline(): TP[] {
  return [
    { label: 'D-3 매수', price: 18200, kind: 'buy' },
    { label: 'D-2', price: 22000, kind: 'seed' },
    { label: 'D-1', price: 25800, kind: 'seed' },
    { label: 'D0 고점', price: PEAK, kind: 'seed' },
    { label: '악재 발생', price: 24100, kind: 'seed' },
  ];
}
// 매수호가(bids): 잔량이 극히 얇음 — 몇 번 던지면 매수자가 사라짐 (총 7주)
const INIT_BIDS: Bid[] = [
  { price: 24050, qty: 2 }, { price: 23700, qty: 2 }, { price: 23300, qty: 1 },
  { price: 22900, qty: 1 }, { price: 22400, qty: 1 },
];
const ASKS: Bid[] = [
  { price: 24100, qty: 640 }, { price: 24150, qty: 2100 }, { price: 24250, qty: 890 },
  { price: 24400, qty: 1800 }, { price: 24550, qty: 3200 },
];

export default function SurgeGame() {
  const { go, toast } = useApp();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const gRef = useRef<G | null>(null);
  const [, setT] = useState(0);
  const rerender = () => setT((x) => x + 1);
  const playCanvas = useRef<HTMLCanvasElement>(null);
  const resCanvas = useRef<HTMLCanvasElement>(null);

  const start = () => {
    gRef.current = {
      price: 24100, holdings: 100, avg: 18200,
      bids: INIT_BIDS.map((b) => ({ ...b })), candles: seedCandles(), timeline: seedTimeline(),
      attempts: 0, filledQty: 0, exhausted: false, ended: false,
    };
    setPhase('play');
    rerender();
  };

  const pushCandle = (g: G, o: number, c: number, crash = false) => {
    g.candles.push({ o, h: Math.max(o, c) * 1.003, l: Math.min(o, c) * 0.997, c, crash });
    if (g.candles.length > 26) g.candles.shift();
  };

  const sell = () => {
    const g = gRef.current; if (!g || g.ended) return;
    if (g.holdings <= 0) { toast('이미 다 팔았어요'); return; }
    const before = g.price;
    const bid = g.bids.find((b) => b.qty > 0);
    g.attempts++;
    if (bid) {
      const take = Math.min(g.holdings, bid.qty);
      bid.qty -= take;
      g.holdings -= take;
      g.filledQty += take;
      g.price = bid.price;
      g.timeline.push({ label: `시도${g.attempts}`, price: bid.price, kind: 'fill' });
      pushCandle(g, before, bid.price, true);
      if (g.bids.every((b) => b.qty <= 0)) g.exhausted = true;
    } else {
      // 매수 잔량 소진 -> 매도 실패
      g.price = Math.round(g.price * 0.994);
      g.timeline.push({ label: `시도${g.attempts}`, price: g.price, kind: 'fail' });
      pushCandle(g, before, g.price);
      g.exhausted = true;
      toast('매수 잔량이 없어요! 팔 사람이 사라졌어요');
    }
    rerender();
  };

  const showResult = () => {
    const g = gRef.current; if (!g) return;
    g.ended = true; setPhase('result'); rerender();
  };

  // 플레이: 캔들차트
  useEffect(() => {
    if (phase !== 'play') return;
    const g = gRef.current; const cv = playCanvas.current;
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
      const col = k.c >= k.o && !k.crash ? '#F04452' : k.crash || k.c < k.o ? '#3182F6' : '#F04452';
      const c2 = k.crash ? '#F04452' : k.c >= k.o ? '#F04452' : '#3182F6';
      ctx.strokeStyle = c2; ctx.fillStyle = c2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
      const yo = Y(k.o), yc = Y(k.c);
      ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(Math.abs(yc - yo), 1.5));
      void col;
    });
  });

  // 결과: 매매 타임라인 (라인 + 체결/실패 마커)
  useEffect(() => {
    if (phase !== 'result') return;
    const g = gRef.current; const cv = resCanvas.current;
    if (!g || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const tl = g.timeline;
    const lo = 18000, hi = 30000, pad = 18, range = hi - lo;
    const X = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(tl.length - 1, 1);
    const Y = (v: number) => pad + (1 - (v - lo) / range) * (h - 2 * pad);
    // baseline 매수가
    ctx.strokeStyle = 'rgba(18,184,134,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, Y(18200)); ctx.lineTo(w - pad, Y(18200)); ctx.stroke(); ctx.setLineDash([]);
    // line
    ctx.strokeStyle = '#F0656F'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); tl.forEach((p, i) => (i ? ctx.lineTo(X(i), Y(p.price)) : ctx.moveTo(X(i), Y(p.price)))); ctx.stroke();
    // markers
    tl.forEach((p, i) => {
      const x = X(i), y = Y(p.price);
      if (p.kind === 'fail') {
        ctx.strokeStyle = '#F04452'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
      } else {
        ctx.fillStyle = p.kind === 'fill' || p.kind === 'buy' ? '#12B886' : '#9AA4B0';
        ctx.beginPath(); ctx.arc(x, y, p.kind === 'seed' ? 2.5 : 4, 0, 7); ctx.fill();
      }
    });
  });

  const g = gRef.current;
  const pnl = g ? ((g.price - g.avg) / g.avg) * 100 : 0;
  const dropFromPeak = g ? ((PEAK - g.price) / PEAK) * 100 : 0;

  return (
    <section className="screen active" id="game2">
      <div className="topbar"><button className="back" onClick={() => go('mentor')}>‹</button><div className="title">호가창 탈출</div></div>
      <div className="gamewrap" style={{ overflowY: 'auto' }}>

        {phase === 'intro' && (
          <div className="g-overlay">
            <div className="g-badge">급등주 유동성 위험 체험</div>
            <h2 className="g-title">지금 팔면<br />될 것 같나요?</h2>
            <p className="g-desc">급등주는 팔고 싶을 때 <b>항상 팔 수 있는 게 아니에요.</b> ㈜모바일히어로 100주(+62%)를 들고 있는데 악재가 터졌어요. 시장가로 팔아보고 무슨 일이 벌어지는지 직접 겪어보세요.</p>
            <button className="btn btn-primary" onClick={start}>게임 시작 →</button>
          </div>
        )}

        {phase === 'play' && g && (
          <div className="ob-wrap">
            <div className="ob-news">🚨 감사원 회계 의혹 · 기관 매도 · 개인 패닉 매도</div>
            <div className="ob-chartbox">
              <div className="ob-chart-t">모바일히어로 초봉 차트</div>
              <div className="ob-chartwrap"><canvas ref={playCanvas} /></div>
            </div>
            <div className="ob-stats">
              <div><div className="l">매수가</div><div className="v">{fmt(g.avg)}</div></div>
              <div><div className="l">현재가</div><div className="v" style={{ color: '#F04452' }}>{fmt(g.price)}</div></div>
              <div><div className="l">평가손익</div><div className="v" style={{ color: pnl >= 0 ? '#12B886' : '#3182F6' }}>{(pnl >= 0 ? '+' : '') + pnl.toFixed(1)}%</div></div>
            </div>
            <div className="ob-book">
              <div className="ob-row ob-head"><span>잔량</span><span>호가</span></div>
              {ASKS.map((a, i) => (<div key={'a' + i} className="ob-row ob-ask"><span>{fmt(a.qty)}</span><span>{fmt(a.price)}</span></div>))}
              <div className="ob-row ob-spread"><span>스프레드</span><span>{fmt(ASKS[0].price - g.bids[0].price)}원</span></div>
              {g.bids.map((b, i) => (<div key={'b' + i} className={'ob-row ob-bid' + (b.qty <= 0 ? ' empty' : '')}><span>{fmt(b.price)}</span><span>{b.qty <= 0 ? '소진' : fmt(b.qty)}</span></div>))}
            </div>
            <div className="ob-order">
              <div className="ob-order-t">매도 주문</div>
              <div className="ob-tabs"><button className="on">시장가</button><button disabled>지정가</button><button disabled>최유리</button></div>
              <div className="ob-qty">수량 <b>{g.holdings}주 (전량)</b></div>
              <button className="ob-sell" onClick={sell}>⚡ 시장가 매도 실행</button>
              <div className="ob-fill">
                <div><div className="l">시도</div><div className="v">{g.attempts}회</div></div>
                <div><div className="l">체결</div><div className="v" style={{ color: '#12B886' }}>{g.filledQty}주</div></div>
                <div><div className="l">미체결</div><div className="v" style={{ color: '#F04452' }}>{g.holdings}주</div></div>
              </div>
              {g.exhausted && (
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={showResult}>결과 보기 →</button>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && g && (
          <div className="ob-wrap">
            <div style={{ textAlign: 'center', paddingTop: 6 }}>
              <div style={{ fontSize: 48 }}>😱</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '10px 0 8px' }}>{g.holdings}주 매도 실패</h2>
              <p style={{ fontSize: 13.5, color: '#9AA4B2', lineHeight: 1.6, margin: '0 10px 16px' }}>
                {g.attempts}번 시도했지만 {g.holdings}주가 여전히 손에 남아있어요.<br />매수자가 모두 사라졌습니다.
              </p>
            </div>

            <div className="ob-chartbox">
              <div className="ob-chart-t">📊 내 매매 타임라인</div>
              <div className="ob-chartwrap" style={{ height: 160 }}><canvas ref={resCanvas} /></div>
            </div>

            <div className="ob-summary">
              매수가 <b>18,200원</b> → 고점 <b>29,480원</b> (+62%) → 현재 <b>{fmt(g.price)}원</b><br />
              고점 대비 ▼{fmt(PEAK - g.price)}원 ({dropFromPeak.toFixed(1)}%) 하락 · 매수가 대비 {g.price >= 18200 ? '+' : ''}{fmt(g.price - 18200)}원 {g.price >= 18200 ? '이익' : '손실'}이지만 <b>팔지 못했어요.</b>
            </div>

            <div className="res-cards" style={{ flexWrap: 'wrap' }}>
              <div className="res-c" style={{ minWidth: '46%' }}><div className="rc-l">매도 시도</div><div className="rc-v">{g.attempts}회</div></div>
              <div className="res-c" style={{ minWidth: '46%' }}><div className="rc-l">체결 수량</div><div className="rc-v" style={{ color: '#12B886' }}>{g.filledQty}주</div></div>
              <div className="res-c" style={{ minWidth: '46%' }}><div className="rc-l">미체결</div><div className="rc-v" style={{ color: '#F04452' }}>{g.holdings}주</div></div>
              <div className="res-c" style={{ minWidth: '46%' }}><div className="rc-l">고점 대비 낙폭</div><div className="rc-v" style={{ color: '#F04452' }}>-{dropFromPeak.toFixed(1)}%</div></div>
            </div>

            <div className="ob-lesson">
              <div className="ob-lesson-t">📌 이 게임이 가르치는 것</div>
              <p>호가창의 <b>매수 잔량이 순식간에 소진</b>되어 매도 주문이 체결되지 못했어요.</p>
              <p>급등주는 <b>악재 뉴스 하나에 매수자가 증발</b>합니다.</p>
            </div>

            <button className="btn btn-primary" onClick={start} style={{ marginTop: 6 }}>다시 해보기</button>
            <button className="btn btn-ghost" onClick={() => go('list')}>주식앱으로 돌아가기</button>
          </div>
        )}
      </div>
    </section>
  );
}
