# Canvas LMS Grade Sync Guide

This guide walks you through syncing quiz grades from the BCS E-Learning Platform to your Canvas course. Once set up, you can push all quiz scores to Canvas with a single button click — no more downloading spreadsheets and uploading them manually.

For general information about course groups and grade exports, see the [User Guide](/guide) sections on Course Groups and Gradebook Export.

---

## Table of Contents

1. [How It Works](#1-how-it-works)
2. [What You Need](#2-what-you-need)
3. [Step 1: Get Your Canvas API Token](#3-step-1-get-your-canvas-api-token)
4. [Step 2: Find Your Canvas Course ID](#4-step-2-find-your-canvas-course-id)
5. [Step 3: Create a Course Group in BCS](#5-step-3-create-a-course-group-in-bcs)
6. [Step 4: Add Students to the Group](#6-step-4-add-students-to-the-group)
7. [Step 5: Sync Grades](#7-step-5-sync-grades)
8. [Understanding the Sync Results](#8-understanding-the-sync-results)
9. [Re-syncing Grades](#9-re-syncing-grades)
10. [What Gets Created in Canvas](#10-what-gets-created-in-canvas)
11. [Student Matching](#11-student-matching)
12. [Semester Workflow](#12-semester-workflow)
13. [Troubleshooting](#13-troubleshooting)
14. [FAQ](#14-faq)
15. [Security and Safety](#15-security-and-safety)

---

## 1. How It Works

The sync pushes quiz grades from BCS to Canvas using the Canvas REST API. Here is what happens when you click "Sync to Canvas":

1. BCS looks at all quizzes in the course and finds each student's **best score** on each quiz
2. For each quiz, BCS creates a corresponding **assignment** in your Canvas course (or reuses one from a previous sync)
3. BCS matches students between the two systems by **email address**
4. Each student's best score is pushed to the matching Canvas assignment
5. You see a summary showing how many quizzes and students were synced, and whether any students could not be matched

The sync is **manual** — it only runs when you click the button. Nothing is sent to Canvas automatically.

---

## 2. What You Need

Before you can sync grades, make sure you have:

| Requirement | Details |
|---|---|
| A **Canvas API token** | A personal access token generated from your Canvas profile (see Step 1) |
| Your **Canvas course ID** | The numeric ID from your Canvas course URL (see Step 2) |
| **Students enrolled in both systems** | Students must be enrolled in both BCS and Canvas, using the **same email address** |
| **Quiz attempts in BCS** | Students must have completed at least one quiz — there are no grades to sync otherwise |
| **Admin setup complete** | Your platform administrator must have added the Canvas API token and base URL to the server environment variables |

### For Administrators

The following environment variables must be set on the server (e.g., in Vercel):

| Variable | Value | Purpose |
|---|---|---|
| `CANVAS_BASE_URL` | `https://canvas.illinois.edu` (or your institution's Canvas URL) | The base URL of your Canvas instance |
| `CANVAS_API_TOKEN` | Your personal access token | Authenticates API requests to Canvas |
| `CANVAS_ALLOWED_COURSE_IDS` | Comma-separated list of course IDs (e.g., `68879,73000`) | Safety guard — only these Canvas courses can receive grade syncs. Prevents accidental pushes to unrelated courses. |

---

## 3. Step 1: Get Your Canvas API Token

A personal access token lets BCS communicate with Canvas on your behalf.

1. Log in to Canvas and go to **Account** (click your profile picture in the left sidebar) then **Settings**
2. Scroll down to the **Approved Integrations** section
3. Click **+ New Access Token**
4. Enter a purpose (e.g., "BCS Grade Sync") and optionally set an expiration date
5. Click **Generate Token**
6. **Copy the token immediately** — Canvas will not show it again after you close the dialog
7. Give this token to your platform administrator to add as the `CANVAS_API_TOKEN` environment variable

### Important Notes

- Your token acts with **your permissions**. It can only modify courses where you are a Teacher or TA.
- **Do not share your token** with anyone. It should only be stored as a secure server environment variable.
- If your institution has disabled personal token generation, contact your Canvas administrator to request one or to have it enabled for your account.
- If your token expires or is revoked, the sync will stop working until a new token is configured.

---

## 4. Step 2: Find Your Canvas Course ID

Every Canvas course has a numeric ID in its URL. You need this ID to link your BCS group to the correct Canvas course.

1. Open your Canvas course in a web browser
2. Look at the URL in your address bar. It will look like: `https://canvas.illinois.edu/courses/68879`
3. The number at the end (`68879` in this example) is your **Canvas Course ID**
4. Write this number down — you will enter it when creating your BCS group

### Tips

- Each semester typically has a **different Canvas course**, even if the course content is the same. Make sure you use the course ID for the correct semester.
- The course does **not** need to be published for the API to work, but students must have **active enrollments** (not just pending invitations) for grades to appear in the Canvas gradebook.

---

## 5. Step 3: Create a Course Group in BCS

Course groups connect your BCS course to a specific Canvas course. Each group represents a semester or section.

1. Go to your **Faculty Dashboard** and click on the course
2. Open the **Analytics** page for the course
3. Click the **Groups** button in the top-right corner
4. Click **Create Group**
5. Fill in:
   - **Name** — Use something descriptive like "Fall 2026" or "Spring 2027 Section A"
   - **Description** (optional) — Any notes about this group
   - **Canvas Course ID** — Enter the numeric Canvas course ID from Step 2 (e.g., `68879`)
6. Click **Create**

### Why Groups?

Since the BCS platform is open-enrollment (anyone can sign up), groups let you define which students are in your actual class. When you sync to Canvas, only the students in the selected group are included. This also means you can have the same BCS course running across multiple semesters, each linked to a different Canvas course.

---

## 6. Step 4: Add Students to the Group

After creating the group, you need to add your students to it.

1. Open the group you just created
2. Click **Add Members**
3. You have two options:
   - **Pick Enrolled** — Search for students by name or email from the list of students enrolled in your BCS course
   - **Paste Emails** — Paste a list of student email addresses (one per line or comma-separated). This is useful if you have a class roster from Canvas or your university's system.
4. Click **Add** to confirm

### Important Rules

- Only students who are **already enrolled** in the BCS course can be added to a group
- Each student can belong to **at most one group** per course. If a student is already in another group, you will see an error message telling you which group they are in.
- Student emails in BCS must **match** their Canvas emails for the sync to work (see [Student Matching](#11-student-matching))

---

## 7. Step 5: Sync Grades

Once your group is set up with a Canvas Course ID and has members, you are ready to sync.

1. Go to the **Analytics** page for your course
2. In the top-right corner, select your group from the **group picker dropdown** (e.g., "Fall 2026 (30)")
3. The **Sync to Canvas** button will appear next to the "Export Grades" button
4. Click **Sync to Canvas**
5. A confirmation dialog will appear showing:
   - Which group is being synced
   - Which Canvas course will receive the grades
6. Click **Sync Now**
7. Wait for the sync to complete (this may take a few seconds depending on the number of quizzes and students)
8. Review the results summary

### When the Sync Button Does Not Appear

The "Sync to Canvas" button is only visible when **both** of these conditions are true:

- You have selected a **specific group** from the dropdown (not "All enrolled students")
- That group has a **Canvas Course ID** configured

If you don't see the button, check that your group has a Canvas Course ID set (edit the group to verify).

---

## 8. Understanding the Sync Results

After the sync completes, a results dialog shows three numbers:

| Metric | What It Means |
|---|---|
| **Quizzes synced** | The number of quiz assignments that were created or updated in Canvas |
| **Students synced** | The number of students whose grades were successfully pushed |
| **Skipped** | The number of students in your group who could not be found in Canvas (email mismatch) |

### Sync Statuses

| Status | Icon | Meaning |
|---|---|---|
| **Sync Complete** | Green checkmark | All quizzes and students synced successfully |
| **Sync Partially Complete** | Yellow warning | Some items synced but there were errors or skipped students |
| **Sync Failed** | Red X | Nothing could be synced — check the error messages |

### Unmatched Students

If any students are skipped, their email addresses are listed under "Students not found in Canvas." This means:
- The student's email in BCS does not match any student email in the Canvas course, OR
- The student is not enrolled as a Student in the Canvas course

### Errors

If any errors occurred (e.g., permission issues, Canvas API problems), they are listed in red at the bottom of the results dialog.

---

## 9. Re-syncing Grades

You can sync as many times as you want. Each sync:

- **Updates existing grades** — If a student improved their score since the last sync, the new best score replaces the old one in Canvas
- **Reuses existing assignments** — BCS remembers which Canvas assignments it created and does not create duplicates
- **Picks up new students** — If you added new members to the group since the last sync, their grades will be included
- **Picks up new quizzes** — If you added new quizzes to the course since the last sync, new Canvas assignments will be created for them

### When to Re-sync

- After students complete additional quiz attempts
- After adding new students to the group
- After adding new quizzes to the course
- Before submitting final grades at the end of the semester

---

## 10. What Gets Created in Canvas

When you sync for the first time, BCS creates one **assignment** in Canvas for each quiz in the course. For example, if your course has a module called "Python Programming Basics" with a Mastery Check and a Module Assessment, Canvas will get:

- **Python Programming Basics — Mastery Check** (with the correct point value, e.g., 4 pts)
- **Python Programming Basics — Module Assessment** (with the correct point value, e.g., 3 pts)

These assignments:
- Have **submission type "none"** (students do not submit anything through Canvas — the grades come from BCS)
- Are **published** immediately so they appear in the Canvas gradebook
- Appear in the default **Assignments** group in Canvas (you can move them to a different group in Canvas if you prefer)

### Grade Values

Grades are pushed as **raw points** (e.g., 3 out of 4), not percentages. Canvas automatically calculates the percentage based on the points possible.

The grade pushed is always the student's **best score** across all their attempts on that quiz.

---

## 11. Student Matching

BCS matches students between the two systems using **email addresses** (case-insensitive).

For a student's grade to sync successfully:
1. The student must be enrolled in the BCS course **and** be a member of the group being synced
2. The student must be enrolled as a **Student** in the Canvas course (not just as a TA, Designer, or Observer)
3. The student's **email address in BCS must match** their email address (or login ID) in Canvas

### Common Matching Issues

| Issue | Solution |
|---|---|
| Student uses a different email in BCS vs Canvas | Have the student update their BCS email to match their Canvas email (typically their university email) |
| Student shows as "skipped" | Check that their Canvas enrollment is active and their email matches |
| Student's Canvas enrollment is "pending" | The student needs to accept their Canvas course invitation. This can happen if the Canvas course is unpublished. |

---

## 12. Semester Workflow

Since each semester has a different Canvas course, here is the recommended workflow:

### Start of Semester

1. Note your new Canvas course ID for the semester
2. In BCS, go to your course's Analytics page and click **Groups**
3. Create a new group (e.g., "Fall 2027") with the new Canvas Course ID
4. Add your students to the group (use the Paste Emails tab if you have a class roster)
5. Update the `CANVAS_ALLOWED_COURSE_IDS` environment variable to include the new course ID

### During the Semester

- Sync grades periodically as students complete quizzes
- Re-sync after adding new quizzes or new students

### End of Semester

1. Do a final sync to push all latest grades
2. Verify grades in the Canvas gradebook
3. The old group remains in BCS for historical reference — you do not need to delete it

### Next Semester

Repeat the process with a new group and new Canvas course ID. The same BCS course can have multiple groups, each linked to a different Canvas course.

---

## 13. Troubleshooting

### "Canvas API is not configured"

The `CANVAS_BASE_URL` and `CANVAS_API_TOKEN` environment variables are not set on the server. Contact your platform administrator.

### "Canvas course [ID] is not in the allowed list"

The Canvas course ID you are trying to sync to is not in the `CANVAS_ALLOWED_COURSE_IDS` environment variable. Contact your platform administrator to add it.

### "This group has no Canvas Course ID configured"

Edit the group and add the Canvas Course ID. See [Step 3](#5-step-3-create-a-course-group-in-bcs).

### "Failed to fetch Canvas students"

This usually means:
- The Canvas API token has expired or been revoked — generate a new one
- The Canvas course ID is wrong — double-check it in your Canvas course URL
- The Canvas API is temporarily unavailable — try again in a few minutes

### "user not authorized to perform that action"

Your Canvas role on the target course does not have grading permissions. You need to be a **Teacher** or **TA** on the Canvas course. Designer and Observer roles cannot push grades.

### "No students found" in Canvas SpeedGrader

This is a Canvas UI issue. If the Canvas course is unpublished or student enrollments are pending (not yet accepted), students may not appear in SpeedGrader or the gradebook. Ensure:
- The Canvas course is **published**, OR
- Students have **accepted** their enrollment invitations

### Students show as "skipped"

The student's email in BCS does not match any student email in the Canvas course. See [Student Matching](#11-student-matching).

### Grades synced but Canvas gradebook shows dashes

This can happen if:
- The student's Canvas enrollment is pending (not yet accepted)
- The student is enrolled as a non-Student role (TA, Designer, Observer)
- The Canvas course is unpublished and student enrollments have not been activated

### No quizzes to sync

Make sure:
- Your course has quizzes configured on its modules
- At least one student in the group has submitted a quiz attempt
- Quiz attempts have a status of "submitted" (not "in progress")

---

## 14. FAQ

**Q: Does syncing delete anything in Canvas?**

No. The sync only **creates** assignments and **updates** grades. It never deletes assignments, removes students, or modifies anything else in your Canvas course.

**Q: What if I add more quizzes later?**

New quizzes will get new Canvas assignments on the next sync. Existing assignments are not affected.

**Q: What if a student retakes a quiz and gets a higher score?**

The next time you sync, the new best score will overwrite the old grade in Canvas.

**Q: What if a student retakes a quiz and gets a lower score?**

The sync always pushes the **best** score, so the Canvas grade will not decrease.

**Q: Can I sync to multiple Canvas courses from the same BCS course?**

Yes. Create separate groups, each with a different Canvas Course ID. Sync each group independently.

**Q: Will syncing affect my other Canvas courses?**

No. The sync only touches the specific Canvas course linked to the group you selected. Additionally, a safety allowlist (`CANVAS_ALLOWED_COURSE_IDS`) prevents accidental syncs to unapproved courses.

**Q: How long does the sync take?**

Typically a few seconds for a course with 5-10 quizzes and 30-50 students. Larger courses may take 10-20 seconds.

**Q: Can students see that grades came from BCS?**

Students will see the assignment names (e.g., "Python Programming Basics — Mastery Check") and their scores in the Canvas gradebook. The assignments have submission type "none," so there is no submission to view — just the grade.

**Q: What happens if I run the sync twice?**

Nothing bad. Existing assignments are reused, and grades are updated with the latest best scores. It is safe to sync as often as you like.

---

## 15. Security and Safety

### Your API Token

- Your personal access token acts with **your Canvas permissions**. It can read and write in any Canvas course where you are a Teacher or TA.
- The token is stored as a server environment variable and is **never exposed** to the browser or to students.
- If you suspect your token has been compromised, revoke it immediately in Canvas (Settings > Approved Integrations > delete the token) and generate a new one.

### Course Allowlist

The `CANVAS_ALLOWED_COURSE_IDS` environment variable acts as a safety net. Even if someone enters a wrong Canvas Course ID on a group, the sync will be **blocked** unless that course ID is in the allowlist. This prevents accidental grade pushes to unrelated courses (e.g., courses where you are a TA).

### What the Sync Can and Cannot Do

| Can Do | Cannot Do |
|---|---|
| Create assignments in allowed Canvas courses | Access courses not in the allowlist |
| Push grades for matched students | Delete assignments or grades |
| Read the student roster of the Canvas course | Modify course settings, enrollments, or content |
| | Access any Canvas data outside the specific course being synced |
