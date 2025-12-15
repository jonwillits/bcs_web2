# Testing Guide: Curriculum Map & Learning Paths

## Test Environment
- **URL**: https://bcs-web2.vercel.app
- **Test Account**: ritikh2@illinois.edu / Test234!
- **Role**: Faculty (has permissions)

---

## Test 1: Curriculum Map Editor

### Objective
Verify faculty can visually organize curriculum and set prerequisites.

### Steps

1. **Access the Editor**
   - Login as faculty
   - Go to Faculty Dashboard
   - Click "Edit Curriculum" card
   - ✅ Should load `/faculty/curriculum/edit`

2. **Verify Auto-Layout**
   - Page loads with courses positioned
   - Check if "Unsaved changes" warning appears (if auto-layout ran)
   - ✅ Courses should be arranged hierarchically, not stacked at center

3. **Test Drag-and-Drop**
   - Click and drag any course node
   - Move it to a different position
   - ✅ Course should move smoothly
   - ✅ SVG prerequisite lines should update in real-time
   - ✅ "Unsaved changes" warning should appear

4. **Test Prerequisite Editing**
   - Click any course node (becomes highlighted with yellow ring)
   - Right sidebar should open showing course details
   - ✅ See list of all other courses with checkboxes
   - Check/uncheck some prerequisites
   - ✅ SVG lines should update when you check/uncheck
   - ✅ "Unsaved changes" warning should appear

5. **Test Auto-Layout Button**
   - Click "Auto-Layout" button
   - ✅ All courses should rearrange into hierarchical layout
   - Courses with no prerequisites → top
   - Courses with prerequisites → lower layers

6. **Test Save Functionality**
   - Click "Save Layout" button
   - ✅ Should show "Curriculum layout saved successfully!"
   - ✅ "Unsaved changes" warning should disappear
   - Refresh page
   - ✅ Positions should be preserved

7. **Test Validation**
   - Try to create a circular prerequisite:
     - Course A requires Course B
     - Course B requires Course A
   - Click "Save Layout"
   - ✅ Should show error: "Circular prerequisite detected"

---

## Test 2: Learning Paths List

### Objective
Verify faculty can view and manage learning paths.

### Steps

1. **Access Learning Paths**
   - Go to Faculty Dashboard
   - Click "Manage Paths" card
   - ✅ Should load `/faculty/paths`

2. **Verify Empty State** (if no paths exist)
   - ✅ Should show "No Learning Paths Yet" message
   - ✅ Should show "Create Learning Path" button

3. **Verify List View** (if paths exist)
   - ✅ See all learning paths with:
     - Title
     - Description
     - Course count
     - Creator name
     - Created date
   - ✅ Featured paths should show star badge
   - ✅ Each path should have View/Edit/Delete buttons

---

## Test 3: Create Learning Path

### Objective
Verify faculty can create curated learning paths.

### Steps

1. **Start Creation**
   - From `/faculty/paths`, click "Create New Path"
   - ✅ Should load `/faculty/paths/create`

2. **Test Form Fields**
   - Enter title: "Test Data Science Path"
   - ✅ Slug should auto-generate: "test-data-science-path"
   - Manually edit slug: "ds-path-2024"
   - ✅ Should allow manual override
   - Enter description: "A comprehensive path for aspiring data scientists"
   - ✅ Description is optional

3. **Test Course Selection**
   - Left panel shows "Available Courses"
   - ✅ See all published courses with module counts
   - Click on 3-4 courses
   - ✅ Courses should move to "Selected Courses" panel on right
   - ✅ Available courses count should decrease

4. **Test Drag-to-Reorder**
   - In "Selected Courses" panel, grab drag handle (grip icon)
   - Drag course to different position
   - ✅ Courses should reorder
   - ✅ Numbers (1, 2, 3...) should update

5. **Test Remove Course**
   - Click X button on a selected course
   - ✅ Course should return to "Available Courses" list

6. **Test Featured Toggle**
   - Check "Featured Path" checkbox
   - ✅ Should toggle on/off

7. **Test Validation**
   - Leave title empty, click "Create Path"
   - ✅ Should prevent submission (browser validation)
   - Unselect all courses, try to submit
   - ✅ "Create Path" button should be disabled

8. **Test Creation**
   - Fill all fields correctly
   - Select 3+ courses
   - Click "Create Path"
   - ✅ Should redirect to `/faculty/paths`
   - ✅ New path should appear in list

---

## Test 4: Edit Learning Path

### Objective
Verify faculty can edit existing paths.

### Steps

1. **Access Edit Form**
   - From `/faculty/paths`, click "Edit" on a path
   - ✅ Should load `/faculty/paths/edit/[slug]`
   - ✅ Form should pre-fill with existing data

