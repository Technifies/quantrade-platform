import { RiskParameters } from '../types/trading';

export class RiskCalculator {
  private riskParams: RiskParameters;

  constructor(riskParams: RiskParameters) {
    this.riskParams = riskParams;
  }

  /**
   * Calculate position size based on entry price and risk parameters
   */
  calculatePositionSize(entryPrice: number): number {
    const notionalValue = this.riskParams.totalCapital / this.riskParams.maxSimultaneousPositions;
    return Math.floor(notionalValue / entryPrice);
  }

  /**
   * Calculate initial trailing stop-loss
   */
  calculateInitialStopLoss(entryPrice: number): number {
    return entryPrice * (1 - this.riskParams.trailingStopLoss / 100);
  }

  /**
   * Update trailing stop-loss based on current and highest price
   */
  updateTrailingStopLoss(
    entryPrice: number,
    currentPrice: number,
    highestPrice: number
  ): number {
    const initialStopLoss = this.calculateInitialStopLoss(entryPrice);
    const trailingStopLoss = highestPrice * (1 - this.riskParams.trailingStopLoss / 100);
    
    return Math.max(initialStopLoss, trailingStopLoss);
  }

  /**
   * Calculate maximum risk per trade in rupees
   */
  getMaxRiskPerTrade(): number {
    const notionalValue = this.riskParams.totalCapital / this.riskParams.maxSimultaneousPositions;
    return (notionalValue * this.riskParams.riskPerTrade) / 100;
  }

  /**
   * Calculate buying power with leverage
   */
  getBuyingPower(): number {
    return this.riskParams.intradayAllocation * this.riskParams.leverageMultiple;
  }

  /**
   * Calculate margin per trade
   */
  getMarginPerTrade(): number {
    return this.riskParams.intradayAllocation / this.riskParams.maxSimultaneousPositions;
  }

  /**
   * Check if position can be opened based on current exposure
   */
  canOpenPosition(
    entryPrice: number,
    currentExposure: number,
    activePositions: number
  ): {
    canOpen: boolean;
    reason?: string;
    suggestedSize?: number;
  } {
    // Check maximum positions limit
    if (activePositions >= this.riskParams.maxSimultaneousPositions) {
      return {
        canOpen: false,
        reason: 'Maximum simultaneous positions reached'
      };
    }

    // Check available margin
    const marginPerTrade = this.getMarginPerTrade();
    const availableMargin = this.getBuyingPower() - currentExposure;
    
    if (availableMargin < marginPerTrade) {
      return {
        canOpen: false,
        reason: 'Insufficient margin available'
      };
    }

    // Calculate suggested position size
    const suggestedSize = this.calculatePositionSize(entryPrice);
    const requiredMargin = suggestedSize * entryPrice;

    if (requiredMargin > availableMargin) {
      const adjustedSize = Math.floor(availableMargin / entryPrice);
      return {
        canOpen: adjustedSize > 0,
        reason: adjustedSize > 0 ? 'Adjusted position size due to margin constraints' : 'Insufficient margin for minimum position',
        suggestedSize: adjustedSize
      };
    }

    return {
      canOpen: true,
      suggestedSize
    };
  }

  /**
   * Calculate daily drawdown limit
   */
  getDailyDrawdownLimit(): number {
    return (this.riskParams.totalCapital * this.riskParams.maxDailyDrawdown) / 100;
  }

  /**
   * Check if daily drawdown limit is exceeded
   */
  isDrawdownLimitExceeded(currentDrawdown: number): boolean {
    return Math.abs(currentDrawdown) >= this.getDailyDrawdownLimit();
  }

  /**
   * Calculate risk utilization percentage
   */
  calculateRiskUtilization(
    currentExposure: number,
    activePositions: number
  ): number {
    const maxExposure = this.getBuyingPower();
    const positionUtilization = (activePositions / this.riskParams.maxSimultaneousPositions) * 100;
    const marginUtilization = (currentExposure / maxExposure) * 100;
    
    return Math.max(positionUtilization, marginUtilization);
  }

  /**
   * Calculate target price based on risk-reward ratio
   */
  calculateTargetPrice(
    entryPrice: number,
    stopLoss: number,
    riskRewardRatio: number = 2
  ): number {
    const risk = entryPrice - stopLoss;
    return entryPrice + (risk * riskRewardRatio);
  }

  /**
   * Validate risk parameters
   */
  validateRiskParameters(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (this.riskParams.totalCapital <= 0) {
      errors.push('Total capital must be greater than 0');
    }

    if (this.riskParams.intradayAllocation > this.riskParams.totalCapital) {
      errors.push('Intraday allocation cannot exceed total capital');
    }

    if (this.riskParams.maxSimultaneousPositions <= 0) {
      errors.push('Maximum positions must be greater than 0');
    }

    if (this.riskParams.riskPerTrade <= 0 || this.riskParams.riskPerTrade > 5) {
      errors.push('Risk per trade should be between 0.1% and 5%');
    }

    if (this.riskParams.maxDailyDrawdown <= 0 || this.riskParams.maxDailyDrawdown > 10) {
      errors.push('Maximum daily drawdown should be between 0.1% and 10%');
    }

    if (this.riskParams.trailingStopLoss <= 0 || this.riskParams.trailingStopLoss > 5) {
      errors.push('Trailing stop-loss should be between 0.1% and 5%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}