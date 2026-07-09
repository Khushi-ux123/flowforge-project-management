/**
 * Shared Type Definitions for FlowForge
 */

export enum UserRole {
  OWNER = "Organization Owner",
  MANAGER = "Project Manager",
  MEMBER = "Team Member",
  CLIENT = "Client (Read-only)"
}

export enum ProjectStatus {
  PLANNING = "Planning",
  ACTIVE = "Active",
  PAUSED = "Paused",
  COMPLETED = "Completed"
}

export enum ProjectPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

export enum TaskStatus {
  BACKLOG = "Backlog",
  TODO = "Todo",
  IN_PROGRESS = "In Progress",
  REVIEW = "Review",
  TESTING = "Testing",
  COMPLETED = "Completed"
}

export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

export enum CalendarEventType {
  MEETING = "Meeting",
  MILESTONE = "Milestone",
  TASK_DUE = "Task Due"
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar: string; // URL or Initials
  title: string;
  bio?: string;
  timezone: string;
  language: string;
  role?: UserRole;
  notificationPrefs: {
    email: boolean;
    push: boolean;
    mentionsOnly: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  logo?: string;
  settings: {
    allowedDomains: string[];
    twoFactorRequired: boolean;
    defaultRole: UserRole;
  };
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: UserRole;
}

export interface Team {
  id: string;
  name: string;
  orgId: string;
  description: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
}

export interface Project {
  id: string;
  name: string;
  orgId: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  teamIds: string[]; // List of teams assigned
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId?: string; // User ID
  creatorId: string; // User ID
  labels: string[];
  tags: string[];
  position: number; // For drag and drop sorting
  dependencies: string[]; // Task IDs that this task depends on
  points?: number; // Story points or estimated effort
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string; // User ID
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: "assigned" | "due_soon" | "mention" | "update" | "invite";
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: CalendarEventType;
  attendees: string[]; // User IDs
}

export interface ChatMessage {
  id: string;
  channelId: string; // "team_<teamId>" or "project_<projectId>" or "global"
  userId: string;
  content: string;
  createdAt: string;
}

// AI Assistance Payload responses
export interface AITaskBreakdown {
  tasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    labels: string[];
  }>;
}

export interface AISprintPlanning {
  sprintGoal: string;
  suggestedVelocity: number;
  scopeAlerts: string[];
  allocation: Array<{
    assigneeId: string;
    taskIds: string[];
    loadPercentage: number;
  }>;
}

export interface AIProjectHealth {
  healthScore: number; // 0-100
  status: "On Track" | "At Risk" | "Critical";
  riskAnalysis: string[];
  blockersDetected: string[];
  timelinePrediction: string;
  remedySuggestions: string[];
}

export interface MeetingSummaryActionItem {
  task: string;
  assigneeName: string;
  assigneeId?: string;
  priority: string;
  dueDate?: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  duration?: string;
  summary: string;
  decisions: string[];
  actionItems: MeetingSummaryActionItem[];
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "task-summary" | "project-progress" | "team-performance" | "ai-insights" | "meeting-summaries-list" | "quick-action-links" | "portfolio_revenue" | "project_progress" | "sprint_velocity" | "blockers_risks" | "ai_insights" | "workload_checklist" | "productivity_load" | "sprint_burnout" | "custom";
  visible: boolean;
  order: number;
  description?: string;
  value?: string;
}

export interface SavedSearchFilter {
  id: string;
  name: string;
  projectId?: string;
  status?: TaskStatus[];
  assigneeId?: string;
  priority?: TaskPriority[];
  dueDateStart?: string;
  dueDateEnd?: string;
  tags?: string[];
  createdAt: string;
  filters: {
    projectId?: string;
    status?: string;
    assigneeId?: string;
    priority?: string;
    tag?: string;
  };
}

