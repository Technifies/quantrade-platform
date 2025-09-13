import requests
import psycopg2
import redis
import time
from typing import Dict, Any
from .config import NORTHFLANK_SERVICES, MONITORING_CONFIG

class HealthMonitor:
    def __init__(self):
        self.service_status = {}
        self.failure_counts = {}

    def check_api_health(self, service_name: str, url: str, health_endpoint: str) -> bool:
        try:
            response = requests.get(f"{url}{health_endpoint}", timeout=10)
            return response.status_code == 200
        except requests.RequestException:
            return False

    def check_database_connection(self, db_config: Dict[str, Any]) -> bool:
        try:
            conn = psycopg2.connect(
                host=db_config['host'],
                port=db_config['port'],
                user=db_config['username'],
                password=db_config['password'],
                database=db_config['database']
            )
            conn.close()
            return True
        except Exception:
            return False

    def check_redis_connection(self, redis_config: Dict[str, Any]) -> bool:
        try:
            redis_client = redis.Redis(
                host=redis_config['host'],
                port=int(redis_config['port']),
                password=redis_config['password'],
                socket_timeout=5
            )
            redis_client.ping()
            return True
        except Exception:
            return False

    def monitor_services(self) -> Dict[str, Dict[str, Any]]:
        # Check Backend API
        backend_health = self.check_api_health(
            'backend_api', 
            NORTHFLANK_SERVICES['backend_api']['url'], 
            NORTHFLANK_SERVICES['backend_api']['health_endpoint']
        )
        
        # Check Python Service
        python_service_health = self.check_api_health(
            'python_service', 
            NORTHFLANK_SERVICES['python_service']['url'], 
            NORTHFLANK_SERVICES['python_service']['health_endpoint']
        )
        
        # Check Database Connection
        database_health = self.check_database_connection(NORTHFLANK_SERVICES['database'])
        
        # Check Redis Connection
        redis_health = self.check_redis_connection(NORTHFLANK_SERVICES['redis'])

        # Aggregate Service Status
        service_status = {
            'backend_api': backend_health,
            'python_service': python_service_health,
            'database': database_health,
            'redis': redis_health
        }

        # Track and update failure counts
        for service, status in service_status.items():
            if not status:
                self.failure_counts[service] = self.failure_counts.get(service, 0) + 1
            else:
                self.failure_counts[service] = 0

        return service_status

    def get_service_health_summary(self) -> Dict[str, Any]:
        service_status = self.monitor_services()
        return {
            'service_status': service_status,
            'critical_failures': [
                service for service, count in self.failure_counts.items() 
                if count >= MONITORING_CONFIG['alert_threshold_failures']
            ]
        }