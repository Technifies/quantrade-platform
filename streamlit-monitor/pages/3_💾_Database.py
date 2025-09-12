import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import time
import sys
import os

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.config import Config
from utils.db_client import DatabaseClient

st.set_page_config(
    page_title="Database Monitor",
    page_icon="💾",
    layout="wide"
)

def main():
    st.title("💾 Database Monitoring Dashboard")
    
    # Initialize client
    config = Config()
    db_client = DatabaseClient()
    
    # Sidebar controls
    st.sidebar.header("🎛️ Database Controls")
    
    auto_refresh = st.sidebar.checkbox("Auto Refresh", value=True)
    refresh_interval = st.sidebar.slider("Refresh Interval (s)", 5, 60, 15)
    
    if st.sidebar.button("🔄 Refresh Now"):
        st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Database Info:**")
    st.sidebar.markdown(f"**Environment**: {config.ENVIRONMENT}")
    st.sidebar.markdown(f"**Database URL**: {config.DATABASE_URL[:50]}...")
    st.sidebar.markdown(f"**Redis URL**: {config.REDIS_URL[:50]}...")
    
    # Main content tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🐘 PostgreSQL", "🔴 Redis", "🔍 Query Tool", "📊 Analytics"])
    
    with tab1:
        show_postgresql_monitoring(db_client)
    
    with tab2:
        show_redis_monitoring(db_client)
    
    with tab3:
        show_query_tool(db_client)
    
    with tab4:
        show_database_analytics(db_client)
    
    # Auto refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()

def show_postgresql_monitoring(db_client):
    """Show PostgreSQL monitoring information"""
    st.header("🐘 PostgreSQL Monitoring")
    
    # Get PostgreSQL status
    postgres_status = db_client.get_postgres_status()
    
    # Connection status
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if postgres_status.get("status") == "🟢 Connected":
            st.success("✅ Database Connected")
        else:
            st.error("❌ Database Disconnected")
            if postgres_status.get("error"):
                st.error(f"Error: {postgres_status['error']}")
    
    with col2:
        if postgres_status.get("database_size"):
            st.metric("Database Size", postgres_status["database_size"])
    
    with col3:
        if postgres_status.get("active_connections"):
            st.metric("Active Connections", postgres_status["active_connections"])
    
    if postgres_status.get("status") == "🟢 Connected":
        # Database metrics
        st.subheader("📊 Database Metrics")
        
        # Table statistics
        if postgres_status.get("tables"):
            st.subheader("📋 Table Statistics")
            
            tables_data = postgres_status["tables"]
            tables_df = pd.DataFrame(tables_data)
            
            if not tables_df.empty:
                # Display table statistics
                st.dataframe(tables_df, use_container_width=True)
                
                # Visualizations
                col1, col2 = st.columns(2)
                
                with col1:
                    # Table activity (inserts)
                    if "inserts" in tables_df.columns:
                        fig_inserts = px.bar(
                            tables_df,
                            x="table",
                            y="inserts",
                            title="Insert Operations by Table",
                            color="inserts",
                            color_continuous_scale="Blues"
                        )
                        fig_inserts.update_layout(height=400)
                        fig_inserts.update_xaxis(tickangle=45)
                        st.plotly_chart(fig_inserts, use_container_width=True)
                
                with col2:
                    # Table modifications (updates + deletes)
                    if "updates" in tables_df.columns and "deletes" in tables_df.columns:
                        tables_df["modifications"] = tables_df["updates"] + tables_df["deletes"]
                        
                        fig_mods = px.pie(
                            tables_df,
                            values="modifications",
                            names="table",
                            title="Table Modifications Distribution"
                        )
                        fig_mods.update_layout(height=400)
                        st.plotly_chart(fig_mods, use_container_width=True)
            else:
                st.info("No table statistics available")
        
        # Recent database activity
        st.subheader("🔄 Recent Database Activity")
        
        if postgres_status.get("recent_queries"):
            recent_queries = postgres_status["recent_queries"]
            queries_df = pd.DataFrame(recent_queries)
            
            st.dataframe(queries_df, use_container_width=True)
        else:
            st.info("No recent database activity")
        
        # Database health indicators
        st.subheader("💚 Database Health")
        
        health_col1, health_col2, health_col3 = st.columns(3)
        
        with health_col1:
            # Connection health
            connection_count = postgres_status.get("active_connections", 0)
            if connection_count < 10:
                st.success(f"✅ Healthy Connections: {connection_count}")
            elif connection_count < 50:
                st.warning(f"⚠️ Moderate Load: {connection_count} connections")
            else:
                st.error(f"🔴 High Load: {connection_count} connections")
        
        with health_col2:
            # Table activity health
            if postgres_status.get("tables"):
                total_operations = sum(
                    table.get("inserts", 0) + table.get("updates", 0) + table.get("deletes", 0)
                    for table in postgres_status["tables"]
                )
                st.metric("Total Operations", f"{total_operations:,}")
        
        with health_col3:
            # Last update
            st.metric("Last Check", postgres_status.get("timestamp", "Unknown"))
    
    else:
        # Connection troubleshooting
        st.subheader("🔧 Connection Troubleshooting")
        
        st.error("Unable to connect to PostgreSQL database")
        
        with st.expander("Troubleshooting Steps", expanded=True):
            st.markdown("""
            **Common Issues:**
            1. **Database URL**: Verify the DATABASE_URL environment variable
            2. **Network**: Check if database server is reachable
            3. **Credentials**: Ensure username/password are correct
            4. **SSL**: Check SSL configuration for production databases
            5. **Firewall**: Verify network access to database port
            
            **Debug Steps:**
            - Test connection manually with psql
            - Check database logs for connection attempts
            - Verify environment variables are loaded correctly
            """)

def show_redis_monitoring(db_client):
    """Show Redis monitoring information"""
    st.header("🔴 Redis Monitoring")
    
    # Get Redis status
    redis_status = db_client.get_redis_status()
    
    # Connection status
    if redis_status.get("status") == "🟢 Connected":
        st.success("✅ Redis Connected")
        
        # Redis metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if redis_status.get("redis_version"):
                st.metric("Redis Version", redis_status["redis_version"])
        
        with col2:
            if redis_status.get("used_memory"):
                st.metric("Memory Usage", redis_status["used_memory"])
        
        with col3:
            if redis_status.get("connected_clients"):
                st.metric("Connected Clients", redis_status["connected_clients"])
        
        with col4:
            if redis_status.get("uptime_in_seconds"):
                uptime_hours = redis_status["uptime_in_seconds"] // 3600
                st.metric("Uptime (hours)", f"{uptime_hours:,}")
        
        # Redis performance metrics
        st.subheader("📈 Redis Performance")
        
        perf_col1, perf_col2 = st.columns(2)
        
        with perf_col1:
            # Commands processed
            if redis_status.get("total_commands_processed"):
                st.metric("Total Commands", f"{redis_status['total_commands_processed']:,}")
            
            # Hit rate calculation
            hits = redis_status.get("keyspace_hits", 0)
            misses = redis_status.get("keyspace_misses", 0)
            
            if hits + misses > 0:
                hit_rate = (hits / (hits + misses)) * 100
                st.metric("Cache Hit Rate", f"{hit_rate:.1f}%")
        
        with perf_col2:
            # Hit/Miss visualization
            if hits > 0 or misses > 0:
                hit_miss_data = pd.DataFrame({
                    "Type": ["Hits", "Misses"],
                    "Count": [hits, misses]
                })
                
                fig_hit_miss = px.pie(
                    hit_miss_data,
                    values="Count",
                    names="Type",
                    title="Cache Hit/Miss Ratio",
                    color_discrete_sequence=["#00CC96", "#FF6692"]
                )
                fig_hit_miss.update_layout(height=300)
                st.plotly_chart(fig_hit_miss, use_container_width=True)
        
        # Redis health indicators
        st.subheader("💚 Redis Health")
        
        redis_health_col1, redis_health_col2, redis_health_col3 = st.columns(3)
        
        with redis_health_col1:
            client_count = redis_status.get("connected_clients", 0)
            if client_count < 100:
                st.success(f"✅ Normal Client Load: {client_count}")
            else:
                st.warning(f"⚠️ High Client Load: {client_count}")
        
        with redis_health_col2:
            memory = redis_status.get("used_memory", "0B")
            st.info(f"💾 Memory Usage: {memory}")
        
        with redis_health_col3:
            st.metric("Last Check", redis_status.get("timestamp", "Unknown"))
    
    else:
        st.error("❌ Redis Disconnected")
        if redis_status.get("error"):
            st.error(f"Error: {redis_status['error']}")
        
        # Redis troubleshooting
        st.subheader("🔧 Redis Troubleshooting")
        
        with st.expander("Troubleshooting Steps", expanded=True):
            st.markdown("""
            **Common Issues:**
            1. **Redis URL**: Verify the REDIS_URL environment variable
            2. **Redis Server**: Check if Redis server is running
            3. **Network**: Ensure network connectivity to Redis
            4. **Authentication**: Check Redis password if required
            5. **Port**: Verify Redis is listening on correct port (default 6379)
            
            **Debug Commands:**
            - `redis-cli ping` - Test Redis connection
            - `redis-server --version` - Check Redis version
            - Check Redis logs for connection issues
            """)

