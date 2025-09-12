import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
import sys
import os
import json

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.config import Config
from utils.api_client import APIClient

st.set_page_config(
    page_title="Trading Analytics",
    page_icon="📈",
    layout="wide"
)

def main():
    st.title("📈 Trading Analytics Dashboard")
    
    # Initialize client
    config = Config()
    api_client = APIClient()
    
    # Sidebar controls
    st.sidebar.header("🎛️ Trading Controls")
    
    auto_refresh = st.sidebar.checkbox("Auto Refresh", value=False)
    refresh_interval = st.sidebar.slider("Refresh Interval (s)", 10, 300, 30)
    
    if st.sidebar.button("🔄 Refresh Now"):
        st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("**Trading Environment:**")
    st.sidebar.markdown(f"**Mode**: {config.ENVIRONMENT}")
    st.sidebar.markdown(f"**Python Service**: {config.PYTHON_SERVICE_URL}")
    
    # Main content tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🧪 Backtesting", "📊 Strategy Analysis", "⚡ Live Testing", "📋 Results"])
    
    with tab1:
        show_backtesting_interface(api_client)
    
    with tab2:
        show_strategy_analysis()
    
    with tab3:
        show_live_testing(api_client)
    
    with tab4:
        show_results_dashboard()
    
    # Auto refresh
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()

def show_backtesting_interface(api_client):
    """Show backtesting interface"""
    st.header("🧪 Strategy Backtesting")
    
    # Backtesting configuration
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📝 Strategy Code")
        
        # Strategy templates
        strategy_template = st.selectbox(
            "Strategy Template",
            ["Custom", "Simple Moving Average", "RSI Strategy", "Bollinger Bands", "Mean Reversion"]
        )
        
        # Predefined strategies
        strategies = {
            "Simple Moving Average": '''
class SMAStrategy(bt.Strategy):
    params = (
        ('sma_period', 20),
    )
    
    def __init__(self):
        self.sma = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.sma_period)
        
    def next(self):
        if not self.position:
            if self.data.close[0] > self.sma[0]:
                self.buy()
        else:
            if self.data.close[0] < self.sma[0]:
                self.sell()
''',
            "RSI Strategy": '''
class RSIStrategy(bt.Strategy):
    params = (
        ('rsi_period', 14),
        ('rsi_upper', 70),
        ('rsi_lower', 30),
    )
    
    def __init__(self):
        self.rsi = bt.indicators.RSI(self.data.close, period=self.params.rsi_period)
        
    def next(self):
        if not self.position:
            if self.rsi[0] < self.params.rsi_lower:
                self.buy()
        else:
            if self.rsi[0] > self.params.rsi_upper:
                self.sell()
''',
            "Bollinger Bands": '''
class BBStrategy(bt.Strategy):
    params = (
        ('bb_period', 20),
        ('bb_dev', 2),
    )
    
    def __init__(self):
        self.bb = bt.indicators.BollingerBands(self.data.close, 
                                               period=self.params.bb_period, 
                                               devfactor=self.params.bb_dev)
        
    def next(self):
        if not self.position:
            if self.data.close[0] < self.bb.lines.bot[0]:
                self.buy()
        else:
            if self.data.close[0] > self.bb.lines.top[0]:
                self.sell()
''',
            "Mean Reversion": '''
class MeanReversionStrategy(bt.Strategy):
    params = (
        ('lookback', 20),
        ('threshold', 2.0),
    )
    
    def __init__(self):
        self.sma = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.lookback)
        self.std = bt.indicators.StandardDeviation(self.data.close, period=self.params.lookback)
        
    def next(self):
        current_price = self.data.close[0]
        upper_band = self.sma[0] + (self.std[0] * self.params.threshold)
        lower_band = self.sma[0] - (self.std[0] * self.params.threshold)
        
        if not self.position:
            if current_price < lower_band:
                self.buy()
        else:
            if current_price > upper_band:
                self.sell()
'''
        }
        
        if strategy_template != "Custom":
            default_code = strategies[strategy_template]
        else:
            default_code = '''
class CustomStrategy(bt.Strategy):
    def __init__(self):
        # Initialize indicators here
        pass
        
    def next(self):
        # Implement your trading logic here
        if not self.position:
            # Buy condition
            self.buy()
        else:
            # Sell condition
            self.sell()
'''
        
        strategy_code = st.text_area(
            "Strategy Code",
            value=default_code,
            height=400,
            help="Write your Backtrader strategy code here"
        )
    
    with col2:
        st.subheader("⚙️ Backtest Parameters")
        
        # Stock symbol
        symbol = st.text_input("Symbol", value="AAPL", help="Stock symbol to backtest")
        
        # Date range
        col_a, col_b = st.columns(2)
        with col_a:
            start_date = st.date_input(
                "Start Date", 
                value=datetime.now() - timedelta(days=365)
            )
        
        with col_b:
            end_date = st.date_input(
                "End Date", 
                value=datetime.now()
            )
        
        # Capital and parameters
        initial_capital = st.number_input(
            "Initial Capital ($)", 
            min_value=1000, 
            max_value=1000000, 
            value=10000,
            step=1000
        )
        
        commission = st.number_input(
            "Commission (%)", 
            min_value=0.0, 
            max_value=1.0, 
            value=0.001,
            step=0.001,
            format="%.3f"
        )
        
        # Run backtest button
        if st.button("🚀 Run Backtest", type="primary"):
            run_backtest(api_client, strategy_code, symbol, start_date, end_date, initial_capital, commission)

