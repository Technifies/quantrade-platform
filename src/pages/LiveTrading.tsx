import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';

const LiveTrading: React.FC = () => {
  const { signals, positions, executeSignal, isConnected } = useTrading();
  const { user } = useAuth();
  const [autoExecute, setAutoExecute] = useState(false);

  const pendingSignals = signals.filter(s => s.status === 'generated');
  const recentSignals = signals.slice(0, 10);

  const handleExecuteSignal = async (signalId: string) => {
    const success = await executeSignal(signalId);
    if (success) {
      // Signal executed successfully
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Trading</h1>
          <p className="text-gray-600 mt-1">Monitor and execute trading signals in real-time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto Execute</span>
          </label>
        </div>
      </div>

      {/* Trading Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Signals</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{pendingSignals.length}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{positions.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trading Status</p>
              <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Signals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pending Signals</h2>
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          
          <div className="space-y-4">
            {pendingSignals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending signals</p>
            ) : (
              pendingSignals.map((signal) => (
                <div key={signal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{signal.symbol}</h3>
                      <p className="text-sm text-gray-600">
                        {signal.action} {signal.quantity} @ ₹{signal.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signal.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.action}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(signal.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>SL: ₹{signal.stopLoss}</span>
                    <span>Target: ₹{signal.target}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                    </div>
                    
                    <button
                      onClick={() => handleExecuteSignal(signal.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Signals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Signals</h2>
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {recentSignals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent signals</p>
            ) : (
              recentSignals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{signal.symbol}</h3>
                    <p className="text-sm text-gray-600">
                      {signal.action} {signal.quantity} @ ₹{signal.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      signal.status === 'executed' ? 'bg-green-100 text-green-800' :
                      signal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {signal.status === 'executed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {signal.status === 'rejected' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {signal.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warning for disconnected state */}
      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Connection Lost</h3>
              <p className="text-sm text-red-700 mt-1">
                Unable to connect to trading services. Please check your connection and try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrading;