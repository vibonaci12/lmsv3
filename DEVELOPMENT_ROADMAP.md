# 🎓 LMS Development Roadmap

## ✅ FASE 1: FONDASI DATABASE & AUTHENTICATION (COMPLETED)

### Database Schema
Semua tabel telah dibuat:
- ✅ **teachers** - Profile guru (linked ke Supabase Auth)
- ✅ **students** - Akun siswa dengan custom authentication
- ✅ **classes** - Kelas pembelajaran (shared access)
- ✅ **class_students** - Enrollment siswa ke kelas
- ✅ **materials** - Materi pembelajaran
- ✅ **assignments** - Tugas (dual type: wajib & tambahan)
- ✅ **questions** - Soal dalam assignment
- ✅ **submissions** - Pengumpulan tugas siswa
- ✅ **answers** - Jawaban siswa per soal
- ✅ **attendances** - Absensi
- ✅ **notifications** - Notifikasi
- ✅ **activity_logs** - Audit trail

### Security (RLS)
- ✅ RLS enabled untuk semua tabel
- ✅ Teachers: Full shared access ke semua data
- ✅ Students: Access hanya ke data mereka dan kelas enrolled
- ✅ Storage buckets: avatars, materials, submissions

### Tech Stack
- ✅ Mantine UI v7
- ✅ React Router v6
- ✅ Recharts (analytics)
- ✅ XLSX (Excel import/export)
- ✅ Day.js (date handling)
- ✅ Bcrypt.js (password hashing)

---

## ✅ FASE 2: CORE INFRASTRUCTURE (COMPLETED)

### 2.1 Authentication System ✅
**File Structure:**
```
src/
├── contexts/
│   └── AuthContext.tsx        # Auth state management ✅
├── services/
│   ├── authService.ts         # Teacher login (Supabase Auth) ✅
│   └── studentAuthService.ts  # Student login (custom) ✅
└── types/
    └── index.ts               # Auth types ✅
```

**Tasks:**
- ✅ Create AuthContext dengan dual authentication
- ✅ Teacher authentication (Supabase Auth)
  - Register dengan email verification
  - Login dengan email/password
  - Auto-create profile di `teachers` table
- ✅ Student authentication (Custom)
  - Login dengan email + birth_date (DDMMYYYY)
  - Verify terhadap `students` table
  - Password: bcrypt hash dari birth_date
- ✅ Protected routes (teacher vs student)
- ✅ Session management & auto-refresh

### 2.2 Routing & Layouts ✅
**File Structure:**
```
src/
├── layouts/
│   ├── TeacherLayout.tsx      # Layout dengan sidebar guru ✅
│   └── StudentLayout.tsx      # Layout dengan sidebar siswa ✅
├── pages/
│   ├── auth/
│   │   ├── TeacherLogin.tsx   ✅
│   │   ├── TeacherRegister.tsx ✅
│   │   └── StudentLogin.tsx   ✅
│   ├── teacher/
│   │   ├── TeacherDashboard.tsx ✅
│   │   ├── ClassList.tsx      ✅
│   │   └── ClassDetail.tsx    ✅
│   └── student/
│       └── StudentDashboard.tsx ✅
└── App.tsx                    # Route configuration ✅
```

**Routes:**
```
/                          → Unified Login (Teacher & Student)

/teacher/*                → Teacher Routes (Protected)
├── /dashboard            → Teacher Dashboard
├── /classes              → Class List
├── /classes/:id          → Class Detail
├── /classes/:id/manage → Class Student Management
├── /classes/:id/attendance → Class Attendance Management
├── /students             → All Students
├── /assignments          → Assignment List
├── /assignments/:id      → Assignment Detail
├── /grading              → Grading Interface
└── /profile              → Teacher Profile

/student/*                → Student Routes (Protected)
├── /dashboard            → Student Dashboard
├── /classes              → My Classes
├── /assignments          → My Assignments
├── /assignments/:id      → Assignment Detail & Submit
├── /grades               → My Grades
└── /profile              → Student Profile
```

