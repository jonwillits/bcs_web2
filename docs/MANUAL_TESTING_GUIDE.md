# 🧪 Manual Testing Guide - Multi-User Scenarios

**Purpose**: Guide for manually testing features that require multiple authenticated users simultaneously

**Last Updated**: January 13, 2025

**Automated Test Coverage**: 146/156 (93.6%)

**Requires Manual Testing**: 10 tests (5 multi-user + 3 accessibility + 1 infrastructure + 1 catalog)

---

## 📋 Prerequisites

### Test Users Available

| User | Email | Password | Role | Status |
|------|-------|----------|------|--------|
| **User A** | ritikh2@illinois.edu | Test234! | Faculty | ✅ Verified |
| **User B** | jwillits@illinois.edu | TestFaculty123! | Faculty | ✅ Verified |
| **Student** | student@test.edu | TestStudent123! | Student | ✅ Verified |

### Browser Setup

For multi-user testing, you'll need to use either:
- **Two different browsers** (e.g., Chrome + Firefox)
- **Incognito/Private windows** in separate browser instances
- **Browser profiles** (recommended for Chrome/Edge)

---

## 🔀 Multi-User Tests

### TEST-CLONE-005: Clone with Collaborators

**Feature**: Module Cloning with Collaborators
**Type**: Functional
**Priority**: Medium

#### Test Steps:

1. **Setup (User A - ritikh2@illinois.edu)**:
   - Log in to https://bcs-web2.vercel.app
   - Navigate to Faculty Dashboard → Modules
   - Find or create a module with collaborators
   - Note the module slug

2. **Clone Module (Still as User A)**:
   - Navigate to the module page
   - Click "Clone" button in header
   - Check "Clone collaborators" checkbox ✓
   - Enter new title (e.g., "Cloned Module with Collaborators")
   - Click "Clone Module"

3. **Verify**:
   - Navigate to the cloned module's edit page
   - Go to Collaborators section
   - Verify original collaborators are present
   - Verify User A is the author (not listed as collaborator)
   - Verify module status is "draft"
   - Verify visibility is "private"

#### Expected Results:
- ✅ Collaborators are cloned to new module
- ✅ User A is the author of the clone (not a collaborator)
- ✅ Cloned module is private and draft
- ✅ Original module unchanged

---

### TEST-CLONE-007: Clone Permissions - Public Module

**Feature**: Cross-User Module Cloning (Public)
**Type**: Security
**Priority**: High

#### Test Steps:

1. **Setup (User A - Browser 1)**:
   - Log in as ritikh2@illinois.edu
   - Navigate to a public published module you own
   - Recommended: `/modules/neural-networks`
   - Note the module slug and author name

2. **Clone as Different User (User B - Browser 2)**:
   - Log in as jwillits@illinois.edu
   - Navigate to the same module: `/modules/neural-networks`
   - Click "Clone" button in header
   - Verify clone dialog appears
   - Enter new title: "Cloned from Public Module"
   - Click "Clone Module"

3. **Verify Clone Ownership (Browser 2)**:
   - Navigate to Faculty Dashboard → Modules
   - Find the cloned module
   - Click to edit
   - Verify YOU (Jon Willits) are the author
   - Verify original author (Ritik Hariani) is NOT listed as collaborator

4. **Verify Original Unchanged (Browser 1)**:
   - Refresh the original module
   - Verify clone count incremented
   - Verify module still owned by User A
   - Verify no changes to collaborators

#### Expected Results:
- ✅ User B can clone User A's public module
- ✅ User B becomes the author of the clone
- ✅ Original author NOT added as collaborator
- ✅ Clone is private draft owned by User B
- ✅ Original module's clone_count incremented

#### Security Check:
- ✅ Public modules are cloneable by any faculty user
- ✅ Clone ownership transfers to cloning user
- ✅ Original module permissions unchanged

---

### TEST-CLONE-008: Clone Permissions - Private Module

**Feature**: Cross-User Module Cloning (Private)
**Type**: Security
**Priority**: High

#### Test Steps:

1. **Setup (User A - Browser 1)**:
   - Log in as ritikh2@illinois.edu
   - Create or find a PRIVATE module
   - Ensure it's published (status: published, visibility: private)
   - Note the module slug

2. **Attempt to View as Different User (User B - Browser 2)**:
   - Log in as jwillits@illinois.edu
   - Try to navigate to the private module URL directly
   - Example: `/modules/test-published-private-module`

