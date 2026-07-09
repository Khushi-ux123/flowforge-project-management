import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

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

// PostgreSQL pool setup (Optional & Graceful fallback)
let pool: pg.Pool | null = null;
const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (dbUrl) {
  try {
    pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false } // Neon database connection requires SSL
    });
    console.log("Constructed Neon PG Connection Pool.");
  } catch (poolErr) {
    console.error("Failed to construct Neon PG Connection Pool:", poolErr);
  }
}

// ============================================================================
// PostgreSQL Manual Entity Mappers (CamelCase JS <-> SnakeCase SQL)
// ============================================================================

function mapUserToRow(u: User) {
  return [
    u.id, u.email, u.fullName, u.avatar, u.title, u.bio || null,
    u.timezone, u.language, u.role || null, JSON.stringify(u.notificationPrefs)
  ];
}
function mapRowToUser(r: any): User {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    avatar: r.avatar,
    title: r.title,
    bio: r.bio || undefined,
    timezone: r.timezone,
    language: r.language,
    role: r.role || undefined,
    notificationPrefs: typeof r.notification_prefs === "string" ? JSON.parse(r.notification_prefs) : r.notification_prefs
  };
}

function mapOrgToRow(o: Organization) {
  return [o.id, o.name, o.ownerId, o.logo || null, JSON.stringify(o.settings)];
}
function mapRowToOrg(r: any): Organization {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    logo: r.logo || undefined,
    settings: typeof r.settings === "string" ? JSON.parse(r.settings) : r.settings
  };
}

function mapOrgMemberToRow(m: OrgMember) {
  return [m.id, m.orgId, m.userId, m.role];
}
function mapRowToOrgMember(r: any): OrgMember {
  return {
    id: r.id,
    orgId: r.org_id,
    userId: r.user_id,
    role: r.role
  };
}

function mapTeamToRow(t: Team) {
  return [t.id, t.name, t.orgId, t.description];
}
function mapRowToTeam(r: any): Team {
  return {
    id: r.id,
    name: r.name,
    orgId: r.org_id,
    description: r.description
  };
}

function mapTeamMemberToRow(m: TeamMember) {
  return [m.id, m.teamId, m.userId];
}
function mapRowToTeamMember(r: any): TeamMember {
  return {
    id: r.id,
    teamId: r.team_id,
    userId: r.user_id
  };
}

function mapProjectToRow(p: Project) {
  return [p.id, p.name, p.orgId, p.description, p.status, p.priority, p.startDate, p.endDate, p.budget, p.spent, JSON.stringify(p.teamIds)];
}
function mapRowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    orgId: r.org_id,
    description: r.description,
    status: r.status,
    priority: r.priority,
    startDate: r.start_date,
    endDate: r.end_date,
    budget: Number(r.budget),
    spent: Number(r.spent),
    teamIds: typeof r.team_ids === "string" ? JSON.parse(r.team_ids) : r.team_ids
  };
}

function mapTaskToRow(t: Task) {
  return [
    t.id, t.projectId, t.title, t.description, t.status, t.priority,
    t.dueDate, t.assigneeId || null, t.creatorId, JSON.stringify(t.labels),
    JSON.stringify(t.tags), t.position, JSON.stringify(t.dependencies), t.points || null
  ];
}
function mapRowToTask(r: any): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date,
    assigneeId: r.assignee_id || undefined,
    creatorId: r.creator_id,
    labels: typeof r.labels === "string" ? JSON.parse(r.labels) : r.labels,
    tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
    position: Number(r.position),
    dependencies: typeof r.dependencies === "string" ? JSON.parse(r.dependencies) : r.dependencies,
    points: r.points || undefined
  };
}

function mapSubtaskToRow(s: Subtask) {
  return [s.id, s.taskId, s.title, s.completed];
}
function mapRowToSubtask(r: any): Subtask {
  return {
    id: r.id,
    taskId: r.task_id,
    title: r.title,
    completed: r.completed
  };
}

function mapCommentToRow(c: Comment) {
  return [c.id, c.taskId, c.userId, c.content, c.createdAt];
}
function mapRowToComment(r: any): Comment {
  return {
    id: r.id,
    taskId: r.task_id,
    userId: r.user_id,
    content: r.content,
    createdAt: r.created_at
  };
}

function mapAttachmentToRow(a: Attachment) {
  return [a.id, a.taskId, a.name, a.url, a.mimeType, a.size, a.uploadedBy, a.createdAt];
}
function mapRowToAttachment(r: any): Attachment {
  return {
    id: r.id,
    taskId: r.task_id,
    name: r.name,
    url: r.url,
    mimeType: r.mime_type,
    size: r.size,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at
  };
}