### 2.3 Services Layer ✅
**File Structure:**
```
src/services/
├── classService.ts           # Class CRUD operations ✅
├── studentService.ts         # Student management ✅
├── materialService.ts        # Material upload/download ✅
├── assignmentService.ts      # Assignment CRUD ✅
├── submissionService.ts      # Submission handling ✅
├── gradeService.ts           # Grading operations ✅
├── attendanceService.ts      # Attendance tracking ✅
├── notificationService.ts    # Notification system ✅
└── activityLogService.ts     # Activity logging ✅
```

**Key Functions:**
- ✅ CRUD operations untuk semua entities
- ✅ File upload/download helpers
- ✅ Data aggregation untuk dashboard
- ✅ Notification triggers

### 2.4 Shared Components ✅
**File Structure:**
```
src/components/
├── common/
│   ├── LoadingSpinner.tsx    ✅
│   ├── EmptyState.tsx        ✅
│   ├── ConfirmDialog.tsx     ✅
│   └── FileUpload.tsx        ✅
├── cards/
│   ├── ClassCard.tsx         ✅
│   ├── AssignmentCard.tsx    ✅
│   └── StudentCard.tsx       ✅
└── tables/
    ├── StudentsTable.tsx     ✅
    ├── AssignmentsTable.tsx  ✅
    └── GradesTable.tsx       ✅
```

---

## 🏫 FASE 3: TEACHER FEATURES

### 3.1 Teacher Dashboard ✅
**Components:**
- ✅ Stats cards (total classes, students, pending reviews)
- ✅ Recent activities timeline (all teachers)
- ✅ Quick access grids (classes, assignments)
- ✅ Charts (submissions, grades, attendance)

### 3.2 Class Management ✅
**Pages:**
- ✅ Class list (grid view dengan filters)
- ✅ Create/Edit class form
- ✅ Class detail dengan tabs:
  - ✅ **Overview**: Stats & quick info
  - ✅ **Students**: Manage enrollment
  - ✅ **Materials**: Upload/manage files
  - ✅ **Assignments**: List wajib + tambahan
  - ✅ **Attendance**: Input & history
  - ✅ **Grades**: Gradebook view

**Features:**
- ✅ Generate class code otomatis
- [ ] Bulk import students (Excel)
- [ ] Copy class (duplicate untuk semester baru)
- [ ] Archive/deactivate class

### 3.3 Student Management
**Pages:**
- All students list dengan filters
- Create/Edit student form
- Student detail (profile, classes, performance)
- Bulk operations (import, export, deactivate)

**Features:**
- Excel import dengan template
- Auto-generate password (birth_date hash)
- Track student across multiple classes
- Performance analytics per student

### 3.4 Material Management
**Features:**
- Upload files (PDF, DOC, PPT, images, videos)
- Organize by class
- Preview support
- Download statistics
- Version control (optional)

---

## 📝 FASE 4: ASSIGNMENT SYSTEM

### 4.1 Assignment Builder
**Components:**
- Multi-step wizard:
  1. **Type Selection**: Wajib vs Tambahan
  2. **Target Selection**: Class (wajib) atau Grade (tambahan)
  3. **Details**: Title, description, deadline, points
  4. **Questions**: Add essay/file upload questions
  5. **Review & Publish**

**Features:**
- Rich text editor untuk description
- Question reordering (drag & drop)
- Point allocation per question
- Template system (save & reuse)
- Schedule publish (optional)

### 4.2 Assignment Distribution Logic
**Auto-distribution ketika create:**

```typescript
// Tugas Wajib
if (type === 'wajib') {
  students = getStudentsInClass(class_id);
  createSubmissions(assignment_id, students);
  notifyStudents(students, assignment);
}

// Tugas Tambahan
if (type === 'tambahan') {
  classes = getClassesByGrade(target_grade);
  students = getAllStudentsInClasses(classes);
  createSubmissions(assignment_id, students);
  notifyStudents(students, assignment);
}
```

### 4.3 Assignment Management
**Pages:**
- Assignment list dengan filters (type, status, class/grade)
- Assignment detail & edit
- Duplicate assignment
- Delete assignment (cascade delete submissions)

**Features:**
- Filter by: Type, Status, Date range, Class/Grade
- Sort by: Deadline, Created date, Submission count
- Bulk actions: Delete, Extend deadline
- Export to Excel

