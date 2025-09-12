import psycopg2
import redis
import pandas as pd
from typing import Dict, List, Any, Optional
import time
from .config import Config

class DatabaseClient:
    """Database client for monitoring PostgreSQL and Redis"""
    
    def __init__(self):
        self.config = Config()
        self.pg_conn = None
        self.redis_client = None
    
    def connect_postgres(self) -> bool:
        """Connect to PostgreSQL database"""
        try:
            self.pg_conn = psycopg2.connect(self.config.DATABASE_URL)
            return True
        except Exception as e:
            print(f"PostgreSQL connection error: {e}")
            return False
    
    def connect_redis(self) -> bool:
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(self.config.REDIS_URL)
            self.redis_client.ping()
            return True
        except Exception as e:
            print(f"Redis connection error: {e}")
            return False
    
    def get_postgres_status(self) -> Dict[str, Any]:
        """Get PostgreSQL status and metrics"""
        if not self.connect_postgres():
            return {
                "status": "🔴 Disconnected",
                "error": "Failed to connect to PostgreSQL"
            }
        
        try:
            cursor = self.pg_conn.cursor()
            
            # Get database size
            cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
            db_size = cursor.fetchone()[0]
            
            # Get table information
            cursor.execute("""
                SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
                FROM pg_stat_user_tables 
                ORDER BY n_tup_ins DESC;
            """)
            tables = cursor.fetchall()
            
            # Get connection count
            cursor.execute("SELECT count(*) FROM pg_stat_activity;")
            connections = cursor.fetchone()[0]
            
            # Get recent activity
            cursor.execute("""
                SELECT query, state, query_start 
                FROM pg_stat_activity 
                WHERE state != 'idle' 
                ORDER BY query_start DESC 
                LIMIT 5;
            """)
            recent_queries = cursor.fetchall()
            
            cursor.close()
            
            return {
                "status": "🟢 Connected",
                "database_size": db_size,
                "active_connections": connections,
                "tables": [{"schema": t[0], "table": t[1], "inserts": t[2], "updates": t[3], "deletes": t[4]} for t in tables],
                "recent_queries": [{"query": q[0][:100], "state": q[1], "start_time": q[2]} for q in recent_queries],
                "timestamp": time.strftime("%H:%M:%S")
            }
            
        except Exception as e:
            return {
                "status": "🔴 Error",
                "error": str(e),
                "timestamp": time.strftime("%H:%M:%S")
            }
        finally:
            if self.pg_conn:
                self.pg_conn.close()
    
    def get_redis_status(self) -> Dict[str, Any]:
        """Get Redis status and metrics"""
        if not self.connect_redis():
            return {
                "status": "🔴 Disconnected",
                "error": "Failed to connect to Redis"
            }
        
        try:
            info = self.redis_client.info()
            
            return {
                "status": "🟢 Connected",
                "redis_version": info.get("redis_version", "Unknown"),
                "used_memory": info.get("used_memory_human", "Unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "uptime_in_seconds": info.get("uptime_in_seconds", 0),
                "timestamp": time.strftime("%H:%M:%S")
            }
            
        except Exception as e:
            return {
                "status": "🔴 Error",
                "error": str(e),
                "timestamp": time.strftime("%H:%M:%S")
            }
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute a custom SQL query"""
        if not self.connect_postgres():
            return {"error": "Failed to connect to database"}
        
        try:
            start_time = time.time()
            df = pd.read_sql(query, self.pg_conn)
            execution_time = round((time.time() - start_time) * 1000, 2)
            
            return {
                "success": True,
                "data": df,
                "execution_time": execution_time,
                "row_count": len(df),
                "timestamp": time.strftime("%H:%M:%S")
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": time.strftime("%H:%M:%S")
            }
        finally:
            if self.pg_conn:
                self.pg_conn.close()
    
    def get_table_stats(self) -> pd.DataFrame:
        """Get statistics for all tables"""
        query = """
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
        """
        
        result = self.execute_query(query)
        return result.get("data", pd.DataFrame()) if result.get("success") else pd.DataFrame()
    
    def get_recent_activity(self) -> pd.DataFrame:
        """Get recent database activity"""
        query = """
        SELECT 
            datname,
            usename,
            application_name,
            client_addr,
            state,
            query_start,
            LEFT(query, 100) as query_preview
        FROM pg_stat_activity 
        WHERE state != 'idle' 
        ORDER BY query_start DESC 
        LIMIT 20;
        """
        
        result = self.execute_query(query)
        return result.get("data", pd.DataFrame()) if result.get("success") else pd.DataFrame()