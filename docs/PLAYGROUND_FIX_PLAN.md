# Playground Feature - Comprehensive Fix Plan

**Date:** October 25, 2025
**Priority:** P0 - Critical
**Based on:** PLAYGROUND_USER_TESTING_REPORT.md

---

## Overview

This document provides a detailed, step-by-step plan to fix all 7 issues identified in the user testing report. Each fix includes the specific files to modify, code changes needed, and testing steps.

---

## Fix Priority Matrix

| Issue # | Title | Severity | Priority | Est. Time | Complexity |
|---------|-------|----------|----------|-----------|------------|
| #4 | Preview Shows Wrong Code | Critical | P0 | 1-2h | Medium |
| #5 | Save Fails with 401 | Critical | P0 | 1h | Low |
| #6 | No Auth Check Upfront | High | P0 | 1-2h | Medium |
| #1 | Search Hides Templates | High | P1 | 30min | Low |
| #2 | Category Filter Hides Templates | High | P1 | 30min | Low |
| #3 | Monaco CSP Violations | High | P1 | 30min | Low |
| #7 | Mobile Editor Usability | Medium | P2 | 2-3h | High |

**Total Est. Time:** 6-9 hours

---

## Fix #1 & #2: Search/Filter Should Filter Templates, Not Hide Them

### Priority: P1 (High)
### Files to Modify:
- `src/app/playgrounds/page.tsx`

### Current Code (lines 132-180):
```jsx
{activeFilter === 'all' && !searchQuery && (
  <div className="mb-12">
    {/* Featured Templates */}
  </div>
)}
```

### Fix Implementation:

**Step 1:** Create a filtered templates function
```jsx
// Add after line 49 (after filteredPlaygrounds definition)
const filteredTemplates = featuredTemplates.filter((template) => {
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matches =
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.requirements.some(req => req.toLowerCase().includes(query));
    if (!matches) return false;
  }

  // Filter by category
  if (activeFilter !== 'all' && template.category !== activeFilter) {
    return false;
  }

  return true;
});
```

**Step 2:** Update template section rendering (replace lines 132-180)
```jsx
{/* Featured Templates Section - Always show if templates match filter */}
{filteredTemplates.length > 0 && (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {searchQuery || activeFilter !== 'all' ? 'Matching Templates' : 'Featured Templates'}
        </h2>
        <p className="text-gray-600 mt-1">
          {searchQuery || activeFilter !== 'all'
            ? `${filteredTemplates.length} template(s) found`
            : 'Start with these professionally designed templates'}
        </p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {filteredTemplates.map((template) => (
        <Link
          key={template.id}
          href={`/playgrounds/builder?template=${template.id}`}
          className="group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-6"
        >
          {/* ... existing template card content ... */}
        </Link>
      ))}
    </div>
    <div className="border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Playgrounds</h2>
    </div>
  </div>
)}

{/* Show message if no templates match but there are community playgrounds */}
{filteredTemplates.length === 0 && (searchQuery || activeFilter !== 'all') && (
  <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p className="text-blue-800">
      No featured templates match your search. Check out community playgrounds below.
    </p>
  </div>
)}
```

### Testing Steps:
1. Navigate to `/playgrounds`
2. Type "neural" in search - should see Neural Network template
3. Clear search
4. Click "Neural Networks" category - should see Neural Network template
5. Click "Physics" category - should see 3 physics templates
6. Type "chaos" with Physics selected - should see Lorenz Attractor only

### Expected Result:
- Templates always visible and filtered by search/category
- Clear indication when templates match
- Smooth transition between filtered and unfiltered states

---

## Fix #3: Monaco Editor CSP Violations

### Priority: P1 (High)
### Files to Modify:
- `next.config.ts`

### Current Code (lines 79-94):
```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
    "frame-src 'self' https://shinylive.io",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
},
```

### Fix Implementation:

Replace with:
```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",  // Added cdn.jsdelivr.net
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
    "frame-src 'self' https://shinylive.io",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",  // Added for Monaco workers
    "upgrade-insecure-requests"
  ].join('; '),
},
```

### Changes Made:
1. **Line 83:** Added `https://cdn.jsdelivr.net` to `style-src` for Monaco CSS
2. **New line:** Added `worker-src 'self' blob:` to allow Monaco web workers

### Testing Steps:
1. Restart dev server (`npm run dev`)
2. Open browser console (clear cache hard reload)
3. Navigate to `/playgrounds/builder`
4. Select any template
5. Check console - should have NO CSP errors
6. Verify Monaco syntax highlighting works
7. Verify Monaco autocomplete works (Ctrl/Cmd + Space)

