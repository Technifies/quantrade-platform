import streamlit as st
import time
import pandas as pd
from utils.health_monitor import HealthMonitor
from utils.config import MONITORING_CONFIG, FEATURES

def main():
    st.title('Northflank Deployment Monitoring Dashboard')
    
    # Initialize Health Monitor
    health_monitor = HealthMonitor()
    
    # Sidebar Configuration
    st.sidebar.header('Monitoring Configuration')
    st.sidebar.write(f"Refresh Interval: {MONITORING_CONFIG['refresh_interval_seconds']} seconds")
    
    # Feature Toggle Section
    st.sidebar.header('Feature Toggles')
    for feature, enabled in FEATURES.items():
        st.sidebar.checkbox(feature.replace('_', ' ').title(), value=enabled, key=feature)
    
    # Main Monitoring View
    if FEATURES['service_health_check']:
        st.header('Service Health Status')
        
        # Real-time Health Check
        health_summary = health_monitor.get_service_health_summary()
        
        # Create Columns for Status
        col1, col2, col3, col4 = st.columns(4)
        
        status_mapping = {
            'backend_api': col1,
            'python_service': col2,
            'database': col3,
            'redis': col4
        }
        
        for service, column in status_mapping.items():
            with column:
                status = health_summary['service_status'][service]
                status_text = "Healthy" if status else "Unhealthy"
                color = "green" if status else "red"
                st.markdown(f"### {service.replace('_', ' ').title()}")
                st.markdown(f"<p style='color:{color};'>{status_text}</p>", unsafe_allow_html=True)
        
        # Critical Failures Alert
        if health_summary['critical_failures']:
            st.error(f"Critical Failures Detected: {', '.join(health_summary['critical_failures'])}")
    
    # API Testing Interface (if enabled)
    if FEATURES['api_testing']:
        st.header('API Endpoint Testing')
        # Future implementation: Add API testing interface
    
    # Add additional monitoring features as required
    if FEATURES['trading_analytics']:
        st.header('Trading Analytics')
        # Future implementation: Add trading performance metrics

if __name__ == '__main__':
    main()