import streamlit as st
import requests
import time
import json
from datetime import datetime
import os
from pathlib import Path

# Load environment variables manually
def load_env():
    env_vars = {}
    env_file = Path(".env")
    if env_file.exists():
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
        except Exception as e:
            st.error(f"Error loading .env file: {e}")
    return env_vars

# Configuration
env_vars = load_env()
BACKEND_URL = env_vars.get("BACKEND_URL", "http://localhost:3001")
PYTHON_SERVICE_URL = env_vars.get("PYTHON_SERVICE_URL", "http://localhost:8000")
FRONTEND_URL = env_vars.get("FRONTEND_URL", "http://localhost:5173")
ENVIRONMENT = env_vars.get("ENVIRONMENT", "development")

st.set_page_config(
    page_title="QuantTrade Monitor",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .status-online {
        color: #28a745;
        font-weight: bold;
    }
    .status-offline {
        color: #dc3545;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def check_service_health(service_name, url):
    """Check health of a service"""
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        response_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            "service": service_name,
            "status": "🟢 Online" if response.status_code == 200 else "🔴 Offline",
            "status_code": response.status_code,
            "response_time": f"{response_time}ms",
            "response_time_numeric": response_time,
            "timestamp": time.strftime("%H:%M:%S"),
            "url": url,
            "details": response.text[:200] if response.text else "No response"
        }
    except Exception as e:
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

def main():
    # Sidebar
    st.sidebar.title("🚀 QuantTrade Monitor")
    st.sidebar.markdown("---")
    
    # Environment selector
    environment = st.sidebar.selectbox(
        "Environment",
        ["development", "production"],
        index=0 if ENVIRONMENT == "development" else 1
    )
    
    # Auto refresh toggle
    auto_refresh = st.sidebar.checkbox("Auto Refresh", value=True)
    refresh_interval = st.sidebar.slider("Refresh Interval (seconds)", 1, 30, 5)
    
    # Manual refresh button
    if st.sidebar.button("🔄 Refresh Now"):
        st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Service URLs:**")
    st.sidebar.markdown(f"• **Frontend**: {FRONTEND_URL}")
    st.sidebar.markdown(f"• **Backend**: {BACKEND_URL}")
    st.sidebar.markdown(f"• **Python Service**: {PYTHON_SERVICE_URL}")
    
    # Main content
    st.title("📊 QuantTrade Platform Monitor")
    st.markdown(f"**Environment**: {environment.upper()} | **Last Updated**: {datetime.now().strftime('%H:%M:%S')}")
    
    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🏠 Overview", "📡 Services", "🔧 API Test", "ℹ️ Info"])
    
    with tab1:
        show_overview()
    
    with tab2:
        show_services()
    
    with tab3:
        show_api_test()
    
    with tab4:
        show_info()
    
    # Auto refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()

def show_overview():
    """Show system overview"""
    st.header("🏠 System Overview")
    
    # Get service statuses
    backend_status = check_service_health("Backend API", f"{BACKEND_URL}/health")
    python_status = check_service_health("Python Service", f"{PYTHON_SERVICE_URL}/health")
    frontend_status = check_service_health("Frontend", FRONTEND_URL)
    
    # Service status cards
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            label="🔧 Backend API",
            value=backend_status.get("status", "Unknown"),
            delta=backend_status.get("response_time", "N/A")
        )
        
        if "Online" in backend_status.get("status", ""):
            st.success("✅ Operational")
        else:
            st.error("❌ Down")
            st.error(f"Error: {backend_status.get('details', 'Unknown error')}")
    
    with col2:
        st.metric(
            label="🐍 Python Service",
            value=python_status.get("status", "Unknown"),
            delta=python_status.get("response_time", "N/A")
        )
        
        if "Online" in python_status.get("status", ""):
            st.success("✅ Operational")
        else:
            st.error("❌ Down")
            st.error(f"Error: {python_status.get('details', 'Unknown error')}")
    
    with col3:
        st.metric(
            label="🌐 Frontend",
            value=frontend_status.get("status", "Unknown"),
            delta=frontend_status.get("response_time", "N/A")
        )
        
        if "Online" in frontend_status.get("status", ""):
            st.success("✅ Operational")
        else:
            st.error("❌ Down")
            st.error(f"Error: {frontend_status.get('details', 'Unknown error')}")
    
    # System health summary
    st.subheader("📊 System Health Summary")
    
    total_services = 3
    online_services = 0
    
    for status in [backend_status, python_status, frontend_status]:
        if "Online" in status.get("status", ""):
            online_services += 1
    
    health_percentage = (online_services / total_services) * 100
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric(
            label="System Health",
            value=f"{health_percentage:.0f}%",
            delta=f"{online_services}/{total_services} services online"
        )
        
        # Health status
        if health_percentage == 100:
            st.success("🟢 All systems operational")
        elif health_percentage >= 67:
            st.warning("🟡 Some services down")
        else:
            st.error("🔴 System issues detected")
    
    with col2:
        # Service details
        st.subheader("Service Details")
        
        service_data = []
        for service_name, status in [
            ("Backend API", backend_status),
            ("Python Service", python_status), 
            ("Frontend", frontend_status)
        ]:
            service_data.append({
                "Service": service_name,
                "Status": status.get("status", "Unknown"),
                "Response Time": status.get("response_time", "N/A"),
                "Last Check": status.get("timestamp", "Unknown")
            })
        
        for service in service_data:
            st.write(f"**{service['Service']}**: {service['Status']} ({service['Response Time']})")

