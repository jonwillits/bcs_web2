# Playground Prototypes - Shinylive Testing

This directory contains prototype Shinylive applications to validate the new playground architecture.

## Purpose

Test Shinylive as a replacement for the broken Pyodide + turtle graphics system.

## Prototypes

### Demo 1: Interactive Data Visualization
- **File**: `demo1-data-viz/app.py`
- **Purpose**: Test basic Shiny + Plotly integration
- **Features**: Sliders, interactive charts, real-time updates

### Demo 2: Neural Network Playground
- **File**: `demo2-neural-network/app.py`
- **Purpose**: Test complex visualization (TensorFlow Playground style)
- **Features**: Network diagram, training visualization, decision boundaries

### Demo 3: Sorting Algorithm Visualization
- **File**: `demo3-sorting/app.py`
- **Purpose**: Test animation and step-by-step execution
- **Features**: Algorithm selection, speed control, visual feedback

## How to Run

### Option 1: Using Shinylive CLI (Recommended)
```bash
# Install shinylive
pip install shinylive

# Run a demo
cd demo1-data-viz
shiny run app.py

# Export to static bundle
shinylive export . site
```

### Option 2: Using Shiny directly
```bash
pip install shiny plotly matplotlib numpy pandas

cd demo1-data-viz
shiny run app.py --reload
```

### Option 3: Deploy to static hosting
```bash
# Export to shinylive bundle
shinylive export demo1-data-viz demo1-bundle

# Serve locally
python -m http.server 8000 -d demo1-bundle
```

## Testing Checklist

- [ ] Demo 1 runs successfully
- [ ] Demo 2 runs successfully
- [ ] Demo 3 runs successfully
- [ ] Measure bundle sizes
- [ ] Test load times
- [ ] Test on mobile devices
- [ ] Test embedding in iframe
- [ ] Integrate with Next.js

## Next Steps

After validation:
1. Document findings in `/docs/SHINYLIVE_PROTOTYPE_RESULTS.md`
2. Get stakeholder approval
3. Begin Phase 2: Builder interface implementation
