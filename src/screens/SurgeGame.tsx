import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
const FOMO_UP = ['🚀 지금 안 사면 늦어요!', '🔥 가즈아!!', '📈 이건 무조건 간다', '💎 존버는 승리', '🤑 아직 안 늦었다', '👀 다들 사는 중'];
const FOMO_DN = ['😨 어? 왜 빠지지', '📉 손절 각인가', '😱 지금 팔아야 하나', '💦 나만 물린 건가', '🩸 폭락이다...'];

interface G {
  price: number; start: number; cash: number; qty: number; avg: number;
  t: number; hist: number[]; phase: 'rise' | 'crash'; crashAt: number; peak: number; ended: boolean;
}
interface Snap {
  price: number; chg: number; heat: number; cash: number; qty: number; pnl: number; hist: number[]; fomo: string; panic: boolean;
}
interface Result {
  total: number; pnl: number; peakDd: number; badge: string; badgeColor: string; title: string; lesson: string;
}

function snapshot(g: G, fomo: string, panic: boolean): Snap {
  const chg = (g.price / g.start - 1) * 100;
  const heat = Math.max(0, Math.min(100, ((g.price / g.start - 1) / 1.2) * 100));
  return { price: g.price, chg, heat, cash: g.cash, qty: g.qty, pnl: (g.price - g.avg) * g.qty, hist: [...g.hist], fomo, panic };
}