function mapNotificationToRow(n: Notification) {
  return [n.id, n.userId, n.title, n.message, n.read, n.type, n.createdAt, n.link || null];
}
function mapRowToNotification(r: any): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    message: r.message,
    read: r.read,
    type: r.type as any,
    createdAt: r.created_at,
    link: r.link || undefined
  };
}

function mapActivityLogToRow(a: ActivityLog) {
  return [a.id, a.projectId || null, a.taskId || null, a.userId, a.action, a.details, a.createdAt];
}
function mapRowToActivityLog(r: any): ActivityLog {
  return {
    id: r.id,
    projectId: r.project_id || undefined,
    taskId: r.task_id || undefined,
    userId: r.user_id,
    action: r.action,
    details: r.details,
    createdAt: r.created_at
  };
}

function mapCalendarEventToRow(e: CalendarEvent) {
  return [e.id, e.projectId, e.title, e.description, e.startDate, e.endDate, e.type, JSON.stringify(e.attendees)];
}
function mapRowToCalendarEvent(r: any): CalendarEvent {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    startDate: r.start_date,
    endDate: r.end_date,
    type: r.type as any,
    attendees: typeof r.attendees === "string" ? JSON.parse(r.attendees) : r.attendees
  };
}

function mapChatMessageToRow(m: ChatMessage) {
  return [m.id, m.channelId, m.userId, m.content, m.createdAt];
}
function mapRowToChatMessage(r: any): ChatMessage {
  return {
    id: r.id,
    channelId: r.channel_id,
    userId: r.user_id,
    content: r.content,
    createdAt: r.created_at
  };
}

function mapMeetingSummaryToRow(s: MeetingSummary) {
  return [s.id, s.title, s.date, s.duration || null, s.summary, JSON.stringify(s.decisions), JSON.stringify(s.actionItems), s.createdAt];
}
function mapRowToMeetingSummary(r: any): MeetingSummary {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    duration: r.duration || undefined,
    summary: r.summary,
    decisions: typeof r.decisions === "string" ? JSON.parse(r.decisions) : r.decisions,
    actionItems: typeof r.action_items === "string" ? JSON.parse(r.action_items) : r.action_items,
    createdAt: r.created_at
  };
}

function mapSavedFilterToRow(f: SavedSearchFilter) {
  return [
    f.id, f.name, f.projectId || null, JSON.stringify(f.status || null),
    f.assigneeId || null, JSON.stringify(f.priority || null), f.dueDateStart || null,
    f.dueDateEnd || null, JSON.stringify(f.tags || null), f.createdAt, JSON.stringify(f.filters)
  ];
}
function mapRowToSavedFilter(r: any): SavedSearchFilter {
  return {
    id: r.id,
    name: r.name,
    projectId: r.project_id || undefined,
    status: r.status ? (typeof r.status === "string" ? JSON.parse(r.status) : r.status) : undefined,
    assigneeId: r.assignee_id || undefined,
    priority: r.priority ? (typeof r.priority === "string" ? JSON.parse(r.priority) : r.priority) : undefined,
    dueDateStart: r.due_date_start || undefined,
    dueDateEnd: r.due_date_end || undefined,
    tags: r.tags ? (typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags) : undefined,
    createdAt: r.created_at,
    filters: typeof r.filters === "string" ? JSON.parse(r.filters) : r.filters
  };
}

