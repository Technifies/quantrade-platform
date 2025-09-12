from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import backtrader as bt
import pandas as pd
import yfinance as yf
import numpy as np
from datetime import datetime, timedelta
import asyncio
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Backtrader Engine", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    strategyId: str
    strategyCode: str
    parameters: Dict[str, Any]
    startDate: str
    endDate: str
    initialCapital: float
    symbols: List[str]
    dataSource: str = "yahoo"

class BacktestResult(BaseModel):
    strategyId: str
    startDate: str
    endDate: str
    initialCapital: float
    finalCapital: float
    totalTrades: int
    winRate: float
    maxDrawdown: float
    sharpeRatio: float
    totalReturn: float
    results: Dict[str, Any]

class StrategyValidation(BaseModel):
    strategyCode: str

class CustomStrategy(bt.Strategy):
    """Base strategy class that can execute user-defined code"""
    
    def __init__(self):
        self.trades = []
        self.daily_values = []
        
    def log(self, txt, dt=None):
        dt = dt or self.datas[0].datetime.date(0)
        logger.info(f'{dt.isoformat()}: {txt}')

    def notify_order(self, order):
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'BUY EXECUTED: {order.executed.price:.2f}')
            elif order.issell():
                self.log(f'SELL EXECUTED: {order.executed.price:.2f}')

    def notify_trade(self, trade):
        if trade.isclosed:
            trade_data = {
                'symbol': trade.data._name,
                'entryDate': bt.num2date(trade.dtopen).strftime('%Y-%m-%d'),
                'exitDate': bt.num2date(trade.dtclose).strftime('%Y-%m-%d'),
                'side': 'BUY' if trade.long else 'SELL',
                'quantity': abs(trade.size),
                'entryPrice': trade.price,
                'exitPrice': trade.pnlcomm / trade.size + trade.price if trade.size != 0 else 0,
                'pnl': trade.pnl,
                'commission': trade.commission
            }
            self.trades.append(trade_data)
            self.log(f'TRADE CLOSED: PnL: {trade.pnl:.2f}')

    def next(self):
        # Record daily portfolio value
        self.daily_values.append({
            'date': self.datas[0].datetime.date(0).isoformat(),
            'portfolioValue': self.broker.getvalue(),
            'cash': self.broker.getcash()
        })

class MovingAverageCrossStrategy(CustomStrategy):
    """Example strategy: Moving Average Crossover"""
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
    )

    def __init__(self):
        super().__init__()
        self.fast_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.fast_period
        )
        self.slow_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.slow_period
        )
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)

    def next(self):
        super().next()
        
        if not self.position:
            if self.crossover > 0:  # Fast MA crosses above Slow MA
                self.buy()
        else:
            if self.crossover < 0:  # Fast MA crosses below Slow MA
                self.sell()

class RSIStrategy(CustomStrategy):
    """Example strategy: RSI Overbought/Oversold"""
    params = (
        ('rsi_period', 14),
        ('rsi_upper', 70),
        ('rsi_lower', 30),
    )

    def __init__(self):
        super().__init__()
        self.rsi = bt.indicators.RelativeStrengthIndex(
            self.datas[0], period=self.params.rsi_period
        )

    def next(self):
        super().next()
        
        if not self.position:
            if self.rsi < self.params.rsi_lower:  # Oversold
                self.buy()
        else:
            if self.rsi > self.params.rsi_upper:  # Overbought
                self.sell()