export default function SurgeGame() {
  const { go, toast } = useApp();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const [snap, setSnap] = useState<Snap | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const gRef = useRef<G | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clear = () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = undefined; };
  useEffect(() => () => clear(), []);

  const start = () => {
    const g: G = { price: 10000, start: 10000, cash: 1000000, qty: 0, avg: 0, t: 0, hist: [10000], phase: 'rise', crashAt: 8 + Math.floor(Math.random() * 8), peak: 10000, ended: false };
    gRef.current = g;
    setResult(null);
    setPhase('play');
    setSnap(snapshot(g, '🚀 지금이 기회!', false));
    clear();
    timerRef.current = window.setInterval(tick, 650);
  };

  const tick = () => {
    const g = gRef.current;
    if (!g || g.ended) { clear(); return; }
    g.t++;
    let r = 0;
    if (g.phase === 'rise') { r = 0.03 + Math.random() * 0.07; if (g.t >= g.crashAt) g.phase = 'crash'; }
    if (g.phase === 'crash') { r = -(0.08 + Math.random() * 0.14); }
    g.price = Math.max(300, g.price * (1 + r));
    if (g.price > g.peak) g.peak = g.price;
    g.hist.push(g.price); if (g.hist.length > 40) g.hist.shift();
    const rising = g.phase === 'rise';
    const fomo = (rising ? FOMO_UP : FOMO_DN)[Math.floor(Math.random() * (rising ? FOMO_UP.length : FOMO_DN.length))];
    setSnap(snapshot(g, fomo, !rising));
    if (g.phase === 'crash' && g.t >= g.crashAt + 6) endGame();
  };

  const buy = () => {
    const g = gRef.current; if (!g || g.ended) return;
    if (g.cash < g.price) { toast('현금이 부족해요'); return; }
    const q = Math.floor(g.cash / g.price);
    g.avg = (g.avg * g.qty + g.price * q) / (g.qty + q); g.qty += q; g.cash -= g.price * q;
    toast(`${q.toLocaleString('ko-KR')}주 매수`);
    setSnap(snapshot(g, snap?.fomo ?? '', snap?.panic ?? false));
  };
  const sell = () => {
    const g = gRef.current; if (!g || g.ended) return;
    if (g.qty <= 0) { toast('보유 수량이 없어요'); return; }
    g.cash += g.qty * g.price; toast(`${g.qty.toLocaleString('ko-KR')}주 매도`); g.qty = 0; g.avg = 0;
    setSnap(snapshot(g, snap?.fomo ?? '', snap?.panic ?? false));
  };

  const endGame = () => {
    const g = gRef.current; if (!g) return;
    g.ended = true; clear();
    const total = g.cash + g.qty * g.price;
    const pnl = total - 1000000;
    const peakDd = (g.price / g.peak - 1) * 100;
    let badge = '', badgeColor = '', title = '', lesson = '';
    if (g.qty > 0) {
      badge = '🩸 물렸어요'; badgeColor = '#F04452'; title = '못 팔고 물렸어요';
      lesson = `급락이 시작되면 팔 기회를 놓치기 쉬워요. 고점 대비 ${peakDd.toFixed(0)}%까지 빠졌어요. 급등주는 언제 꺼질지 아무도 모릅니다.`;
    } else if (pnl > 0) {
      badge = '🎉 수익 실현'; badgeColor = '#12B886'; title = '운 좋게 빠져나왔네요';
      lesson = '이번엔 타이밍이 맞았지만 순전히 운이에요. 매번 급락 직전에 팔 수는 없어요. 대부분은 고점에 사서 물립니다.';
    } else {
      badge = '📉 손실'; badgeColor = '#F04452'; title = '결국 손해였어요';
      lesson = '급등주 추격 매수는 손실로 끝나기 쉬워요. 싸게 사서 비싸게 판다는 건, 급등주에서는 거의 불가능합니다.';
    }
    setResult({ total, pnl, peakDd, badge, badgeColor, title, lesson });
    setPhase('result');
  };

  // 차트 그리기
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !snap) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const a = snap.hist;
    let min = Math.min(...a), max = Math.max(...a);
    const pad = 8, gap = max - min || 1; min -= gap * 0.1; max += gap * 0.12;
    const X = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(a.length - 1, 1);
    const Y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
    const rising = !snap.panic;
    const col = rising ? '#F04452' : '#3182F6';
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rising ? 'rgba(240,68,82,.25)' : 'rgba(49,130,246,.25)');
    grad.addColorStop(1, 'rgba(11,14,20,0)');
    ctx.beginPath(); a.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.lineTo(X(a.length - 1), h - pad); ctx.lineTo(X(0), h - pad); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); a.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(a.length - 1), Y(a[a.length - 1]), 4, 0, 7); ctx.fill();
  }, [snap]);

  const heatTxt = snap ? (snap.heat > 75 ? '⚠ 과열' : snap.heat > 40 ? '상승' : '보통') : '보통';

  return (
    <section className="screen active" id="game2">
      <div className="topbar"><button className="back" onClick={() => { clear(); go('mentor'); }}>‹</button><div className="title">급등주 타이밍</div></div>
      <div className="gamewrap">
        {phase !== 'intro' && snap && (
          <>
            <div className="g2-top">
              <div className="g2-price">{fmt(snap.price)}원</div>
              <div className="g2-chg" style={{ color: snap.chg >= 0 ? '#F04452' : '#3182F6' }}>{(snap.chg >= 0 ? '+' : '') + snap.chg.toFixed(1)}%</div>
              <div className="g2-heat"><div className="g2-heat-bar" style={{ width: `${snap.heat}%` }} /></div>
              <div className="g2-heat-l"><span>과열도</span><span>{heatTxt}</span></div>
            </div>
            <div className="g2-chartwrap"><canvas ref={canvasRef} /></div>
          </>
        )}

        {phase === 'play' && snap && (
          <>
            <div className={'g2-fomo' + (snap.panic ? ' panic' : '')}>{snap.fomo}</div>
            <div className="g2-stat">
              <div><div className="l">현금</div><div className="v">{fmt(snap.cash)}</div></div>
              <div><div className="l">보유</div><div className="v">{snap.qty}주</div></div>
              <div><div className="l">평가손익</div><div className="v" style={{ color: snap.pnl > 0 ? '#F04452' : snap.pnl < 0 ? '#3182F6' : '#fff' }}>{(snap.pnl > 0 ? '+' : '') + fmt(snap.pnl)}</div></div>
            </div>
            <div className="g2-trade">
              <button className="g2-buy" onClick={buy}>매수 (전액)</button>
              <button className="g2-sell" onClick={sell}>매도 (전량)</button>
            </div>
          </>
        )}

        {phase === 'intro' && (
          <div className="g-overlay">
            <div className="g-badge">급등주 타이밍 게임</div>
            <h2 className="g-title">급등하는 종목,<br />언제 사고 팔래요?</h2>
            <p className="g-desc">가격이 빠르게 <b>급등</b>하다가 <b>어느 순간 급락</b>해요. 언제 급락할지는 아무도 몰라요. <b>매수</b>로 올라타고 <b>매도</b>로 팔아서 수익을 내보세요. 초기 자금 100만원.</p>
            <button className="btn btn-primary" onClick={start}>매매 시작</button>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="g-overlay res">
            <div className="g-badge" style={{ color: result.badgeColor }}>{result.badge}</div>
            <h2 className="g-title">{result.title}</h2>
            <div className="res-cards">
              <div className="res-c"><div className="rc-l">최종 자산</div><div className="rc-v">{fmt(result.total)}</div><div className="rc-t">현금+평가</div></div>
              <div className="res-c"><div className="rc-l">손익</div><div className="rc-v" style={{ color: result.pnl >= 0 ? '#12B886' : '#F04452' }}>{(result.pnl >= 0 ? '+' : '') + fmt(result.pnl)}</div><div className="rc-t">원금 대비</div></div>
              <div className="res-c"><div className="rc-l">고점 대비</div><div className="rc-v">{result.peakDd.toFixed(0)}%</div><div className="rc-t">현재가</div></div>
            </div>
            <p className="g-desc">{result.lesson}</p>
            <button className="btn btn-primary" onClick={start}>다시 매매</button>
            <button className="btn btn-ghost" onClick={() => go('list')}>주식앱으로 돌아가기</button>
          </div>
        )}
      </div>
    </section>
  );
}
