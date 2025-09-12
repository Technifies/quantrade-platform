#!/bin/bash

# Health Check Script for QuantTrade Platform

# Configuration
BACKEND_URL="https://quantrade-backend.onrender.com/health"
BACKTRADER_URL="https://quantrade-backtrader.onrender.com/health"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check service health
check_service_health() {
    local service_name=$1
    local service_url=$2
    local timeout=10

    echo "Checking ${service_name} health..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$service_url")
    
    if [ "$response" -eq 200 ]; then
        echo -e "${GREEN}✓ ${service_name} is healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ ${service_name} is not responding${NC}"
        return 1
    fi
}

# Main health check
main() {
    local overall_health=0

    check_service_health "Backend API" "$BACKEND_URL"
    overall_health=$((overall_health + $?))

    check_service_health "Backtrader Service" "$BACKTRADER_URL"
    overall_health=$((overall_health + $?))

    if [ $overall_health -eq 0 ]; then
        echo -e "${GREEN}✓ All services are operational${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some services are not functioning correctly${NC}"
        exit 1
    fi
}

main