# Progress Tracking - Future Enhancements

**Status:** Deferred features from Week 4 implementation
**Created:** November 2025
**Priority:** Low to Medium (nice-to-have improvements)

This document tracks progress tracking features that were intentionally skipped during the Week 4 simplified implementation. These features can be added later without disrupting existing functionality.

---

## 🔥 Learning Streaks System

**Status:** Not Implemented
**Priority:** Medium
**Estimated Effort:** 1-2 days

### Description
GitHub-style learning streak tracking to gamify consistent learning habits.

### What's Needed

#### 1. Database Schema
```sql
-- New table: learning_sessions
CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,  -- One record per user per day
  minutes_studied INT DEFAULT 0,
  modules_viewed INT DEFAULT 0,
  modules_completed INT DEFAULT 0,
  courses_accessed INT DEFAULT 0,
  first_activity TIMESTAMP,
  last_activity TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX learning_sessions_user_date_idx ON learning_sessions(user_id, date);
CREATE INDEX learning_sessions_date_idx ON learning_sessions(date DESC);
```

#### 2. API Endpoints
- `GET /api/progress/streaks` - Get current streak, longest streak, calendar heatmap data
- Update existing endpoints to record daily sessions

#### 3. UI Components
- `LearningStreakCalendar.tsx` - GitHub-style contribution calendar (use `react-calendar-heatmap` library)
- `StreakBadge.tsx` - "🔥 X-day streak" indicator
- `StreakStats.tsx` - Current vs longest streak comparison

#### 4. Pages
- `/progress/streaks` - Full streak calendar with stats
- Add streak badge to dashboard header

#### 5. Logic
```typescript
// Streak calculation logic
function calculateStreak(sessions: LearningSession[]): number {
  let streak = 0;
  let currentDate = startOfDay(new Date());

  for (const session of sortedSessions) {
    if (isSameDay(sessionDate, currentDate) ||
        isSameDay(sessionDate, subDays(currentDate, 1))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
}
```

#### 6. Dependencies
```bash
npm install react-calendar-heatmap date-fns
```

---

## ⏱️ Time Tracking System

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 2-3 days

### Description
Automatic time tracking with heartbeat system to measure actual learning time.

### What's Needed

#### 1. Database Schema Changes
```sql
-- Add to module_progress table
ALTER TABLE module_progress ADD COLUMN time_spent_mins INT DEFAULT 0;
ALTER TABLE module_progress ADD COLUMN visit_count INT DEFAULT 0;
ALTER TABLE module_progress ADD COLUMN scroll_depth_pct FLOAT DEFAULT 0;
ALTER TABLE module_progress ADD COLUMN last_accessed TIMESTAMP;
```

#### 2. Client-Side Tracking
```typescript
// Hook: useModuleProgress
export function useModuleProgress(moduleId: string, courseId: string) {
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Heartbeat: Send API call every 5 minutes
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isIdle()) {
        sendHeartbeat(moduleId, courseId, 5);  // 5 minutes elapsed
        setTimeSpent(t => t + 5);
      }
    }, 5 * 60 * 1000);  // 5 minutes

    return () => clearInterval(interval);
  }, [isTracking, moduleId, courseId]);

  return { timeSpent, isTracking };
}
```

#### 3. API Endpoints
- `PUT /api/progress/module/heartbeat` - Update time_spent_mins
- Update `/api/progress/user` to include total time spent

#### 4. Idle Detection
```typescript
// Detect user inactivity (no mouse/keyboard events for >5 minutes)
function isIdle(): boolean {
  const lastActivityTime = getLastActivityTime();
  return Date.now() - lastActivityTime > 5 * 60 * 1000;
}
```

#### 5. UI Updates
- Show "X minutes spent" on course cards
- Add time spent to progress stats
- Display time estimates ("~15 min read")

---

## 📊 Faculty Course Analytics

**Status:** Not Implemented
**Priority:** Medium
**Estimated Effort:** 2-3 days

### Description
Detailed analytics dashboard for instructors to monitor learner engagement.

### What's Needed

#### 1. API Endpoint
```typescript
// GET /api/faculty/analytics/[courseId]
{
  enrollment: {
    total: 150,
    active: 120,
    completed: 30
  },
  completionRate: 20, // 30/150 = 20%
  averageProgress: 45, // Average completion percentage
  moduleAnalytics: [
    {
      moduleId: "...",
      moduleTitle: "Introduction",
      completionCount: 100,
      averageTimeMinutes: 25,
      dropoffRate: 10  // % who didn't complete after starting
    }
  ],
  recentActivity: [...],  // Last 20 module completions
  engagementOverTime: [...]  // Daily activity chart data
}
```

#### 2. UI Components
- `FacultyCourseAnalytics.tsx` - Main analytics dashboard
- Charts using `recharts` library:
  - Completion rate bar chart
  - Engagement timeline (line chart)
  - Module popularity (sorted list)
  - Drop-off heatmap

#### 3. Page
- `/faculty/courses/[id]/analytics` - Full analytics dashboard
- Add "View Analytics" button to faculty course cards

#### 4. Dependencies
```bash
npm install recharts
```

#### 5. Considerations
- **Privacy**: Show only aggregate data, not individual learner progress (unless explicit permission)
- **Performance**: Cache analytics data, regenerate hourly
- **Permissions**: Verify instructor owns course or is collaborator

---

## 🎯 Auto-Completion Based on Scroll Depth

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 4-6 hours

### Description
Automatically mark modules as completed when user scrolls to 100% of content.

### What's Needed

#### 1. Scroll Tracking
```typescript
function calculateScrollDepth(): number {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset;

  return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
}

// Update scroll_depth_pct in module_progress via heartbeat
```

#### 2. Auto-Completion Logic
```typescript
// In useModuleProgress hook
useEffect(() => {
  if (scrollDepth >= 100 && status !== 'completed') {
    // Auto-complete module
    completeModule(moduleId, courseId, false);  // manually_marked = false
  }
}, [scrollDepth]);
```

#### 3. UI Indicator
- Show scroll progress bar at top of page
- "You've reached the end! Mark as complete?" prompt

#### 4. Considerations
- Allow users to manually mark incomplete if auto-completed
- Don't auto-complete for quick scrollers (require minimum time spent)

---

## 📜 Completion Certificates

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 1-2 days

### Description
Generate PDF certificates when learners complete 100% of a course.

### What's Needed

#### 1. Certificate Generation
```bash
npm install @react-pdf/renderer
```

```typescript
// Component: CertificateTemplate.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function CertificateTemplate({ userName, courseName, completionDate }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape">
        <View style={styles.certificate}>
          <Text>Certificate of Completion</Text>
          <Text>{userName}</Text>
          <Text>has successfully completed</Text>
          <Text>{courseName}</Text>
          <Text>{completionDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

#### 2. API Endpoint
- `GET /api/certificates/[courseId]` - Generate and download PDF

#### 3. UI Components
- `CompletionCertificate.tsx` - Display certificate preview
- "Download Certificate" button on 100% complete courses
- Certificate gallery page

#### 4. Considerations
- Add instructor signature (stored in course metadata)
- Include course completion date and unique certificate ID
- Store certificate generation records for audit

---

## 🏆 Leaderboards & Gamification

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 2-3 days

### Description
Optional leaderboards to encourage competition and motivation.

### What's Needed

#### 1. Database Schema
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN badges JSON DEFAULT '[]';
```

#### 2. Points System
```typescript
const POINTS = {
  MODULE_COMPLETE: 10,
  COURSE_COMPLETE: 100,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
  FIRST_MODULE: 5,
};
```

#### 3. API Endpoints
- `GET /api/leaderboard/course/[courseId]` - Top learners in course
- `GET /api/leaderboard/global` - Platform-wide leaderboard
- `POST /api/badges/award` - Award badges for achievements

#### 4. UI Components
- `Leaderboard.tsx` - Sortable rankings
- `BadgeDisplay.tsx` - User badges showcase
- `LevelIndicator.tsx` - Progress to next level

#### 5. Considerations
- **Opt-in**: Make leaderboards optional (privacy setting)
- **Anonymous option**: Allow users to hide their name
- **Time-based**: Monthly/semester leaderboards
- **Fair comparison**: Separate leaderboards per course or cohort

---

## 📱 Progress Notifications

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 1 day

