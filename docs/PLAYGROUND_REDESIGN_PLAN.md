# Interactive Playground Re-Architecture Plan

## 🎯 Executive Summary

**Problem**: Current Pyodide + custom turtle graphics implementation is breaking, unreliable, and overly complex.

**Solution**: Hybrid architecture using proven frameworks while keeping your existing playground management system (database, gallery, viewing interface).

**Keep**: Playground concept, database models, gallery UI, creation/saving workflow
**Replace**: Execution engine, visualization layer, creation interface

---

## 🏗️ Recommended Architecture: **Hybrid Shinylive + Plotly Approach**

### Core Recommendation

**Use Shinylive for Python-based interactive demos** (Shiny running entirely in browser via WebAssembly)

**Why This Solves Your Problems:**
1. ✅ **Eliminates turtle graphics conversion issues** - Use Shiny's native rendering
2. ✅ **Stable, proven framework** - Less code breaking, better maintained
3. ✅ **Reactive by design** - Automatic state management (no manual parameter binding)
4. ✅ **Still browser-based** - No server needed (shinylive compiles to WASM)
5. ✅ **Rich visualizations** - Built-in Plotly, Matplotlib, Altair support
6. ✅ **Faculty-friendly** - Simple Python decorators, easier than custom system

---

## 📐 New System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FACULTY INTERFACE                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Playground Builder (Your Existing UI)             │     │
│  │  - Template Selection                              │     │
│  │  - Title, Description, Category                    │     │
│  │  - **NEW: Shiny Code Editor (Monaco)**             │     │
│  │  - Live Preview (Shinylive iframe)                 │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         │ Save
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (Keep Existing Schema)                 │
│  playgrounds table:                                          │
│  - id, title, description, category                          │
│  - code_config (store Shiny app.py code)                     │
│  - created_by, is_public, share_url                          │
│  - **Remove**: controls JSON, visualization JSON            │
│  - **Add**: shinylive_bundle (compiled WASM app)             │
└─────────────────────────────────────────────────────────────┘
                         │ Load
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  STUDENT INTERFACE                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Playground Viewer                                 │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │  Shinylive Iframe (Self-Contained App)   │     │     │
│  │  │  - Runs entirely in browser              │     │     │
│  │  │  - No server calls after load             │     │     │
│  │  │  - All UI controls defined in Python     │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Prototype & Validation (Week 1-2)

**Goal**: Prove Shinylive works for your use cases

#### Tasks:
1. **Setup Shinylive Development Environment**
   - Install: `pip install shiny shinylive`
   - Create test apps for each demo type:
     - Neural Network demo (TensorFlow Playground style)
     - Braitenberg Vehicles (simulation)
     - Sorting algorithm visualization
     - Data visualization with Plotly

2. **Build Shinylive Embedding System**
   - Research shinylive bundle generation
   - Test iframe embedding
   - Verify performance and load times

3. **Compare with Current System**
   - Side-by-side comparison
   - Document pros/cons
   - Get stakeholder sign-off

**Deliverable**: 3-4 working Shinylive demos proving viability

---

### Phase 2: Builder Interface (Week 3-5)

**Goal**: Create faculty interface for building Shiny apps

#### Tasks:
1. **Template System**
   - Create 10-15 Shinylive templates:
     ```python
     # Example: Neural Network Template
     from shiny import App, ui, render
     import plotly.graph_objects as go

     app_ui = ui.page_fluid(
         ui.input_slider("layers", "Hidden Layers", 1, 5, 2),
         ui.input_slider("learning_rate", "Learning Rate", 0.001, 1, 0.1),
         ui.output_plot("network_viz")
     )

     def server(input, output, session):
         @render.plot
         def network_viz():
             # Network visualization using Plotly
             ...

     app = App(app_ui, server)
     ```
   - Categories: Neural Networks, Physics, Algorithms, Data Viz

2. **Code Editor Integration**
   - Monaco Editor with Python syntax
   - Template insertion
   - Live preview using shinylive
   - Validation and error checking

3. **Shinylive Compilation API**
   - API endpoint: `/api/playgrounds/compile`
   - Input: Python code (app.py)
   - Output: Shinylive bundle (WASM + assets)
   - Store bundle in database or S3

**Deliverable**: Faculty can select template, edit code, preview, and save

---

### Phase 3: Database & API Updates (Week 5-6)

#### Database Schema Changes:

```prisma
model playgrounds {
  id                String   @id @default(cuid())
  title             String
  description       String   @db.Text
  category          String

  // NEW FIELDS
  app_type          String   @default("shinylive")  // "shinylive" or "observable" (future)
  source_code       String   @db.Text               // app.py content
  compiled_bundle   String?  @db.Text               // Shinylive WASM bundle URL or JSON
  requirements      String[] @default([])           // Python packages needed

  // KEEP EXISTING
  created_by        String
  is_public         Boolean  @default(false)
  share_url         String   @unique @default(cuid())
  view_count        Int      @default(0)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // REMOVE (no longer needed with Shiny)
  // controls          Json
  // visualization     Json
  // code_config       Json

  author            users    @relation(fields: [created_by], references: [id])
}
```

