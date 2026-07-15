import { useState } from 'react';
import { useApp } from '../app/AppContext';

interface Q { q: string; opts: string[]; a: number; e: string; }

const QUIZ: Q[] = [
  { q: "'레버리지 ETF'의 핵심 특징은?",
    opts: ['지수와 똑같이 1배로 움직인다', '지수 움직임의 2배(또는 3배)로 움직인다', '원금이 절대 손실나지 않는다'],
    a: 1, e: '레버리지 ETF는 기초지수의 하루 수익률을 2배(때로 3배)로 추종해요. 수익도 손실도 그만큼 커집니다.' },
  { q: '지수가 오늘 -3% 내리면 2배 레버리지 상품은?',
    opts: ['약 -1.5%', '약 -3%', '약 -6%'],
    a: 2, e: '2배 상품이라 하루 등락의 2배, 약 -6%가 돼요. 반대로 오를 때도 2배입니다.' },
  { q: '지수가 제자리인데 레버리지 상품은 손해나는 현상을?',
    opts: ['음의 복리(변동성 손실)', '단리 효과', '액면분할'],
    a: 0, e: '매일 2배로 재계산되기 때문에 오르락내리락만 반복해도 원금이 깎여요. 이걸 음의 복리 또는 변동성 손실이라 해요.' },
  { q: '빚(신용·미수)으로 산 주식이 급락하면 강제로 청산되는 것은?',
    opts: ['공매도', '반대매매', '배당락'],
    a: 1, e: '담보 가치가 기준 밑으로 떨어지면 증권사가 강제로 파는 \'반대매매\'가 일어나, 원금 이상 잃을 수 있어요.' },
  { q: "'빚투'가 특히 위험한 이유로 맞는 것은?",
    opts: ['세금이 많이 붙어서', '손실이 나도 갚아야 할 원금과 이자가 남아서', '거래 수수료가 비싸서'],
    a: 1, e: '내 돈이면 잃고 끝이지만, 빚투는 손실 위에 갚을 원금과 이자까지 남아요. 그래서 위험이 배가됩니다.' },
];

export default function Quiz() {
  const { go } = useApp();
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = QUIZ[qi];

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.a) setScore((s) => s + 1);
  };
  const next = () => {
    if (qi < QUIZ.length - 1) { setQi(qi + 1); setPicked(null); }
    else setDone(true);
  };
  const restart = () => { setQi(0); setScore(0); setPicked(null); setDone(false); };

  if (done) {
    const em = score >= 4 ? '🎉' : score >= 2 ? '👍' : '🚨';
    const msg = score >= 4 ? '금융 리터러시가 탄탄해요!' : score >= 2 ? '조금만 더 알면 안전해져요.' : '위험 신호! 체험부터 시작해봐요.';
    return (
      <section className="screen active">
        <div className="topbar"><button className="back" onClick={() => go('home')}>‹</button><div className="title">주식 용어 퀴즈</div></div>
        <div className="scroll">
          <div className="quiz-result">
            <div className="em">{em}</div>
            <h2>결과</h2>
            <div className="score">{score} / {QUIZ.length}</div>
            <p>{msg}</p>
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={restart}>다시 풀기</button>
              <button className="btn btn-ghost" onClick={() => go('home')}>홈으로</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen active">
      <div className="topbar"><button className="back" onClick={() => go('home')}>‹</button><div className="title">주식 용어 퀴즈</div></div>
      <div className="scroll">
        <div className="qprog"><i style={{ width: `${(qi / QUIZ.length) * 100}%` }} /></div>
        <div className="qnum">Q{qi + 1} / {QUIZ.length}</div>
        <div className="qtext">{q.q}</div>
        <div>
          {q.opts.map((o, i) => {
            let cls = 'opt';
            if (picked !== null) {
              cls += ' disabled';
              if (i === q.a) cls += ' correct';
              else if (i === picked) cls += ' wrong';
            }
            return (
              <div key={i} className={cls} onClick={() => answer(i)}>
                <div className="ob">{String.fromCharCode(65 + i)}</div><div>{o}</div>
              </div>
            );
          })}
        </div>
        {picked !== null && (
          <div className="qexp show">
            {(picked === q.a ? '✅ 정답! ' : '❌ 아쉬워요. ')}<b>{q.opts[q.a]}</b><br />{q.e}
          </div>
        )}
      </div>
      {picked !== null && (
        <div className="cta"><button className="btn btn-primary" onClick={next}>{qi === QUIZ.length - 1 ? '결과 보기' : '다음'}</button></div>
      )}
    </section>
  );
}
