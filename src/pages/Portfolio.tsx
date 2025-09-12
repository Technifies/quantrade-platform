import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useAuth } from '../contexts/AuthContext';

const Portfolio: React.FC = () => {
  const { positions, riskMetrics } = useTrading();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('1D');

  const totalCapital = user?.riskProfile?.totalCapital || 200000;
  const totalPnL = riskMetrics.unrealizedPnl + riskMetrics.realizedPnl;
  const totalPnLPercent = (totalPnL / totalCapital) * 100;

  const portfolioStats = [
    {
      title: 'Portfolio Value',
      value: `₹${(totalCapital + totalPnL).toLocaleString('en-IN')}`,
      change: `${totalPnLPercent >= 0 ? '+' : ''}${totalPnLPercent.toFixed(2)}%`,
      positive: totalPnL >= 0,
      icon: Briefcase
    },
    {
      title: 'Unrealized P&L',
      value: `₹${riskMetrics.unrealizedPnl.toLocaleString('en-IN')}`,
      change: 'Open positions',
      positive: riskMetrics.unrealizedPnl >= 0,
      icon: TrendingUp
    },
    {
      title: 'Realized P&L',
      value: `₹${riskMetrics.realizedPnl.toLocaleString('en-IN')}`,
      change: 'Today',
      positive: riskMetrics.realizedPnl >= 0,
      icon: DollarSign
    },
    {
      title: 'Cash Available',
      value: `₹${riskMetrics.availableMargin.toLocaleString('en-IN')}`,
      change: 'Ready to invest',
      positive: true,
      icon: Percent
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-600 mt-1">Track your investment performance and holdings</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioStats.map((stat) => (
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
        {/* Current Holdings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Current Holdings</h2>
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No current positions</p>
            ) : (
              positions.map((position) => (
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

        {/* Portfolio Allocation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Allocation</h2>
            <PieChart className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Invested</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {((riskMetrics.currentExposure / totalCapital) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Cash</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {((riskMetrics.availableMargin / totalCapital) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(riskMetrics.currentExposure / totalCapital) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance Chart</h2>
          <Calendar className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Performance chart will be implemented here</p>
            <p className="text-sm text-gray-500 mt-1">Showing {timeframe} performance data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;