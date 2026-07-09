import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  User,
  UserRole,
  Organization,
  OrgMember,
  Team,
  TeamMember,
  Project,
  ProjectStatus,
  ProjectPriority,
  Task,
  TaskStatus,
  TaskPriority,
  Subtask,
  Comment,
  Attachment,
  Notification,
  ActivityLog,
  CalendarEvent,
  CalendarEventType,
  ChatMessage,
  MeetingSummary,
  DashboardWidget,
  SavedSearchFilter
} from "../types.js";

const DB_FILE = path.join(process.cwd(), "db.json");

interface DBStore {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  organizations: Organization[];
  orgMembers: OrgMember[];
  teams: Team[];
  teamMembers: TeamMember[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  calendarEvents: CalendarEvent[];
  chatMessages: ChatMessage[];
  meetingSummaries: MeetingSummary[];
  savedSearchFilters: SavedSearchFilter[];
  dashboardLayouts: Record<string, DashboardWidget[]>;
}

// Global in-memory instance
let store: DBStore | null = null;

// Hashing helper
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getInitialStore(): DBStore {
  // Let's seed initial realistic data
  const users: User[] = [
    {
      id: "u-owner",
      email: "owner@flowforge.com",
      fullName: "Khushi Sharma",
      avatar: "KS",
      title: "Chief Product Officer",
      timezone: "America/New_York",
      language: "en",
      notificationPrefs: { email: true, push: true, mentionsOnly: false }
    },
    {
      id: "u-manager",
      email: "manager@flowforge.com",
      fullName: "Alex Rivera",
      avatar: "AR",
      title: "Senior Project Manager",
      timezone: "Europe/London",
      language: "en",
      notificationPrefs: { email: true, push: true, mentionsOnly: false }
    },
    {
      id: "u-member",
      email: "member@flowforge.com",
      fullName: "Sarah Chen",
      avatar: "SC",
      title: "Lead Frontend Engineer",
      timezone: "Asia/Singapore",
      language: "en",
      notificationPrefs: { email: true, push: false, mentionsOnly: true }
    },
    {
      id: "u-client",
      email: "client@flowforge.com",
      fullName: "Marcus Aurelius",
      avatar: "MA",
      title: "VP of Engineering (Acme Corp)",
      timezone: "America/Los_Angeles",
      language: "en",
      notificationPrefs: { email: false, push: false, mentionsOnly: true }
    }
  ];

  const passwords: Record<string, string> = {
    "u-owner": hashPassword("password123"),
    "u-manager": hashPassword("password123"),
    "u-member": hashPassword("password123"),
    "u-client": hashPassword("password123")
  };

  const organizations: Organization[] = [
    {
      id: "org-1",
      name: "Acme Cloud Corp",
      ownerId: "u-owner",
      settings: {
        allowedDomains: ["acme.com", "flowforge.com"],
        twoFactorRequired: false,
        defaultRole: UserRole.MEMBER
      }
    }
  ];

  const orgMembers: OrgMember[] = [
    { id: "om-1", orgId: "org-1", userId: "u-owner", role: UserRole.OWNER },
    { id: "om-2", orgId: "org-1", userId: "u-manager", role: UserRole.MANAGER },
    { id: "om-3", orgId: "org-1", userId: "u-member", role: UserRole.MEMBER },
    { id: "om-4", orgId: "org-1", userId: "u-client", role: UserRole.CLIENT }
  ];

  const teams: Team[] = [
    { id: "t-frontend", name: "Core Frontend Devs", orgId: "org-1", description: "Design, build and polish components." },
    { id: "t-growth", name: "Growth & Mobile Team", orgId: "org-1", description: "Focus on user acquisition and iOS/Android app features." }
  ];

  const teamMembers: TeamMember[] = [
    { id: "tm-1", teamId: "t-frontend", userId: "u-owner" },
    { id: "tm-2", teamId: "t-frontend", userId: "u-manager" },
    { id: "tm-3", teamId: "t-frontend", userId: "u-member" },
    { id: "tm-4", teamId: "t-growth", userId: "u-manager" },
    { id: "tm-5", teamId: "t-growth", userId: "u-member" }
  ];

  const projects: Project[] = [
    {
      id: "p-forge",
      name: "FlowForge v1.0 Launch",
      orgId: "org-1",
      description: "Launch the initial production version of FlowForge, our enterprise project management platform, including real-time chats, task dependencies, and a robust AI Scrum Master.",
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.HIGH,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      budget: 150000,
      spent: 85200,
      teamIds: ["t-frontend", "t-growth"]
    },
    {
      id: "p-mobile",
      name: "iOS & Android Companion App",
      orgId: "org-1",
      description: "Build a highly responsive native wrapper/mobile experience optimized for on-the-go sprint planning and rapid task updates.",
      status: ProjectStatus.PLANNING,
      priority: ProjectPriority.MEDIUM,
      startDate: "2026-09-01",
      endDate: "2026-12-15",
      budget: 80000,
      spent: 5000,
      teamIds: ["t-growth"]
    }
  ];

  const tasks: Task[] = [
    {
      id: "tsk-1",
      projectId: "p-forge",
      title: "Design core Figma architecture & layout systems",
      description: "Draft structural layouts, card spacing ratios, type sheets, and consistent gray palettes inspired by Linear and Stripe.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: "2026-06-15",
      assigneeId: "u-owner",
      creatorId: "u-manager",
      labels: ["Design", "v1.0"],
      tags: ["figma", "theme"],
      position: 1000,
      dependencies: [],
      points: 5
    },
    {
      id: "tsk-2",
      projectId: "p-forge",
      title: "Set up full-stack Node.js Express server on Port 3000",
      description: "Initialize the Express web app, set up Vite middlewares, package bundler processes, and API gateway routing.",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: "2026-06-25",
      assigneeId: "u-member",
      creatorId: "u-manager",
      labels: ["Backend", "Core"],
      tags: ["express", "node"],
      position: 2000,
      dependencies: ["tsk-1"],
      points: 8
    },
    {
      id: "tsk-3",
      projectId: "p-forge",
      title: "Implement interactive Gantt Timeline & Calendar drag-and-drop",
      description: "Users should be able to reschedule sprint milestones or move blocks on a calendar view, triggering updates to db.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: "2026-07-20",
      assigneeId: "u-member",
      creatorId: "u-manager",
      labels: ["Frontend", "Interactive"],
      tags: ["gantt", "react"],
      position: 3000,
      dependencies: ["tsk-2"],
      points: 13
    },
    {
      id: "tsk-4",
      projectId: "p-forge",
      title: "Integrate Gemini AI model for task auto-prioritization and breakdown",
      description: "Call gemini-3.5-flash server-side to analyze sprint backlog. Break high-level requests into smaller, actionable tickets.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: "2026-07-30",
      assigneeId: "u-manager",
      creatorId: "u-owner",
      labels: ["AI", "Gemini"],
      tags: ["ai", "gemini-flash"],
      position: 4000,
      dependencies: ["tsk-3"],
      points: 8
    },
    {
      id: "tsk-5",
      projectId: "p-forge",
      title: "Build client-side global notifications, chat hubs & socket sync",
      description: "Hook up interactive chat channels so developers can speak, tag users with @name, and view standard alert panels.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: "2026-07-15",
      assigneeId: "u-owner",
      creatorId: "u-member",
      labels: ["Frontend", "Real-time"],
      tags: ["chat", "notifications"],
      position: 5000,
      dependencies: ["tsk-2"],
      points: 5
    },
    {
      id: "tsk-6",
      projectId: "p-forge",
      title: "Audit deployment packages and optimize production builds",
      description: "Ensure code splitting works smoothly, load charts asynchronously, and strip down unneeded bundle footprints.",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      dueDate: "2026-08-15",
      assigneeId: undefined,
      creatorId: "u-manager",
      labels: ["DevOps"],
      tags: ["build", "perf"],
      position: 6000,
      dependencies: ["tsk-5"]
    },
    {
      id: "tsk-7",
      projectId: "p-mobile",
      title: "Wireframe React Native / mobile screens",
      description: "Outline tab views, task summary sheets, and lightweight widgets for notifications.",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.MEDIUM,
      dueDate: "2026-09-10",
      assigneeId: "u-member",
      creatorId: "u-manager",
      labels: ["Design", "Mobile"],
      tags: ["mobile", "figma"],
      position: 1000,
      dependencies: []
    }
  ];

  const subtasks: Subtask[] = [
    { id: "sub-1", taskId: "tsk-3", title: "Install ResizeObserver handles", completed: true },
    { id: "sub-2", taskId: "tsk-3", title: "Calculate fluid scale coordinate shifts", completed: false },
    { id: "sub-3", taskId: "tsk-3", title: "Handle timeline bar collisions and snap-to-day grids", completed: false },
    { id: "sub-4", taskId: "tsk-5", title: "Create chat notification badge updates", completed: true },
    { id: "sub-5", taskId: "tsk-5", title: "Build custom mentions regex parsing", completed: false }
  ];

  const comments: Comment[] = [
    {
      id: "c-1",
      taskId: "tsk-3",
      userId: "u-manager",
      content: "Let's make sure the interactive Gantt chart renders beautifully on smaller resolutions (1200px and below). Sarah, let's use tailwind's flexible grid handles.",
      createdAt: "2026-07-01T10:00:00Z"
    },
    {
      id: "c-2",
      taskId: "tsk-3",
      userId: "u-member",
      content: "Agreed! I'm planning to use a pure Tailwind CSS timeline track with a clean container resize listener so it is fully responsive.",
      createdAt: "2026-07-02T14:30:00Z"
    }
  ];

  const attachments: Attachment[] = [
    {
      id: "att-1",
      taskId: "tsk-3",
      name: "timeline_blueprint.png",
      url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
      mimeType: "image/png",
      size: 142000,
      uploadedBy: "u-manager",
      createdAt: "2026-07-01T10:02:00Z"
    }
  ];

  const notifications: Notification[] = [
    {
      id: "n-1",
      userId: "u-member",
      title: "New Task Assigned",
      message: "Alex Rivera assigned you to: 'Implement interactive Gantt Timeline & Calendar drag-and-drop'.",
      read: false,
      type: "assigned",
      createdAt: "2026-07-01T10:00:00Z",
      link: "/tasks/tsk-3"
    },
    {
      id: "n-2",
      userId: "u-owner",
      title: "Mentioned in Chat",
      message: "Sarah Chen tagged you in Core Frontend Devs chat: '@Khushi Sharma we need to verify the design grid.'",
      read: false,
      type: "mention",
      createdAt: "2026-07-03T15:20:00Z",
      link: "/chat/t-frontend"
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: "act-1",
      projectId: "p-forge",
      taskId: "tsk-1",
      userId: "u-owner",
      action: "Completed Task",
      details: "Completed: Design core Figma architecture & layout systems",
      createdAt: "2026-06-15T18:00:00Z"
    },
    {
      id: "act-2",
      projectId: "p-forge",
      taskId: "tsk-3",
      userId: "u-manager",
      action: "Assigned Task",
      details: "Assigned Gantt Timeline development task to Sarah Chen",
      createdAt: "2026-07-01T10:00:00Z"
    },
    {
      id: "act-3",
      projectId: "p-forge",
      taskId: "tsk-3",
      userId: "u-member",
      action: "Added Comment",
      details: "Discussed fluid grids in Gantt timeline design",
      createdAt: "2026-07-02T14:30:00Z"
    }
  ];

  const calendarEvents: CalendarEvent[] = [
    {
      id: "cal-1",
      projectId: "p-forge",
      title: "Sprint Sync & AI Backlog Review",
      description: "Sync about the active launch blockers. Let's run the Gemini Task Breakdown AI script.",
      startDate: "2026-07-08T10:00:00Z",
      endDate: "2026-07-08T11:00:00Z",
      type: CalendarEventType.MEETING,
      attendees: ["u-owner", "u-manager", "u-member"]
    },
    {
      id: "cal-2",
      projectId: "p-forge",
      title: "Weekly Design Critique",
      description: "Review typography scales, Inter pairings, and layout systems in Figma with client Marcus.",
      startDate: "2026-07-10T14:00:00Z",
      endDate: "2026-07-10T15:00:00Z",
      type: CalendarEventType.MEETING,
      attendees: ["u-owner", "u-client"]
    },
    {
      id: "cal-3",
      projectId: "p-forge",
      title: "Gantt Timeline Feature Completed Milestone",
      description: "Interactive timeline is due for testing integration.",
      startDate: "2026-07-20T23:59:59Z",
      endDate: "2026-07-20T23:59:59Z",
      type: CalendarEventType.TASK_DUE,
      attendees: ["u-member"]
    }
  ];

  const chatMessages: ChatMessage[] = [
    {
      id: "ch-1",
      channelId: "team_t-frontend",
      userId: "u-manager",
      content: "Welcome everyone to our core frontend workspace! Let's build a beautiful premium SaaS UI.",
      createdAt: "2026-07-01T09:00:00Z"
    },
    {
      id: "ch-2",
      channelId: "team_t-frontend",
      userId: "u-member",
      content: "@Khushi Sharma I added the typography configurations in Tailwind CSS, using Inter as default.",
      createdAt: "2026-07-02T11:45:00Z"
    },
    {
      id: "ch-3",
      channelId: "team_t-frontend",
      userId: "u-owner",
      content: "Awesome, Sarah! Let's keep a high-contrast theme focusing on soft grays, sleek borders, and subtle glassmorphism.",
      createdAt: "2026-07-02T13:00:00Z"
    }
  ];

  const meetingSummaries: MeetingSummary[] = [
    {
      id: "ms-1",
      title: "FlowForge Sprint Kickoff",
      date: "2026-07-04",
      duration: "45 minutes",
      summary: "The project team met to establish the high-level backlog, milestones, and tech stack for FlowForge. We confirmed all core features (task management, AI Scrum CoPilot, customizable dashboards, and advanced search filters) are fully specced and ready for active development. We decided to prioritize Inter for display, sleek dark colors, and high contrast typography.",
      decisions: [
        "Adopt Tailwind CSS utility styling with standard theme pairings for high visual contrast.",
        "Use local db.json persistence for all user metrics, customizable dashboards, and meeting summaries.",
        "Store Gemini models prompt responses directly in the DB to allow history retrieval."
      ],
      actionItems: [
        { task: "Implement AI meeting summarizer with file upload", assigneeName: "Sarah Chen", assigneeId: "u-member", priority: "High", dueDate: "2026-07-10" },
        { task: "Add customizable drag-and-drop dashboard widget system", assigneeName: "Alex Rivera", assigneeId: "u-pm", priority: "High", dueDate: "2026-07-12" },
        { task: "Build global search with project, priority, and date range filters", assigneeName: "Sarah Chen", assigneeId: "u-member", priority: "Medium", dueDate: "2026-07-15" }
      ],
      createdAt: "2026-07-04T10:00:00Z"
    }
  ];

  const savedSearchFilters: SavedSearchFilter[] = [
    {
      id: "sf-1",
      name: "My Unfinished High-Priority Tickets",
      projectId: "p-forge",
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      assigneeId: "u-member",
      priority: [TaskPriority.HIGH],
      createdAt: "2026-07-04T12:00:00Z",
      filters: {
        projectId: "p-forge",
        status: TaskStatus.TODO,
        assigneeId: "u-member",
        priority: TaskPriority.HIGH,
        tag: ""
      }
    },
    {
      id: "sf-2",
      name: "All Completed Work",
      status: [TaskStatus.COMPLETED],
      createdAt: "2026-07-03T09:00:00Z",
      filters: {
        projectId: "",
        status: TaskStatus.COMPLETED,
        assigneeId: "",
        priority: "",
        tag: ""
      }
    }
  ];

  const dashboardLayouts: Record<string, DashboardWidget[]> = {
    "Organization Owner": [
      { id: "widget-owner-burnout", title: "Strategic Sprint Burnout Overview", type: "sprint_burnout", visible: true, order: 0 },
      { id: "widget-owner-1", title: "Consolidated Revenue Balance", type: "portfolio_revenue", visible: true, order: 1 },
      { id: "widget-owner-2", title: "Portfolio Milestone Progress", type: "project_progress", visible: true, order: 2 },
      { id: "widget-owner-3", title: "Strategic AI Market CoPilot", type: "ai_insights", visible: true, order: 3 },
      { id: "widget-owner-4", title: "Overlapping Timeline Conflicts", type: "blockers_risks", visible: true, order: 4 }
    ],
    "Project Manager": [
      { id: "widget-pm-burnout", title: "Scrum Team Sprint Burnout Trend", type: "sprint_burnout", visible: true, order: 0 },
      { id: "widget-pm-1", title: "Sprint Burn-down Progress", type: "project_progress", visible: true, order: 1 },
      { id: "widget-pm-2", title: "Iterative Velocity Benchmark", type: "sprint_velocity", visible: true, order: 2 },
      { id: "widget-pm-2-blockers", title: "Active Delivery Warnings", type: "blockers_risks", visible: true, order: 3 },
      { id: "widget-pm-3", title: "Scrum CoPilot Health Check", type: "ai_insights", visible: true, order: 4 }
    ],
    "Team Member": [
      { id: "widget-member-burnout", title: "My Sprint Burnout Contribution", type: "sprint_burnout", visible: true, order: 0 },
      { id: "widget-member-1", title: "My Dynamic Sprint Checklist", type: "workload_checklist", visible: true, order: 1 },
      { id: "widget-member-2", title: "My Active Project Velocity", type: "project_progress", visible: true, order: 2 },
      { id: "widget-member-3", title: "My Efficiency Calculations", type: "productivity_load", visible: true, order: 3 },
      { id: "widget-member-4", title: "AI Backlog Recommender", type: "ai_insights", visible: true, order: 4 }
    ],
    "Client (Read-only)": [
      { id: "widget-client-burnout", title: "Project Sprint Burndown Trajectory", type: "sprint_burnout", visible: true, order: 0 },
      { id: "widget-client-1", title: "Milestone Trajectory Progress", type: "project_progress", visible: true, order: 1 },
      { id: "widget-client-2", title: "Historical Team Velocity", type: "productivity_load", visible: true, order: 2 },
      { id: "widget-client-3", title: "Premium AI Project Forecasts", type: "ai_insights", visible: true, order: 3 }
    ]
  };

  return {
    users,
    passwords,
    organizations,
    orgMembers,
    teams,
    teamMembers,
    projects,
    tasks,
    subtasks,
    comments,
    attachments,
    notifications,
    activityLogs,
    calendarEvents,
    chatMessages,
    meetingSummaries,
    savedSearchFilters,
    dashboardLayouts
  };
}

export function loadDB(): DBStore {
  if (store) return store;

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      store = JSON.parse(data);
      // Fallback check for missing arrays (in case file got corrupted or initialized empty)
      if (!store || !store.users) {
        store = getInitialStore();
        saveDB();
      }
    } else {
      store = getInitialStore();
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load local DB, fallback to initial seed.", err);
    store = getInitialStore();
    saveDB();
  }