def run_backtest(api_client, strategy_code, symbol, start_date, end_date, initial_capital, commission):
    """Run backtest and display results"""
    with st.spinner("Running backtest... This may take a few moments."):
        result = api_client.run_backtest(
            strategy_code, 
            symbol, 
            start_date.strftime("%Y-%m-%d"), 
            end_date.strftime("%Y-%m-%d")
        )
    
    if result["success"]:
        st.success("✅ Backtest completed successfully!")
        
        # Store result in session state
        if "backtest_results" not in st.session_state:
            st.session_state.backtest_results = []
        
        backtest_data = result["data"]
        backtest_data["symbol"] = symbol
        backtest_data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        st.session_state.backtest_results.append(backtest_data)
        
        # Display results
        display_backtest_results(backtest_data)
        
    else:
        st.error("❌ Backtest failed")
        st.error(result["data"])

def display_backtest_results(result_data):
    """Display backtest results"""
    st.subheader("📊 Backtest Results")
    
    # Performance metrics
    if isinstance(result_data, dict):
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_return = result_data.get("total_return", 0)
            st.metric("Total Return", f"{total_return:.2%}")
        
        with col2:
            sharpe_ratio = result_data.get("sharpe_ratio", 0)
            st.metric("Sharpe Ratio", f"{sharpe_ratio:.3f}")
        
        with col3:
            max_drawdown = result_data.get("max_drawdown", 0)
            st.metric("Max Drawdown", f"{max_drawdown:.2%}")
        
        with col4:
            win_rate = result_data.get("win_rate", 0)
            st.metric("Win Rate", f"{win_rate:.1%}")
        
        # Additional metrics
        st.subheader("📈 Detailed Metrics")
        
        metrics_col1, metrics_col2 = st.columns(2)
        
        with metrics_col1:
            metrics_data = {
                "Metric": ["Total Trades", "Winning Trades", "Losing Trades", "Average Trade", "Best Trade", "Worst Trade"],
                "Value": [
                    result_data.get("total_trades", 0),
                    result_data.get("winning_trades", 0),
                    result_data.get("losing_trades", 0),
                    f"${result_data.get('average_trade', 0):.2f}",
                    f"${result_data.get('best_trade', 0):.2f}",
                    f"${result_data.get('worst_trade', 0):.2f}"
                ]
            }
            
            st.dataframe(pd.DataFrame(metrics_data), use_container_width=True)
        
        with metrics_col2:
            # Performance visualization
            if result_data.get("equity_curve"):
                equity_data = result_data["equity_curve"]
                fig = px.line(
                    x=range(len(equity_data)),
                    y=equity_data,
                    title="Equity Curve",
                    labels={"x": "Time", "y": "Portfolio Value ($)"}
                )
                st.plotly_chart(fig, use_container_width=True)
    
    else:
        st.json(result_data)

