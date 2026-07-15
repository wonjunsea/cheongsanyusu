import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';

function buildPaths(vol: number, days: number) {
  const s = vol / 100;
  const idx = [1];
  const lev = [1];
  for (let i = 1; i <= days; i++) {
    const target = i % 2 === 1 ? 1 - s : 1; // 홀수일 하락, 짝수일 원위치
    const r = target / idx[i - 1] - 1;
    idx.push(target);
    lev.push(lev[i - 1] * (1 + 2 * r));
  }
  return { idx, lev };
}

export default function NegCompound() {
  const { go } = useApp();
  const [vol, setVol] = useState(10);
  const [days, setDays] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { idx, lev } = useMemo(() => buildPaths(vol, days), [vol, days]);
  const idxFinal = (idx[days] - 1) * 100;
  const levFinal = (lev[days] - 1) * 100;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const draw = () => {
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const all = idx.concat(lev);
      let min = Math.min(...all), max = Math.max(...all);
      const pad = 16, gap = max - min || 0.1; min -= gap * 0.1; max += gap * 0.1;
      const X = (i: number) => pad + (i * (w - 2 * pad)) / (idx.length - 1);
      const Y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
      ctx.strokeStyle = '#EDF0F3'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad, Y(1)); ctx.lineTo(w - pad, Y(1)); ctx.stroke(); ctx.setLineDash([]);
      const line = (arr: number[], color: string, wd: number) => {
        ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.lineJoin = 'round';
        ctx.beginPath(); arr.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
      };
      line(idx, '#8B95A1', 2);
      line(lev, '#F04452', 2.6);
      ctx.fillStyle = '#8B95A1'; ctx.beginPath(); ctx.arc(X(idx.length - 1), Y(idx[idx.length - 1]), 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#F04452'; ctx.beginPath(); ctx.arc(X(lev.length - 1), Y(lev[lev.length - 1]), 4, 0, 7); ctx.fill();
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [idx, lev]);

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('home')}>‹</button><div className="title">음의 복리 시뮬레이터</div></div>
      <div className="scroll">
        <div className="h1">지수는 제자리인데<br />내 돈은 줄어들어요</div>
        <div className="hsub">레버리지 상품은 매일 2배로 다시 계산돼서, 오르락내리락만 반복해도 원금이 깎여요. 이걸 '음의 복리(변동성 손실)'라고 해요.</div>

        <div className="panelbox">
          <div className="chartwrap"><canvas ref={canvasRef} /></div>
          <div className="legend">
            <span><i className="dot" style={{ background: '#8B95A1' }} />지수(원본)</span>
            <span><i className="dot" style={{ background: '#F04452' }} />2배 레버리지</span>
          </div>
        </div>

        <div className="ctrl">
          <div className="lab"><span>가격 출렁임 정도</span><b>{vol}%</b></div>
          <input type="range" min={2} max={20} value={vol} step={1} onChange={(e) => setVol(+e.target.value)} />
          <div className="seg">
            {[10, 20, 30].map((d) => (
              <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d}일</button>
            ))}
          </div>
        </div>

        <div className="result">
          <div className="rescard idx"><div className="rl">지수 최종</div><div className="rv">{(idxFinal >= 0 ? '+' : '') + idxFinal.toFixed(1)}%</div></div>
          <div className="rescard lev"><div className="rl">레버리지 최종</div><div className="rv" style={{ color: levFinal >= 0 ? 'var(--red)' : 'var(--blue)' }}>{(levFinal >= 0 ? '+' : '') + levFinal.toFixed(1)}%</div></div>
        </div>

        <div className="explain">
          지수는 <b>{(idxFinal >= 0 ? '+' : '') + idxFinal.toFixed(1)}%</b>로 거의 제자리인데, 2배 레버리지는 <b style={{ color: 'var(--blue)' }}>{levFinal.toFixed(1)}%</b>예요. 등락을 반복할수록 이 차이가 벌어집니다. 출렁임을 키우거나 기간을 늘려보세요 — 손실이 더 커져요.
        </div>
      </div>
    </section>
  );
}
