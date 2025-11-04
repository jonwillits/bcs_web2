#!/bin/bash
# Test script for Shinylive demos
# Usage: ./test-demos.sh [demo1|demo2|demo3|all]

set -e

echo "🚀 Shinylive Demo Testing Script"
echo "================================="

# Check if shiny is installed
if ! python3 -c "import shiny" 2>/dev/null; then
    echo "⚠️  Shiny not installed. Installing dependencies..."
    pip install shiny plotly numpy scikit-learn
fi

# Function to run a demo
run_demo() {
    local demo_name=$1
    local demo_dir=$2

    echo ""
    echo "📊 Running $demo_name..."
    echo "Open browser at: http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""

    cd "$demo_dir"
    shiny run app.py --port 8000 --reload
}

# Main logic
case "${1:-all}" in
    demo1)
        run_demo "Demo 1: Data Visualization" "demo1-data-viz"
        ;;
    demo2)
        run_demo "Demo 2: Neural Network" "demo2-neural-network"
        ;;
    demo3)
        run_demo "Demo 3: Sorting Algorithm" "demo3-sorting"
        ;;
    all)
        echo ""
        echo "Available demos:"
        echo "  ./test-demos.sh demo1  - Interactive Data Visualization"
        echo "  ./test-demos.sh demo2  - Neural Network Playground"
        echo "  ./test-demos.sh demo3  - Sorting Algorithm Visualizer"
        echo ""
        echo "Pick one to run (they can't run simultaneously on the same port)"
        ;;
    *)
        echo "Unknown demo: $1"
        echo "Usage: ./test-demos.sh [demo1|demo2|demo3|all]"
        exit 1
        ;;
esac
