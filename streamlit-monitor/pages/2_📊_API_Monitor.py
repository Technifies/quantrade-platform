import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import json
import time
import sys
import os

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.config import Config
from utils.api_client import APIClient

st.set_page_config(
    page_title="API Monitor",
    page_icon="📊",
    layout="wide"
)

def main():
    st.title("📊 API Monitoring Dashboard")
    
    # Initialize client
    config = Config()
    api_client = APIClient()
    
    # Sidebar controls
    st.sidebar.header("🎛️ Controls")
    
    environment = st.sidebar.selectbox(
        "Environment",
        ["development", "production"],
        index=0 if config.ENVIRONMENT == "development" else 1
    )
    
    auto_refresh = st.sidebar.checkbox("Auto Refresh", value=True)
    refresh_interval = st.sidebar.slider("Refresh Interval (s)", 1, 60, 10)
    
    if st.sidebar.button("🔄 Refresh Now"):
        st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Service URLs:**")
    for name, url in config.get_service_urls().items():
        st.sidebar.markdown(f"• **{name}**: {url}")
    
    # Main content tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🏥 Health Checks", "🔧 Endpoint Testing", "📈 Performance", "📝 Logs"])
    
    with tab1:
        show_health_checks(api_client, config)
    
    with tab2:
        show_endpoint_testing(api_client, config)
    
    with tab3:
        show_performance_metrics(api_client)
    
    with tab4:
        show_api_logs(api_client)
    
    # Auto refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()

