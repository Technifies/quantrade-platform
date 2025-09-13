import os

# Northflank Service Configuration
NORTHFLANK_SERVICES = {
    'backend_api': {
        'url': os.getenv('BACKEND_API_URL', 'https://your-backend.northflank.app'),
        'health_endpoint': '/health',
    },
    'python_service': {
        'url': os.getenv('PYTHON_SERVICE_URL', 'https://your-python.northflank.app'),
        'health_endpoint': '/status',
    },
    'database': {
        'host': os.getenv('POSTGRES_HOST', 'your-postgres.northflank.app'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'username': os.getenv('POSTGRES_USER', 'your_username'),
        # Note: Never hardcode passwords, always use environment variables
        'password': os.getenv('POSTGRES_PASSWORD'),
        'database': os.getenv('POSTGRES_DB', 'quanttrade'),
    },
    'redis': {
        'host': os.getenv('REDIS_HOST', 'your-redis.northflank.app'),
        'port': os.getenv('REDIS_PORT', '6379'),
        'password': os.getenv('REDIS_PASSWORD'),
    }
}

# Monitoring Configuration
MONITORING_CONFIG = {
    'refresh_interval_seconds': 30,  # Health check interval
    'alert_threshold_failures': 3,   # Number of consecutive failures before alerting
}

# Feature Flags
FEATURES = {
    'api_testing': True,
    'database_monitoring': True,
    'service_health_check': True,
    'trading_analytics': True,
}