### Description
Email or in-app notifications for progress milestones.

### What's Needed

#### 1. Notification Triggers
```typescript
const NOTIFICATIONS = {
  STREAK_BROKEN: "Your 5-day learning streak is about to end!",
  MILESTONE_25: "You're 25% through the course!",
  MILESTONE_50: "Halfway there! Keep going!",
  MILESTONE_75: "Almost done! Only 25% left!",
  COURSE_COMPLETE: "Congratulations! You completed the course!",
  WEEK_INACTIVE: "We miss you! Come back to continue learning.",
};
```

#### 2. Notification System
- Use existing email infrastructure (Resend)
- Add in-app notification center (bell icon in header)
- Notification preferences page

#### 3. Database Schema
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'email' | 'in_app'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🎯 Estimated Time to Complete

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 4-6 hours

### Description
Show estimated time to complete a course based on average learner data.

### What's Needed

#### 1. Calculation
```typescript
// Based on historical data
function estimateTimeToComplete(courseId: string): number {
  const avgTimePerModule = getAvgTimePerModule(courseId);
  const totalModules = getModuleCount(courseId);

  return avgTimePerModule * totalModules;
}
```

#### 2. UI Display
- "~8 hours to complete" on course cards
- "~20 minutes remaining" on progress page
- Dynamic updates as user progresses

#### 3. Considerations
- Show range instead of exact time ("6-10 hours")
- Update estimates based on user's own pace
- Show "faster than average" / "slower than average" feedback

---

## 🔮 Recommended Modules

**Status:** Not Implemented
**Priority:** Medium
**Estimated Effort:** 3-4 days

### Description
AI-powered recommendations based on progress and learning patterns.

### What's Needed

#### 1. Recommendation Engine
```typescript
function getRecommendations(userId: string): Module[] {
  // Factors:
  // - Completed module topics
  // - Course enrollment history
  // - Other learners with similar patterns
  // - Prerequisite relationships
  // - Popular modules in similar courses
}
```

#### 2. UI Components
- `RecommendedModules.tsx` - Carousel of suggestions
- Show on dashboard and progress pages
- "You might also like" section

#### 3. ML Model (Optional)
- Collaborative filtering
- Content-based filtering
- Hybrid approach

---

## 📊 Weekly Progress Reports

**Status:** Not Implemented
**Priority:** Low
**Estimated Effort:** 1 day

### Description
Automated weekly email summaries of learning progress.

### What's Needed

#### 1. Report Generation
```typescript
// Run weekly cron job
async function generateWeeklyReport(userId: string) {
  const weekData = await getWeeklyStats(userId);

  return {
    modulesCompleted: weekData.completed,
    timeSpent: weekData.timeSpent,
    streak: weekData.streak,
    coursesProgress: weekData.coursesProgress,
    nextGoals: weekData.nextGoals,
  };
}
```

#### 2. Email Template
- Summary stats with visual charts
- Achievements unlocked this week
- Upcoming milestones
- Motivational message

#### 3. Considerations
- Allow users to opt out
- Choose frequency (weekly, monthly)
- Best time to send (e.g., Sunday evening)

---

## 🚀 Implementation Priority

If implementing these features, recommended order:

1. **Learning Streaks** (Medium priority, high engagement impact)
2. **Faculty Analytics** (Medium priority, valuable for instructors)
3. **Time Tracking** (Low priority, nice-to-have data)
4. **Completion Certificates** (Low priority, motivational reward)
5. **Recommended Modules** (Medium priority, improves discovery)
6. **Auto-Completion** (Low priority, convenience feature)
7. **Leaderboards** (Low priority, optional gamification)
8. **Notifications** (Low priority, can be intrusive)
9. **Weekly Reports** (Low priority, automated emails)
10. **Time Estimates** (Low priority, informational only)

---

## 📝 Notes

- All these features are **optional enhancements** that don't affect core functionality
- Current simplified implementation (manual completion tracking) is production-ready
- These features can be added incrementally without breaking changes
- Consider user feedback before implementing to prioritize what learners actually want
- Some features (leaderboards, time tracking) may raise privacy concerns - handle carefully

---

**Last Updated:** November 2025
**Status:** Reference document for future development
