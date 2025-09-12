import React, { useState, useEffect } from 'react';
import { 
  Play, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  BarChart3,
  Settings,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  createdAt: string;
}

const Backtesting: React.FC = () => {
  const { user } = useAuth();
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRunModal, setShowRunModal] = useState(false);

  useEffect(() => {
    fetchBacktests();
  }, []);

  const fetchBacktests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/backtests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBacktests(data);
      }
    } catch (error) {
      console.error('Failed to fetch backtests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backtesting</h1>
          <p className="text-gray-600 mt-1">Test your strategies against historical data</p>
        </div>
        
        <button
          onClick={() => setShowRunModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Run Backtest</span>
        </button>
      </div>

      {/* Backtest Results */}
      {backtests.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No backtests yet</h3>
          <p className="text-gray-600 mb-4">Run your first backtest to see how your strategies perform</p>
          <button
            onClick={() => setShowRunModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Backtest
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {backtests.map((backtest) => (
            <div key={backtest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{backtest.strategyName}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{backtest.startDate} - {backtest.endDate}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>Initial: {formatCurrency(backtest.initialCapital)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Final Capital</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(backtest.finalCapital)}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Return</p>
                  <p className={`text-lg font-semibold ${
                    backtest.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(backtest.totalReturn * 100)}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="text-lg font-semibold text-gray-900">{backtest.totalTrades}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {backtest.winRate.toFixed(1)}%
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Max Drawdown</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{backtest.maxDrawdown.toFixed(2)}%
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Sharpe Ratio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {backtest.sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run Backtest Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Run Backtest</h2>
            <p className="text-gray-600 mb-4">Backtest configuration functionality will be implemented here.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backtesting;