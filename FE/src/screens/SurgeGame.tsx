import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

interface Candle { o: number; h: number; l: number; c: number; }
interface G {
  price: number; holdings: number; buy: number;
  candles: Candle[]; cur: Candle;      // 완성된 캔들 + 지금 형성 중인 캔들
  open: number; target: number; step: number; count: number; crashing: boolean;
  sold: boolean; sellPrice: number | null; ended: boolean;
}

const BUY = 18200;
const REF = 30000;         // 전고점 = 고정 기준선(초록). 가격은 이 아래에서만 논다.
const CAP = REF * 0.985;    // 실시간 상한 (기준선 코앞까지)
const FLOOR = 1700;
const TRIGGER = REF * 0.94; // 이 위로 닿으면 다음 캔들부터 바로 급락
const MAX_CANDLES = 13;
const STEP_MS = 100;
const STEPS = 20;           // 20 * 100ms = 캔들 1개당 2초

function nextTarget(o: number, crashing: boolean) {
  if (!crashing) return Math.min(CAP, o * (1 + 0.14 + Math.random() * 0.16)); // 급등: 빠르게 기준선까지
  return Math.max(FLOOR, o * (1 - (0.22 + Math.random() * 0.28)));            // 급락: 팍! (-22~50%)
}

export default function SurgeGame() {
  const { go } = useApp();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const gRef = useRef<G | null>(null);
  const [, setT] = useState(0);
  const rerender = () => setT((x) => x + 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const clear = () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = undefined; };
  useEffect(() => () => clear(), []);

  const start = () => {
    gRef.current = {
      price: BUY, holdings: 100, buy: BUY,
      candles: [], cur: { o: BUY, h: BUY, l: BUY, c: BUY },
      open: BUY, target: nextTarget(BUY, false), step: 0, count: 0, crashing: false,
      sold: false, sellPrice: null, ended: false,
    };
    setPhase('play');
    rerender();
    clear();
    timerRef.current = window.setInterval(tick, STEP_MS);
  };

  const tick = () => {
    const g = gRef.current; if (!g || g.ended) return;
    g.step++;
    const frac = g.step / STEPS;
    // 목표가로 이동 + 위아래 지터(극적으로 흔들림), 끝으로 갈수록 지터 감소
    const base = g.open + (g.target - g.open) * frac;
    const jitter = (Math.random() - 0.5) * g.open * 0.06 * (1 - frac * 0.5);
    let c = Math.min(CAP, Math.max(FLOOR, base + jitter));
    g.cur.c = c;
    g.cur.h = Math.max(g.cur.h, c);
    g.cur.l = Math.min(g.cur.l, c);
    g.price = c;
    if (g.step >= STEPS) {
      // 캔들 확정
      g.candles.push(g.cur);
      g.count++;
      if (!g.crashing && g.cur.c >= TRIGGER) g.crashing = true; // 기준선 닿으면 즉시 급락 모드
      if (g.count >= MAX_CANDLES || g.cur.c <= FLOOR + 80) { rerender(); endGame(false); return; }
      const o = g.cur.c;
      g.open = o; g.target = nextTarget(o, g.crashing);
      g.cur = { o, h: o, l: o, c: o }; g.step = 0;
    }
    rerender();
  };

  const sell = () => {
    const g = gRef.current; if (!g || g.ended) return;
    endGame(true);
  };

  const endGame = (sold: boolean) => {
    const g = gRef.current; if (!g) return;
    g.sold = sold;
    g.sellPrice = sold ? g.price : null;
    g.ended = true; clear();
    setPhase('result'); rerender();
  };

  // 라이브 캔들 차트 (기준선 고정, y범위 고정)
  useEffect(() => {
    if (phase !== 'play' && phase !== 'result') return;
    const g = gRef.current; const cv = canvasRef.current;
    if (!g || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const lo = 1200, hi = REF * 1.05, pad = 14;
    const Y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (h - 2 * pad);
    // 고정 초록 기준선(전고점) — 맨 위
    ctx.strokeStyle = '#12B886'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(pad, Y(REF)); ctx.lineTo(w - pad, Y(REF)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#12B886'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`전고점(기준선) ${fmt(REF)}`, pad + 2, Y(REF) - 5);
    // 매수가 선(회색)
    ctx.strokeStyle = 'rgba(154,164,176,.4)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pad, Y(BUY)); ctx.lineTo(w - pad, Y(BUY)); ctx.stroke(); ctx.setLineDash([]);
    // 캔들 (완성 + 형성중)
    const all = g.ended ? g.candles : g.candles.concat([g.cur]);
    const slots = MAX_CANDLES + 1, cw = (w - 2 * pad) / slots, bw = Math.min(cw * 0.55, 16);
    all.forEach((k, i) => {
      const x = pad + i * cw + cw / 2;
      const col = k.c >= k.o ? '#12B886' : '#F04452';
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
      const yo = Y(k.o), yc = Y(k.c);
      ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(Math.abs(yc - yo), 2));
    });
    // 결과 화면: 내가 판 가격 선 (기준선 초록과 다른 주황색)
    if (phase === 'result') {
      const spLine = g.sellPrice ?? g.price;
      ctx.strokeStyle = '#FFB020'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(pad, Y(spLine)); ctx.lineTo(w - pad, Y(spLine)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#FFB020'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${g.sold ? '내가 판 가격' : '못 판 최종가'} ${fmt(spLine)}`, pad + 2, Y(spLine) + 13);
    }
  });

  const g = gRef.current;
  const pnlPct = g ? ((g.price - g.buy) / g.buy) * 100 : 0;
  const sp = g?.sellPrice ?? g?.price ?? 0;
  const missedFromPeak = g ? (REF - sp) * g.holdings : 0;
  const realizedVsBuy = g ? (sp - BUY) * g.holdings : 0;
  const stage = g ? (g.crashing ? '급락 중 📉' : '급등 중 🚀') : '';

  return (
    <section className="screen active" id="game2">
      <div className="topbar"><button className="back" onClick={() => { clear(); go('mentor'); }}>‹</button><div className="title">호가창 탈출</div></div>
      <div className="gamewrap" style={{ overflowY: 'auto' }}>

        {phase === 'intro' && (
          <div className="g-overlay">
            <div className="g-badge">급등주 급락 체험</div>
            <h2 className="g-title">고점에서<br />팔 수 있을까요?</h2>
            <p className="g-desc">㈜모바일히어로 100주를 <b>18,200원</b>에 샀어요. 초록 기준선은 <b>전고점(30,000원)</b>. 캔들이 2초씩 <b>실시간으로 요동</b>치며 급등했다가 악재로 급락합니다. 늦기 전에 <b>매도</b>하세요.</p>
            <button className="btn btn-primary" onClick={start}>게임 시작 →</button>
          </div>
        )}

        {phase === 'play' && g && (
          <div className="ob-wrap">
            <div className="ob-news">🚨 감사원 회계 의혹 · 기관 매도 · 개인 패닉 매도</div>
            <div className="ob-chartbox">
              <div className="ob-chart-t">모바일히어로 초봉 차트 · <span style={{ color: g.crashing ? '#F04452' : '#12B886' }}>{stage}</span></div>
              <div className="ob-chartwrap" style={{ height: 200 }}><canvas ref={canvasRef} /></div>
            </div>
            <div className="ob-stats">
              <div><div className="l">매수가</div><div className="v">{fmt(g.buy)}</div></div>
              <div><div className="l">현재가</div><div className="v" style={{ color: pnlPct >= 0 ? '#12B886' : '#F04452' }}>{fmt(g.price)}</div></div>
              <div><div className="l">평가손익</div><div className="v" style={{ color: pnlPct >= 0 ? '#12B886' : '#F04452' }}>{(pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(1)}%</div></div>
            </div>
            <button className="ob-sell" onClick={sell}>⚡ 지금 매도 (100주)</button>
            <div className="ob-hint">기준선(전고점) 코앞까지 갔다가 무너져요. 급등에 취해 기다릴수록 급락에 물립니다.</div>
          </div>
        )}

        {phase === 'result' && g && (
          <div className="ob-wrap">
            <div style={{ textAlign: 'center', paddingTop: 6 }}>
              <div style={{ fontSize: 48 }}>{!g.sold ? '😱' : realizedVsBuy >= 0 ? '😮‍💨' : '😱'}</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '10px 0 6px' }}>
                {!g.sold ? '손쓸 새도 없이 폭락' : realizedVsBuy >= 0 ? '수익은 냈지만…' : '손실 확정'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#9AA4B2', lineHeight: 1.6, margin: '0 10px 14px' }}>
                {!g.sold ? `팔지 못하고 ${fmt(sp)}원까지 떨어졌어요.` : `${fmt(sp)}원에 매도했어요.`}
              </p>
            </div>

            <div className="ob-chartbox">
              <div className="ob-chart-t">모바일히어로 초봉 차트</div>
              <div className="ob-chartwrap" style={{ height: 180 }}><canvas ref={canvasRef} /></div>
            </div>

            <div className="ob-loss">
              <div className="ob-loss-l">전고점 대비 증발한 금액</div>
              <div className="ob-loss-v">-{fmt(missedFromPeak)}원</div>
              <div className="ob-loss-sub">
                전고점 {fmt(REF)}원에 팔 수 있었다면 받았을 돈에서 {fmt(missedFromPeak)}원이 날아갔어요.<br />
                매수가(18,200원) 대비 실현손익 {realizedVsBuy >= 0 ? '+' : ''}{fmt(realizedVsBuy)}원
              </div>
            </div>

            <div className="ob-lesson">
              <div className="ob-lesson-t">🔎 아시나요? 실제 사례입니다</div>
              <p>2023년 <b>SG증권발 하한가 사태</b> 때, 여러 종목이 <b>8거래일 연속 하한가</b>로 고점 대비 <b>-70~80%</b> 폭락했어요.</p>
              <p>급등한 종목은 <b>팔 기회조차 주지 않고</b> 무너집니다. "지금 팔면 되겠지"가 안 통해요.</p>
            </div>

            <button className="btn btn-primary" onClick={start} style={{ marginTop: 6 }}>다시 해보기</button>
            <button className="btn btn-ghost" onClick={() => go('list')}>주식앱으로 돌아가기</button>
          </div>
        )}
      </div>
    </section>
  );
}