### Expected Result:
- No CSP errors in console
- Monaco Editor loads fully with web workers
- Better editor performance (no UI freezes)

---

## Fix #4: Preview Shows Wrong Code

### Priority: P0 (Critical)
### Files to Modify:
- `src/components/playground/ShinyliveEmbed.tsx` (investigation)
- `src/components/playground/PlaygroundBuilder.tsx` (possible fix)

### Root Cause Analysis:

Need to investigate why the preview shows wrong code. Possible causes:
1. State not updating correctly
2. Base64 encoding issue
3. Shinylive URL caching
4. Component re-render issue

### Fix Implementation:

**Step 1:** Add debug logging to ShinyliveEmbed (lines 77-110)

```typescript
const shinyliveUrl = useMemo(() => {
  try {
    console.log('[ShinyliveEmbed] Generating URL with sourceCode:', {
      length: sourceCode.length,
      preview: sourceCode.substring(0, 100),
      requirements
    });

    // Create app bundle structure
    const appBundle = {
      files: [
        {
          name: 'app.py',
          content: sourceCode,
          type: 'text'
        }
      ]
    };

    // Add requirements.txt if packages specified
    if (requirements.length > 0) {
      appBundle.files.push({
        name: 'requirements.txt',
        content: requirements.join('\n'),
        type: 'text'
      });
    }

    // Encode app bundle to base64
    const bundleStr = JSON.stringify(appBundle);
    console.log('[ShinyliveEmbed] Bundle structure:', appBundle);

    const encoded = btoa(bundleStr);
    console.log('[ShinyliveEmbed] Encoded length:', encoded.length);

    // Return full URL
    const url = `${SHINYLIVE_EDITOR_URL}#code=${encoded}`;
    console.log('[ShinyliveEmbed] Generated URL:', url.substring(0, 150) + '...');

    return url;

  } catch (err) {
    console.error('[ShinyliveEmbed] Error generating URL:', err);
    setError('Failed to generate app URL');
    return '';
  }
}, [sourceCode, requirements]);
```

**Step 2:** Force iframe reload in PlaygroundBuilder (line 367)

Replace:
```jsx
<ShinyliveEmbed
  key={code} // Force re-render when code changes
  sourceCode={code}
  requirements={requirements}
  title={title}
  height={700}
/>
```

With:
```jsx
<ShinyliveEmbed
  key={`${code.length}-${Date.now()}`} // More aggressive key to force reload
  sourceCode={code}
  requirements={requirements}
  title={title}
  height={700}
/>
```

**Step 3:** Verify code state is being passed (add to PlaygroundBuilder after line 335)

```jsx
{/* Debug info - Remove after testing */}
<div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
  <strong>Debug Info:</strong>
  <div>Code length: {code.length} characters</div>
  <div>Requirements: {requirements.join(', ')}</div>
  <div>First 100 chars: {code.substring(0, 100)}...</div>
</div>
```

### Testing Steps:
1. Navigate to `/playgrounds/builder`
2. Select "Neural Network Playground" template
3. Verify code editor shows 221 lines
4. Click "Preview →"
5. **Open browser console**
6. Check console logs for sourceCode preview
7. Verify iframe URL contains encoded data
8. Wait for Shinylive to load (may take 30 seconds)
9. Check if preview matches editor code

### If Preview Still Shows Wrong Code:

**Option B:** Use Shinylive App mode instead of Editor mode

Change SHINYLIVE_EDITOR_URL from:
```typescript
const SHINYLIVE_EDITOR_URL = 'https://shinylive.io/py/editor/';
```

To:
```typescript
const SHINYLIVE_APP_URL = 'https://shinylive.io/py/app/';
```

This shows the running app without the editor UI, which may be more reliable.

### Expected Result:
- Console logs show correct code being passed
- Preview iframe loads with the correct code
- App runs and displays Neural Network visualization

---

## Fix #5 & #6: Authentication Flow

### Priority: P0 (Critical)
### Files to Modify:
- `src/app/playgrounds/builder/page.tsx`
- `src/components/playground/PlaygroundBuilder.tsx`

### Strategy:
Implement early authentication check with localStorage draft saving for better UX.

### Fix Implementation:

**Step 1:** Add authentication check to builder page (src/app/playgrounds/builder/page.tsx)

After imports, add:
```typescript
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
```

In the component (after line 14):
```typescript
const { data: session, status } = useSession();
const [showAuthPrompt, setShowAuthPrompt] = useState(false);

