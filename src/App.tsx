import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { TradingProvider } from './contexts/TradingContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Backtesting from './pages/Backtesting';
import LiveTrading from './pages/LiveTrading';
import RiskManagement from './pages/RiskManagement';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <TradingProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/strategies" element={
                    <ProtectedRoute>
                      <Strategies />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/backtesting" element={
                    <ProtectedRoute>
                      <Backtesting />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/trading" element={
                    <ProtectedRoute>
                      <LiveTrading />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/risk" element={
                    <ProtectedRoute>
                      <RiskManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/portfolio" element={
                    <ProtectedRoute>
                      <Portfolio />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </TradingProvider>
        </AuthProvider>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;