def show_query_tool(db_client):
    """Show database query tool"""
    st.header("🔍 Database Query Tool")
    
    # Query categories
    query_category = st.selectbox(
        "Query Category",
        ["Custom Query", "Table Information", "Performance Queries", "User Data"]
    )
    
    # Predefined queries based on category
    predefined_queries = {
        "Table Information": {
            "List all tables": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
            "Table sizes": """
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
            """,
            "Column information": """
                SELECT 
                    table_name,
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position;
            """
        },
        "Performance Queries": {
            "Active connections": """
                SELECT 
                    datname,
                    usename,
                    application_name,
                    client_addr,
                    state,
                    query_start,
                    now() - query_start AS duration
                FROM pg_stat_activity 
                WHERE state != 'idle'
                ORDER BY query_start;
            """,
            "Table statistics": """
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins AS inserts,
                    n_tup_upd AS updates,
                    n_tup_del AS deletes,
                    n_live_tup AS live_tuples,
                    last_vacuum,
                    last_autovacuum
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC;
            """,
            "Index usage": """
                SELECT 
                    t.tablename,
                    indexname,
                    c.reltuples AS num_rows,
                    pg_size_pretty(pg_relation_size(quote_ident(t.tablename)::text)) AS table_size,
                    pg_size_pretty(pg_relation_size(quote_ident(indexname)::text)) AS index_size,
                    CASE WHEN indisunique THEN 'Y' ELSE 'N' END AS UNIQUE,
                    idx_scan as number_of_scans,
                    idx_tup_read as tuples_read,
                    idx_tup_fetch as tuples_fetched
                FROM pg_tables t
                LEFT OUTER JOIN pg_class c ON c.relname=t.tablename
                LEFT OUTER JOIN (
                    SELECT 
                        c.relname AS ctablename, 
                        ipg.relname AS indexname, 
                        x.indnatts AS number_of_columns, 
                        idx_scan, 
                        idx_tup_read, 
                        idx_tup_fetch, 
                        indexrelname, 
                        indisunique 
                    FROM pg_index x
                    JOIN pg_class c ON c.oid = x.indrelid
                    JOIN pg_class ipg ON ipg.oid = x.indexrelid
                    JOIN pg_stat_all_indexes psai ON x.indexrelid = psai.indexrelid
                ) AS foo ON t.tablename = foo.ctablename
                WHERE t.schemaname='public'
                ORDER BY 1,2;
            """
        },
        "User Data": {
            "User count": "SELECT COUNT(*) as total_users FROM users;",
            "Recent users": "SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;",
            "User activity": """
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as new_users
                FROM users 
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date;
            """
        }
    }
    
    # Query input
    col1, col2 = st.columns([2, 1])
    
    with col1:
        if query_category != "Custom Query":
            selected_query = st.selectbox(
                "Select Query",
                list(predefined_queries[query_category].keys())
            )
            default_query = predefined_queries[query_category][selected_query]
        else:
            default_query = "SELECT * FROM users LIMIT 5;"
        
        query = st.text_area(
            "SQL Query",
            value=default_query,
            height=200,
            help="Enter your SQL query here. Be careful with UPDATE/DELETE operations."
        )
    
    with col2:
        st.subheader("Query Options")
        
        limit_results = st.checkbox("Limit Results", value=True)
        if limit_results:
            result_limit = st.number_input("Max Rows", min_value=1, max_value=1000, value=100)
        else:
            result_limit = None
        
        explain_query = st.checkbox("Explain Query", value=False)
        
        if st.button("🚀 Execute Query", type="primary"):
            execute_database_query(db_client, query, result_limit, explain_query)
    
    # Query history
    st.subheader("📝 Query History")
    
    if "query_history" not in st.session_state:
        st.session_state.query_history = []
    
    if st.session_state.query_history:
        for i, hist_query in enumerate(reversed(st.session_state.query_history[-10:])):
            with st.expander(f"Query {len(st.session_state.query_history)-i}: {hist_query['timestamp']}", expanded=False):
                st.code(hist_query['query'])
                st.text(f"Execution Time: {hist_query['execution_time']}ms")
                st.text(f"Rows: {hist_query['row_count']}")
    else:
        st.info("No query history yet.")
    
    if st.button("🗑️ Clear History"):
        st.session_state.query_history = []
        st.rerun()