// Check auth status when component mounts
useEffect(() => {
  if (status === 'unauthenticated' && !editId) {
    setShowAuthPrompt(true);
  }
}, [status, editId]);
```

**Step 2:** Add authentication banner (after line 100, before the loading check)

```typescript
if (showAuthPrompt) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to create and publish playgrounds. Your work will be saved to your account.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/login?callbackUrl=/playgrounds/builder"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
            >
              Sign In to Continue
            </Link>
            <Link
              href="/auth/register?callbackUrl=/playgrounds/builder"
              className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-center"
            >
              Create Account
            </Link>
            <button
              onClick={() => setShowAuthPrompt(false)}
              className="block w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Browse templates without signing in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3:** Add draft saving to localStorage (src/components/playground/PlaygroundBuilder.tsx)

Add after line 75:
```typescript
// Auto-save draft to localStorage
useEffect(() => {
  if (!editMode && code && title) {
    const draft = {
      code,
      title,
      description,
      category,
      requirements,
      timestamp: Date.now()
    };
    localStorage.setItem('playground-draft', JSON.stringify(draft));
  }
}, [code, title, description, category, requirements, editMode]);

// Restore draft on mount
useEffect(() => {
  if (!editMode && !initialCode) {
    const saved = localStorage.getItem('playground-draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // Only restore if less than 24 hours old
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          if (confirm('Restore your last unsaved playground?')) {
            setCode(draft.code);
            setTitle(draft.title);
            setDescription(draft.description);
            setCategory(draft.category);
            setRequirements(draft.requirements);
          }
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }
}, []);
```

**Step 4:** Clear draft after successful save (after line 128)

```typescript
await onSave({
  title,
  description,
  category,
  sourceCode: code,
  requirements,
});
// Clear draft from localStorage after successful save
localStorage.removeItem('playground-draft');
```

**Step 5:** Improve error handling in handleSave (replace lines 113-136)

```typescript
async function handleSave() {
  if (!title || !code) {
    alert('Please provide a title and code');
    return;
  }

  setIsSaving(true);
  try {
    if (onSave) {
      await onSave({
        title,
        description,
        category,
        sourceCode: code,
        requirements,
      });
      // Clear draft from localStorage after successful save
      localStorage.removeItem('playground-draft');
    }
  } catch (error: any) {
    console.error('Failed to save:', error);

    // Better error messages based on error type
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      alert('Please sign in to save playgrounds.\n\nYour work has been saved locally and will be restored when you return.');
    } else if (error.message?.includes('network')) {
      alert('Network error. Please check your connection and try again.');
    } else {
      alert('Failed to save playground. Please try again.');
    }
  } finally {
    setIsSaving(false);
  }
}
```

### Testing Steps:

**Test 1: Authenticated User**
1. Sign in to the application
2. Navigate to `/playgrounds/builder`
3. Should proceed directly to template selection
4. Create a playground and save
5. Should save successfully

**Test 2: Unauthenticated User**
1. Sign out
2. Navigate to `/playgrounds/builder`
3. Should see authentication prompt
4. Click "Browse templates without signing in"
5. Create a playground
6. Try to save - should get better error message
7. Refresh page - should offer to restore draft

**Test 3: Draft Restoration**
1. As unauthenticated user, create a playground
2. Close browser tab
3. Reopen `/playgrounds/builder`
4. Should see prompt to restore draft
5. Accept - playground should be restored

### Expected Result:
- Authenticated users: seamless experience
- Unauthenticated users: clear prompt with options
- Drafts saved automatically
- Better error messages
- No surprise 401 errors

---

## Fix #7: Mobile Editor Usability (Optional)

### Priority: P2 (Medium)
### Files to Modify:
- `src/components/playground/PlaygroundBuilder.tsx`
- `src/components/playground/MonacoCodeEditor.tsx`

### Strategy:
Add mobile detection and provide a better mobile experience.

### Fix Implementation:

**Step 1:** Add mobile detection hook (create new file: `src/hooks/useMediaQuery.ts`)

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}
```

**Step 2:** Update PlaygroundBuilder to show mobile warning

Add after imports:
```typescript
import { useIsMobile } from '@/hooks/useMediaQuery';
```

Add after line 74:
```typescript
const isMobile = useIsMobile();
```

Add mobile banner after header (after line 167):
```typescript
{/* Mobile Warning */}
{isMobile && (
  <div className="bg-yellow-50 border-t border-b border-yellow-200 p-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 text-xl">📱</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">
            Mobile Editing Limited
          </h3>
          <p className="text-sm text-yellow-800">
            Editing code on mobile devices can be challenging. For the best experience,
            we recommend using a desktop or laptop computer.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

**Step 3:** Add "Email me a link" feature (optional)

This allows users to send themselves a link to continue on desktop.

Add to the mobile warning:
```typescript
<button
  onClick={() => {
    const email = prompt('Enter your email to continue on desktop:');
    if (email) {
      // TODO: Implement email sending
      alert('Link sent! Check your email.');
    }
  }}
  className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-900"
>
  Email me a link to continue on desktop
</button>
```

### Testing Steps:
1. Open browser DevTools
2. Toggle device emulation (375x667 - iPhone SE)
3. Navigate to `/playgrounds/builder`
4. Should see mobile warning banner
5. Should still be able to use builder (just warned)

### Expected Result:
- Clear warning about mobile limitations
- User can still proceed if needed
- Option to continue on desktop (via email)

---

## Testing Protocol

### Pre-Deployment Testing Checklist

After implementing all fixes, perform these tests:

#### Test Suite 1: Desktop Browser Testing
- [ ] Playground listing page loads
- [ ] Search filters templates correctly
- [ ] Category filters templates correctly
- [ ] Template selection works
- [ ] Monaco Editor loads without CSP errors
- [ ] Code editing works smoothly
- [ ] Preview shows correct code
- [ ] Save works for authenticated users
- [ ] Auth prompt shows for unauthenticated users
- [ ] Draft restoration works

#### Test Suite 2: Mobile Browser Testing (375x667)
- [ ] Playground listing responsive
- [ ] Template cards display correctly
- [ ] Builder shows mobile warning
- [ ] Editor is usable (even if not ideal)
- [ ] Can navigate through all steps

#### Test Suite 3: Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Test Suite 4: Authentication Flows
- [ ] Authenticated user can save
- [ ] Unauthenticated user sees prompt
- [ ] Draft saves to localStorage
- [ ] Draft restores after page reload
- [ ] Login redirect works correctly

#### Test Suite 5: Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid code shows appropriate errors
- [ ] Save failures show helpful messages
- [ ] Browser console is clean (no errors)

### Regression Testing

After fixes, re-run all tests from PLAYGROUND_USER_TESTING_REPORT.md to ensure:
- All 7 issues are resolved
- No new issues introduced
- Performance is acceptable
- User experience improved

---

## Deployment Plan

### Phase 1: Fix Critical Issues (Week 1)
1. Implement Fix #4 (Preview Code)
2. Implement Fix #5 & #6 (Authentication)
3. Deploy to staging
4. Test thoroughly
5. Deploy to production

### Phase 2: Fix High Priority Issues (Week 1)
1. Implement Fix #1 & #2 (Search/Filter)
2. Implement Fix #3 (CSP)
3. Deploy to staging
4. Test thoroughly
5. Deploy to production

### Phase 3: Improve Mobile Experience (Week 2)
1. Implement Fix #7 (Mobile)
2. Deploy to staging
3. User acceptance testing
4. Deploy to production

### Post-Deployment Monitoring

After each deployment:
- Monitor error logs for 48 hours
- Check user engagement metrics
- Collect user feedback
- Monitor performance metrics
- Watch for new bug reports

---

## Success Criteria

The fixes will be considered successful when:

1. ✅ All 7 issues from testing report are resolved
2. ✅ No new issues introduced by fixes
3. ✅ Authenticated users can create and save playgrounds
4. ✅ Unauthenticated users see clear guidance
5. ✅ Search and filters work as expected
6. ✅ Preview shows correct code
7. ✅ Monaco Editor works without CSP errors
8. ✅ Mobile experience has appropriate warnings
9. ✅ All tests pass in testing protocol
10. ✅ User feedback is positive

---

## Risk Assessment

### Low Risk Fixes
- Fix #1 & #2 (Search/Filter) - Simple logic change
- Fix #3 (CSP) - Well-understood header change

### Medium Risk Fixes
- Fix #5 & #6 (Authentication) - Affects user flow
- Fix #7 (Mobile) - UI changes only

### High Risk Fixes
- Fix #4 (Preview Code) - Complex debugging required
  - **Mitigation:** Thorough logging and testing
  - **Rollback plan:** Disable preview step temporarily

---

## Conclusion

This fix plan provides a comprehensive, step-by-step approach to resolving all identified issues in the Playground feature. By following this plan systematically and testing thoroughly at each step, we can ensure a stable, high-quality feature that provides excellent user experience.

**Estimated Total Time:** 6-9 hours
**Recommended Timeline:** 1-2 weeks for full deployment