def get_data_yahoo(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch data from Yahoo Finance"""
    try:
        # Convert NSE symbols to Yahoo format
        if '.NS' not in symbol:
            symbol = f"{symbol}.NS"
        
        data = yf.download(symbol, start=start_date, end=end_date)
        if data.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        return data
    except Exception as e:
        logger.error(f"Failed to fetch data for {symbol}: {e}")
        raise

def calculate_performance_metrics(trades: List[Dict], daily_values: List[Dict], initial_capital: float) -> Dict[str, Any]:
    """Calculate comprehensive performance metrics"""
    if not trades or not daily_values:
        return {
            'totalReturn': 0,
            'annualizedReturn': 0,
            'volatility': 0,
            'sharpeRatio': 0,
            'sortinoRatio': 0,
            'maxDrawdown': 0,
            'calmarRatio': 0,
            'winRate': 0,
            'profitFactor': 0,
            'avgWin': 0,
            'avgLoss': 0,
            'largestWin': 0,
            'largestLoss': 0
        }
    
    # Calculate returns
    portfolio_values = [d['portfolioValue'] for d in daily_values]
    final_value = portfolio_values[-1]
    total_return = (final_value - initial_capital) / initial_capital
    
    # Calculate daily returns
    daily_returns = []
    for i in range(1, len(portfolio_values)):
        daily_return = (portfolio_values[i] - portfolio_values[i-1]) / portfolio_values[i-1]
        daily_returns.append(daily_return)
    
    daily_returns = np.array(daily_returns)
    
    # Annualized return
    trading_days = len(daily_returns)
    annualized_return = (1 + total_return) ** (252 / trading_days) - 1 if trading_days > 0 else 0
    
    # Volatility
    volatility = np.std(daily_returns) * np.sqrt(252) if len(daily_returns) > 1 else 0
    
    # Sharpe ratio (assuming risk-free rate of 6%)
    risk_free_rate = 0.06
    sharpe_ratio = (annualized_return - risk_free_rate) / volatility if volatility > 0 else 0
    
    # Sortino ratio
    negative_returns = daily_returns[daily_returns < 0]
    downside_deviation = np.std(negative_returns) * np.sqrt(252) if len(negative_returns) > 1 else 0
    sortino_ratio = (annualized_return - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
    
    # Maximum drawdown
    peak = portfolio_values[0]
    max_drawdown = 0
    for value in portfolio_values:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    # Calmar ratio
    calmar_ratio = annualized_return / max_drawdown if max_drawdown > 0 else 0
    
    # Trade statistics
    winning_trades = [t for t in trades if t['pnl'] > 0]
    losing_trades = [t for t in trades if t['pnl'] < 0]
    
    win_rate = len(winning_trades) / len(trades) if trades else 0
    
    total_wins = sum(t['pnl'] for t in winning_trades)
    total_losses = abs(sum(t['pnl'] for t in losing_trades))
    profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')
    
    avg_win = total_wins / len(winning_trades) if winning_trades else 0
    avg_loss = total_losses / len(losing_trades) if losing_trades else 0
    
    largest_win = max([t['pnl'] for t in winning_trades]) if winning_trades else 0
    largest_loss = min([t['pnl'] for t in losing_trades]) if losing_trades else 0
    
    return {
        'totalReturn': total_return,
        'annualizedReturn': annualized_return,
        'volatility': volatility,
        'sharpeRatio': sharpe_ratio,
        'sortinoRatio': sortino_ratio,
        'maxDrawdown': max_drawdown,
        'calmarRatio': calmar_ratio,
        'winRate': win_rate,
        'profitFactor': profit_factor,
        'avgWin': avg_win,
        'avgLoss': avg_loss,
        'largestWin': largest_win,
        'largestLoss': largest_loss
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/indicators")
async def get_indicators():
    """Get list of available Backtrader indicators"""
    indicators = [
        "SimpleMovingAverage", "ExponentialMovingAverage", "WeightedMovingAverage",
        "RelativeStrengthIndex", "MACD", "BollingerBands", "Stochastic",
        "AverageTrueRange", "CommodityChannelIndex", "Williams%R",
        "MomentumOscillator", "RateOfChange", "StochasticRSI"
    ]
    return {"indicators": indicators}

@app.get("/template/{template_type}")
async def get_strategy_template(template_type: str):
    """Get strategy template code"""
    templates = {
        "moving_average": """
class MovingAverageCrossStrategy(bt.Strategy):
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
    )

    def __init__(self):
        self.fast_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.fast_period
        )
        self.slow_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.slow_period
        )
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)

    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        else:
            if self.crossover < 0:
                self.sell()
        """,
        "rsi": """