def show_services():
    """Show detailed service information"""
    st.header("📡 Service Monitoring")
    
    # Service health checks
    st.subheader("🏥 Health Checks")
    
    health_endpoints = {
        "Backend Health": f"{BACKEND_URL}/health",
        "Python Health": f"{PYTHON_SERVICE_URL}/health"
    }
    
    for service_name, endpoint in health_endpoints.items():
        with st.expander(f"{service_name}", expanded=True):
            health_data = check_service_health(service_name, endpoint)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Status", health_data["status"])
            with col2:
                st.metric("Response Time", health_data["response_time"])
            with col3:
                st.metric("Status Code", health_data["status_code"])
            
            st.text(f"URL: {health_data['url']}")
            st.text(f"Details: {health_data['details']}")

def show_api_test():
    """Show API testing interface"""
    st.header("🔧 API Endpoint Testing")
    
    col1, col2 = st.columns(2)
    
    with col1:
        method = st.selectbox("Method", ["GET", "POST", "PUT", "DELETE"])
        endpoint = st.text_input("Endpoint", value="/api/auth/me")
        
        base_url = st.selectbox("Base URL", [BACKEND_URL, PYTHON_SERVICE_URL])
        
        full_url = f"{base_url}{endpoint}"
        st.code(full_url)
    
    with col2:
        headers_text = st.text_area("Headers (JSON)", value='{"Content-Type": "application/json"}')
        data_text = st.text_area("Request Data (JSON)", value='{}')
    
    if st.button("🚀 Test Endpoint"):
        try:
            headers = json.loads(headers_text) if headers_text.strip() else {}
            data = json.loads(data_text) if data_text.strip() else None
            
            start_time = time.time()
            
            if method == "GET":
                response = requests.get(full_url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(full_url, headers=headers, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(full_url, headers=headers, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(full_url, headers=headers, timeout=10)
            
            response_time = round((time.time() - start_time) * 1000, 2)
            
            # Display results
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if 200 <= response.status_code < 300:
                    st.success(f"Status: {response.status_code}")
                else:
                    st.error(f"Status: {response.status_code}")
            
            with col2:
                st.metric("Response Time", f"{response_time}ms")
            
            with col3:
                st.metric("Timestamp", datetime.now().strftime("%H:%M:%S"))
            
            # Response data
            st.subheader("Response Data")
            try:
                response_json = response.json()
                st.json(response_json)
            except:
                st.code(response.text)
                
        except Exception as e:
            st.error(f"Request failed: {e}")

def show_info():
    """Show system information"""
    st.header("ℹ️ System Information")
    
    st.subheader("📋 Configuration")
    config_info = {
        "Environment": ENVIRONMENT,
        "Backend URL": BACKEND_URL,
        "Python Service URL": PYTHON_SERVICE_URL,
        "Frontend URL": FRONTEND_URL
    }
    
    for key, value in config_info.items():
        st.write(f"**{key}**: `{value}`")
    
    st.subheader("🛠️ Troubleshooting")
    
    with st.expander("Common Issues", expanded=False):
        st.markdown("""
        **Service Connection Issues:**
        1. Check if services are running locally
        2. Verify URLs in .env file
        3. Check firewall settings
        4. Ensure correct ports are used
        
        **Development Setup:**
        1. Start Frontend: `npm run dev` (port 5173)
        2. Start Backend: `cd backend && npm run dev` (port 3001)
        3. Start Python: `cd backend/python-services/backtrader-engine && uvicorn app:app --reload` (port 8000)
        4. Start Monitor: `streamlit run app_simple.py` (port 8501)
        """)
    
    st.subheader("🔧 Quick Actions")
    
    if st.button("🧪 Test All Services"):
        with st.spinner("Testing all services..."):
            backend = check_service_health("Backend", f"{BACKEND_URL}/health")
            python = check_service_health("Python", f"{PYTHON_SERVICE_URL}/health") 
            frontend = check_service_health("Frontend", FRONTEND_URL)
            
            results = [
                f"Backend: {backend['status']} ({backend['response_time']})",
                f"Python: {python['status']} ({python['response_time']})",
                f"Frontend: {frontend['status']} ({frontend['response_time']})"
            ]
            
            for result in results:
                st.write(result)

if __name__ == "__main__":
    main()