2. **Test Updates**
   - Change title
   - Add/remove courses
   - Reorder courses
   - Toggle featured status
   - Click "Update Path"
   - ✅ Should save successfully
   - ✅ Changes should be reflected in list

3. **Test Slug Change**
   - Edit slug field to new value
   - Click "Update Path"
   - ✅ Should update successfully
   - ✅ URL should change to new slug

4. **Test Permission Restriction**
   - As Faculty A, create a path
   - Logout, login as Faculty B (different account)
   - Try to edit Faculty A's path
   - ✅ Should redirect or show "Forbidden" (need to test with 2nd account)

---

## Test 5: Delete Learning Path

### Objective
Verify deletion works and checks permissions.

### Steps

1. **Delete Own Path**
   - From `/faculty/paths`, click trash icon on YOUR path
   - ✅ Should delete immediately
   - ✅ Path should disappear from list

2. **Delete as Admin** (if you have admin account)
   - Login as admin
   - ✅ Should be able to delete ANY path

---

## Test 6: Student View Integration

### Objective
Verify students can view curriculum/paths but not edit.

### Steps

1. **Test Curriculum Map Access**
   - Logout from faculty account
   - Go to `/curriculum/map` (without login)
   - ✅ Should load public curriculum map view
   - ✅ Should see courses positioned as faculty arranged them
   - ✅ Should NOT see edit controls

2. **Test Learning Path Access**
   - Go to `/paths`
   - ✅ Should see list of learning paths
   - Click on a path
   - ✅ Should load path map view
   - ✅ Should show only courses in that path

3. **Test Navigation Flow**
   - From course catalog, click "View Curriculum Map"
   - ✅ Should load curriculum map
   - Click a course node
   - ✅ Should zoom to course quest map (module level)
   - Check breadcrumb
   - ✅ Should show: "Curriculum > [Course Name] > Quest Map"
   - Click "Curriculum" in breadcrumb
   - ✅ Should return to curriculum map

---

## Test 7: Mobile Responsiveness

### Objective
Verify features work on mobile devices.

### Steps

1. **Open on Mobile** (or use browser dev tools, mobile view)
   - Test curriculum map editor
   - ✅ Drag should work on touch devices
   - ✅ Sidebar should be readable
   - ✅ Buttons should be tappable

2. **Test Learning Path Form**
   - ✅ Course selection should work
   - ✅ Drag-to-reorder should work on touch

---

## Expected Issues to Watch For

### Known Limitations
1. **No undo/redo** - Changes are manual, must re-drag if mistake
2. **No zoom controls** - Map is fixed size, scroll to navigate
3. **No search** - Can't search for specific course in editor

### Potential Bugs to Check
1. ⚠️ **SVG alignment** - Lines should connect node centers perfectly
2. ⚠️ **Overlapping nodes** - Auto-layout might place courses too close
3. ⚠️ **Long course names** - Might overflow node circles
4. ⚠️ **Many prerequisites** - Too many lines might look cluttered
5. ⚠️ **Empty curriculum** - What happens if no courses published?

---

## Success Criteria

### Must Work
- ✅ Faculty can access all features
- ✅ Students CANNOT access faculty pages
- ✅ Drag-and-drop works smoothly
- ✅ Prerequisites save correctly
- ✅ Learning paths create/edit/delete
- ✅ Navigation between levels works

### Nice to Have (Can improve later)
- 🔹 Smoother animations
- 🔹 Undo/redo functionality
- 🔹 Bulk course selection
- 🔹 Export/import layouts

---

## Test Data Recommendations

### Create Test Scenarios

1. **Simple Linear Path**
   - Course A → Course B → Course C
   - Tests basic prerequisite chain

2. **Branching Path**
   - Course A → Course B and Course C
   - Tests multiple prerequisites from one course

3. **Converging Path**
   - Course A + Course B → Course C
   - Tests course requiring multiple prerequisites

4. **Complex Network**
   - Mix of all above
   - Tests auto-layout algorithm limits

---

## Reporting Issues

When testing, note:
1. **What you did** (steps to reproduce)
2. **What happened** (actual result)
3. **What should happen** (expected result)
4. **Browser/device** (Chrome, Safari, mobile, etc.)
5. **Screenshots** (especially for visual issues)

---

## Post-Testing Next Steps

After testing, decide:
1. ☐ Are there critical bugs to fix?
2. ☐ Is the UX intuitive enough?
3. ☐ Do we need the visual path preview feature?
4. ☐ What improvements would help most?

---

## Quick Test Checklist

**Minimum Viable Test** (15 minutes):
- [ ] Login as faculty
- [ ] Open curriculum editor
- [ ] Drag one course
- [ ] Edit one prerequisite
- [ ] Save layout
- [ ] Create one learning path with 3 courses
- [ ] View path as student
- [ ] Navigate: Curriculum → Course → Module via breadcrumb

If all above work → **Core functionality is solid** ✅
