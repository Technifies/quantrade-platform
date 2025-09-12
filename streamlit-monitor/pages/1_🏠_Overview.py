import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import time
import sys
import os

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.config import Config
from utils.api_client import APIClient
from utils.db_client import DatabaseClient

st.set_page_config(
    page_title="System Overview",
    page_icon="🏠",
    layout="wide"
)

def main():
    st.title("🏠 System Overview Dashboard")
    
    # Initialize clients
    config = Config()
    api_client = APIClient()
    db_client = DatabaseClient()
    
    # Auto-refresh controls
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        st.markdown(f"**Environment**: {config.ENVIRONMENT.upper()} | **Last Updated**: {datetime.now().strftime('%H:%M:%S')}")
    
    with col2:
        auto_refresh = st.checkbox("Auto Refresh", value=True)
    
    with col3:
        refresh_rate = st.selectbox("Refresh Rate", [5, 10, 30, 60], index=0)
    
    # Service Status Overview
    st.header("🚦 Service Status")
    
    # Get all service statuses
    services_status = api_client.get_all_services_status()
    postgres_status = db_client.get_postgres_status()
    redis_status = db_client.get_redis_status()
    
    # Create status metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        backend_data = services_status.get("backend", {})
        backend_online = "Online" in backend_data.get("status", "")
        
        st.metric(
            label="🔧 Backend API",
            value="Online" if backend_online else "Offline",
            delta=backend_data.get("response_time", "N/A"),
            delta_color="normal"
        )
        
        if backend_online:
            st.success("✅ Operational")
        else:
            st.error("❌ Down")
    
    with col2:
        python_data = services_status.get("python_service", {})
        python_online = "Online" in python_data.get("status", "")
        
        st.metric(
            label="🐍 Python Service",
            value="Online" if python_online else "Offline",
            delta=python_data.get("response_time", "N/A"),
            delta_color="normal"
        )
        
        if python_online:
            st.success("✅ Operational")
        else:
            st.error("❌ Down")
    
    with col3:
        postgres_online = "Connected" in postgres_status.get("status", "")
        
        st.metric(
            label="🐘 PostgreSQL",
            value="Connected" if postgres_online else "Disconnected",
            delta=postgres_status.get("database_size", "N/A"),
            delta_color="normal"
        )
        
        if postgres_online:
            st.success("✅ Connected")
        else:
            st.error("❌ Disconnected")
    
    with col4:
        redis_online = "Connected" in redis_status.get("status", "")
        
        st.metric(
            label="🔴 Redis",
            value="Connected" if redis_online else "Disconnected",
            delta=redis_status.get("used_memory", "N/A"),
            delta_color="normal"
        )
        
        if redis_online:
            st.success("✅ Connected")
        else:
            st.error("❌ Disconnected")
    
    # System Health Summary
    st.header("📊 System Health Summary")
    
    total_services = 4
    online_services = sum([
        backend_online,
        python_online,
        postgres_online,
        redis_online
    ])
    
    health_percentage = (online_services / total_services) * 100
    
    # Health gauge chart
    fig_gauge = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=health_percentage,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': "System Health %"},
        delta={'reference': 100},
        gauge={
            'axis': {'range': [None, 100]},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [0, 50], 'color': "lightgray"},
                {'range': [50, 75], 'color': "yellow"},
                {'range': [75, 100], 'color': "lightgreen"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 90
            }
        }
    ))
    
    fig_gauge.update_layout(height=300)
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.plotly_chart(fig_gauge, use_container_width=True)
    
    with col2:
        # Service status breakdown
        status_data = {
            "Service": ["Backend API", "Python Service", "PostgreSQL", "Redis"],
            "Status": [
                "🟢 Online" if backend_online else "🔴 Offline",
                "🟢 Online" if python_online else "🔴 Offline", 
                "🟢 Connected" if postgres_online else "🔴 Disconnected",
                "🟢 Connected" if redis_online else "🔴 Disconnected"
            ],
            "Response Time": [
                backend_data.get("response_time", "N/A"),
                python_data.get("response_time", "N/A"),
                "N/A",
                "N/A"
            ]
        }
        
        st.dataframe(pd.DataFrame(status_data), use_container_width=True)
    
    # Performance Metrics
    st.header("⚡ Performance Metrics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Response time comparison
        response_times = []
        service_names = []
        
        if backend_data.get("response_time_numeric", 0) > 0:
            response_times.append(backend_data["response_time_numeric"])
            service_names.append("Backend API")
        
        if python_data.get("response_time_numeric", 0) > 0:
            response_times.append(python_data["response_time_numeric"])
            service_names.append("Python Service")
        
        if response_times:
            fig_bar = px.bar(
                x=service_names,
                y=response_times,
                title="API Response Times (ms)",
                color=response_times,
                color_continuous_scale="RdYlGn_r"
            )
            fig_bar.update_layout(height=400)
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("No response time data available")
    
    with col2:
        # Database metrics
        if postgres_online and postgres_status.get("tables"):
            tables_data = postgres_status["tables"]
            
            # Convert to DataFrame for better visualization
            df_tables = pd.DataFrame(tables_data)
            
            if not df_tables.empty:
                fig_pie = px.pie(
                    df_tables,
                    values="inserts",
                    names="table",
                    title="Database Activity (Inserts by Table)"
                )
                fig_pie.update_layout(height=400)
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.info("No table data available")
        else:
            st.info("Database not connected or no table data")
    
    # Recent Activity
    st.header("📝 Recent Activity")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🔄 Service Health Checks")
        
        # Create a log of recent checks
        activity_log = []
        
        for service_name, data in services_status.items():
            activity_log.append({
                "Time": data.get("timestamp", "N/A"),
                "Service": service_name.replace("_", " ").title(),
                "Status": data.get("status", "Unknown"),
                "Details": f"Response: {data.get('response_time', 'N/A')}"
            })
        
        if postgres_status:
            activity_log.append({
                "Time": postgres_status.get("timestamp", "N/A"),
                "Service": "PostgreSQL",
                "Status": postgres_status.get("status", "Unknown"),
                "Details": f"Size: {postgres_status.get('database_size', 'N/A')}"
            })
        
        if redis_status:
            activity_log.append({
                "Time": redis_status.get("timestamp", "N/A"),
                "Service": "Redis",
                "Status": redis_status.get("status", "Unknown"),
                "Details": f"Memory: {redis_status.get('used_memory', 'N/A')}"
            })
        
        st.dataframe(pd.DataFrame(activity_log), use_container_width=True)
    
    with col2:
        st.subheader("💾 Database Activity")
        
        if postgres_online and postgres_status.get("recent_queries"):
            queries_df = pd.DataFrame(postgres_status["recent_queries"])
            st.dataframe(queries_df, use_container_width=True)
        else:
            st.info("No recent database activity")
    
    # Alerts and Notifications
    st.header("🚨 Alerts & Notifications")
    
    alerts = []
    
    if not backend_online:
        alerts.append({"Level": "🔴 Critical", "Message": "Backend API is offline", "Time": datetime.now().strftime("%H:%M:%S")})
    
    if not python_online:
        alerts.append({"Level": "🔴 Critical", "Message": "Python Service is offline", "Time": datetime.now().strftime("%H:%M:%S")})
    
    if not postgres_online:
        alerts.append({"Level": "🔴 Critical", "Message": "PostgreSQL is disconnected", "Time": datetime.now().strftime("%H:%M:%S")})
    
    if not redis_online:
        alerts.append({"Level": "🟡 Warning", "Message": "Redis is disconnected", "Time": datetime.now().strftime("%H:%M:%S")})
    
    # Check response times
    for service, data in services_status.items():
        response_time = data.get("response_time_numeric", 0)
        if response_time > 1000:  # > 1 second
            alerts.append({
                "Level": "🟡 Warning",
                "Message": f"{service.replace('_', ' ').title()} response time is high ({data.get('response_time', 'N/A')})",
                "Time": datetime.now().strftime("%H:%M:%S")
            })
    
    if alerts:
        st.dataframe(pd.DataFrame(alerts), use_container_width=True)
    else:
        st.success("🎉 No alerts - All systems running smoothly!")
    
    # Auto-refresh logic
    if auto_refresh:
        time.sleep(refresh_rate)
        st.rerun()

if __name__ == "__main__":
    main()