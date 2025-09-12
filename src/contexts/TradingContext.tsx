import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, TradingSignal, RiskMetrics, MarketData } from '../types/trading';

interface TradingContextType {
  positions: Position[];
  signals: TradingSignal[];
  riskMetrics: RiskMetrics;
  marketData: Map<string, MarketData>;
  isConnected: boolean;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  executeSignal: (signalId: string) => Promise<boolean>;
  closePosition: (positionId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    currentExposure: 0,
    availableMargin: 0,
    unrealizedPnl: 0,
    realizedPnl: 0,
    dailyDrawdown: 0,
    positionsCount: 0,
    riskUtilization: 0
  });
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    initializeWebSocket();
    fetchInitialData();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(initializeWebSocket, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWebsocket(ws);
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'MARKET_DATA':
        setMarketData(prev => {
          const updated = new Map(prev);
          updated.set(data.payload.symbol, data.payload);
          return updated;
        });
        break;
      
      case 'TRADING_SIGNAL':
        setSignals(prev => [data.payload, ...prev.slice(0, 49)]); // Keep last 50 signals
        break;
      
      case 'POSITION_UPDATE':
        setPositions(prev => 
          prev.map(pos => pos.id === data.payload.id ? data.payload : pos)
        );
        break;
      
      case 'RISK_UPDATE':
        setRiskMetrics(data.payload);
        break;
    }
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch positions
      const positionsRes = await fetch('/api/positions', { headers });
      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setPositions(positionsData);
      }

      // Fetch signals
      const signalsRes = await fetch('/api/signals', { headers });
      if (signalsRes.ok) {
        const signalsData = await signalsRes.json();
        setSignals(signalsData);
      }

      // Fetch risk metrics
      const riskRes = await fetch('/api/risk/portfolio', { headers });
      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskMetrics(riskData);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const subscribeToSymbol = (symbol: string) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        payload: { symbol }
      }));
    }
  };

  const unsubscribeFromSymbol = (symbol: string) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'UNSUBSCRIBE',
        payload: { symbol }
      }));
    }
  };

  const executeSignal = async (signalId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/signals/${signalId}/execute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Update signal status
        setSignals(prev =>
          prev.map(signal =>
            signal.id === signalId
              ? { ...signal, status: 'executed' }
              : signal
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to execute signal:', error);
      return false;
    }
  };

  const closePosition = async (positionId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/positions/close/${positionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to close position:', error);
      return false;
    }
  };

  const refreshData = async (): Promise<void> => {
    await fetchInitialData();
  };

  const value: TradingContextType = {
    positions,
    signals,
    riskMetrics,
    marketData,
    isConnected,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    executeSignal,
    closePosition,
    refreshData
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};