#### API Endpoints:

1. `POST /api/playgrounds/compile` - Compile Shiny app to Shinylive bundle
2. `GET /api/playgrounds/[id]/bundle` - Retrieve compiled bundle
3. `POST /api/playgrounds/preview` - Live preview (temporary compilation)

**Deliverable**: Updated database and working API

---

### Phase 4: Student Viewer Interface (Week 7-8)

**Goal**: Beautiful, fast playground viewing experience

#### Component Structure:

```typescript
// /src/app/playgrounds/[id]/page.tsx
export default async function PlaygroundView({ params }) {
  const playground = await getPlayground(params.id);

  return (
    <div className="playground-container">
      <PlaygroundHeader
        title={playground.title}
        description={playground.description}
        author={playground.author}
      />

      <ShinyliveEmbed
        bundle={playground.compiled_bundle}
        sourceCode={playground.source_code}
        requirements={playground.requirements}
      />

      <PlaygroundInfo />
    </div>
  );
}
```

```typescript
// /src/components/playground/ShinyliveEmbed.tsx
export function ShinyliveEmbed({ bundle, sourceCode, requirements }) {
  return (
    <iframe
      src={`/shinylive-embed?code=${encodeURIComponent(sourceCode)}`}
      className="w-full h-[600px] border rounded-lg"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
```

**Deliverable**: Students can view and interact with playgrounds seamlessly

---

### Phase 5: Template Library (Week 9-11)

**Goal**: 15-20 ready-to-use templates covering all demo types

#### Template Categories:

**1. Neural Networks & ML** (3 templates)
- TensorFlow Playground clone
- Linear regression interactive
- K-means clustering viz

**2. Simulations** (4 templates)
- Braitenberg vehicles (Shiny version)
- Projectile motion
- Pendulum physics
- Conway's Game of Life

**3. Algorithm Visualizations** (4 templates)
- Sorting algorithms (bubble, merge, quick)
- Pathfinding (A*, Dijkstra)
- Tree traversal (BFS, DFS)
- Graph algorithms

**4. Data Visualizations** (4 templates)
- Interactive scatter plots
- Time series explorer
- Distribution analyzer
- Correlation heatmap

**Deliverable**: Template marketplace with 15+ production-ready demos

---

### Phase 6: Advanced Features (Week 12-14)

1. **Fork/Remix** - Students can copy and modify demos
2. **Versioning** - Track playground versions
3. **Embedding** - Generate embed codes for external sites
4. **Analytics** - Track student interactions
5. **Sharing** - Social sharing, public gallery

---

## 💰 Cost-Benefit Analysis

### Licensing & Pricing

**✅ SHINYLIVE IS COMPLETELY FREE AND OPEN SOURCE**

- **License**: MIT License (permissive, allows commercial use)
- **Cost**: $0 - No licensing fees, no pricing tiers
- **Repositories**:
  - Python: `posit-dev/py-shinylive` (MIT License)
  - Core assets: `posit-dev/shinylive` (MIT License)
- **Deployment**: Can host on any static web server (GitHub Pages, Vercel, etc.) for free
- **Commercial Use**: ✅ Fully permitted under MIT License

**Key Point**: The user's browser does the computation (WASM), so there are NO server costs after initial deployment. This is perfect for an educational platform.

### Shiny Shinylive Approach

**Benefits:**
- ✅ **100% Free and Open Source** - No vendor lock-in, no licensing costs
- ✅ Proven, stable framework (eliminates "code breaking" issues)
- ✅ No turtle graphics conversion needed
- ✅ Rich built-in visualizations (Plotly, Matplotlib, Altair)
- ✅ Reactive programming (automatic UI updates)
- ✅ Large community and documentation
- ✅ Still browser-based (no server costs after compilation)
- ✅ Faculty can write clean Python (easier than custom JS/Python bridge)

**Trade-offs:**
- ⚠️ Less granular control than custom solution
- ⚠️ Bundle size larger than minimal custom code (~10-20MB initial load, cached afterward)
- ⚠️ Compilation step required (but can cache bundles)

### vs. Current System

| Aspect | Current System | Shinylive Approach |
|--------|---------------|-------------------|
| **Reliability** | Breaking, buggy | Stable, proven framework |
| **Complexity** | Custom parameter binding, turtle conversion | Framework handles reactivity |
| **Faculty Learning Curve** | High (custom system) | Medium (learn Shiny decorators) |
| **Visualization Options** | Limited (canvas, manual) | Rich (Plotly, Matplotlib, Altair) |
| **Maintenance** | High (custom code) | Low (framework maintained) |
| **Performance** | Variable | Optimized by framework |

