# Live Code Preview System - Implementation Plan

> **Created**: December 2024
> **Status**: In Progress
> **Feature**: React Playground (replacing Python/Shinylive Playground)

## Overview

Replace the existing Playground feature with a new React/JavaScript live code preview system (similar to Claude Artifacts). This will support complex 3D simulations like the Braitenberg Vehicles example using THREE.js.

## User Decisions

- **Replace entirely** - Remove Python/Shinylive playground
- **Rebrand Playgrounds** - New system replaces existing feature completely
- **Full THREE.js from MVP** - Support complex 3D simulations immediately
- **Faculty-only creation** - Students can view/interact, faculty can create

---

## How Claude Artifacts Works (Reference)

Claude Artifacts and our system use the same fundamental architecture:

```
Source Code (JSX)
       ↓
   Bundler (transpile + resolve imports)
       ↓
   JavaScript Bundle
       ↓
   Sandboxed iframe
       ↓
   Live Preview
```

### Claude Artifacts Flow
1. Claude generates response with artifact tags containing React/HTML code
2. Web client detects artifact block and extracts code
3. Code sent to client-side bundler (custom Sandpack-like system)
4. Bundler transpiles JSX → JS, resolves npm imports from CDN
5. Bundled code injected into sandboxed iframe
6. Preview renders in isolated iframe

### Our System Flow
1. Faculty writes React code in dedicated builder (Monaco editor)
2. Code stored in database with metadata
3. Sandpack bundles and transpiles the code
4. Preview renders in sandboxed iframe
5. Students view interactive preview, can toggle to see code

**Key Insight**: The preview rendering mechanism is identical - both use iframe sandboxing with client-side bundlers. Sandpack is the open-source version of this pattern.

---

## Architecture

### Technology Choice: Sandpack