def execute_database_query(db_client, query, limit, explain):
    """Execute a database query and display results"""
    try:
        # Add LIMIT if specified
        if limit and not query.strip().upper().endswith(';'):
            query = f"{query.rstrip(';')} LIMIT {limit};"
        
        # Execute EXPLAIN if requested
        if explain:
            explain_result = db_client.execute_query(f"EXPLAIN ANALYZE {query}")
            if explain_result.get("success"):
                st.subheader("📊 Query Execution Plan")
                st.text(explain_result["data"].to_string())
        
        # Execute main query
        with st.spinner("Executing query..."):
            result = db_client.execute_query(query)
        
        if result.get("success"):
            st.success(f"✅ Query executed successfully in {result['execution_time']}ms")
            
            # Display results
            data = result["data"]
            
            if isinstance(data, pd.DataFrame) and not data.empty:
                st.subheader("📋 Query Results")
                st.dataframe(data, use_container_width=True)
                
                # Results summary
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Rows Returned", len(data))
                with col2:
                    st.metric("Columns", len(data.columns))
                with col3:
                    st.metric("Execution Time", f"{result['execution_time']}ms")
                
                # Download option
                csv = data.to_csv(index=False)
                st.download_button(
                    label="📥 Download CSV",
                    data=csv,
                    file_name=f"query_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
                
            else:
                st.info("Query executed successfully but returned no results.")
            
            # Add to history
            if "query_history" not in st.session_state:
                st.session_state.query_history = []
            
            st.session_state.query_history.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "query": query,
                "execution_time": result['execution_time'],
                "row_count": result['row_count']
            })
            
        else:
            st.error(f"❌ Query failed: {result.get('error')}")
            
    except Exception as e:
        st.error(f"❌ Error executing query: {str(e)}")

def show_database_analytics(db_client):
    """Show database analytics and insights"""
    st.header("📊 Database Analytics")
    
    # Get table statistics
    table_stats = db_client.get_table_stats()
    
    if not table_stats.empty:
        st.subheader("📋 Table Overview")
        
        # Display table statistics
        st.dataframe(table_stats, use_container_width=True)
        
        # Visualizations
        col1, col2 = st.columns(2)
        
        with col1:
            # Table size distribution
            if "live_tuples" in table_stats.columns:
                fig_size = px.bar(
                    table_stats.head(10),
                    x="tablename",
                    y="live_tuples",
                    title="Table Sizes (Live Tuples)",
                    color="live_tuples",
                    color_continuous_scale="Blues"
                )
                fig_size.update_xaxis(tickangle=45)
                fig_size.update_layout(height=400)
                st.plotly_chart(fig_size, use_container_width=True)
        
        with col2:
            # Activity heatmap
            if all(col in table_stats.columns for col in ["inserts", "updates", "deletes"]):
                activity_data = table_stats[["tablename", "inserts", "updates", "deletes"]].head(10)
                
                fig_activity = px.bar(
                    activity_data.melt(id_vars=["tablename"], 
                                     value_vars=["inserts", "updates", "deletes"],
                                     var_name="operation", value_name="count"),
                    x="tablename",
                    y="count",
                    color="operation",
                    title="Database Operations by Table",
                    barmode="stack"
                )
                fig_activity.update_xaxis(tickangle=45)
                fig_activity.update_layout(height=400)
                st.plotly_chart(fig_activity, use_container_width=True)
        
        # Database health analysis
        st.subheader("🔍 Database Health Analysis")
        
        health_col1, health_col2, health_col3 = st.columns(3)
        
        with health_col1:
            # Total records
            total_records = table_stats["live_tuples"].sum()
            st.metric("Total Records", f"{total_records:,}")
        
        with health_col2:
            # Most active table
            if "inserts" in table_stats.columns:
                most_active = table_stats.loc[table_stats["inserts"].idxmax(), "tablename"]
                st.metric("Most Active Table", most_active)
        
        with health_col3:
            # Tables needing maintenance
            if "dead_tuples" in table_stats.columns:
                tables_need_vacuum = len(table_stats[table_stats["dead_tuples"] > 1000])
                st.metric("Tables Needing Vacuum", tables_need_vacuum)
        
        # Maintenance recommendations
        st.subheader("🛠️ Maintenance Recommendations")
        
        recommendations = []
        
        if "dead_tuples" in table_stats.columns:
            high_dead_tuples = table_stats[table_stats["dead_tuples"] > 1000]
            if not high_dead_tuples.empty:
                recommendations.extend([
                    f"Consider VACUUM on {table}" 
                    for table in high_dead_tuples["tablename"].tolist()
                ])
        
        if not recommendations:
            recommendations.append("✅ Database appears to be in good health!")
        
        for rec in recommendations:
            st.info(rec)
    
    else:
        st.info("Unable to retrieve table statistics. Check database connection.")
    
    # Recent activity analysis
    recent_activity = db_client.get_recent_activity()
    
    if not recent_activity.empty:
        st.subheader("🔄 Recent Activity Analysis")
        st.dataframe(recent_activity, use_container_width=True)

if __name__ == "__main__":
    main()