async function createPostgresSchema(): Promise<void> {
  if (!pool) return;
  console.log("Creating/updating structured table schemas in Neon PostgreSQL...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      avatar TEXT,
      title TEXT,
      bio TEXT,
      timezone TEXT,
      language TEXT,
      role TEXT,
      notification_prefs JSONB
    );

    CREATE TABLE IF NOT EXISTS user_passwords (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      logo TEXT,
      settings JSONB
    );

    CREATE TABLE IF NOT EXISTS org_members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_id TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_id TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      budget NUMERIC,
      spent NUMERIC,
      team_ids JSONB
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT,
      assignee_id TEXT,
      creator_id TEXT NOT NULL,
      labels JSONB,
      tags JSONB,
      position DOUBLE PRECISION,
      dependencies JSONB,
      points INTEGER
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      task_id TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      type TEXT NOT NULL,
      attendees JSONB
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meeting_summaries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT,
      summary TEXT NOT NULL,
      decisions JSONB,
      action_items JSONB,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_search_filters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT,
      status JSONB,
      assignee_id TEXT,
      priority JSONB,
      due_date_start TEXT,
      due_date_end TEXT,
      tags JSONB,
      created_at TEXT NOT NULL,
      filters JSONB
    );

    CREATE TABLE IF NOT EXISTS dashboard_layouts (
      user_id TEXT PRIMARY KEY,
      widgets JSONB NOT NULL
    );
  `);
}

async function saveStoreToPostgres(s: DBStore): Promise<void> {
  if (!pool) return;
  console.log("Saving full state to Neon Postgres individual tables...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Users
    for (const u of s.users) {
      await client.query(
        `INSERT INTO users (id, email, full_name, avatar, title, bio, timezone, language, role, notification_prefs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           full_name = EXCLUDED.full_name,
           avatar = EXCLUDED.avatar,
           title = EXCLUDED.title,
           bio = EXCLUDED.bio,
           timezone = EXCLUDED.timezone,
           language = EXCLUDED.language,
           role = EXCLUDED.role,
           notification_prefs = EXCLUDED.notification_prefs`,
        mapUserToRow(u)
      );
    }

    // 2. Passwords
    for (const [userId, hash] of Object.entries(s.passwords)) {
      await client.query(
        `INSERT INTO user_passwords (user_id, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [userId, hash]
      );
    }

    // 3. Organizations
    for (const o of s.organizations) {
      await client.query(
        `INSERT INTO organizations (id, name, owner_id, logo, settings)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           owner_id = EXCLUDED.owner_id,
           logo = EXCLUDED.logo,
           settings = EXCLUDED.settings`,
        mapOrgToRow(o)
      );
    }

    // 4. Org Members
    for (const m of s.orgMembers) {
      await client.query(
        `INSERT INTO org_members (id, org_id, user_id, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           org_id = EXCLUDED.org_id,
           user_id = EXCLUDED.user_id,
           role = EXCLUDED.role`,
        mapOrgMemberToRow(m)
      );
    }

    // 5. Teams
    for (const t of s.teams) {
      await client.query(
        `INSERT INTO teams (id, name, org_id, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           org_id = EXCLUDED.org_id,
           description = EXCLUDED.description`,
        mapTeamToRow(t)
      );
    }

    // 6. Team Members
    for (const m of s.teamMembers) {
      await client.query(
        `INSERT INTO team_members (id, team_id, user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
           team_id = EXCLUDED.team_id,
           user_id = EXCLUDED.user_id`,
        mapTeamMemberToRow(m)
      );
    }

    // 7. Projects
    for (const p of s.projects) {
      await client.query(
        `INSERT INTO projects (id, name, org_id, description, status, priority, start_date, end_date, budget, spent, team_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           org_id = EXCLUDED.org_id,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           priority = EXCLUDED.priority,
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           budget = EXCLUDED.budget,
           spent = EXCLUDED.spent,
           team_ids = EXCLUDED.team_ids`,
        mapProjectToRow(p)
      );
    }

    // 8. Tasks
    for (const t of s.tasks) {
      await client.query(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, creator_id, labels, tags, position, dependencies, points)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           project_id = EXCLUDED.project_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           priority = EXCLUDED.priority,
           due_date = EXCLUDED.due_date,
           assignee_id = EXCLUDED.assignee_id,
           creator_id = EXCLUDED.creator_id,
           labels = EXCLUDED.labels,
           tags = EXCLUDED.tags,
           position = EXCLUDED.position,
           dependencies = EXCLUDED.dependencies,
           points = EXCLUDED.points`,
        mapTaskToRow(t)
      );
    }

    // 9. Subtasks
    for (const st of s.subtasks) {
      await client.query(
        `INSERT INTO subtasks (id, task_id, title, completed)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           task_id = EXCLUDED.task_id,
           title = EXCLUDED.title,
           completed = EXCLUDED.completed`,
        mapSubtaskToRow(st)
      );
    }

    // 10. Comments
    for (const c of s.comments) {
      await client.query(
        `INSERT INTO comments (id, task_id, user_id, content, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           task_id = EXCLUDED.task_id,
           user_id = EXCLUDED.user_id,
           content = EXCLUDED.content,
           created_at = EXCLUDED.created_at`,
        mapCommentToRow(c)
      );
    }

    // 11. Attachments
    for (const a of s.attachments) {
      await client.query(
        `INSERT INTO attachments (id, task_id, name, url, mime_type, size, uploaded_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           task_id = EXCLUDED.task_id,
           name = EXCLUDED.name,
           url = EXCLUDED.url,
           mime_type = EXCLUDED.mime_type,
           size = EXCLUDED.size,
           uploaded_by = EXCLUDED.uploaded_by,
           created_at = EXCLUDED.created_at`,
        mapAttachmentToRow(a)
      );
    }

    // 12. Notifications
    for (const n of s.notifications) {
      await client.query(
        `INSERT INTO notifications (id, user_id, title, message, read, type, created_at, link)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           title = EXCLUDED.title,
           message = EXCLUDED.message,
           read = EXCLUDED.read,
           type = EXCLUDED.type,
           created_at = EXCLUDED.created_at,
           link = EXCLUDED.link`,
        mapNotificationToRow(n)
      );
    }

    // 13. Activity Logs
    for (const al of s.activityLogs) {
      await client.query(
        `INSERT INTO activity_logs (id, project_id, task_id, user_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           project_id = EXCLUDED.project_id,
           task_id = EXCLUDED.task_id,
           user_id = EXCLUDED.user_id,
           action = EXCLUDED.action,
           details = EXCLUDED.details,
           created_at = EXCLUDED.created_at`,
        mapActivityLogToRow(al)
      );
    }

    // 14. Calendar Events
    for (const ce of s.calendarEvents) {
      await client.query(
        `INSERT INTO calendar_events (id, project_id, title, description, start_date, end_date, type, attendees)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           project_id = EXCLUDED.project_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           type = EXCLUDED.type,
           attendees = EXCLUDED.attendees`,
        mapCalendarEventToRow(ce)
      );
    }

    // 15. Chat Messages
    for (const cm of s.chatMessages) {
      await client.query(
        `INSERT INTO chat_messages (id, channel_id, user_id, content, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           channel_id = EXCLUDED.channel_id,
           user_id = EXCLUDED.user_id,
           content = EXCLUDED.content,
           created_at = EXCLUDED.created_at`,
        mapChatMessageToRow(cm)
      );
    }

    // 16. Meeting Summaries
    for (const ms of s.meetingSummaries) {
      await client.query(
        `INSERT INTO meeting_summaries (id, title, date, duration, summary, decisions, action_items, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           date = EXCLUDED.date,
           duration = EXCLUDED.duration,
           summary = EXCLUDED.summary,
           decisions = EXCLUDED.decisions,
           action_items = EXCLUDED.action_items,
           created_at = EXCLUDED.created_at`,
        mapMeetingSummaryToRow(ms)
      );
    }

    // 17. Saved Search Filters
    for (const sf of s.savedSearchFilters) {
      await client.query(
        `INSERT INTO saved_search_filters (id, name, project_id, status, assignee_id, priority, due_date_start, due_date_end, tags, created_at, filters)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           project_id = EXCLUDED.project_id,
           status = EXCLUDED.status,
           assignee_id = EXCLUDED.assignee_id,
           priority = EXCLUDED.priority,
           due_date_start = EXCLUDED.due_date_start,
           due_date_end = EXCLUDED.due_date_end,
           tags = EXCLUDED.tags,
           created_at = EXCLUDED.created_at,
           filters = EXCLUDED.filters`,
        mapSavedFilterToRow(sf)
      );
    }

    // 18. Dashboard Layouts
    for (const [userId, widgets] of Object.entries(s.dashboardLayouts)) {
      await client.query(
        `INSERT INTO dashboard_layouts (user_id, widgets)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET widgets = EXCLUDED.widgets`,
        [userId, JSON.stringify(widgets)]
      );
    }

    await client.query("COMMIT");
    console.log("Successfully persisted all database tables in Neon Postgres!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error during saveStoreToPostgres:", err);
  } finally {
    client.release();
  }
}

async function loadStoreFromPostgres(): Promise<DBStore> {
  console.log("Loading all data from Neon Postgres individual tables...");
  const usersRes = await pool!.query("SELECT * FROM users");
  const passwordsRes = await pool!.query("SELECT * FROM user_passwords");
  const orgsRes = await pool!.query("SELECT * FROM organizations");
  const orgMembersRes = await pool!.query("SELECT * FROM org_members");
  const teamsRes = await pool!.query("SELECT * FROM teams");
  const teamMembersRes = await pool!.query("SELECT * FROM team_members");
  const projectsRes = await pool!.query("SELECT * FROM projects");
  const tasksRes = await pool!.query("SELECT * FROM tasks");
  const subtasksRes = await pool!.query("SELECT * FROM subtasks");
  const commentsRes = await pool!.query("SELECT * FROM comments");
  const attachmentsRes = await pool!.query("SELECT * FROM attachments");
  const notificationsRes = await pool!.query("SELECT * FROM notifications");
  const activityLogsRes = await pool!.query("SELECT * FROM activity_logs");
  const calendarEventsRes = await pool!.query("SELECT * FROM calendar_events");
  const chatMessagesRes = await pool!.query("SELECT * FROM chat_messages");
  const meetingSummariesRes = await pool!.query("SELECT * FROM meeting_summaries");
  const savedSearchFiltersRes = await pool!.query("SELECT * FROM saved_search_filters");
  const dashboardLayoutsRes = await pool!.query("SELECT * FROM dashboard_layouts");

  // Reconstruct passwords record
  const passwords: Record<string, string> = {};
  for (const r of passwordsRes.rows) {
    passwords[r.user_id] = r.password_hash;
  }

  // Reconstruct dashboard layouts record
  const dashboardLayouts: Record<string, DashboardWidget[]> = {};
  for (const r of dashboardLayoutsRes.rows) {
    dashboardLayouts[r.user_id] = typeof r.widgets === "string" ? JSON.parse(r.widgets) : r.widgets;
  }

  return {
    users: usersRes.rows.map(mapRowToUser),
    passwords,
    organizations: orgsRes.rows.map(mapRowToOrg),
    orgMembers: orgMembersRes.rows.map(mapRowToOrgMember),
    teams: teamsRes.rows.map(mapRowToTeam),
    teamMembers: teamMembersRes.rows.map(mapRowToTeamMember),
    projects: projectsRes.rows.map(mapRowToProject),
    tasks: tasksRes.rows.map(mapRowToTask),
    subtasks: subtasksRes.rows.map(mapRowToSubtask),
    comments: commentsRes.rows.map(mapRowToComment),
    attachments: attachmentsRes.rows.map(mapRowToAttachment),
    notifications: notificationsRes.rows.map(mapRowToNotification),
    activityLogs: activityLogsRes.rows.map(mapRowToActivityLog),
    calendarEvents: calendarEventsRes.rows.map(mapRowToCalendarEvent),
    chatMessages: chatMessagesRes.rows.map(mapRowToChatMessage),
    meetingSummaries: meetingSummariesRes.rows.map(mapRowToMeetingSummary),
    savedSearchFilters: savedSearchFiltersRes.rows.map(mapRowToSavedFilter),
    dashboardLayouts
  };
}

export async function initPostgresDB(): Promise<void> {
  if (!pool) {
    const fallbackDbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (fallbackDbUrl) {
      try {
        pool = new pg.Pool({
          connectionString: fallbackDbUrl,
          ssl: { rejectUnauthorized: false }
        });
        console.log("Constructed Neon PG Connection Pool inside initPostgresDB.");
      } catch (poolErr) {
        console.error("Failed to construct Neon PG Connection Pool inside initPostgresDB:", poolErr);
      }
    }
  }

  if (!pool) {
    console.log("No PostgreSQL connection string provided. FlowForge runs on local db.json storage.");
    return;
  }

  try {
    console.log("Initializing Neon Postgres Database connection...");
    
    // Create actual relational table schemas
    await createPostgresSchema();

    // Check if users table is populated
    const countRes = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(countRes.rows[0].count, 10);

    if (userCount > 0) {
      store = await loadStoreFromPostgres();
      console.log("Successfully loaded database from individual Neon Postgres tables!");
    } else {
      console.log("Neon Postgres tables are empty. Checking local db.json for existing project data...");
      let loadedFromLocal = false;
      try {
        if (fs.existsSync(DB_FILE)) {
          const fileData = fs.readFileSync(DB_FILE, "utf-8");
          const parsed = JSON.parse(fileData);
          if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
            store = parsed;
            loadedFromLocal = true;
            console.log("Found existing local db.json with project data. Syncing it to Neon tables...");
          }
        }
      } catch (localReadErr) {
        console.error("Could not read local db.json for Neon migration:", localReadErr);
      }

      if (!loadedFromLocal) {
        console.log("No valid local db.json found. Seeding and initializing demo store data...");
        store = getInitialStore();
      }

      // Sync seeded data into all individual tables
      await saveStoreToPostgres(store);
      console.log("Neon Postgres database tables seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to connect or initialize Neon Postgres database:", err);
    console.log("Falling back gracefully to local db.json storage.");
    pool = null; // deactivate pool so we fall back to local file system
  }
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

  if (pool) {
    saveStoreToPostgres(store).catch((err) => {
      console.error("Failed to persist database changes to individual Neon tables:", err);
    });
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
  deleteOrgMember: (userId: string, orgId: string) => {
    const s = loadDB();
    s.orgMembers = s.orgMembers.filter((om) => !(om.userId === userId && om.orgId === orgId));
    saveDB();
  },
  toggleUserSuspended: (userId: string) => {
    const s = loadDB();
    const idx = s.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      const u = s.users[idx] as any;
      u.isSuspended = !u.isSuspended;
      saveDB();
      return u.isSuspended;
    }
    return false;
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
