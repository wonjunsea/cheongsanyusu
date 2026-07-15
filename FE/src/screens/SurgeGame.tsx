import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../app/AppContext";
import "./SurgeGame.css";

type GamePhase = "intro" | "rising" | "target" | "crashing" | "locked" | "liquidityReturn" | "result";
type Outcome = "success" | "loss" | null;

type CandleTick = {
  open: number;
  high: number;
  low: number;
  close: number;
  buyers: number;
  sellers: number;
};

const BUY_PRICE = 38_500;
const TARGET_PRICE = 41_000;
const LIMIT_PRICE = 24_500;
const TARGET_TICK_INDEX = 11;
const CRASH_START_INDEX = 12;
const CRASH_END_INDEX = 14;
const TARGET_WINDOW_MS = 180;
const RISING_DURATIONS = [680, 920, 560, 860, 250, 210, 170, 220, 140, 180, 120, 160];
const CRASH_DURATIONS = [520, 780, 620];
const LIVE_PATTERNS = [
  {
    progress: [0, 0.12, 0.28, 0.42, 0.58, 0.76, 1],
    wobble: [0, -0.46, 0.38, -0.72, 0.3, -0.18, 0],
    timing: [0, 0.11, 0.28, 0.51, 0.63, 0.84, 1],
  },
  {
    progress: [0, 0.18, 0.32, 0.49, 0.64, 0.81, 1],
    wobble: [0, 0.32, 0.18, -0.58, -0.25, 0.22, 0],
    timing: [0, 0.18, 0.34, 0.47, 0.72, 0.88, 1],
  },
  {
    progress: [0, 0.1, 0.25, 0.45, 0.6, 0.78, 1],
    wobble: [0, -0.38, -0.22, 0.46, 0.25, -0.33, 0],
    timing: [0, 0.08, 0.37, 0.5, 0.69, 0.92, 1],
  },
  {
    progress: [0, 0.22, 0.36, 0.55, 0.7, 0.85, 1],
    wobble: [0, 0.45, -0.4, 0.3, -0.5, 0.15, 0],
    timing: [0, 0.15, 0.25, 0.59, 0.74, 0.86, 1],
  },
];

const getTickDuration = (phase: GamePhase, index: number) => {
  if (phase === "crashing") return CRASH_DURATIONS[index - CRASH_START_INDEX] ?? 700;
  return RISING_DURATIONS[index] ?? 720;
};

const TICKS: CandleTick[] = [
  { open: 38_500, high: 38_900, low: 38_200, close: 38_800, buyers: 62_000, sellers: 18_000 },
  { open: 38_800, high: 39_400, low: 38_650, close: 39_200, buyers: 58_000, sellers: 21_000 },
  { open: 39_200, high: 39_350, low: 38_750, close: 38_950, buyers: 57_000, sellers: 23_000 },
  { open: 38_950, high: 39_100, low: 38_650, close: 38_780, buyers: 54_000, sellers: 25_000 },
  { open: 38_780, high: 39_250, low: 38_700, close: 39_150, buyers: 52_000, sellers: 28_000 },
  { open: 39_150, high: 39_620, low: 39_050, close: 39_520, buyers: 49_000, sellers: 30_000 },
  { open: 39_520, high: 39_980, low: 39_400, close: 39_900, buyers: 46_000, sellers: 34_000 },
  { open: 39_900, high: 40_260, low: 39_800, close: 40_180, buyers: 43_000, sellers: 36_000 },
  { open: 40_180, high: 40_520, low: 40_100, close: 40_450, buyers: 40_000, sellers: 39_000 },
  { open: 40_450, high: 40_720, low: 40_350, close: 40_650, buyers: 37_000, sellers: 42_000 },
  { open: 40_650, high: 40_880, low: 40_580, close: 40_820, buyers: 34_000, sellers: 44_000 },
  { open: 40_820, high: 41_000, low: 40_760, close: 41_000, buyers: 31_000, sellers: 46_000 },
  { open: 41_000, high: 41_000, low: 36_500, close: 36_800, buyers: 9_000, sellers: 84_000 },
  { open: 36_800, high: 37_100, low: 29_700, close: 30_200, buyers: 1_200, sellers: 160_000 },
  { open: 30_200, high: 30_400, low: 24_500, close: 24_500, buyers: 0, sellers: 300_000 },
  { open: 24_500, high: 24_500, low: 24_500, close: 24_500, buyers: 0, sellers: 428_317 },
  { open: 24_500, high: 24_500, low: 24_500, close: 24_500, buyers: 1, sellers: 428_316 },
];

