import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  Activity,
  Zap
} from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { riskMetrics, positions, signals, isConnected } = useTrading();
  const { user } = useAuth();

  const totalCapital = user?.riskProfile?.totalCapital || 200000;
  const dailyPnL = riskMetrics.unrealizedPnl + riskMetrics.realizedPnl;
  const dailyPnLPercent = (dailyPnL / totalCapital) * 100;

  const recentSignals = signals.slice(0, 5);
  const activePositions = positions.filter(p => p.quantity > 0);

  const stats = [
    {
      title: 'Total P&L',
      value: `₹${dailyPnL.toLocaleString('en-IN')}`,
      change: `${dailyPnLPercent >= 0 ? '+' : ''}${dailyPnLPercent.toFixed(2)}%`,
      positive: dailyPnL >= 0,
      icon: DollarSign
    },
    {
      title: 'Unrealized P&L',
      value: `₹${riskMetrics.unrealizedPnl.toLocaleString('en-IN')}`,
      change: 'Live positions',
      positive: riskMetrics.unrealizedPnl >= 0,
      icon: TrendingUp
    },
    {
      title: 'Risk Utilization',
      value: `${riskMetrics.riskUtilization.toFixed(1)}%`,
      change: `${activePositions.length}/5 positions`,
      positive: riskMetrics.riskUtilization < 80,
      icon: Shield
    },
    {
      title: 'Available Margin',
      value: `₹${riskMetrics.availableMargin.toLocaleString('en-IN')}`,
      change: 'Ready to deploy',
      positive: true,
      icon: Activity
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your trading overview.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stat.positive ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.positive ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Positions</h2>
            <Activity className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {activePositions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active positions</p>
            ) : (
              activePositions.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{position.symbol}</h3>
                    <p className="text-sm text-gray-600">
                      {position.quantity} shares @ ₹{position.avgPrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {position.unrealizedPnl >= 0 ? '+' : ''}₹{position.unrealizedPnl.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{position.currentPrice}
                    </p>
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
            <Zap className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {recentSignals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent signals</p>
            ) : (
              recentSignals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{signal.symbol}</h3>
                    <p className="text-sm text-gray-600">
                      {signal.action} {signal.quantity} @ ₹{signal.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      signal.status === 'executed' ? 'bg-green-100 text-green-800' :
                      signal.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      signal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {signal.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(signal.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      {riskMetrics.riskUtilization > 80 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">High Risk Utilization</h3>
              <p className="text-sm text-red-700 mt-1">
                You're using {riskMetrics.riskUtilization.toFixed(1)}% of your risk capacity. 
                Consider closing some positions to maintain healthy risk levels.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;