---

## 🚀 Migration Strategy

### Phase 1: Parallel Development
- Build new Shinylive system alongside current
- Don't touch existing playgrounds yet

### Phase 2: Migration Tools
- Build converter: old playground config → Shiny app template
- Semi-automated with manual review

### Phase 3: Gradual Rollout
- New playgrounds use Shinylive only
- Existing playgrounds marked "legacy"
- Provide migration guide for faculty

### Phase 4: Deprecation
- After 6 months, sunset old system
- All playgrounds migrated or archived

---

## 📊 Success Metrics

1. **Reliability**: < 1% playground execution errors (vs current issues)
2. **Performance**: < 3 second initial load time
3. **Faculty Adoption**: 20+ playgrounds created in first month
4. **Student Engagement**: 5+ minutes average interaction time
5. **Code Quality**: 0 breaking changes in 3 months

---

## 🎯 Alternative Considered: Pure JavaScript/Observable Approach

If Shinylive proves too heavy, **fallback option**:

- **Observable-style reactive notebooks** (JavaScript + D3)
- Benefits: Lighter, faster, more flexible
- Trade-off: Not Python-first (faculty may prefer Python)

---

## 📅 Timeline Summary

- **Week 1-2**: Prototype validation
- **Week 3-5**: Builder interface
- **Week 5-6**: Database/API updates
- **Week 7-8**: Student viewer
- **Week 9-11**: Template library
- **Week 12-14**: Advanced features
- **Total**: ~3.5 months to production

---

## 🔑 Key Technical Decisions

1. **Use Shinylive (Shiny + WebAssembly)** as primary execution engine
2. **Keep existing database schema** with modifications
3. **Monaco Editor** for code editing
4. **Template-first approach** (faculty start from working examples)
5. **iframe embedding** for isolation and security
6. **Progressive enhancement** (start simple, add features incrementally)

---

## 📝 Implementation Roadmap

### Immediate Next Steps (This Week)

1. ✅ **Document approved** - This plan saved to `/docs/PLAYGROUND_REDESIGN_PLAN.md`

2. **Build 3 Prototype Shinylive Demos**
   - Neural Network (TensorFlow Playground style)
   - Data Visualization (Interactive Plotly chart)
   - Algorithm Visualization (Sorting algorithm)

3. **Test Shinylive Embedding**
   - Create standalone HTML files with shinylive
   - Test iframe embedding in Next.js
   - Measure bundle size and load times

4. **Technical Spike: Shinylive Integration**
   - Research shinylive CLI for compilation
   - Test Python → WASM bundle generation
   - Document integration approach

### Week 2-3

5. **Architecture Review**
   - Present prototypes to team/stakeholders
   - Gather feedback
   - Refine approach if needed

6. **Begin Phase 1 Implementation**
   - Setup development environment
   - Create `/playground-prototypes` directory
   - Build first 3 working demos

---

## 📚 Resources & References

- **Shiny for Python**: https://shiny.posit.co/py/
- **Shinylive**: https://shinylive.io/py/examples/
- **Shiny Docs**: https://shiny.posit.co/py/docs/
- **Plotly Python**: https://plotly.com/python/
- **TensorFlow Playground**: https://playground.tensorflow.org/
- **Observable**: https://observablehq.com/ (alternative approach)

---

## 🤝 Team Collaboration

### Roles & Responsibilities

- **Backend Developer**: Database schema updates, API endpoints for compilation
- **Frontend Developer**: Builder UI, Monaco editor integration, student viewer
- **Python Developer**: Template creation, Shiny app examples
- **UX Designer**: Builder interface, template gallery, student experience

---

## ⚠️ Risk Mitigation

### Risk 1: Shinylive Bundle Size Too Large
- **Mitigation**: Test early, measure performance, consider code-splitting
- **Fallback**: Observable-style JavaScript approach

### Risk 2: Faculty Find Shiny Too Complex
- **Mitigation**: Excellent templates, documentation, video tutorials
- **Fallback**: Support multiple creation modes (visual + code)

### Risk 3: Performance Issues on Student Devices
- **Mitigation**: Optimize bundles, lazy loading, progressive enhancement
- **Fallback**: Server-side rendering option for complex demos

### Risk 4: Compilation API Reliability
- **Mitigation**: Cache compiled bundles, retry logic, fallback to client-side compilation
- **Fallback**: Pre-compile during playground creation instead of on-demand

---

**Document Version**: 1.0
**Created**: October 25, 2025
**Status**: Approved - Implementation Starting
**Next Review**: After prototype validation (Week 2)