3. **Expected Behavior**:
   - ❌ Module should NOT be accessible
   - Should show 404 or "Module not found" error
   - OR redirect to modules library

4. **Verify Clone Button Not Present**:
   - If you somehow access the module (as collaborator)
   - Clone button should work
   - But if you're NOT a collaborator, you shouldn't see the module

#### Expected Results:
- ❌ User B CANNOT access User A's private module
- ❌ User B CANNOT clone User A's private module
- ✅ Privacy controls working correctly
- ✅ Only collaborators can access private modules

#### Security Check:
- ✅ Private modules are NOT accessible to non-collaborators
- ✅ Private modules are NOT cloneable by non-collaborators
- ✅ Proper access control enforcement

---

### TEST-CLONE-010: Clone Lineage Tracking (Multi-User Verification)

**Feature**: Clone Relationship Tracking
**Type**: Functional
**Priority**: Low

#### Test Steps:

1. **Create Original (User A - Browser 1)**:
   - Create a module as ritikh2@illinois.edu
   - Note the module ID

2. **Clone by User B (Browser 2)**:
   - Log in as jwillits@illinois.edu
   - Clone User A's public module
   - Note the cloned module ID

3. **Verify Lineage**:
   - Check database or module metadata
   - Verify cloned module has `cloned_from` field set to original module ID
   - Verify original module's `clone_count` incremented

4. **Re-clone by User A (Browser 1)**:
   - User A clones User B's clone
   - Verify new clone has `cloned_from` pointing to User B's module
   - Verify lineage chain is preserved

#### Expected Results:
- ✅ Each clone has `cloned_from` field set
- ✅ Original module tracks clone count
- ✅ Multiple-generation cloning works
- ✅ Lineage is preserved across users

---

### TEST-NOTES-XXX: Course Notes (Multi-User)

**Feature**: Course-Specific Module Notes
**Type**: Functional
**Priority**: Medium

#### Test Steps:

1. **Setup (User A - Browser 1)**:
   - Create a course with multiple modules
   - Add custom notes to a module in the course
   - Publish the course

2. **Add User B as Collaborator (Browser 1)**:
   - Add jwillits@illinois.edu as course collaborator
   - Save changes

3. **Verify Access (User B - Browser 2)**:
   - Log in as jwillits@illinois.edu
   - Navigate to Faculty Dashboard
   - Find the shared course
   - Edit the course
   - Verify you can see User A's notes
   - Add your own notes to a module

4. **Verify Isolation**:
   - Notes should be course-specific
   - Same module in different courses can have different notes
   - Changes by User B visible to User A

#### Expected Results:
- ✅ Course notes are shared among collaborators
- ✅ Notes are course-specific (not module-specific)
- ✅ All collaborators can edit notes
- ✅ Changes sync properly

---

## ♿ Accessibility Tests (Require Manual Testing)

### TEST-PERF-003: Keyboard Navigation

**Feature**: Keyboard-Only Navigation
**Type**: Accessibility
**Priority**: High

#### Test Steps:

1. **Tab Through Interface**:
   - Start on homepage
   - Use only `Tab` key to navigate
   - Verify focus indicators are visible
   - Verify logical tab order

2. **Test Interactive Elements**:
   - `Enter` to activate links/buttons
   - `Space` to toggle checkboxes
   - `Esc` to close dialogs
   - Arrow keys for dropdowns

3. **Test Forms**:
   - Tab through all form fields
   - Verify labels are properly associated
   - Verify error messages are accessible

#### Expected Results:
- ✅ All interactive elements accessible via keyboard
- ✅ Focus indicators always visible
- ✅ Logical tab order throughout
- ✅ No keyboard traps

---

### TEST-PERF-004: Screen Reader

**Feature**: Screen Reader Compatibility
**Type**: Accessibility
**Priority**: High

#### Test Steps:

1. **Setup**:
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Navigate to https://bcs-web2.vercel.app

2. **Test Landmarks**:
   - Verify page regions announced (navigation, main, footer)
   - Verify headings hierarchy (H1 → H2 → H3)
   - Verify skip links work

3. **Test Forms**:
   - Verify field labels announced
   - Verify error messages announced
   - Verify required fields indicated

4. **Test Interactive Elements**:
   - Verify button purposes clear
   - Verify link destinations clear
   - Verify image alt text meaningful

