import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Code, 
  TrendingUp,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Strategy {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  status: 'draft' | 'backtested' | 'live' | 'paused';
  createdAt: string;
  updatedAt: string;
}

const Strategies: React.FC = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/strategies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'backtested':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'backtested':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Trading Strategies</h1>
          <p className="text-gray-600 mt-1">Create, test, and deploy your trading algorithms</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Strategy</span>
        </button>
      </div>

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies yet</h3>
          <p className="text-gray-600 mb-4">Create your first trading strategy to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Strategy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(strategy.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
                    {strategy.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Code className="w-4 h-4 mr-2" />
                  <span>Python Strategy</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Updated {new Date(strategy.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {strategy.status === 'live' ? (
                  <button className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm hover:bg-yellow-200 transition-colors">
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm hover:bg-green-200 transition-colors">
                    <Play className="w-3 h-3" />
                    <span>Deploy</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Strategy</h2>
            <p className="text-gray-600 mb-4">Strategy creation functionality will be implemented here.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Strategies;