---

## 👨‍🎓 FASE 5: STUDENT FEATURES

### 5.1 Student Dashboard
**Components:**
- My classes overview
- Pending assignments (grouped by type)
- Recent grades
- Performance charts (per subject)
- Notifications feed

### 5.2 Assignment View & Submission
**Pages:**
- Assignment list dengan tabs:
  - Pending (belum submit)
  - Submitted (menunggu nilai)
  - Graded (sudah dinilai)
- Assignment detail dengan questions
- Submission form (per question)

**Features:**
- Badge indicators: [Wajib - Class] vs [Tambahan - Grade]
- Countdown timer to deadline
- Auto-save draft (localStorage)
- File upload validation
- Confirmation before submit

### 5.3 Grade View
**Pages:**
- Grades overview (list semua assignments)
- Grade detail (per assignment dengan feedback)
- Performance analytics:
  - Chart per subject
  - Average grades
  - Comparison dengan class average (optional)

---

## 📊 FASE 6: GRADING & ATTENDANCE

### 6.1 Grading Interface
**Components:**
- Assignment selection dengan submission count
- Submission list dengan filters (status, student)
- Grading panel:
  - Split view (student work | grading form)
  - Question-by-question grading
  - Points input dengan validation
  - Feedback per question
  - Overall feedback
  - Total grade (auto-calculated)

**Features:**
- Batch grading (same question across students)
- Save draft grades
- Publish grades (notify students)
- Rubric support (optional)
- Export grades to Excel

### 6.2 Attendance System
**Components:**
- Attendance sheet per class per date
- Student list dengan status selector
- Bulk actions (mark all present)
- Attendance history dengan calendar view

**Features:**
- Quick input (keyboard shortcuts)
- Attendance statistics (per student, per class)
- Export attendance report
- Attendance reminders

### 6.3 Gradebook
**Components:**
- Spreadsheet-style table
- Rows: Students
- Columns: Assignments
- Cells: Grades
- Final grade calculation

**Features:**
- Filter assignments (wajib/tambahan)
- Sort by name, grade, etc.
- Export to Excel
- Grade statistics (average, median, etc.)

---

## 📈 FASE 7: ANALYTICS & POLISH

### 7.1 Dashboard Analytics
**Teacher Dashboard:**
- System-wide statistics
- Activity heatmap
- Top performing classes
- Assignment completion rates
- Grade distribution charts

**Student Dashboard:**
- Personal performance over time
- Subject comparison
- Attendance rate
- Assignment completion rate

### 7.2 Notification System
**Features:**
- Real-time notifications (bell icon)
- Notification types:
  - New assignment (students)
  - Submission received (teachers)
  - Grade published (students)
  - Deadline reminder (students)
  - Material uploaded (students)
- Mark as read
- Notification history
- Push notifications (optional)

### 7.3 Export Features
**Excel Export:**
- Class roster dengan details
- Assignment submissions list
- Grades report (gradebook format)
- Attendance report
- Activity logs

**PDF Export:**
- Grade transcripts
- Attendance certificates
- Assignment reports

### 7.4 UI Polish
**Improvements:**
- Skeleton loaders
- Empty states dengan illustrations
- Error handling dengan user-friendly messages
- Form validations dengan clear feedback
- Responsive design (mobile-friendly)
- Dark mode (optional)
- Animations & transitions
- Accessibility (ARIA labels, keyboard navigation)

---

## 🔑 KEY IMPLEMENTATION NOTES

### Multi-Teacher Collaboration
```typescript
// Semua guru akses data yang sama
// Tidak ada "my classes" vs "other teacher's classes"
// System hanya track siapa yang melakukan action

// Example: Create class
const createClass = async (classData) => {
  const { data: newClass } = await supabase
    .from('classes')
    .insert({
      ...classData,
      created_by: currentTeacherId // Track only
    });

  // Log activity
  await logActivity({
    teacher_id: currentTeacherId,
    action: 'create',
    entity_type: 'class',
    entity_id: newClass.id,
    description: `Created class ${classData.name}`
  });

  return newClass;
};

// All teachers can edit this class
const updateClass = async (classId, updates) => {
  const { data } = await supabase
    .from('classes')
    .update({
      ...updates,
      updated_by: currentTeacherId // Track who updated
    })
    .eq('id', classId);

  await logActivity({...});

  return data;
};
```

