import { useApp } from '../app/AppContext';

export default function StockList() {
  const { go, openOrder, enterMentor } = useApp();
  return (
    <section className="screen active">
      <div className="topbar"><div style={{ width: 16 }} /><div className="title brand-title">청산유수</div></div>
      <div className="scroll">
        <div className="h1">오늘의 인기 종목</div>
        <div className="hsub">거래량이 급증한 상품이에요</div>

        <div className="appbanner" onClick={() => go('home')}>
          <div className="ab-txt">
            <div className="ab-t">⚠️ 빚투하기 전, 3분 체험</div>
            <div className="ab-d">레버리지 위험을 직접 확인해보세요</div>
          </div>
          <div className="ab-arrow">›</div>
        </div>

        <div className="sec-label">주식</div>
        <div className="card">
          <div className="row" onClick={() => openOrder('삼성전자', '일반 주식')}>
            <div className="ic samsung">S</div>
            <div className="rbody"><div className="nm">삼성전자</div><div className="rmeta">코스피 · 반도체</div></div>
            <div className="price"><div className="p">71,200</div><div className="c up">+1.4%</div></div>
          </div>
          <div className="row" onClick={() => openOrder('KODEX 200', 'ETF')}>
            <div className="ic kodex">K</div>
            <div className="rbody"><div className="nm">KODEX 200</div><div className="rmeta">지수 추종 ETF</div></div>
            <div className="price"><div className="p">38,540</div><div className="c up">+0.8%</div></div>
          </div>
        </div>

        <div className="sec-label">레버리지 · 인버스 · 급등주</div>
        <div className="card">
          <div className="row" onClick={() => enterMentor('KODEX 레버리지', 'compound')}>
            <div className="ic lev">2X</div>
            <div className="rbody"><div className="nm">KODEX 레버리지</div><div className="rmeta"><span className="tag-risk">⚠ 고위험</span> 지수 2배 추종</div></div>
            <div className="price"><div className="p">17,830</div><div className="c up">+3.1%</div></div>
          </div>
          <div className="row" onClick={() => enterMentor('KODEX 200선물인버스2X', 'etf')}>
            <div className="ic inv">-2X</div>
            <div className="rbody"><div className="nm">200선물인버스2X</div><div className="rmeta"><span className="tag-risk">⚠ 고위험</span> 하락 2배 추종</div></div>
            <div className="price"><div className="p">2,145</div><div className="c down">-2.9%</div></div>
          </div>
          <div className="row" onClick={() => enterMentor('에코비트', 'surge')}>
            <div className="ic surge">🚀</div>
            <div className="rbody"><div className="nm">에코비트</div><div className="rmeta"><span className="tag-risk">⚠ 고위험</span> 최근 5일 +142% 급등주</div></div>
            <div className="price"><div className="p">48,600</div><div className="c up">+29.8%</div></div>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </section>
  );
}
