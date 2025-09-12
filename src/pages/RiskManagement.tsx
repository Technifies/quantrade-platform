import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Settings,
  DollarSign,
  Percent,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrading } from '../contexts/TradingContext';

const RiskManagement: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { riskMetrics } = useTrading();
  const [showSettings, setShowSettings] = useState(false);
  const [riskParams, setRiskParams] = useState(user?.riskProfile || {
    totalCapital: 200000,
    intradayAllocation: 100000,
    leverageMultiple: 5,
    maxSimultaneousPositions: 5,
    riskPerTrade: 0.5,
    maxDailyDrawdown: 1.25,
    trailingStopLoss: 0.5
  });

  const handleUpdateRiskParams = async () => {
    const success = await updateProfile({ riskProfile: riskParams });
    if (success) {
      setShowSettings(false);
    }
  };

  const riskCards = [
    {
      title: 'Total Capital',
      value: `₹${riskParams.totalCapital.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Risk Utilization',
      value: `${riskMetrics.riskUtilization.toFixed(1)}%`,
      icon: Percent,
      color: riskMetrics.riskUtilization > 80 ? 'red' : 'green'
    },
    {
      title: 'Active Positions',
      value: `${riskMetrics.positionsCount}/${riskParams.maxSimultaneousPositions}`,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Daily Drawdown',
      value: `₹${riskMetrics.dailyDrawdown.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      color: riskMetrics.dailyDrawdown > 0 ? 'red' : 'gray'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Management</h1>
          <p className="text-gray-600 mt-1">Monitor and control your trading risk exposure</p>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Risk Settings</span>
        </button>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riskCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                <card.icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Alerts */}
      {riskMetrics.riskUtilization > 80 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">High Risk Utilization</h3>
              <p className="text-sm text-red-700 mt-1">
                You're using {riskMetrics.riskUtilization.toFixed(1)}% of your risk capacity. 
                Consider reducing positions to maintain healthy risk levels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Parameters Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Current Risk Parameters</h2>
          <Shield className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Intraday Allocation</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{riskParams.intradayAllocation.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Leverage Multiple</p>
            <p className="text-lg font-semibold text-gray-900">{riskParams.leverageMultiple}x</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Risk Per Trade</p>
            <p className="text-lg font-semibold text-gray-900">{riskParams.riskPerTrade}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Max Daily Drawdown</p>
            <p className="text-lg font-semibold text-gray-900">{riskParams.maxDailyDrawdown}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Trailing Stop Loss</p>
            <p className="text-lg font-semibold text-gray-900">{riskParams.trailingStopLoss}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Available Margin</p>
            <p className="text-lg font-semibold text-green-600">
              ₹{riskMetrics.availableMargin.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Risk Management Settings</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Capital (₹)
                  </label>
                  <input
                    type="number"
                    value={riskParams.totalCapital}
                    onChange={(e) => setRiskParams({...riskParams, totalCapital: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intraday Allocation (₹)
                  </label>
                  <input
                    type="number"
                    value={riskParams.intradayAllocation}
                    onChange={(e) => setRiskParams({...riskParams, intradayAllocation: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leverage Multiple
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={riskParams.leverageMultiple}
                    onChange={(e) => setRiskParams({...riskParams, leverageMultiple: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Simultaneous Positions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={riskParams.maxSimultaneousPositions}
                    onChange={(e) => setRiskParams({...riskParams, maxSimultaneousPositions: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Per Trade (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={riskParams.riskPerTrade}
                    onChange={(e) => setRiskParams({...riskParams, riskPerTrade: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Daily Drawdown (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={riskParams.maxDailyDrawdown}
                    onChange={(e) => setRiskParams({...riskParams, maxDailyDrawdown: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRiskParams}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskManagement;