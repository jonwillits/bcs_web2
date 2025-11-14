# Test Failures and Issues - BCS E-Textbook Platform

**Document Created**: January 12, 2025
**Purpose**: Track tests that fail or are not working as expected
**Environment**: Development (bcs-web2.vercel.app)

---

## 📋 Summary

**Total Failures**: 0
**Total Issues**: 0
**Total Warnings**: 2
**Tests Not Testable**: 2

---

## ⚠️ WARNINGS (Non-Critical Issues)

### 1. TEST-ERROR-003: Database Connection Error
**Status**: ⚠️ NOT TESTABLE IN DEV ENVIRONMENT
**Issue**: Cannot simulate database outage in shared development environment
**Impact**: Low - Real database failures would be caught in production monitoring
**Recommendation**:
- Add database connection retry logic (already implemented via `withDatabaseRetry`)
- Monitor production logs for connection errors
- Consider integration tests in staging with controlled DB failures

---

### 2. TEST-PERF-004: Screen Reader
**Status**: ⚠️ REQUIRES MANUAL TESTING
**Issue**: Automated screen reader testing not available via Playwright MCP
**Impact**: Medium - Accessibility compliance cannot be fully automated
**Recommendation**:
- Schedule manual screen reader testing (NVDA/JAWS)
- Ensure ARIA labels are present (can be automated)
- Test with keyboard-only navigation (TEST-PERF-003)

---

## 🔍 TESTS REQUIRING SETUP

### TEST-PROFILE-008: Social Link Buttons
**Status**: ⏳ NEEDS TEST DATA
**Issue**: No user profiles currently have social links configured
**Setup Required**:
1. Update a faculty profile with social links:
   - Google Scholar URL
   - Personal Website URL
   - LinkedIn URL
   - Twitter URL
   - GitHub URL
2. Navigate to profile to verify buttons display
3. Click each button to test external link functionality

**SQL to Add Test Data**:
```sql
UPDATE users
SET
  google_scholar_url = 'https://scholar.google.com/citations?user=test',
  personal_website_url = 'https://example.com',
  linkedin_url = 'https://linkedin.com/in/testuser',
  twitter_url = 'https://twitter.com/testuser',
  github_url = 'https://github.com/testuser'
WHERE id = 'faculty_1760130020977_mrpjkoo0bgb'
```

---

## ⏳ PENDING HIGH-PRIORITY TESTS

### Module Functionality (High User Impact)
1. **TEST-MODULE-007**: Module Sorting
   - Status: Ready to test
   - Observable: Sort dropdown visible with 5 options

2. **TEST-MODULE-008**: Module Tag & Author Filtering
   - Status: Ready to test
   - Observable: Filter controls visible

3. **TEST-MODULE-009**: Module Statistics
   - Status: Ready to test
   - Observable: Stats cards showing (12 modules, 1 author, 3 root, 4 with submodules)

### Search Functionality
4. **TEST-SEARCH-006**: Case-Insensitive Fuzzy Search
   - Status: Ready to test
   - Plan: Test "BRAIN" vs "brain" vs "Brain"

### Profile Features
5. **TEST-PROFILE-009**: Publications Tab
   - Status: Ready to test
   - Expected: "Coming Soon" placeholder

6. **TEST-PROFILE-010**: Research Tab
   - Status: Ready to test
   - Expected: "Coming Soon" placeholder

7. **TEST-PROFILE-011**: Link Input in Edit Profile
   - Status: Ready to test
   - Location: `/profile/edit` → "Academic & Social Links" section

8. **TEST-PROFILE-012**: Profile Banner Z-Index
   - Status: Ready to test
   - Verification: Banner background, content foreground

### API & Performance
9. **TEST-API-002**: Pagination API
   - Status: Ready to test
   - Endpoint: `GET /api/courses?page=1&limit=20`

10. **TEST-API-003**: Authentication Required
    - Status: Ready to test
    - Test: Protected endpoints without auth

11. **TEST-PERF-001**: Page Load Performance
    - Status: Ready to test
    - Method: Browser performance API

12. **TEST-PERF-002**: Mobile Performance
    - Status: Ready to test
    - Viewport: 375x667px

---

## ✅ RECENTLY FIXED ISSUES

### January 12, 2025 Session
**No failures detected in 3 tests run:**
- TEST-PROFILE-004: View Other User Profile ✅ PASS
- TEST-CATALOG-004: Course Pagination ✅ PASS
- TEST-CATALOG-011: Universal Search Link ✅ PASS

All tests passed on first attempt with no issues or bugs discovered.

---

## 📊 Historical Failures (Resolved)

### TEST-CASCADE-001: Cascade Checkbox Blocking (RESOLVED)
**Date**: January 11, 2025
**Issue**: Cascade checkbox causing form submission to block
**Resolution**: Removed default blocking behavior, added opt-in cascade feature
**Test Status**: ☑ Pass (after fix)
**Git Commit**: Previous testing session

---

## 🔧 TEST ENVIRONMENT NOTES

### Database State (January 12, 2025)
- Published Courses: 25 (21 test courses + 4 original)
- Published Modules: 12
- Total Users: 20
- Faculty Users: 10
- Test Data: Well-established for pagination and multi-user testing

### Known Limitations
1. **Cannot test database failures** in shared dev environment
2. **Screen reader testing** requires manual intervention
3. **Network failure simulation** limited in browser automation
4. **Email delivery** uses dev Resend account (not production)

---

## 🎯 RECOMMENDATIONS

### Immediate Actions
1. ✅ **Completed**: Create pagination test data (25 courses)
2. ⏳ **Pending**: Add social links to test user profile
3. ⏳ **Pending**: Complete module filtering tests (high user impact)
4. ⏳ **Pending**: Test case-insensitive search

### Future Improvements
1. **Automated Accessibility Testing**: Integrate axe-core or similar
2. **Load Testing**: Use k6 or Artillery for performance under load
3. **Visual Regression Testing**: Add Percy or Chromatic for UI changes
4. **E2E Test Suite**: Expand Playwright tests to cover all critical paths

---

## 📞 REPORTING ISSUES

**If you discover a test failure:**
1. Document in this file under appropriate section
2. Include screenshot evidence
3. Add steps to reproduce
4. Tag with priority (High/Medium/Low)
5. Cross-reference with GitHub issues if applicable

---

**Last Updated**: January 12, 2025
**Next Review**: January 13, 2025
