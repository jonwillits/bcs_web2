# Testing Instructions for Shinylive Prototypes

## Quick Start

### Option 1: Test in Next.js (Recommended for Quick Preview)

```bash
# From project root
npm run dev

# Open browser at:
# http://localhost:3000/playground-test
```

This shows the demos embedded in the actual Next.js app.

### Option 2: Run Demos Standalone

```bash
# Install dependencies (one-time)
pip install shiny plotly numpy scikit-learn

# Use the test script
cd playground-prototypes
./test-demos.sh demo1  # or demo2, demo3
```

## Testing Checklist

### Functionality Tests

- [ ] Demo 1 loads and displays chart
- [ ] Sliders update chart in real-time
- [ ] Color scheme changes work
- [ ] Statistics update correctly
- [ ] Demo 2 loads neural network visualization
- [ ] Training button works
- [ ] Decision boundary displays
- [ ] Loss curve updates
- [ ] Demo 3 loads sorting visualization
- [ ] Step-by-step execution works
- [ ] Different algorithms work
- [ ] Array generation works

### Performance Tests

- [ ] Measure initial load time (target: < 5 seconds)
- [ ] Measure interaction responsiveness (target: < 100ms)
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile Chrome
- [ ] Test on mobile Safari

### Integration Tests

- [ ] Embedding in Next.js works
- [ ] Multiple demos on one page work
- [ ] No console errors
- [ ] No security warnings
- [ ] Iframe sandbox restrictions work

## Measuring Performance

### Bundle Size

```bash
# For a Shinylive app
cd demo1-data-viz
shinylive export . bundle
du -sh bundle/
```

Expected: ~10-20MB (includes Python runtime)

### Load Time

1. Open browser DevTools
2. Go to Network tab
3. Load playground page
4. Note "DOMContentLoaded" time
5. Note time until interactive

Target: < 3 seconds after first load (cached)

## Troubleshooting

### Demo won't run locally

```bash
# Make sure dependencies are installed
pip install --upgrade shiny plotly numpy scikit-learn

# Try clearing cache
shiny run app.py --reload
```

### Next.js page won't load

```bash
# Rebuild Next.js
npm run build
npm run dev
```

### Iframe not loading

- Check browser console for errors
- Verify sandbox permissions
- Try in incognito mode (to avoid cache issues)

## Next Steps After Testing

1. Document bundle sizes in `/docs/SHINYLIVE_PROTOTYPE_RESULTS.md`
2. Note any issues found
3. Get stakeholder approval
4. Begin Phase 2: Builder interface