class RSIStrategy(bt.Strategy):
    params = (
        ('rsi_period', 14),
        ('rsi_upper', 70),
        ('rsi_lower', 30),
    )

    def __init__(self):
        self.rsi = bt.indicators.RelativeStrengthIndex(
            self.datas[0], period=self.params.rsi_period
        )

    def next(self):
        if not self.position:
            if self.rsi < self.params.rsi_lower:
                self.buy()
        else:
            if self.rsi > self.params.rsi_upper:
                self.sell()
        """
    }
    
    if template_type not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"template": templates[template_type]}

@app.post("/validate")
async def validate_strategy(validation: StrategyValidation):
    """Validate strategy code syntax"""
    try:
        # Basic syntax validation
        compile(validation.strategyCode, '<string>', 'exec')
        return {"valid": True}
    except SyntaxError as e:
        return {"valid": False, "errors": [f"Syntax error: {str(e)}"]}
    except Exception as e:
        return {"valid": False, "errors": [f"Validation error: {str(e)}"]}

@app.post("/backtest")
async def run_backtest(request: BacktestRequest) -> BacktestResult:
    """Run backtest using Backtrader"""
    try:
        logger.info(f"Starting backtest for strategy {request.strategyId}")
        
        # Create Cerebro engine
        cerebro = bt.Cerebro()
        
        # Set initial capital
        cerebro.broker.setcash(request.initialCapital)
        
        # Set commission (0.1% per trade)
        cerebro.broker.setcommission(commission=0.001)
        
        # Add strategy based on strategy code or use predefined ones
        if "MovingAverageCross" in request.strategyCode:
            cerebro.addstrategy(MovingAverageCrossStrategy, **request.parameters)
        elif "RSI" in request.strategyCode:
            cerebro.addstrategy(RSIStrategy, **request.parameters)
        else:
            # For custom strategies, we'd need to execute the user code safely
            # This is a simplified version - in production, you'd want proper sandboxing
            cerebro.addstrategy(MovingAverageCrossStrategy, **request.parameters)
        
        # Add data feeds
        for symbol in request.symbols:
            try:
                data = get_data_yahoo(symbol, request.startDate, request.endDate)
                data_feed = bt.feeds.PandasData(dataname=data, name=symbol)
                cerebro.adddata(data_feed)
            except Exception as e:
                logger.warning(f"Failed to add data for {symbol}: {e}")
                continue
        
        if len(cerebro.datas) == 0:
            raise HTTPException(status_code=400, detail="No valid data feeds added")
        
        # Add analyzers
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
        cerebro.addanalyzer(bt.analyzers.Returns, _name='returns')
        
        # Run backtest
        logger.info("Running backtest...")
        results = cerebro.run()
        
        # Extract results
        strategy = results[0]
        
        # Get trade data
        trades = getattr(strategy, 'trades', [])
        daily_values = getattr(strategy, 'daily_values', [])
        
        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(daily_values)):
            prev_value = daily_values[i-1]['portfolioValue']
            curr_value = daily_values[i]['portfolioValue']
            daily_return = (curr_value - prev_value) / prev_value
            cumulative_return = (curr_value - request.initialCapital) / request.initialCapital
            
            # Simple drawdown calculation
            peak_value = max([d['portfolioValue'] for d in daily_values[:i+1]])
            drawdown = (peak_value - curr_value) / peak_value
            
            daily_returns.append({
                'date': daily_values[i]['date'],
                'portfolioValue': curr_value,
                'dailyReturn': daily_return,
                'cumulativeReturn': cumulative_return,
                'drawdown': drawdown
            })
        
        # Get analyzer results
        trade_analyzer = strategy.analyzers.trades.get_analysis()
        sharpe_analyzer = strategy.analyzers.sharpe.get_analysis()
        drawdown_analyzer = strategy.analyzers.drawdown.get_analysis()
        
        final_value = cerebro.broker.getvalue()
        total_trades = trade_analyzer.get('total', {}).get('total', 0)
        won_trades = trade_analyzer.get('won', {}).get('total', 0)
        win_rate = (won_trades / total_trades * 100) if total_trades > 0 else 0
        max_drawdown = drawdown_analyzer.get('max', {}).get('drawdown', 0) or 0
        sharpe_ratio = sharpe_analyzer.get('sharperatio', 0) or 0
        total_return = (final_value - request.initialCapital) / request.initialCapital
        
        # Calculate comprehensive metrics
        metrics = calculate_performance_metrics(trades, daily_values, request.initialCapital)
        
        result = BacktestResult(
            strategyId=request.strategyId,
            startDate=request.startDate,
            endDate=request.endDate,
            initialCapital=request.initialCapital,
            finalCapital=final_value,
            totalTrades=total_trades,
            winRate=win_rate,
            maxDrawdown=max_drawdown,
            sharpeRatio=sharpe_ratio,
            totalReturn=total_return,
            results={
                'trades': trades,
                'dailyReturns': daily_returns,
                'metrics': metrics
            }
        )
        
        logger.info(f"Backtest completed for strategy {request.strategyId}")
        logger.info(f"Final value: {final_value:.2f}, Total return: {total_return:.2%}")
        
        return result
        
    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)