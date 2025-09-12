import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for Streamlit monitoring dashboard"""
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Service URLs based on environment
    if ENVIRONMENT == "production":
        BACKEND_URL = os.getenv("PROD_BACKEND_URL", "https://quantrade-backend.onrender.com")
        PYTHON_SERVICE_URL = os.getenv("PROD_PYTHON_URL", "https://quantrade-backtrader.onrender.com")
        FRONTEND_URL = os.getenv("PROD_FRONTEND_URL", "https://quanttrade-platform.netlify.app")
    else:
        BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
        PYTHON_SERVICE_URL = os.getenv("PYTHON_SERVICE_URL", "http://localhost:8000")
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/quantrade")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # GitHub
    GITHUB_REPO = os.getenv("GITHUB_REPO", "your-username/your-repo-name")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
    
    # Deployment
    NETLIFY_SITE_ID = os.getenv("NETLIFY_SITE_ID", "")
    RENDER_SERVICE_ID = os.getenv("RENDER_SERVICE_ID", "")
    
    # Streamlit Config
    REFRESH_INTERVAL = 5  # seconds
    MAX_LOG_ENTRIES = 100
    
    @classmethod
    def get_service_urls(cls):
        """Get all service URLs"""
        return {
            "Frontend": cls.FRONTEND_URL,
            "Backend API": cls.BACKEND_URL,
            "Python Service": cls.PYTHON_SERVICE_URL
        }
    
    @classmethod
    def get_health_endpoints(cls):
        """Get health check endpoints"""
        return {
            "Backend Health": f"{cls.BACKEND_URL}/health",
            "Python Health": f"{cls.PYTHON_SERVICE_URL}/health"
        }