import streamlit as st
import time
import pandas as pd
from datetime import datetime
from utils.config import Config
from utils.api_client import APIClient
from utils.db_client import DatabaseClient

# Page config
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
    .stTabs [data-baseweb="tab-list"] {
        gap: 2px;
    }
</style>
""", unsafe_allow_html=True)

def main():
    # Initialize clients
    config = Config()
    api_client = APIClient()
    db_client = DatabaseClient()
    
    # Sidebar
    st.sidebar.title("🚀 QuantTrade Monitor")
    st.sidebar.markdown("---")
    
    # Environment selector
    environment = st.sidebar.selectbox(
        "Environment",
        ["development", "production"],
        index=0 if config.ENVIRONMENT == "development" else 1
    )
    
    # Auto refresh toggle
    auto_refresh = st.sidebar.checkbox("Auto Refresh", value=True)
    refresh_interval = st.sidebar.slider("Refresh Interval (seconds)", 1, 30, 5)
    
    # Manual refresh button
    if st.sidebar.button("🔄 Refresh Now"):
        st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Service URLs:**")
    for name, url in config.get_service_urls().items():
        st.sidebar.markdown(f"• **{name}**: {url}")
    
    # Main content
    st.title("📊 QuantTrade Platform Monitor")
    st.markdown(f"**Environment**: {environment.upper()} | **Last Updated**: {datetime.now().strftime('%H:%M:%S')}")
    
    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🏠 Overview", "📡 Services", "💾 Database", "⚡ Actions"])
    
    with tab1:
        show_overview(api_client, db_client)
    
    with tab2:
        show_services(api_client)
    
    with tab3:
        show_database(db_client)
    
    with tab4:
        show_actions(api_client)
    
    # Auto refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()

def show_overview(api_client, db_client):
    """Show system overview"""
    st.header("🏠 System Overview")
    
    # Get service statuses
    services_status = api_client.get_all_services_status()
    postgres_status = db_client.get_postgres_status()
    redis_status = db_client.get_redis_status()
    
    # Service status cards
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        backend_status = services_status.get("backend", {})
        status_color = "🟢" if "Online" in backend_status.get("status", "") else "🔴"
        st.metric(
            label="Backend API",
            value=backend_status.get("status", "Unknown"),
            delta=backend_status.get("response_time", "N/A")
        )
    
    with col2:
        python_status = services_status.get("python_service", {})
        status_color = "🟢" if "Online" in python_status.get("status", "") else "🔴"
        st.metric(
            label="Python Service",
            value=python_status.get("status", "Unknown"),
            delta=python_status.get("response_time", "N/A")
        )
    
    with col3:
        db_status_text = postgres_status.get("status", "Unknown")
        st.metric(
            label="PostgreSQL",
            value=db_status_text,
            delta=postgres_status.get("database_size", "N/A")
        )
    
    with col4:
        redis_status_text = redis_status.get("status", "Unknown")
        st.metric(
            label="Redis",
            value=redis_status_text,
            delta=redis_status.get("used_memory", "N/A")
        )
    
    # Performance metrics
    st.subheader("📈 Performance Metrics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Response time chart
        response_times = []
        services = []
        
        for service, data in services_status.items():
            if data.get("response_time_numeric", 0) > 0:
                response_times.append(data["response_time_numeric"])
                services.append(service.replace("_", " ").title())
        
        if response_times:
            df_response = pd.DataFrame({
                "Service": services,
                "Response Time (ms)": response_times
            })
            st.bar_chart(df_response.set_index("Service"))
    
    with col2:
        # System health summary
        total_services = 4
        online_services = 0
        
        if "Online" in backend_status.get("status", ""):
            online_services += 1
        if "Online" in python_status.get("status", ""):
            online_services += 1
        if "Connected" in postgres_status.get("status", ""):
            online_services += 1
        if "Connected" in redis_status.get("status", ""):
            online_services += 1
        
        health_percentage = (online_services / total_services) * 100
        
        st.metric(
            label="System Health",
            value=f"{health_percentage:.0f}%",
            delta=f"{online_services}/{total_services} services online"
        )
        
        # Health status
        if health_percentage == 100:
            st.success("🟢 All systems operational")
        elif health_percentage >= 75:
            st.warning("🟡 Some services down")
        else:
            st.error("🔴 System issues detected")

def show_services(api_client):
    """Show detailed service information"""
    st.header("📡 Service Monitoring")
    
    # Service health checks
    st.subheader("🏥 Health Checks")
    
    health_endpoints = Config.get_health_endpoints()
    
    for service_name, endpoint in health_endpoints.items():
        with st.expander(f"{service_name}", expanded=True):
            health_data = api_client.check_service_health(service_name, endpoint)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Status", health_data["status"])
            with col2:
                st.metric("Response Time", health_data["response_time"])
            with col3:
                st.metric("Status Code", health_data["status_code"])
            
            if health_data.get("details"):
                st.json(health_data["details"])
    
    # API endpoint testing
    st.subheader("🔧 API Endpoint Testing")
    
    col1, col2 = st.columns(2)
    
    with col1:
        method = st.selectbox("Method", ["GET", "POST", "PUT", "DELETE"])
        endpoint = st.text_input("Endpoint", value="/api/auth/me")
    
    with col2:
        headers = st.text_area("Headers (JSON)", value='{"Authorization": "Bearer token"}')
        data = st.text_area("Request Data (JSON)", value='{}')
    
    if st.button("🚀 Test Endpoint"):
        try:
            headers_dict = eval(headers) if headers.strip() else None
            data_dict = eval(data) if data.strip() else None
            
            result = api_client.test_api_endpoint(method, endpoint, data_dict, headers_dict)
            
            st.json(result)
            
        except Exception as e:
            st.error(f"Error: {e}")

def show_database(db_client):
    """Show database monitoring"""
    st.header("💾 Database Monitoring")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🐘 PostgreSQL")
        postgres_status = db_client.get_postgres_status()
        
        if postgres_status.get("status") == "🟢 Connected":
            st.success("Database connected successfully")
            
            # Database metrics
            if postgres_status.get("database_size"):
                st.metric("Database Size", postgres_status["database_size"])
            if postgres_status.get("active_connections"):
                st.metric("Active Connections", postgres_status["active_connections"])
            
            # Tables information
            if postgres_status.get("tables"):
                st.subheader("📋 Table Statistics")
                tables_df = pd.DataFrame(postgres_status["tables"])
                st.dataframe(tables_df)
        else:
            st.error("Database connection failed")
            if postgres_status.get("error"):
                st.error(postgres_status["error"])
    
    with col2:
        st.subheader("🔴 Redis")
        redis_status = db_client.get_redis_status()
        
        if redis_status.get("status") == "🟢 Connected":
            st.success("Redis connected successfully")
            
            # Redis metrics
            metrics = ["used_memory", "connected_clients", "total_commands_processed"]
            for metric in metrics:
                if redis_status.get(metric):
                    st.metric(metric.replace("_", " ").title(), redis_status[metric])
        else:
            st.error("Redis connection failed")
            if redis_status.get("error"):
                st.error(redis_status["error"])
    
    # Custom query executor
    st.subheader("🔍 Query Executor")
    query = st.text_area(
        "SQL Query",
        value="SELECT * FROM users LIMIT 5;",
        height=100
    )
    
    if st.button("Execute Query"):
        result = db_client.execute_query(query)
        
        if result.get("success"):
            st.success(f"Query executed successfully in {result['execution_time']}ms")
            st.dataframe(result["data"])
        else:
            st.error(f"Query failed: {result.get('error')}")

def show_actions(api_client):
    """Show available actions"""
    st.header("⚡ Quick Actions")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🧪 Backtest Runner")
        
        strategy_code = st.text_area(
            "Strategy Code",
            value="""