  return store!;
}

export function saveDB(): void {
  if (!store) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database to file:", err);
  }
}

// Relational query helper functions
export const db = {
  // Read all entities
  getUsers: () => loadDB().users,
  getPasswords: () => loadDB().passwords,
  getOrganizations: () => loadDB().organizations,
  getOrgMembers: () => loadDB().orgMembers,
  getTeams: () => loadDB().teams,
  getTeamMembers: () => loadDB().teamMembers,
  getProjects: () => loadDB().projects,
  getTasks: () => loadDB().tasks,
  getSubtasks: () => loadDB().subtasks,
  getComments: () => loadDB().comments,
  getAttachments: () => loadDB().attachments,
  getNotifications: () => loadDB().notifications,
  getActivityLogs: () => loadDB().activityLogs,
  getCalendarEvents: () => loadDB().calendarEvents,
  getChatMessages: () => loadDB().chatMessages,

  // Write handlers (mutations auto-persist)
  addUser: (user: User, passwordHash: string) => {
    const s = loadDB();
    s.users.push(user);
    s.passwords[user.id] = passwordHash;
    saveDB();
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const s = loadDB();
    const idx = s.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      s.users[idx] = { ...s.users[idx], ...updates };
      saveDB();
      return s.users[idx];
    }
    return null;
  },
  addOrganization: (org: Organization) => {
    const s = loadDB();
    s.organizations.push(org);
    saveDB();
  },
  addOrgMember: (mem: OrgMember) => {
    const s = loadDB();
    s.orgMembers.push(mem);
    saveDB();
  },
  addTeam: (team: Team) => {
    const s = loadDB();
    s.teams.push(team);
    saveDB();
  },
  addTeamMember: (mem: TeamMember) => {
    const s = loadDB();
    s.teamMembers.push(mem);
    saveDB();
  },
  addProject: (proj: Project) => {
    const s = loadDB();
    s.projects.push(proj);
    saveDB();
  },
  updateProject: (id: string, updates: Partial<Project>) => {
    const s = loadDB();
    const idx = s.projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      s.projects[idx] = { ...s.projects[idx], ...updates };
      saveDB();
      return s.projects[idx];
    }
    return null;
  },
  deleteProject: (id: string) => {
    const s = loadDB();
    s.projects = s.projects.filter((p) => p.id !== id);
    s.tasks = s.tasks.filter((t) => t.projectId !== id);
    saveDB();
  },
  addTask: (task: Task) => {
    const s = loadDB();
    s.tasks.push(task);
    saveDB();
  },
  updateTask: (id: string, updates: Partial<Task>) => {
    const s = loadDB();
    const idx = s.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      s.tasks[idx] = { ...s.tasks[idx], ...updates };
      saveDB();
      return s.tasks[idx];
    }
    return null;
  },
  deleteTask: (id: string) => {
    const s = loadDB();
    s.tasks = s.tasks.filter((t) => t.id !== id);
    s.subtasks = s.subtasks.filter((st) => st.taskId !== id);
    s.comments = s.comments.filter((c) => c.taskId !== id);
    s.attachments = s.attachments.filter((a) => a.taskId !== id);
    saveDB();
  },
  addSubtask: (st: Subtask) => {
    const s = loadDB();
    s.subtasks.push(st);
    saveDB();
  },
  updateSubtask: (id: string, updates: Partial<Subtask>) => {
    const s = loadDB();
    const idx = s.subtasks.findIndex((st) => st.id === id);
    if (idx !== -1) {
      s.subtasks[idx] = { ...s.subtasks[idx], ...updates };
      saveDB();
      return s.subtasks[idx];
    }
    return null;
  },
  deleteSubtask: (id: string) => {
    const s = loadDB();
    s.subtasks = s.subtasks.filter((st) => st.id !== id);
    saveDB();
  },
  addComment: (comment: Comment) => {
    const s = loadDB();
    s.comments.push(comment);
    saveDB();
  },
  addAttachment: (attachment: Attachment) => {
    const s = loadDB();
    s.attachments.push(attachment);
    saveDB();
  },
  deleteAttachment: (id: string) => {
    const s = loadDB();
    s.attachments = s.attachments.filter((a) => a.id !== id);
    saveDB();
  },
  addNotification: (notif: Notification) => {
    const s = loadDB();
    s.notifications.push(notif);
    saveDB();
  },
  markNotificationRead: (id: string) => {
    const s = loadDB();
    const idx = s.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      s.notifications[idx].read = true;
      saveDB();
    }
  },
  addActivityLog: (log: ActivityLog) => {
    const s = loadDB();
    s.activityLogs.push(log);
    saveDB();
  },
  addCalendarEvent: (event: CalendarEvent) => {
    const s = loadDB();
    s.calendarEvents.push(event);
    saveDB();
  },
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => {
    const s = loadDB();
    const idx = s.calendarEvents.findIndex((e) => e.id === id);
    if (idx !== -1) {
      s.calendarEvents[idx] = { ...s.calendarEvents[idx], ...updates };
      saveDB();
      return s.calendarEvents[idx];
    }
    return null;
  },
  addChatMessage: (msg: ChatMessage) => {
    const s = loadDB();
    s.chatMessages.push(msg);
    saveDB();
  },
  getMeetingSummaries: () => {
    const s = loadDB();
    if (!s.meetingSummaries) s.meetingSummaries = [];
    return s.meetingSummaries;
  },
  addMeetingSummary: (summary: MeetingSummary) => {
    const s = loadDB();
    if (!s.meetingSummaries) s.meetingSummaries = [];
    s.meetingSummaries.push(summary);
    saveDB();
    return summary;
  },
  deleteMeetingSummary: (id: string) => {
    const s = loadDB();
    if (!s.meetingSummaries) s.meetingSummaries = [];
    s.meetingSummaries = s.meetingSummaries.filter((ms) => ms.id !== id);
    saveDB();
  },
  getSavedSearchFilters: () => {
    const s = loadDB();
    if (!s.savedSearchFilters) s.savedSearchFilters = [];
    return s.savedSearchFilters;
  },
  addSavedSearchFilter: (filter: SavedSearchFilter) => {
    const s = loadDB();
    if (!s.savedSearchFilters) s.savedSearchFilters = [];
    s.savedSearchFilters.push(filter);
    saveDB();
    return filter;
  },
  deleteSavedSearchFilter: (id: string) => {
    const s = loadDB();
    if (!s.savedSearchFilters) s.savedSearchFilters = [];
    s.savedSearchFilters = s.savedSearchFilters.filter((sf) => sf.id !== id);
    saveDB();
  },
  getDashboardLayouts: () => {
    const s = loadDB();
    if (!s.dashboardLayouts) s.dashboardLayouts = {};
    return s.dashboardLayouts;
  },
  updateDashboardLayout: (role: string, layout: DashboardWidget[]) => {
    const s = loadDB();
    if (!s.dashboardLayouts) s.dashboardLayouts = {};
    s.dashboardLayouts[role] = layout;
    saveDB();
    return layout;
  },
  updateOrgMemberRole: (userId: string, orgId: string, role: UserRole) => {
    const s = loadDB();
    const idx = s.orgMembers.findIndex((om) => om.userId === userId && om.orgId === orgId);
    if (idx !== -1) {
      s.orgMembers[idx].role = role;
    } else {
      s.orgMembers.push({
        id: `om-${Date.now()}`,
        orgId,
        userId,
        role
      });
    }
    saveDB();
  },
  markAllNotificationsRead: (userId: string) => {
    const s = loadDB();
    s.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    saveDB();
  }
};
