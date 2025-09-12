import requests
import time
import json
from typing import Dict, Any, Optional, Tuple
from .config import Config

class APIClient:
    """API client for monitoring QuantTrade services"""
    
    def __init__(self):
        self.config = Config()
        self.session = requests.Session()
        self.session.timeout = 10
    
    def check_service_health(self, service_name: str, url: str) -> Dict[str, Any]:
        """Check health of a service"""
        try:
            start_time = time.time()
            response = self.session.get(url)
            response_time = round((time.time() - start_time) * 1000, 2)
            
            return {
                "service": service_name,
                "status": "🟢 Online" if response.status_code == 200 else "🔴 Offline",
                "status_code": response.status_code,
                "response_time": f"{response_time}ms",
                "response_time_numeric": response_time,
                "timestamp": time.strftime("%H:%M:%S"),
                "url": url,
                "details": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
            }
        except requests.exceptions.RequestException as e:
            return {
                "service": service_name,
                "status": "🔴 Offline",
                "status_code": "Error",
                "response_time": "N/A",
                "response_time_numeric": 0,
                "timestamp": time.strftime("%H:%M:%S"),
                "url": url,
                "details": str(e)
            }
    
    def test_api_endpoint(self, method: str, endpoint: str, data: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Test a specific API endpoint"""
        url = f"{self.config.BACKEND_URL}{endpoint}"
        
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return {"error": f"Unsupported method: {method}"}
            
            response_time = round((time.time() - start_time) * 1000, 2)
            
            return {
                "method": method.upper(),
                "endpoint": endpoint,
                "url": url,
                "status_code": response.status_code,
                "response_time": response_time,
                "timestamp": time.strftime("%H:%M:%S"),
                "response_data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                "success": 200 <= response.status_code < 300
            }
            
        except Exception as e:
            return {
                "method": method.upper(),
                "endpoint": endpoint,
                "url": url,
                "status_code": "Error",
                "response_time": 0,
                "timestamp": time.strftime("%H:%M:%S"),
                "response_data": str(e),
                "success": False
            }
    
    def get_backend_status(self) -> Dict[str, Any]:
        """Get comprehensive backend status"""
        health_data = self.check_service_health("Backend", f"{self.config.BACKEND_URL}/health")
        
        # Try to get additional stats if available
        try:
            stats_response = self.session.get(f"{self.config.BACKEND_URL}/api/stats")
            if stats_response.status_code == 200:
                health_data["stats"] = stats_response.json()
        except:
            pass
            
        return health_data
    
    def get_python_service_status(self) -> Dict[str, Any]:
        """Get Python service status"""
        return self.check_service_health("Python Service", f"{self.config.PYTHON_SERVICE_URL}/health")
    
    def get_all_services_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all services"""
        return {
            "backend": self.get_backend_status(),
            "python_service": self.get_python_service_status()
        }
    
    def run_backtest(self, strategy_code: str, symbol: str = "AAPL", start_date: str = "2023-01-01", end_date: str = "2023-12-31") -> Dict[str, Any]:
        """Run a backtest via Python service"""
        url = f"{self.config.PYTHON_SERVICE_URL}/backtest"
        data = {
            "strategy_code": strategy_code,
            "symbol": symbol,
            "start_date": start_date,
            "end_date": end_date,
            "initial_capital": 10000
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=data)
            response_time = round((time.time() - start_time) * 1000, 2)
            
            return {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "response_time": response_time,
                "data": response.json() if response.status_code == 200 else response.text,
                "timestamp": time.strftime("%H:%M:%S")
            }
        except Exception as e:
            return {
                "success": False,
                "status_code": "Error",
                "response_time": 0,
                "data": str(e),
                "timestamp": time.strftime("%H:%M:%S")
            }