def show_health_checks(api_client, config):
    """Show health check status for all services"""
    st.header("🏥 Service Health Monitoring")
    
    # Get health status for all services
    health_endpoints = config.get_health_endpoints()
    health_results = {}
    
    for service_name, endpoint in health_endpoints.items():
        health_results[service_name] = api_client.check_service_health(service_name, endpoint)
    
    # Display health status cards
    cols = st.columns(len(health_results))
    
    for i, (service_name, health_data) in enumerate(health_results.items()):
        with cols[i]:
            # Service status card
            is_online = "Online" in health_data.get("status", "")
            
            if is_online:
                st.success(f"✅ {service_name}")
            else:
                st.error(f"❌ {service_name}")
            
            # Metrics
            st.metric("Status", health_data.get("status", "Unknown"))
            st.metric("Response Time", health_data.get("response_time", "N/A"))
            st.metric("Status Code", health_data.get("status_code", "N/A"))
            
            # Last checked
            st.caption(f"Last checked: {health_data.get('timestamp', 'Unknown')}")
    
    # Detailed health information
    st.subheader("📋 Detailed Health Information")
    
    for service_name, health_data in health_results.items():
        with st.expander(f"{service_name} Details", expanded=False):
            col1, col2 = st.columns(2)
            
            with col1:
                st.json({
                    "Service": health_data.get("service", "Unknown"),
                    "URL": health_data.get("url", "Unknown"),
                    "Status Code": health_data.get("status_code", "Unknown"),
                    "Response Time": health_data.get("response_time", "Unknown"),
                    "Timestamp": health_data.get("timestamp", "Unknown")
                })
            
            with col2:
                if health_data.get("details"):
                    st.subheader("Response Details:")
                    if isinstance(health_data["details"], dict):
                        st.json(health_data["details"])
                    else:
                        st.text(health_data["details"])
    
    # Health history chart
    st.subheader("📈 Response Time History")
    
    # Simulated historical data (in real implementation, you'd store this)
    response_times = []
    timestamps = []
    services = []
    
    for service_name, health_data in health_results.items():
        response_time = health_data.get("response_time_numeric", 0)
        if response_time > 0:
            response_times.append(response_time)
            timestamps.append(datetime.now())
            services.append(service_name)
    
    if response_times:
        fig = px.bar(
            x=services,
            y=response_times,
            title="Current Response Times by Service",
            labels={"x": "Service", "y": "Response Time (ms)"},
            color=response_times,
            color_continuous_scale="RdYlGn_r"
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No response time data available")

def show_endpoint_testing(api_client, config):
    """Show endpoint testing interface"""
    st.header("🔧 API Endpoint Testing")
    
    # Quick test buttons for common endpoints
    st.subheader("⚡ Quick Tests")
    
    common_endpoints = [
        {"name": "Health Check", "method": "GET", "endpoint": "/health"},
        {"name": "Auth Status", "method": "GET", "endpoint": "/api/auth/me"},
        {"name": "Strategies List", "method": "GET", "endpoint": "/api/strategies"},
        {"name": "User Profile", "method": "GET", "endpoint": "/api/users/profile"},
    ]
    
    cols = st.columns(4)
    
    for i, endpoint_info in enumerate(common_endpoints):
        with cols[i % 4]:
            if st.button(f"🧪 {endpoint_info['name']}"):
                with st.spinner(f"Testing {endpoint_info['name']}..."):
                    result = api_client.test_api_endpoint(
                        endpoint_info['method'],
                        endpoint_info['endpoint']
                    )
                    
                    if result.get("success"):
                        st.success(f"✅ {endpoint_info['name']} - {result.get('response_time', 0)}ms")
                    else:
                        st.error(f"❌ {endpoint_info['name']} - {result.get('status_code', 'Error')}")
    
    st.markdown("---")
    
    # Custom endpoint testing
    st.subheader("🛠️ Custom Endpoint Testing")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Request configuration
        st.subheader("Request Configuration")
        
        method = st.selectbox(
            "HTTP Method",
            ["GET", "POST", "PUT", "DELETE", "PATCH"],
            index=0
        )
        
        endpoint = st.text_input(
            "Endpoint Path",
            value="/api/health",
            help="Enter the endpoint path (e.g., /api/users/profile)"
        )
        
        # Headers
        st.subheader("Headers")
        headers_text = st.text_area(
            "Request Headers (JSON)",
            value='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer your-token-here"\n}',
            height=100
        )
        
        # Request body (for POST/PUT requests)
        if method in ["POST", "PUT", "PATCH"]:
            st.subheader("Request Body")
            request_body = st.text_area(
                "Request Body (JSON)",
                value='{\n  "key": "value"\n}',
                height=150
            )
        else:
            request_body = None
    
    with col2:
        # Test execution
        st.subheader("Test Execution")
        
        if st.button("🚀 Execute Request", type="primary"):
            try:
                # Parse headers
                headers = json.loads(headers_text) if headers_text.strip() else None
                
                # Parse request body
                data = json.loads(request_body) if request_body and request_body.strip() else None
                
                with st.spinner("Executing request..."):
                    result = api_client.test_api_endpoint(method, endpoint, data, headers)
                
                # Display results
                st.subheader("Response")
                
                # Response summary
                col_a, col_b, col_c = st.columns(3)
                
                with col_a:
                    status_code = result.get("status_code", "Unknown")
                    if result.get("success"):
                        st.success(f"Status: {status_code}")
                    else:
                        st.error(f"Status: {status_code}")
                
                with col_b:
                    response_time = result.get("response_time", 0)
                    st.metric("Response Time", f"{response_time}ms")
                
                with col_c:
                    st.metric("Timestamp", result.get("timestamp", "Unknown"))
                
                # Response data
                st.subheader("Response Data")
                response_data = result.get("response_data", "No response data")
                
                if isinstance(response_data, dict):
                    st.json(response_data)
                else:
                    st.code(str(response_data))
                
            except json.JSONDecodeError as e:
                st.error(f"JSON parsing error: {e}")
            except Exception as e:
                st.error(f"Request failed: {e}")
    
    # Request history
    st.subheader("📝 Request History")
    
    # Initialize session state for history
    if "request_history" not in st.session_state:
        st.session_state.request_history = []
    
    if st.session_state.request_history:
        history_df = pd.DataFrame(st.session_state.request_history)
        st.dataframe(history_df, use_container_width=True)
        
        if st.button("🗑️ Clear History"):
            st.session_state.request_history = []
            st.rerun()
    else:
        st.info("No request history yet. Execute some requests to see them here.")

def show_performance_metrics(api_client):
    """Show API performance metrics"""
    st.header("📈 Performance Metrics")
    
    # Get current service status
    services_status = api_client.get_all_services_status()
    
    # Performance overview
    st.subheader("⚡ Current Performance")
    
    col1, col2, col3, col4 = st.columns(4)
    
    # Calculate performance metrics
    response_times = []
    for service, data in services_status.items():
        response_time = data.get("response_time_numeric", 0)
        if response_time > 0:
            response_times.append(response_time)
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    max_response_time = max(response_times) if response_times else 0
    min_response_time = min(response_times) if response_times else 0
    
    with col1:
        st.metric("Average Response Time", f"{avg_response_time:.2f}ms")
    
    with col2:
        st.metric("Max Response Time", f"{max_response_time:.2f}ms")
    
    with col3:
        st.metric("Min Response Time", f"{min_response_time:.2f}ms")
    
    with col4:
        online_services = sum(1 for data in services_status.values() if "Online" in data.get("status", ""))
        st.metric("Services Online", f"{online_services}/{len(services_status)}")
    
    # Performance charts
    col1, col2 = st.columns(2)
    
    with col1:
        # Response time by service
        if response_times:
            service_names = [service.replace("_", " ").title() for service in services_status.keys()]
            
            fig_performance = px.bar(
                x=service_names[:len(response_times)],
                y=response_times,
                title="Response Time by Service",
                labels={"x": "Service", "y": "Response Time (ms)"},
                color=response_times,
                color_continuous_scale="RdYlGn_r"
            )
            fig_performance.update_layout(height=400)
            st.plotly_chart(fig_performance, use_container_width=True)
    
    with col2:
        # Service availability
        availability_data = {
            "Service": [],
            "Status": [],
            "Count": []
        }
        
        for service, data in services_status.items():
            service_name = service.replace("_", " ").title()
            is_online = "Online" in data.get("status", "")
            
            availability_data["Service"].append(service_name)
            availability_data["Status"].append("Online" if is_online else "Offline")
            availability_data["Count"].append(1)
        
        if availability_data["Service"]:
            fig_availability = px.pie(
                names=[f"{s} ({st})" for s, st in zip(availability_data["Service"], availability_data["Status"])],
                values=availability_data["Count"],
                title="Service Availability"
            )
            fig_availability.update_layout(height=400)
            st.plotly_chart(fig_availability, use_container_width=True)
    
    # Performance alerts
    st.subheader("🚨 Performance Alerts")
    
    alerts = []
    
    for service, data in services_status.items():
        response_time = data.get("response_time_numeric", 0)
        service_name = service.replace("_", " ").title()
        
        if response_time > 1000:  # > 1 second
            alerts.append({
                "Level": "🔴 Critical",
                "Service": service_name,
                "Issue": f"High response time: {data.get('response_time', 'N/A')}",
                "Timestamp": data.get("timestamp", "Unknown")
            })
        elif response_time > 500:  # > 500ms
            alerts.append({
                "Level": "🟡 Warning", 
                "Service": service_name,
                "Issue": f"Elevated response time: {data.get('response_time', 'N/A')}",
                "Timestamp": data.get("timestamp", "Unknown")
            })
        
        if "Offline" in data.get("status", ""):
            alerts.append({
                "Level": "🔴 Critical",
                "Service": service_name,
                "Issue": "Service is offline",
                "Timestamp": data.get("timestamp", "Unknown")
            })
    
    if alerts:
        alerts_df = pd.DataFrame(alerts)
        st.dataframe(alerts_df, use_container_width=True)
    else:
        st.success("🎉 No performance issues detected!")

def show_api_logs(api_client):
    """Show API logs and monitoring"""
    st.header("📝 API Logs & Monitoring")
    
    # Log filters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        log_level = st.selectbox("Log Level", ["All", "Info", "Warning", "Error"], index=0)
    
    with col2:
        time_range = st.selectbox("Time Range", ["Last 1 hour", "Last 24 hours", "Last 7 days"], index=0)
    
    with col3:
        service_filter = st.selectbox("Service", ["All", "Backend", "Python Service"], index=0)
    
    # Mock log data (in real implementation, this would come from your logging system)
    current_time = datetime.now()
    mock_logs = []
    
    for i in range(20):
        log_time = current_time - timedelta(minutes=i*5)
        mock_logs.append({
            "Timestamp": log_time.strftime("%H:%M:%S"),
            "Level": ["INFO", "WARNING", "ERROR"][i % 3],
            "Service": ["Backend", "Python Service"][i % 2],
            "Message": f"Mock log message {i+1}",
            "Details": f"Additional details for log entry {i+1}"
        })
    
    # Display logs
    st.subheader("📋 Recent Logs")
    
    logs_df = pd.DataFrame(mock_logs)
    
    # Apply filters
    if log_level != "All":
        logs_df = logs_df[logs_df["Level"] == log_level.upper()]
    
    if service_filter != "All":
        logs_df = logs_df[logs_df["Service"] == service_filter]
    
    # Display filtered logs
    if not logs_df.empty:
        for _, log in logs_df.iterrows():
            with st.expander(f"{log['Timestamp']} - {log['Level']} - {log['Service']}", expanded=False):
                st.text(f"Message: {log['Message']}")
                st.text(f"Details: {log['Details']}")
    else:
        st.info("No logs match the selected filters.")
    
    # Real-time monitoring
    st.subheader("⏱️ Real-time Monitoring")
    
    if st.button("🔄 Refresh Logs"):
        st.rerun()
    
    # Log statistics
    st.subheader("📊 Log Statistics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Log level distribution
        log_counts = logs_df["Level"].value_counts()
        
        if not log_counts.empty:
            fig_logs = px.pie(
                values=log_counts.values,
                names=log_counts.index,
                title="Log Level Distribution"
            )
            st.plotly_chart(fig_logs, use_container_width=True)
    
    with col2:
        # Service activity
        service_counts = logs_df["Service"].value_counts()
        
        if not service_counts.empty:
            fig_services = px.bar(
                x=service_counts.index,
                y=service_counts.values,
                title="Log Activity by Service"
            )
            st.plotly_chart(fig_services, use_container_width=True)

if __name__ == "__main__":
    main()