const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const formatCount = (value: number) => value.toLocaleString("ko-KR");

const phaseCopy: Record<GamePhase, { eyebrow: string; title: string; body: string }> = {
  intro: {
    eyebrow: "급등주 탑승 직전",
    title: "상한가 간다는데,\n돈 벌어보자",
    body: "41,000원에 도달하면 매도 버튼을 눌러 수익을 실현해보세요.",
  },
  rising: {
    eyebrow: "급등 중",
    title: "조금만 더 오르면\n수익을 확정할 수 있어요",
    body: "목표가에 닿는 순간 매도 버튼이 잠깐 열립니다.",
  },
  target: {
    eyebrow: "지금 체결 구간",
    title: "목표가 도달\n지금 매도하세요",
    body: "41,000원 매도 주문은 0.18초 동안만 체결됩니다.",
  },
  crashing: {
    eyebrow: "장대음봉 발생",
    title: "팔려고 했는데\n가격이 먼저 무너집니다",
    body: "41,000원 지정가 주문은 현재 매수호가와 만나지 못합니다.",
  },
  locked: {
    eyebrow: "하한가 잠김",
    title: "매도 버튼은 눌리지만\n체결은 되지 않습니다",
    body: "지금 가격에 사려는 사람이 0명입니다.",
  },
  liquidityReturn: {
    eyebrow: "매수 잔량 1주 등장",
    title: "이제야 팔 수 있지만\n수익은 사라졌습니다",
    body: "24,500원에 손실을 확정하고 탈출할 수 있습니다.",
  },
  result: {
    eyebrow: "체험 종료",
    title: "주문과 체결은\n서로 다릅니다",
    body: "",
  },
};

const triggerFeedback = (duration = 35) => {
  if ("vibrate" in navigator) navigator.vibrate(duration);
};