Using [Sandpack](https://sandpack.codesandbox.io/) (CodeSandbox's open-source toolkit) because:
- Battle-tested bundler with npm dependency support
- Hot module reloading out of the box
- Works entirely in-browser (no server)
- Supports THREE.js and React Three Fiber
- ~250KB bundle size
- Used by React official documentation

### Database

**No migration needed** - reuse existing `playgrounds` table:
- `app_type`: Change default from `'shinylive'` to `'sandpack'`
- `source_code`: Stores React/JSX code
- `requirements`: npm packages array (e.g., `['three', '@react-three/fiber']`)

---

## Implementation Phases

### Phase 1: Core Setup

**1.1 Install Dependencies**
```bash
npm install @codesandbox/sandpack-react @codesandbox/sandpack-themes
```

**1.2 Update CSP Headers**
File: `/next.config.ts`
- Add Sandpack CDN sources to `script-src`, `frame-src`, `connect-src`

**1.3 Create Type Definitions**
File: `/src/types/react-playground.ts`
- `ReactPlaygroundData` interface
- `SandpackTemplate` type
- Dependency types

---

### Phase 2: Core Components

**2.1 Create Sandpack Configuration**
File: `/src/lib/react-playground/sandpack-config.ts`
- Theme matching neural design system
- Default React + THREE.js dependencies
- Editor options

**2.2 Create Preview Component**
File: `/src/components/react-playground/ReactPlaygroundPreview.tsx`
- Sandpack integration with error boundary
- Fullscreen support (native Fullscreen API + fallback)
- Loading states

**2.3 Create Editor Component**
File: `/src/components/react-playground/ReactPlaygroundEditor.tsx`
- Use Sandpack's built-in Monaco editor (or customize)
- JSX/TSX syntax highlighting
- Code snippets for THREE.js patterns

**2.4 Create Dependency Manager**
File: `/src/components/react-playground/DependencyManager.tsx`
- Curated package list (three, @react-three/fiber, gsap, etc.)
- Add custom npm packages
- Version selection

**2.5 Create Main Builder Component**
File: `/src/components/react-playground/ReactPlaygroundBuilder.tsx`
- Resizable split-pane layout (using `react-resizable-panels`)
- Editor + Preview + Dependency panel
- Save/Load functionality
- Auto-save draft to localStorage

---

### Phase 3: Pages & API Updates

**3.1 Update/Replace Playground Pages**

| Current | New |
|---------|-----|
| `/playgrounds/page.tsx` | Gallery of React playgrounds |
| `/playgrounds/[id]/page.tsx` | View playground (Sandpack preview) |
| `/playgrounds/builder/page.tsx` | Create/Edit (faculty only) |

**3.2 Update API Routes**
File: `/src/app/api/playgrounds/route.ts`
- Change default `app_type` to `'sandpack'`
- Validate `requirements` as npm packages

**3.3 Update Navigation**
File: `/src/components/Header.tsx`
- Keep "Playgrounds" link, points to new system

---

### Phase 4: Templates & Content

**4.1 Create Template System**
File: `/src/lib/react-playground/templates.ts`

Templates to create:
1. **Basic React** - Simple counter component
2. **THREE.js Cube** - Spinning 3D cube
3. **React Three Fiber Scene** - Interactive 3D scene
4. **Braitenberg Vehicles** - User's example (full simulation)
5. **Neural Network Viz** - Educational demo

**4.2 Create Template Gallery Component**
File: `/src/components/react-playground/TemplateGallery.tsx`
- Browse templates
- Preview before selecting
- Fork to create new playground

---

### Phase 5: Cleanup

**5.1 Remove Old Python/Shinylive Code**
- `/src/components/playground/ShinyliveEmbed.tsx` - Delete
- `/src/lib/pyodide-loader.ts` - Delete (unless used elsewhere)
- `/src/lib/playground/execution-engine.ts` - Delete
- `/src/lib/playground/parameter-binder.ts` - Delete
- `/src/templates/shinylive/` - Delete all
- `/src/components/playground/controls/` - Delete

**5.2 Keep or Refactor**
- `/src/components/playground/MonacoCodeEditor.tsx` - May keep for other features
- `/src/lib/turtle-manager.ts` - Delete (simulation now in React)

---

## File Structure (New)

```
src/
  components/
    react-playground/
      ReactPlaygroundBuilder.tsx    # Main builder page component
      ReactPlaygroundPreview.tsx    # Sandpack preview wrapper
      ReactPlaygroundEditor.tsx     # Code editor panel
      DependencyManager.tsx         # Package picker
      TemplateGallery.tsx           # Template browser
      FullscreenWrapper.tsx         # Fullscreen container
  lib/
    react-playground/
      sandpack-config.ts            # Sandpack theme & options
      templates.ts                  # Template definitions
  types/
    react-playground.ts             # TypeScript definitions
  app/
    playgrounds/
      page.tsx                      # Gallery (updated)
      [id]/page.tsx                 # Viewer (updated)
      builder/page.tsx              # Builder (updated, faculty only)
```

---

## CSP Headers to Add

```typescript
// In next.config.ts headers
"script-src": "... https://sandpack-bundler.codesandbox.io https://esm.sh",
"frame-src": "... https://sandpack-bundler.codesandbox.io",
"connect-src": "... https://esm.sh https://registry.npmjs.org https://sandpack-bundler.codesandbox.io",
```

---

## Key Files to Modify

1. `/next.config.ts` - CSP headers
2. `/src/app/playgrounds/page.tsx` - Gallery
3. `/src/app/playgrounds/[id]/page.tsx` - Viewer
4. `/src/app/playgrounds/builder/page.tsx` - Builder (faculty auth)
5. `/src/app/api/playgrounds/route.ts` - API updates
6. `/prisma/schema.prisma` - Change default app_type (optional)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| THREE.js import issues | Use React Three Fiber wrapper; provide working templates |
| Large bundle size | Lazy-load Sandpack via `next/dynamic` |
| CSP violations | Test CSP changes on Vercel preview before production |
| Mobile performance | Show "Run" button instead of live preview on mobile |

---

## Testing Checklist

- [ ] Basic React component renders in preview
- [ ] THREE.js Canvas renders (React Three Fiber)
- [ ] npm dependencies load from CDN
- [ ] Code changes trigger live reload
- [ ] Fullscreen toggle works
- [ ] Resize panels work
- [ ] Save to database works
- [ ] Load from database works
- [ ] Faculty can create, students cannot
- [ ] Templates load correctly
- [ ] Error boundaries catch crashes
- [ ] Mobile shows appropriate fallback

---

## Success Criteria

1. Faculty can create a playground with React + THREE.js code
2. Preview renders 3D simulation in real-time as code changes
3. Playgrounds can be saved, loaded, and shared via URL
4. Braitenberg Vehicles example works as a template
5. Students can view and interact with playgrounds
6. Mobile users see a functional (if simplified) experience