#### Expected Results:
- ✅ All content accessible to screen readers
- ✅ Semantic HTML used correctly
- ✅ ARIA labels where appropriate
- ✅ Meaningful announcements

---

### TEST-PERF-005: Browser Compatibility

**Feature**: Cross-Browser Support
**Type**: Compatibility
**Priority**: Medium

#### Test Steps:

1. **Test in Each Browser**:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

2. **Test Key Features**:
   - Homepage loads correctly
   - Navigation works
   - Forms submit properly
   - Module viewer displays correctly
   - Rich text editor functions
   - Images load
   - Styles render correctly

3. **Test Responsive Design**:
   - Desktop (1920×1080)
   - Tablet (768×1024)
   - Mobile (375×667)

#### Expected Results:
- ✅ Consistent appearance across browsers
- ✅ All features work in all browsers
- ✅ No console errors
- ✅ Responsive design works everywhere

---

## 🗄️ Infrastructure Test

### TEST-ERROR-003: Database Connection Error

**Feature**: Database Failure Handling
**Type**: Error Handling
**Priority**: Low

#### Test Steps:

**⚠️ WARNING: This test requires taking down the database temporarily.**

1. **Setup**:
   - Access Supabase dashboard
   - Temporarily pause the database
   - OR revoke connection temporarily

2. **Test Application Behavior**:
   - Try to load any page
   - Verify graceful error message
   - Verify no sensitive data exposed
   - Verify user-friendly error page

3. **Restore**:
   - Re-enable database connection
   - Verify application recovers

#### Expected Results:
- ✅ Graceful error handling
- ✅ User-friendly error message
- ✅ No stack traces exposed
- ✅ Application recovers after database restored

**Recommendation**: Test in staging environment only, not production.

---

## 📊 Additional Manual Test

### TEST-CATALOG-XXX: Course Catalog Statistics (Edge Case)

**Feature**: Statistics Card Accuracy
**Type**: Functional
**Priority**: Low

#### Test Steps:

1. **Verify Module Count**:
   - Navigate to `/courses`
   - Check "Total Modules" stat card
   - Compare with database count
   - Previously showed "NaN" - verify this is fixed

2. **Test Edge Cases**:
   - Create course with no modules
   - Create course with 100+ modules
   - Verify statistics update correctly
   - Check statistics after deleting courses

#### Expected Results:
- ✅ All statistics show valid numbers
- ✅ No "NaN" or undefined values
- ✅ Statistics update in real-time
- ✅ Edge cases handled correctly

---

## 📝 Testing Checklist Template

Use this checklist when performing manual tests:

```markdown
### Test: TEST-XXXX-XXX

- [ ] Prerequisites met
- [ ] Test environment: _______________
- [ ] Browsers used: _______________
- [ ] Date tested: _______________
- [ ] Tester: _______________

**Results:**
- [ ] Test passed
- [ ] Test failed
- [ ] Test blocked (reason: _______________)

**Issues Found:**
- Issue 1: _______________
- Issue 2: _______________

**Screenshots:**
- Screenshot 1: _______________
- Screenshot 2: _______________

**Notes:**
_______________
```

---

## 🚀 Quick Test Commands

```bash
# Get list of test users
SELECT email, role, email_verified FROM users WHERE email_verified = true;

# Check module visibility
SELECT id, title, visibility, status, author_id FROM modules WHERE slug = 'module-slug';

# Check clone count
SELECT id, title, clone_count, cloned_from FROM modules WHERE slug = 'module-slug';

# Check collaborators
SELECT * FROM collaborators WHERE module_id = 'module_id';
```

---

## 📞 Support

If you encounter issues during manual testing:

1. Check the main TESTING_CHECKLIST.md for test details
2. Review TECHNICAL_DOCUMENTATION.md for architecture
3. Check database schema in prisma/schema.prisma
4. Review API routes in src/app/api/

---

## ✅ Completion Criteria

Mark tests as PASS when:
- All expected results verified
- No critical bugs found
- Behavior matches specifications
- Security controls working

Mark tests as FAIL when:
- Expected results not met
- Critical bugs discovered
- Security vulnerabilities found

Mark tests as BLOCKED when:
- Prerequisites not met
- Test environment unavailable
- Dependencies not working

---

**Note**: These manual tests complement the 146 automated tests already completed. Together they provide comprehensive test coverage of the BCS E-Textbook Platform.