export default function SurgeGame() {
  const { go } = useApp();
  const shellRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [tickIndex, setTickIndex] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [livePrice, setLivePrice] = useState(TICKS[0].close);
  const [liveHigh, setLiveHigh] = useState(TICKS[0].high);
  const [liveLow, setLiveLow] = useState(TICKS[0].low);

  const currentTick = TICKS[tickIndex];
  const isLiquidityReady = phase === "liquidityReturn" && tickIndex === TICKS.length - 1;
  const isCrashView = tickIndex >= CRASH_START_INDEX || phase === "crashing" || phase === "locked" || phase === "liquidityReturn" || phase === "result";
  const isSurging = phase === "rising" && tickIndex >= 4;
  const currentRate = ((livePrice - BUY_PRICE) / BUY_PRICE) * 100;
  const title = phaseCopy[phase];

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    shell.scrollTop = 0;
    const phone = shell.closest<HTMLElement>(".phone");
    if (phone) phone.scrollTop = 0;
  }, [phase]);

  const chart = useMemo(() => {
    const plot = { left: 62, right: 708, top: 42, bottom: 558 };
    const min = isCrashView ? 23_500 : 37_800;
    const max = 41_500;
    const x = (index: number) => plot.left + (index / (TICKS.length - 1)) * (plot.right - plot.left);
    const y = (value: number) => plot.bottom - ((value - min) / (max - min)) * (plot.bottom - plot.top);
    return { plot, x, y };
  }, [isCrashView]);

  useEffect(() => {
    const tick = TICKS[tickIndex];
    const isLive = phase === "rising" || phase === "crashing";

    if (!isLive) {
      setLivePrice(tick.close);
      setLiveHigh(tick.high);
      setLiveLow(tick.low);
      return;
    }

    setLivePrice(tick.open);
    setLiveHigh(tick.open);
    setLiveLow(tick.open);

    const duration = getTickDuration(phase, tickIndex);
    const pattern = LIVE_PATTERNS[tickIndex % LIVE_PATTERNS.length];
    const timers = pattern.progress.slice(1).map((progress, offset) => window.setTimeout(() => {
      const step = offset + 1;
      const range = Math.max(100, tick.high - tick.low);
      const wobble = pattern.wobble[step] * range * 0.45;
      const rawPrice = tick.open + (tick.close - tick.open) * progress + wobble;
      const nextPrice = Math.round(Math.min(tick.high, Math.max(tick.low, rawPrice)) / 10) * 10;

      setLivePrice(nextPrice);
      setLiveHigh((value) => Math.max(value, nextPrice));
      setLiveLow((value) => Math.min(value, nextPrice));

    }, duration * pattern.timing[offset + 1]));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, tickIndex]);

  useEffect(() => {
    if (phase !== "rising" && phase !== "crashing") return;
    if (alertOpen || outcome === "success" && phase !== "crashing") return;

    const maxIndex = phase === "rising" ? TARGET_TICK_INDEX : CRASH_END_INDEX;
    if (tickIndex >= maxIndex) return;

    const timer = window.setTimeout(() => {
      setTickIndex((current) => {
        return Math.min(maxIndex, current + 1);
      });
    }, getTickDuration(phase, tickIndex) + 40);

    return () => window.clearTimeout(timer);
  }, [alertOpen, outcome, phase, tickIndex]);

  useEffect(() => {
    if (phase === "rising" && tickIndex === TARGET_TICK_INDEX && livePrice >= TARGET_PRICE) setPhase("target");
    if (phase === "crashing" && tickIndex === CRASH_END_INDEX && livePrice <= LIMIT_PRICE) {
      setPhase("locked");
      setTickIndex(CRASH_END_INDEX + 1);
      triggerFeedback(70);
    }
  }, [livePrice, phase, tickIndex]);

  useEffect(() => {
    if (phase !== "target") return;

    const timer = window.setTimeout(() => {
      setPhase("crashing");
      setTickIndex(CRASH_START_INDEX);
      triggerFeedback(55);
    }, TARGET_WINDOW_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "locked" || outcome !== "success") return;

    const timer = window.setTimeout(() => setPhase("result"), 1100);
    return () => window.clearTimeout(timer);
  }, [outcome, phase]);

  useEffect(() => {
    if (phase !== "liquidityReturn" || tickIndex === TICKS.length - 1) return;

    const timer = window.setTimeout(() => setTickIndex(TICKS.length - 1), 900);
    return () => window.clearTimeout(timer);
  }, [phase, tickIndex]);

  const startGame = () => {
    setPhase("rising");
    setTickIndex(0);
    setOutcome(null);
    setAlertOpen(false);
    setAttempts(0);
    setLivePrice(TICKS[0].open);
    setLiveHigh(TICKS[0].open);
    setLiveLow(TICKS[0].open);
  };

  const resetGame = () => {
    setPhase("intro");
    setTickIndex(0);
    setOutcome(null);
    setAlertOpen(false);
    setAttempts(0);
    setLivePrice(TICKS[0].close);
    setLiveHigh(TICKS[0].high);
    setLiveLow(TICKS[0].low);
  };

  const handleSell = () => {
    if (phase === "target") {
      setOutcome("success");
      setPhase("crashing");
      setTickIndex(CRASH_START_INDEX);
      triggerFeedback(25);
      return;
    }

    if (phase === "crashing" || phase === "locked") {
      setAttempts((current) => current + 1);
      setAlertOpen(true);
      triggerFeedback(70);
    }

    if (isLiquidityReady) {
      setOutcome("loss");
      setPhase("result");
      triggerFeedback(25);
    }
  };

  const dismissAlert = () => {
    setAlertOpen(false);
    if (phase === "locked" && outcome === null) {
      setPhase("liquidityReturn");
      setTickIndex(TICKS.length - 2);
    }
  };

  const liveTick: CandleTick = {
    ...currentTick,
    high: liveHigh,
    low: liveLow,
    close: livePrice,
  };
  const visibleTicks = [...TICKS.slice(0, tickIndex), liveTick];
  const gridValues = isCrashView ? [41_000, 35_000, 30_000, 24_500] : [41_000, 40_000, 39_000, 38_000];
  const movingAveragePoints = (period: number) => visibleTicks.map((_, index) => {
    const start = Math.max(0, index - period + 1);
    const values = visibleTicks.slice(start, index + 1);
    const average = values.reduce((sum, tick) => sum + tick.close, 0) / values.length;
    return `${chart.x(index)},${chart.y(average)}`;
  }).join(" ");
  const resultTitle = outcome === "success" ? "체결 성공" : "손실 확정";
  const resultBody = outcome === "success"
    ? "이번에는 0.18초의 찰나를 잡았습니다. 하지만 직후 주가는 24,500원까지 떨어졌어요."
    : "팔고 싶다는 결정만으로는 팔 수 없어요. 사려는 사람이 있어야 체결됩니다.";
  const resultSellPrice = outcome === "success" ? TARGET_PRICE : LIMIT_PRICE;
  const missedAmount = TARGET_PRICE - resultSellPrice;
  const realizedAmount = resultSellPrice - BUY_PRICE;

  return (
    <section className="screen active surge-exit-game" id="game2">
      <section ref={shellRef} className="game-shell" aria-label="급등주 탈출 타이밍 게임">
        <div className="stock-topline">
          <button className="game-back" onClick={() => go("mentor")} type="button" aria-label="금융 멘토로 돌아가기">‹</button>
          <div className="stock-identity">
            <span className="stock-name">퓨처테마</span>
            <small>009930 · 코스닥 · 신용 가능</small>
          </div>
          <div className="stock-actions">
            <span className={`market-badge ${phase === "crashing" || phase === "locked" ? "danger" : ""}`}>
              {phase === "locked" ? "하한가" : phase === "crashing" ? "급락" : isSurging ? "급등" : "장중"}
            </span>
            <button className="restart-icon" onClick={resetGame} type="button" aria-label="게임 다시 시작">↻</button>
          </div>
        </div>

        <section className={`market-card ${phase === "crashing" || phase === "locked" ? "panic" : ""}`}>
            <div className="price-readout">
              <span>현재가</span>
            <strong>{formatPrice(livePrice)}</strong>
            <small className={currentRate >= 0 ? "up-text" : "down-text"}>
              {currentRate >= 0 ? "+" : ""}{currentRate.toFixed(1)}% · 내 매수가 {formatPrice(BUY_PRICE)}
            </small>
          </div>
          <div className="liquidity-readout">
            <div>
              <span>사려는 사람</span>
              <strong className={currentTick.buyers === 0 ? "zero" : ""}>{formatCount(currentTick.buyers)}주</strong>
            </div>
            <div>
              <span>팔려는 사람</span>
              <strong>{formatCount(currentTick.sellers)}주</strong>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-period">1초봉 · 실시간</div>
            <div className="chart-label target-label" style={{ top: `${chart.y(TARGET_PRICE) / 6.2}%` }}>목표가 {formatPrice(TARGET_PRICE)}</div>
            <div className="chart-label buy-label" style={{ top: `${chart.y(BUY_PRICE) / 6.2}%` }}>내 매수가 {formatPrice(BUY_PRICE)}</div>
            <svg className="price-chart" viewBox="0 0 740 620" role="img" aria-labelledby="chart-title chart-description">
              <title id="chart-title">급등주 초봉 움직임</title>
              <desc id="chart-description">목표가에 도달한 뒤 장대음봉으로 하한가까지 떨어지는 가상 주가 차트</desc>
              {gridValues.map((value) => (
                <g className="grid-row" key={value}>
                  <line x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(value)} y2={chart.y(value)} />
                  <text x="2" y={chart.y(value) + 4}>{formatPrice(value)}</text>
                </g>
              ))}
              <line className="reference-line target-reference" x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(TARGET_PRICE)} y2={chart.y(TARGET_PRICE)} />
              <line className="reference-line buy-reference" x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(BUY_PRICE)} y2={chart.y(BUY_PRICE)} />
              <line className="live-price-guide" x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(livePrice)} y2={chart.y(livePrice)} />
              <polyline className="moving-average slow" points={movingAveragePoints(6)} />
              <polyline className="moving-average fast" points={movingAveragePoints(3)} />
              {visibleTicks.map((tick, index) => {
                const x = chart.x(index);
                const isUp = tick.close >= tick.open;
                const bodyTop = Math.min(chart.y(tick.open), chart.y(tick.close));
                const bodyHeight = Math.max(4, Math.abs(chart.y(tick.open) - chart.y(tick.close)));
                const isCurrent = index === visibleTicks.length - 1;
                return (
                  <g className={`candle ${isUp ? "up" : "down"} ${isCurrent ? "current" : ""}`} key={index}>
                    <line x1={x} x2={x} y1={chart.y(tick.high)} y2={chart.y(tick.low)} />
                    <rect height={bodyHeight} width="24" x={x - 12} y={bodyTop} rx="3" />
                  </g>
                );
              })}
              <g className={`live-price-marker ${livePrice >= currentTick.open ? "up" : "down"}`} key={`marker-${tickIndex}`} transform={`translate(${chart.plot.right - 92} ${Math.max(chart.plot.top, Math.min(chart.plot.bottom - 28, chart.y(livePrice) - 14))})`}>
                <rect width="92" height="28" rx="6" />
                <text x="46" y="19" textAnchor="middle">{livePrice.toLocaleString("ko-KR")}</text>
              </g>
              {phase === "target" ? <circle className="target-pulse" cx={chart.x(TARGET_TICK_INDEX)} cy={chart.y(TARGET_PRICE)} r="16" /> : null}
            </svg>
            <div className={`chart-event ${phase === "target" ? "target-event" : ""} ${phase === "locked" ? "locked-event" : ""}`}>
              {phase === "target" ? "목표가 도달 · 지금 매도" : phase === "locked" ? "매수 잔량 0주 · 하한가 잠김" : phase === "crashing" ? "장대음봉 · 매수세 급감" : phase === "liquidityReturn" ? (isLiquidityReady ? "매수 1주 등장" : "가격이 잠잠해지는 중") : isSurging ? "매수세 유입 · 속도가 빨라집니다" : "초봉이 움직입니다"}
            </div>
          </div>
        </section>

        {phase !== "intro" ? (
          <>
            <div className="copy-block">
              <span>{title.eyebrow}</span>
              <h1>{title.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
              <p>{phase === "result" ? resultBody : title.body}</p>
            </div>

            <div className="action-area">
              <button
                className={`sell-action ${phase === "target" ? "ready" : ""} ${phase === "locked" ? "blocked" : ""}`}
                disabled={phase === "rising" || phase === "result" || outcome === "success" || phase === "liquidityReturn" && !isLiquidityReady}
                onClick={handleSell}
                type="button"
              >
                {outcome === "success" ? "체결 완료 · +6.5%" : phase === "rising" ? "목표가까지 기다리는 중" : phase === "target" ? "41,000원에 매도" : phase === "liquidityReturn" ? "24,500원에 손실 확정" : "41,000원 지정가 매도"}
              </button>
              <small>{phase === "rising" ? "41,000원에 도달하면 버튼이 활성화됩니다." : phase === "target" ? "0.18초 안에 누르지 않으면 놓칩니다." : phase === "locked" ? "매도 주문을 내도 사려는 사람이 없습니다." : phase === "liquidityReturn" ? (isLiquidityReady ? "매수 잔량 1주가 내 주문을 받아줍니다." : "잠시만 기다리세요.") : ""}</small>
            </div>

            <div className="attempt-note" aria-live="polite">
              {attempts > 0 ? `미체결 주문 ${attempts}건 · 주문은 접수됐지만 체결되지 않았어요.` : "매도 주문은 시장에 내는 요청입니다."}
            </div>
          </>
        ) : null}

        {phase === "intro" ? (
          <div className="intro-backdrop" role="presentation">
            <section className="intro-sheet" role="dialog" aria-modal="true" aria-labelledby="intro-title">
              <div className="intro-sheet-top">
                <button className="intro-home-button" onClick={() => go("list")} type="button" aria-label="홈 화면으로 돌아가기">‹ 홈</button>
                <span className="intro-kicker">급등주 탑승 직전</span>
              </div>
              <h2 id="intro-title"><span>상한가 간다는데,</span><span>돈 벌어보자</span></h2>
              <p>41,000원에 도달하는 순간 매도 버튼을 눌러 수익을 실현해보세요.</p>
              <div className="intro-order">
                <div><span>내 매수가</span><strong>{formatPrice(BUY_PRICE)}</strong></div>
                <div><span>목표 매도가</span><strong>{formatPrice(TARGET_PRICE)}</strong></div>
              </div>
              <button onClick={startGame} type="button">도전 시작</button>
              <small>매도 기회는 단 0.18초입니다.</small>
            </section>
          </div>
        ) : null}

        {alertOpen ? (
          <div className="sheet-backdrop" role="presentation">
            <section className="warning-sheet" role="dialog" aria-modal="true" aria-labelledby="warning-title">
              <div className="sheet-handle" />
              <span className="warning-icon" aria-hidden="true">!</span>
              <span className="sheet-kicker">매도 주문 접수</span>
              <h2 id="warning-title">아직 팔리지 않았어요</h2>
              <div className="fill-status">
                <div><span>체결 수량</span><strong>0주</strong></div>
                <div><span>현재 매수 잔량</span><strong>0주</strong></div>
              </div>
              <p>사려는 사람이 없어 주문이 체결되지 않았어요. 매도 버튼을 눌렀다고 바로 팔리는 것은 아닙니다.</p>
              <button onClick={dismissAlert} type="button">확인하고 계속 보기</button>
            </section>
          </div>
        ) : null}

        {phase === "result" ? (
          <div className="result-backdrop" role="presentation">
            <section className={`result-sheet legacy-result ${outcome === "success" ? "success" : "loss"}`} role="dialog" aria-modal="true" aria-labelledby="result-title">
              <header className="legacy-result-header">
                <button className="legacy-result-back" onClick={() => go("list")} type="button" aria-label="홈 화면으로 돌아가기">‹</button>
                <strong>호가창 탈출</strong>
              </header>

              <div className="legacy-result-scroll">
                <div className="legacy-result-summary">
                  <span className="legacy-result-emoji" aria-hidden="true">{outcome === "success" ? "✓" : "😱"}</span>
                  <span className="result-kicker">{outcome === "success" ? "체결 완료" : "손실 확정"}</span>
                  <h2 id="result-title">{resultTitle}</h2>
                  <p>{formatPrice(resultSellPrice)}에 매도했어요.</p>
                </div>

                <section className="legacy-result-chart" aria-label="퓨처테마 초봉 결과 차트">
                  <strong>퓨처테마 초봉 차트</strong>
                  <svg viewBox="0 0 740 620" role="img" aria-label="목표가와 실제 매도가를 비교한 초봉 차트">
                    <line className="legacy-target-line" x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(TARGET_PRICE)} y2={chart.y(TARGET_PRICE)} />
                    <text className="legacy-target-text" x={chart.plot.left} y={chart.y(TARGET_PRICE) - 10}>전고점(목표가) {formatPrice(TARGET_PRICE)}</text>
                    <line className="legacy-sell-line" x1={chart.plot.left} x2={chart.plot.right} y1={chart.y(resultSellPrice)} y2={chart.y(resultSellPrice)} />
                    <text className="legacy-sell-text" x={chart.plot.left} y={Math.max(chart.plot.top + 18, chart.y(resultSellPrice) - 10)}>내가 판 가격 {formatPrice(resultSellPrice)}</text>
                    {visibleTicks.map((tick, index) => {
                      const x = chart.x(index);
                      const isUp = tick.close >= tick.open;
                      const bodyTop = Math.min(chart.y(tick.open), chart.y(tick.close));
                      const bodyHeight = Math.max(4, Math.abs(chart.y(tick.open) - chart.y(tick.close)));
                      return (
                        <g className={`legacy-candle ${isUp ? "up" : "down"}`} key={index}>
                          <line x1={x} x2={x} y1={chart.y(tick.high)} y2={chart.y(tick.low)} />
                          <rect height={bodyHeight} width="24" x={x - 12} y={bodyTop} rx="3" />
                        </g>
                      );
                    })}
                  </svg>
                </section>

                <section className={`legacy-loss-card ${outcome === "success" ? "success" : ""}`}>
                  <span>{outcome === "success" ? "불과 0.18초 뒤 떨어진 금액" : "전고점 대비 증발한 금액"}</span>
                  <strong>-{formatCount(TARGET_PRICE - LIMIT_PRICE)}원</strong>
                  <p>
                    {outcome === "success"
                      ? `41,000원에 체결된 직후 주가는 ${formatPrice(LIMIT_PRICE)}까지 떨어졌어요.`
                      : <><span>전고점 {formatPrice(TARGET_PRICE)}에 팔 수 있었다면</span><span>받은 돈에서 {formatCount(missedAmount)}원이 날아갔어요.</span></>}
                    <span className="legacy-realized">매수가({formatPrice(BUY_PRICE)}) 대비 실현손익 {realizedAmount >= 0 ? "+" : ""}{formatCount(realizedAmount)}원</span>
                  </p>
                </section>

                <section className="legacy-lesson-card">
                  <strong>아시나요? 실제 사례입니다</strong>
                  <p>2023년 <b>SG증권발 하한가 사태</b> 때, 여러 종목이 <b>8거래일 연속 하한가</b>로 고점 대비 <b>-70~80%</b> 폭락했어요.</p>
                  <p>급등한 종목은 <b>팔 기회조차 주지 않고</b> 무너집니다. “지금 팔면 되겠지”가 안 통해요.</p>
                </section>

                <p className="legacy-result-message">
                  {outcome === "success" ? resultBody : <><span>팔고 싶다는 결정만으로는 팔 수 없어요.</span><span>사려는 사람이 있어야 체결됩니다.</span></>}
                </p>
                <button className="legacy-retry-button" onClick={resetGame} type="button">다시 해보기</button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </section>
  );
}