def show_strategy_analysis():
    """Show strategy analysis tools"""
    st.header("📊 Strategy Analysis")
    
    # Strategy comparison
    if "backtest_results" in st.session_state and st.session_state.backtest_results:
        st.subheader("🔍 Strategy Comparison")
        
        # Results table
        comparison_data = []
        for i, result in enumerate(st.session_state.backtest_results):
            if isinstance(result, dict):
                comparison_data.append({
                    "Test #": i + 1,
                    "Symbol": result.get("symbol", "N/A"),
                    "Timestamp": result.get("timestamp", "N/A"),
                    "Total Return": f"{result.get('total_return', 0):.2%}",
                    "Sharpe Ratio": f"{result.get('sharpe_ratio', 0):.3f}",
                    "Max Drawdown": f"{result.get('max_drawdown', 0):.2%}",
                    "Win Rate": f"{result.get('win_rate', 0):.1%}"
                })
        
        if comparison_data:
            comparison_df = pd.DataFrame(comparison_data)
            st.dataframe(comparison_df, use_container_width=True)
            
            # Visualization
            col1, col2 = st.columns(2)
            
            with col1:
                # Return comparison
                returns = [result.get('total_return', 0) for result in st.session_state.backtest_results if isinstance(result, dict)]
                test_numbers = list(range(1, len(returns) + 1))
                
                if returns:
                    fig_returns = px.bar(
                        x=test_numbers,
                        y=returns,
                        title="Total Return Comparison",
                        labels={"x": "Test Number", "y": "Total Return"},
                        color=returns,
                        color_continuous_scale="RdYlGn"
                    )
                    st.plotly_chart(fig_returns, use_container_width=True)
            
            with col2:
                # Risk-Return scatter
                sharpe_ratios = [result.get('sharpe_ratio', 0) for result in st.session_state.backtest_results if isinstance(result, dict)]
                
                if returns and sharpe_ratios:
                    fig_scatter = px.scatter(
                        x=returns,
                        y=sharpe_ratios,
                        title="Risk-Return Analysis",
                        labels={"x": "Total Return", "y": "Sharpe Ratio"},
                        hover_data={"Test": test_numbers}
                    )
                    st.plotly_chart(fig_scatter, use_container_width=True)
        
        # Clear results
        if st.button("🗑️ Clear Results"):
            st.session_state.backtest_results = []
            st.rerun()
    
    else:
        st.info("No backtest results available. Run some backtests to see analysis here.")
    
    # Strategy optimization suggestions
    st.subheader("🎯 Optimization Suggestions")
    
    with st.expander("Strategy Improvement Tips", expanded=False):
        st.markdown("""
        **General Optimization Tips:**
        
        1. **Parameter Tuning:**
           - Test different timeframes and periods
           - Optimize entry/exit conditions
           - Adjust risk management parameters
        
        2. **Risk Management:**
           - Implement stop-loss orders
           - Use position sizing based on volatility
           - Diversify across multiple symbols
        
        3. **Performance Metrics:**
           - Focus on risk-adjusted returns (Sharpe ratio)
           - Monitor maximum drawdown
           - Track win/loss ratios
        
        4. **Market Conditions:**
           - Test across different market regimes
           - Consider transaction costs and slippage
           - Validate on out-of-sample data
        """)

def show_live_testing(api_client):
    """Show live testing interface"""
    st.header("⚡ Live Strategy Testing")
    
    st.info("🚧 Live testing functionality is under development. This will allow you to test strategies with real market data in a paper trading environment.")
    
    # Mock interface for live testing
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🎮 Paper Trading Setup")
        
        # Paper trading configuration
        paper_capital = st.number_input("Paper Trading Capital ($)", value=10000, min_value=1000, step=1000)
        
        selected_strategy = st.selectbox(
            "Select Strategy",
            ["SMA Crossover", "RSI Strategy", "Bollinger Bands", "Custom Strategy"]
        )
        
        symbols = st.multiselect(
            "Select Symbols",
            ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"],
            default=["AAPL"]
        )
        
        if st.button("🚀 Start Paper Trading"):
            st.success("Paper trading session started!")
            st.info("This would connect to live data feeds and execute trades in a simulated environment.")
    
    with col2:
        st.subheader("📊 Live Performance")
        
        # Mock live performance data
        live_performance = {
            "Current Portfolio Value": "$10,250",
            "Total Return": "+2.5%",
            "Open Positions": "3",
            "Today's P&L": "+$125",
            "Active Strategies": "2"
        }
        
        for metric, value in live_performance.items():
            st.metric(metric, value)
        
        # Mock real-time chart
        dates = pd.date_range(start='2024-01-01', periods=100, freq='H')
        mock_prices = 100 + pd.Series(range(100)).apply(lambda x: x * 0.1 + (x % 10) * 0.5)
        
        fig_live = px.line(
            x=dates,
            y=mock_prices,
            title="Live Portfolio Performance (Mock Data)",
            labels={"x": "Time", "y": "Portfolio Value ($)"}
        )
        st.plotly_chart(fig_live, use_container_width=True)

