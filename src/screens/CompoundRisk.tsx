import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

/** 흔들림(±vol%) 장세를 20일간 만들어, 본주(1배)와 2배 ETF를 일별 재계산 */
function makeSeries(vol: number) {
  const days = 20;
  const v1 = [100];
  const v2 = [100];
  let sign = Math.random() < 0.5 ? 1 : -1;
  for (let i = 1; i <= days; i++) {
    const r = (sign * (0.45 + Math.random() * 0.55) * vol) / 100; // 지그재그 + 랜덤 크기
    sign = -sign;
    v1.push(v1[i - 1] * (1 + r));
    v2.push(v2[i - 1] * (1 + 2 * r)); // 2배 ETF는 매일 2배로 재계산
  }
  return { v1, v2, days };
}

export default function CompoundRisk() {
  const { go } = useApp();
  const [vol, setVol] = useState(3);
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [day, setDay] = useState(0);
  const seriesRef = useRef(makeSeries(3));
  const timerRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clear = () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = undefined; };
  useEffect(() => () => clear(), []);

  const start = () => {
    const s = makeSeries(vol);
    seriesRef.current = s;
    setPhase('running');
    setDay(0);
    clear();
    timerRef.current = window.setInterval(() => {
      setDay((d) => {
        if (d >= s.days) { clear(); setPhase('done'); return d; }
        return d + 1;
      });
    }, 240);
  };

  const s = seriesRef.current;
  const v1 = s.v1[day];
  const v2 = s.v2[day];
  const diff = Math.abs(v1 - v2);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const all = s.v1.concat(s.v2);
    let min = Math.min(...all), max = Math.max(...all);
    const pad = 12, gap = max - min || 1; min -= gap * 0.12; max += gap * 0.12;
    const X = (i: number) => pad + (i * (w - 2 * pad)) / s.days;
    const Y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
    // baseline 100
    ctx.strokeStyle = '#E5E8EB'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, Y(100)); ctx.lineTo(w - pad, Y(100)); ctx.stroke(); ctx.setLineDash([]);
    const line = (arr: number[], color: string, wd: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= day; i++) { i ? ctx.lineTo(X(i), Y(arr[i])) : ctx.moveTo(X(i), Y(arr[i])); }
      ctx.stroke();
    };
    line(s.v1, '#9AA4B0', 2);      // 본주 회색
    line(s.v2, '#10A79B', 2.6);    // 2배 ETF 초록
    if (day > 0) {
      ctx.fillStyle = '#9AA4B0'; ctx.beginPath(); ctx.arc(X(day), Y(s.v1[day]), 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#10A79B'; ctx.beginPath(); ctx.arc(X(day), Y(s.v2[day]), 4, 0, 7); ctx.fill();
    }
  }, [day, s]);

  const status = phase === 'done' ? '20일 완료' : phase === 'running' ? `${day}일째 비교 중` : '준비';
  const diffText = phase === 'ready' ? '흔들림 강도를 정해보세요' : `지금 ${diff.toFixed(1)}만원 차이`;

  return (
    <section className="screen active" id="game3">
      <div className="topbar"><button className="back" onClick={() => { clear(); go('mentor'); }}>‹</button><div className="title">흔들림 장세 복리 체험</div></div>
      <div className="scroll">
        <div className="cr-progtop">
          <div className="cr-prog"><i style={{ width: `${(day / s.days) * 100}%` }} /></div>
          <div className="cr-progn">{day}/{s.days}일</div>
        </div>

        <div className="cr-h1">같이 흔들렸는데,<br />왜 내 돈이 더 줄었을까요?</div>
        <div className="cr-sub">100만원으로 시작한 본주와 2배 ETF를 천천히 비교해보세요.</div>

        <div className="cr-slider">
          <div className="lab"><span>흔들림 강도</span><b>±{vol}%</b></div>
          <input type="range" min={2} max={8} step={1} value={vol} disabled={phase === 'running'} onChange={(e) => setVol(+e.target.value)} />
        </div>

        <div className="cr-cards">
          <div className="cr-card">
            <div className="cl"><span className="cr-dot" style={{ background: '#9AA4B0' }} />본주</div>
            <div className="cv">{phase === 'ready' ? '-' : `${v1.toFixed(1)}만원`}</div>
            <div className="cr">수익률 {phase === 'ready' ? '-' : `${(v1 - 100 >= 0 ? '+' : '') + (v1 - 100).toFixed(1)}%`}</div>
          </div>
          <div className="cr-card etf">
            <div className="cl"><span className="cr-dot" style={{ background: '#10A79B' }} />2배 ETF</div>
            <div className="cv" style={{ color: 'var(--blue-dark)' }}>{phase === 'ready' ? '-' : `${v2.toFixed(1)}만원`}</div>
            <div className="cr">수익률 {phase === 'ready' ? '-' : `${(v2 - 100 >= 0 ? '+' : '') + (v2 - 100).toFixed(1)}%`}</div>
          </div>
        </div>

        <div className="cr-chartwrap"><canvas ref={canvasRef} /></div>

        <div className="cr-status">{status}</div>
        <div className="cr-diff">{diffText}</div>

        {phase === 'done' && (
          <div className="explain" style={{ marginTop: 12 }}>
            같은 장에서 똑같이 흔들렸는데, 2배 ETF는 <b>{(v2 - 100).toFixed(1)}%</b>로 본주(<b>{(v1 - 100).toFixed(1)}%</b>)보다 뒤처졌어요. 매일 2배로 다시 계산되기 때문에, 오르내림이 반복될수록 손해가 쌓이는 <b>음의 복리</b>예요.
          </div>
        )}
      </div>
      <div className="cta">
        {phase === 'running' ? (
          <button className="btn btn-primary" disabled>● 천천히 보여드리는 중</button>
        ) : (
          <button className="btn btn-primary" onClick={start}>{phase === 'done' ? '다시 체험하기' : '▶ 체험 시작하기'}</button>
        )}
        {phase === 'done' && <button className="btn btn-ghost" onClick={() => go('list')}>주식앱으로 돌아가기</button>}
      </div>
    </section>
  );
}