class SimpleStrategy(bt.Strategy):
    def next(self):
        if not self.position:
            if self.data.close[0] > self.data.close[-1]:
                self.buy()
        else:
            if self.data.close[0] < self.data.close[-1]:
                self.sell()
""",
            height=200
        )
        
        col_a, col_b = st.columns(2)
        with col_a:
            symbol = st.text_input("Symbol", value="AAPL")
            start_date = st.date_input("Start Date", value=pd.to_datetime("2023-01-01"))
        with col_b:
            end_date = st.date_input("End Date", value=pd.to_datetime("2023-12-31"))
        
        if st.button("🚀 Run Backtest"):
            with st.spinner("Running backtest..."):
                result = api_client.run_backtest(
                    strategy_code,
                    symbol,
                    start_date.strftime("%Y-%m-%d"),
                    end_date.strftime("%Y-%m-%d")
                )
                
                if result["success"]:
                    st.success("Backtest completed successfully!")
                    st.json(result["data"])
                else:
                    st.error("Backtest failed")
                    st.error(result["data"])
    
    with col2:
        st.subheader("🔧 System Controls")
        
        if st.button("🔄 Restart Services"):
            st.info("Service restart functionality coming soon...")
        
        if st.button("📊 Generate Report"):
            st.info("Report generation functionality coming soon...")
        
        if st.button("🧹 Clear Cache"):
            st.info("Cache clearing functionality coming soon...")
        
        if st.button("📈 Performance Test"):
            st.info("Performance testing functionality coming soon...")

if __name__ == "__main__":
    main()