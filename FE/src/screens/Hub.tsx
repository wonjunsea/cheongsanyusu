import { useApp } from '../app/AppContext';

export default function Hub() {
  const { go, openWarning } = useApp();
  return (
    <section className="screen active" id="home">
      <div className="topbar"><button className="back" onClick={() => go('list')}>‹</button><div className="title">빚투 STOP 체험</div></div>
      <div className="scroll">
        <div className="hook">
          <div className="tag">2030 투자자 리포트</div>
          <h2>10명 중 <span className="big">7명</span>이<br />투자 경력 1년 미만.</h2>
          <p>수익률만 보고 레버리지에 뛰어들기 전에,<br />3분만 체험해볼까요?</p>
          <div className="emoji">📉</div>
        </div>

        <div className="sec-label">체험하기</div>
        <div className="card">
          <div className="menu" onClick={() => go('neg')}>
            <div className="mic m1">🌀</div>
            <div className="mbody"><div className="mt">음의 복리 시뮬레이터</div><div className="md">지수는 제자리인데 왜 내 돈은 줄어들까?</div></div>
            <div className="arrow">›</div>
          </div>
          <div className="menu" onClick={() => go('quiz')}>
            <div className="mic m2">🧠</div>
            <div className="mbody"><div className="mt">주식 용어 퀴즈</div><div className="md">레버리지·반대매매, 얼마나 알고 있나요?</div></div>
            <div className="arrow">›</div>
          </div>
          <div className="menu" onClick={() => go('sim')}>
            <div className="mic m3">📊</div>
            <div className="mbody"><div className="mt">모의투자 시뮬레이션</div><div className="md">가짜 돈으로 레버리지 매매를 직접 경험</div></div>
            <div className="arrow">›</div>
          </div>
          <div className="menu" onClick={() => openWarning('KODEX 레버리지')}>
            <div className="mic m4">⚠️</div>
            <div className="mbody"><div className="mt">위험 상품 안내 다시보기</div><div className="md">고위험 상품 선택 시 뜨는 경고 화면</div></div>
            <div className="arrow">›</div>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </section>
  );
}