def show_results_dashboard():
    """Show comprehensive results dashboard"""
    st.header("📋 Trading Results Dashboard")
    
    # Results summary
    if "backtest_results" in st.session_state and st.session_state.backtest_results:
        st.subheader("📊 Performance Summary")
        
        # Aggregate statistics
        results = [r for r in st.session_state.backtest_results if isinstance(r, dict)]
        
        if results:
            total_tests = len(results)
            avg_return = sum(r.get('total_return', 0) for r in results) / total_tests
            avg_sharpe = sum(r.get('sharpe_ratio', 0) for r in results) / total_tests
            best_return = max(r.get('total_return', 0) for r in results)
            worst_return = min(r.get('total_return', 0) for r in results)
            
            col1, col2, col3, col4, col5 = st.columns(5)
            
            with col1:
                st.metric("Total Tests", total_tests)
            
            with col2:
                st.metric("Avg Return", f"{avg_return:.2%}")
            
            with col3:
                st.metric("Avg Sharpe", f"{avg_sharpe:.3f}")
            
            with col4:
                st.metric("Best Return", f"{best_return:.2%}")
            
            with col5:
                st.metric("Worst Return", f"{worst_return:.2%}")
            
            # Performance distribution
            col1, col2 = st.columns(2)
            
            with col1:
                # Return distribution
                returns = [r.get('total_return', 0) for r in results]
                
                fig_hist = px.histogram(
                    x=returns,
                    nbins=10,
                    title="Return Distribution",
                    labels={"x": "Total Return", "y": "Frequency"}
                )
                st.plotly_chart(fig_hist, use_container_width=True)
            
            with col2:
                # Sharpe ratio distribution
                sharpe_ratios = [r.get('sharpe_ratio', 0) for r in results]
                
                fig_sharpe_hist = px.histogram(
                    x=sharpe_ratios,
                    nbins=10,
                    title="Sharpe Ratio Distribution",
                    labels={"x": "Sharpe Ratio", "y": "Frequency"}
                )
                st.plotly_chart(fig_sharpe_hist, use_container_width=True)
            
            # Detailed results table
            st.subheader("📋 Detailed Results")
            
            detailed_results = []
            for i, result in enumerate(results):
                detailed_results.append({
                    "Test": i + 1,
                    "Symbol": result.get("symbol", "N/A"),
                    "Date": result.get("timestamp", "N/A"),
                    "Total Return": result.get("total_return", 0),
                    "Sharpe Ratio": result.get("sharpe_ratio", 0),
                    "Max Drawdown": result.get("max_drawdown", 0),
                    "Win Rate": result.get("win_rate", 0),
                    "Total Trades": result.get("total_trades", 0)
                })
            
            results_df = pd.DataFrame(detailed_results)
            st.dataframe(results_df, use_container_width=True)
            
            # Export functionality
            csv = results_df.to_csv(index=False)
            st.download_button(
                label="📥 Download Results CSV",
                data=csv,
                file_name=f"backtest_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
    
    else:
        st.info("No trading results available. Run some backtests to see results here.")
        
        # Sample data visualization
        st.subheader("📈 Sample Trading Analytics")
        
        # Generate sample data for demonstration
        sample_data = pd.DataFrame({
            'Date': pd.date_range('2024-01-01', periods=30, freq='D'),
            'Portfolio_Value': [10000 + i*50 + (i%7)*100 for i in range(30)],
            'Daily_Return': [0.005 + (i%5)*0.001 for i in range(30)]
        })
        
        fig_sample = px.line(
            sample_data, 
            x='Date', 
            y='Portfolio_Value',
            title="Sample Portfolio Growth (Demo Data)",
            labels={"Portfolio_Value": "Portfolio Value ($)"}
        )
        st.plotly_chart(fig_sample, use_container_width=True)

if __name__ == "__main__":
    main()