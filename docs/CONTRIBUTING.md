# Contributing to QuantTrade Platform

Thank you for your interest in contributing to the QuantTrade Platform! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/QuantTradingBolt-v2.git
   cd QuantTradingBolt-v2
   ```

2. **Set Up Development Environment**
   Follow the [Development Setup Guide](./DEVELOPMENT_SETUP.md)

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Message Format

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(trading): add trailing stop-loss functionality
fix(auth): resolve JWT token expiration issue
docs(api): update authentication endpoints documentation
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Prefer functional components with hooks
- Use meaningful variable and function names

**Example:**
```typescript
// Good
const calculatePositionSize = (entryPrice: number, riskAmount: number): number => {
  return Math.floor(riskAmount / entryPrice);
};

// Bad
const calc = (p: number, r: number): number => {
  return Math.floor(r / p);
};
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions and classes
- Use meaningful variable names

**Example:**
```python
def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
    """
    Calculate Sharpe ratio for a series of returns.
    
    Args:
        returns: List of portfolio returns
        risk_free_rate: Risk-free rate (default: 2%)
    
    Returns:
        Sharpe ratio value
    """
    excess_returns = [r - risk_free_rate for r in returns]
    return np.mean(excess_returns) / np.std(excess_returns)
```

### Database

- Use descriptive table and column names
- Always include proper indexes
- Write migrations for schema changes
- Include comments for complex queries

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Include comprehensive error messages
- Validate all inputs
- Document all endpoints

## Testing Guidelines

### Frontend Testing

```typescript
// Component testing example
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

describe('Dashboard', () => {
  it('should display portfolio metrics', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total P&L')).toBeInTheDocument();
  });

  it('should handle risk alert display', () => {
    const mockRiskMetrics = { riskUtilization: 95 };
    render(<Dashboard riskMetrics={mockRiskMetrics} />);
    expect(screen.getByText(/High Risk Utilization/)).toBeInTheDocument();
  });
});
```

### Backend Testing

```typescript
// API testing example
import request from 'supertest';
import { app } from '../server';

describe('POST /api/strategies', () => {
  it('should create a new strategy', async () => {
    const strategyData = {
      name: 'Test Strategy',
      code: 'class TestStrategy(bt.Strategy): pass',
      parameters: { period: 10 }
    };

    const response = await request(app)
      .post('/api/strategies')
      .set('Authorization', `Bearer ${validToken}`)
      .send(strategyData)
      .expect(201);

    expect(response.body.name).toBe('Test Strategy');
  });
});
```

### Python Testing

```python
# Backtrader testing example
import pytest
from app import calculate_performance_metrics

def test_performance_metrics_calculation():
    trades = [
        {'pnl': 100, 'symbol': 'TEST'},
        {'pnl': -50, 'symbol': 'TEST'},
        {'pnl': 200, 'symbol': 'TEST'}
    ]
    
    daily_values = [
        {'portfolioValue': 100000, 'date': '2024-01-01'},
        {'portfolioValue': 100100, 'date': '2024-01-02'},
        {'portfolioValue': 100050, 'date': '2024-01-03'}
    ]
    
    metrics = calculate_performance_metrics(trades, daily_values, 100000)
    
    assert metrics['totalReturn'] > 0
    assert metrics['winRate'] == 2/3  # 2 winning trades out of 3
```

### Test Coverage

- Maintain minimum 80% test coverage
- Test both happy path and error scenarios
- Include integration tests for critical flows
- Mock external API calls

## Pull Request Process

### Before Submitting

1. **Run Tests**
   ```bash
   # Frontend tests
   npm run test
   
   # Backend tests
   cd backend && npm run test
   
   # Python tests
   cd backend/python-services/backtrader-engine && pytest
   ```

2. **Code Quality Checks**
   ```bash
   # Linting
   npm run lint
   
   # Type checking
   npm run type-check
   
   # Formatting
   npm run format
   ```

3. **Update Documentation**
   - Update API documentation if endpoints changed
   - Update README if setup process changed
   - Add inline code comments for complex logic

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Verify tests cover new functionality
4. **Documentation**: Ensure documentation is updated

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security concerns to: [security@yourproject.com]
2. Include detailed description of the vulnerability
3. Provide steps to reproduce if possible
4. Allow reasonable time for fix before public disclosure

### Security Guidelines

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Implement proper authentication and authorization
- Use HTTPS in production
- Keep dependencies updated

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Project documentation

## Questions?

- Create a discussion on GitHub
- Join our Discord server (if available)
- Email the maintainers

Thank you for contributing to QuantTrade Platform! 🚀