### Dual Assignment System
```typescript
// Assignment distribution logic

const distributeAssignment = async (assignment) => {
  let targetStudents = [];

  if (assignment.assignment_type === 'wajib') {
    // Get students dari specific class
    targetStudents = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', assignment.class_id);
  }
  else if (assignment.assignment_type === 'tambahan') {
    // Get all students dari semua kelas with target_grade
    const classes = await supabase
      .from('classes')
      .select('id')
      .eq('grade', assignment.target_grade);

    const classIds = classes.map(c => c.id);

    targetStudents = await supabase
      .from('class_students')
      .select('student_id')
      .in('class_id', classIds);
  }

  // Create submissions untuk semua target students
  const submissions = targetStudents.map(s => ({
    assignment_id: assignment.id,
    student_id: s.student_id,
    status: 'pending'
  }));

  await supabase.from('submissions').insert(submissions);

  // Send notifications
  await notifyStudents(targetStudents, assignment);
};
```

### Activity Logging
```typescript
// Helper function untuk log semua teacher actions

const logActivity = async ({
  action,      // 'create', 'update', 'delete', 'grade', etc.
  entity_type, // 'class', 'student', 'assignment', etc.
  entity_id,
  description
}) => {
  const teacherId = getCurrentTeacherId();

  await supabase.from('activity_logs').insert({
    teacher_id: teacherId,
    action,
    entity_type,
    entity_id,
    description
  });
};

// Display activity feed
const getRecentActivities = async () => {
  const { data } = await supabase
    .from('activity_logs')
    .select(`
      *,
      teachers (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  return data;
};
```

---

## 🎯 CURRENT STATUS

✅ **FASE 1 COMPLETED** - Database foundation solid and ready
✅ **FASE 2 COMPLETED** - Core infrastructure with authentication, routing, services, and components
✅ **FASE 3 PARTIALLY COMPLETED** - Teacher Dashboard and Class Management

**COMPLETED FEATURES:**
- ✅ Complete authentication system (dual: teacher + student)
- ✅ Protected routing with role-based access
- ✅ Comprehensive service layer for all operations
- ✅ Reusable UI components (cards, tables, forms)
- ✅ Enhanced dashboards with real-time analytics
- ✅ Class management system with full CRUD operations
- ✅ File upload system for materials
- ✅ Activity logging and notifications

**NEXT STEPS:**
1. ✅ ~~Setup AuthContext & authentication flows~~
2. ✅ ~~Create routing structure & layouts~~
3. ✅ ~~Build service layer for API calls~~
4. ✅ ~~Create shared UI components~~
5. ✅ ~~Start with Teacher Dashboard~~
6. 🔄 **CURRENT**: Student Management System
7. Assignment Creation & Management System
8. Grading & Attendance System
9. Student Features & Assignment Submission
10. Analytics & Polish

**ESTIMATED TIMELINE:**
- ✅ Fase 2: 2-3 days (COMPLETED)
- 🔄 Fase 3: 3-4 days (70% COMPLETED)
- Fase 4: 2-3 days
- Fase 5: 2-3 days
- Fase 6: 3-4 days
- Fase 7: 2-3 days

**Total: ~15-20 days** for full LMS implementation

---

## 📚 RESOURCES

- [Mantine UI Docs](https://mantine.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [Recharts Examples](https://recharts.org/)

---

## 💡 TIPS FOR DEVELOPMENT

1. **Start Small**: Build one complete flow end-to-end before expanding
2. **Test Early**: Test authentication & permissions thoroughly
3. **Use TypeScript**: Leverage types for database schema
4. **Component Library**: Build reusable components first
5. **Mock Data**: Use mock data during UI development
6. **Error Handling**: Plan error states from the start
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Performance**: Use pagination, lazy loading, debouncing
9. **Security**: Never trust client-side validation alone
10. **Documentation**: Document complex logic as you go

---

**Ready to continue? Let me know which fase to work on next!**
