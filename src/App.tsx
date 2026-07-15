import { useCallback, useRef, useState } from 'react';
import { AppContext, type AppApi, type ScreenId } from './app/AppContext';
import { CASE_ORDER, type CaseType } from './lib/mentor';
import StockList from './screens/StockList';
import Hub from './screens/Hub';
import NegCompound from './screens/NegCompound';
import Quiz from './screens/Quiz';
import TradeSim from './screens/TradeSim';
import MentorChat from './screens/MentorChat';
import SurgeGame from './screens/SurgeGame';
import CompoundRisk from './screens/CompoundRisk';
import EtfPlaceholder from './screens/EtfPlaceholder';
import Order from './screens/Order';
import WarningSheet from './components/WarningSheet';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('list');
  const [order, setOrder] = useState({ name: '상품', desc: '' });
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnProduct, setWarnProduct] = useState('KODEX 레버리지');
  const [caseType, setCaseType] = useState<CaseType>('surge');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  const go = useCallback((s: ScreenId) => setScreen(s), []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 1800);
  }, []);

  const openOrder = useCallback((name: string, desc: string) => {
    setOrder({ name, desc: desc + ' · 주문 화면 데모입니다. (실제 주문은 되지 않아요)' });
    setScreen('order');
  }, []);

  // 고위험 종목 클릭 -> 랜덤 케이스 1개 (클릭당 체험 한 번)
  const enterMentor = useCallback((product: string) => {
    setWarnProduct(product);
    setCaseType(CASE_ORDER[Math.floor(Math.random() * CASE_ORDER.length)]);
    setScreen('mentor');
  }, []);

  const openWarning = useCallback((product: string) => {
    setWarnProduct(product);
    setWarnOpen(true);
  }, []);
  const closeWarning = useCallback(() => setWarnOpen(false), []);

  const api: AppApi = {
    screen, go, toast, caseType, enterMentor, openOrder, openWarning, closeWarning, order,
  };

  return (
    <AppContext.Provider value={api}>
      <div className="phone">
        <div className="notch" />
        <div className="statusbar">
          <span>9:41</span>
          <span className="right">●●●● 5G ▮</span>
        </div>

        {screen === 'list' && <StockList />}
        {screen === 'home' && <Hub />}
        {screen === 'neg' && <NegCompound />}
        {screen === 'quiz' && <Quiz />}
        {screen === 'sim' && <TradeSim />}
        {screen === 'mentor' && <MentorChat />}
        {screen === 'game2' && <SurgeGame />}
        {screen === 'game3' && <CompoundRisk />}
        {screen === 'game4' && <EtfPlaceholder />}
        {screen === 'order' && <Order />}

        <WarningSheet open={warnOpen} product={warnProduct} />

        <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
      </div>
    </AppContext.Provider>
  );
}
