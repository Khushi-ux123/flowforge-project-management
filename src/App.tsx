import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  Users,
  MessageSquare,
  ShieldAlert,
  Cpu,
  LogOut,
  FolderPlus,
  Plus,
  Moon,
  Sun,
  LayoutGrid,
  TrendingUp,
  Settings,
  X,
  Menu,
  ChevronRight,
  User,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FileDown
} from "lucide-react";
import {
  User as WorkspaceUser,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  ChatMessage,
  CalendarEvent,
  Notification,
  UserRole,
  DashboardWidget,
  SavedSearchFilter
} from "./types.ts";
import CalendarGantt from "./components/CalendarGantt.tsx";
import TaskModal from "./components/TaskModal.tsx";
import AICoPilot from "./components/AICoPilot.tsx";
import ChatHub from "./components/ChatHub.tsx";
import AnalyticsPanel from "./components/AnalyticsPanel.tsx";
import CommandPalette from "./components/CommandPalette.tsx";
import SprintBurnout from "./components/SprintBurnout.tsx";
import { exportActiveProjectReport } from "./utils/pdfExport.ts";

export default function App() {
  // Auth & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);

  // Form Inputs
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole>(UserRole.MEMBER);
  const [authError, setAuthError] = useState("");

  // Workspace Core States
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Navigation & Preferences
  const [activeTab, setActiveTab] = useState<"projects" | "ai" | "chat" | "analytics" | "settings">("projects");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? saved === "true" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Popups & Modal triggers
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync dark mode class on root document element and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // Command palette keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // New Ticket Form Inputs
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskLabels, setNewTaskLabels] = useState("");

  // New Project Form Inputs
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjBudget, setNewProjBudget] = useState(50000);

  // Customizable Dashboard layout state
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [isCustomizingWidgets, setIsCustomizingWidgets] = useState(false);
  const [isSavingWidgets, setIsSavingWidgets] = useState(false);
  const [customWidgetTitle, setCustomWidgetTitle] = useState("");
  const [customWidgetDesc, setCustomWidgetDesc] = useState("");
  const [customWidgetValue, setCustomWidgetValue] = useState("");

  // Advanced search filters state
  const [savedFiltersList, setSavedFiltersList] = useState<SavedSearchFilter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<SavedSearchFilter | null>(null);
  const [newFilterName, setNewFilterName] = useState("");
  // Advanced filter parameter selections
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Bootstrapping session validation
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("currentUser");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch core telemetry on authenticated state
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaceData();
    }
  }, [isAuthenticated]);

  const fetchWorkspaceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      // Parallelize fetches for fast, seamless rendering
      const [uRes, pRes, tRes, eRes, nRes, tmRes, dRes, fRes] = await Promise.all([
        fetch("/api/users", { headers }),
        fetch("/api/projects", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/events", { headers }),
        fetch("/api/notifications", { headers }),
        fetch("/api/teams", { headers }),
        fetch("/api/dashboard/layout", { headers }),
        fetch("/api/saved-filters", { headers })
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (eRes.ok) setCalendarEvents(await eRes.json());
      if (nRes.ok) setNotifications(await nRes.json());
      if (tmRes.ok) setTeams(await tmRes.json());

      if (dRes.ok) {
        const layouts = await dRes.json();
        const rawUser = localStorage.getItem("currentUser");
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          const roleLayout = layouts[parsedUser.role] || [];
          setDashboardWidgets(roleLayout);
        }
      }

      if (fRes.ok) {
        setSavedFiltersList(await fRes.json());
      }

      if (pRes.ok) {
        const projData: Project[] = await pRes.json();
        setProjects(projData);
        if (projData.length > 0 && !activeProject) {
          setActiveProject(projData[0]);
        }
      }
    } catch (err) {
      console.error("Workspace telemetry sync error:", err);
    }
  };

  // Customizable Dashboard layout handlers
  const handleSaveDashboardLayout = async (updatedWidgets: DashboardWidget[]) => {
    setIsSavingWidgets(true);
    try {
      const res = await fetch("/api/dashboard/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          role: currentUser?.role,
          layout: updatedWidgets
        })
      });
      if (res.ok) {
        setDashboardWidgets(updatedWidgets);
      }
    } catch (err) {
      console.error("Failed to save dashboard layout:", err);
    } finally {
      setIsSavingWidgets(false);
    }
  };

  const handleToggleWidgetVisibility = (id: string) => {
    const next = dashboardWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    handleSaveDashboardLayout(next);
  };

  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    const next = [...dashboardWidgets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    
    // Swap elements
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    // Normalize order
    const updated = next.map((w, idx) => ({ ...w, order: idx }));
    handleSaveDashboardLayout(updated);
  };

  const handleAddCustomWidget = () => {
    if (!customWidgetTitle.trim()) return;
    const newWidget: DashboardWidget = {
      id: "custom_" + Date.now(),
      title: customWidgetTitle.trim(),
      description: customWidgetDesc.trim() || "User defined custom widget",
      type: "custom",
      visible: true,
      order: dashboardWidgets.length,
      value: customWidgetValue.trim() || "N/A"
    };
    const next = [...dashboardWidgets, newWidget];
    handleSaveDashboardLayout(next);
    setCustomWidgetTitle("");
    setCustomWidgetDesc("");
    setCustomWidgetValue("");
  };

  const handleResetDashboardLayout = async () => {
    if (!confirm("Are you sure you want to reset your dashboard layout to default?")) return;
    try {
      const res = await fetch("/api/dashboard/layout/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ role: currentUser?.role })
      });
      if (res.ok) {
        const resetLayout = await res.json();
        setDashboardWidgets(resetLayout);
      }
    } catch (err) {
      console.error("Failed to reset dashboard layout:", err);
    }
  };

  // Advanced Saved Search Filters handlers
  const handleSaveSearchFilter = async () => {
    if (!newFilterName.trim()) return;
    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: newFilterName.trim(),
          filters: {
            projectId: filterProject || undefined,
            status: filterStatus || undefined,
            assigneeId: filterAssignee || undefined,
            priority: filterPriority || undefined,
            tag: filterTag || undefined
          }
        })
      });
      if (res.ok) {
        setNewFilterName("");
        const data = await res.json();
        setSavedFiltersList(prev => [...prev, data]);
        setSelectedFilter(data);
      }
    } catch (err) {
      console.error("Failed to save filter:", err);
    }
  };

  const handleDeleteSearchFilter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved filter?")) return;
    try {
      const res = await fetch(`/api/saved-filters/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setSavedFiltersList(prev => prev.filter(f => f.id !== id));
        if (selectedFilter?.id === id) {
          handleClearFilters();
        }
      }
    } catch (err) {
      console.error("Failed to delete saved filter:", err);
    }
  };

  const handleApplySavedFilter = (sf: SavedSearchFilter) => {
    setSelectedFilter(sf);
    setFilterProject(sf.filters.projectId || "");
    setFilterStatus(sf.filters.status || "");
    setFilterAssignee(sf.filters.assigneeId || "");
    setFilterPriority(sf.filters.priority || "");
    setFilterTag(sf.filters.tag || "");
  };

  const handleClearFilters = () => {
    setSelectedFilter(null);
    setFilterProject("");
    setFilterStatus("");
    setFilterAssignee("");
    setFilterPriority("");
    setFilterTag("");
  };

  // ----------------------------------------------------
  // AUTH PROCEDURES
  // ----------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        const userWithRole = { ...data.user, role: data.role || data.user.role };
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(userWithRole));
        setToken(data.token);
        setCurrentUser(userWithRole);
        setIsAuthenticated(true);
      } else {
        const err = await res.json();
        setAuthError(err.error || "Invalid user credentials.");
      }
    } catch (err) {
      setAuthError("Network server connection timeout.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullNameInput.trim(),
          email: emailInput.trim(),
          password: passwordInput,
          role: roleInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        const userWithRole = { ...data.user, role: data.role || data.user.role };
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(userWithRole));
        setToken(data.token);
        setCurrentUser(userWithRole);
        setIsAuthenticated(true);
      } else {
        const err = await res.json();
        setAuthError(err.error || "Registration validation failed.");
      }
    } catch (err) {
      setAuthError("Server unavailable.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    setEmailInput("");
    setPasswordInput("");
  };

  // Dynamic Switcher for Testing RBAC roles instantly
  const handleSimulateRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth/simulate-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const updatedUser = { ...currentUser, role: newRole };
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // WORKSPACE MUTATIONS (CREATE/DELETE PROJECTS, TICKETS)
  // ----------------------------------------------------
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim(),
          budget: Number(newProjBudget)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [...prev, data]);
        setActiveProject(data);
        setIsCreateProjectOpen(false);
        setNewProjName("");
        setNewProjDesc("");
        setNewProjBudget(50000);
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;

    try {
      const labelArray = newTaskLabels
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          projectId: activeProject.id,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          status: newTaskStatus,
          priority: newTaskPriority,
          assigneeId: newTaskAssignee || undefined,
          dueDate: newTaskDueDate || undefined,
          labels: labelArray
        })
      });

      if (res.ok) {
        setIsCreateTaskOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskDueDate("");
        setNewTaskLabels("");
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNotification = async (notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(notification)
      });
      if (res.ok) {
        const nRes = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (nRes.ok) setNotifications(await nRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCalendarEvent = async (event: Partial<CalendarEvent>) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(event)
      });
      if (res.ok) {
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Tasks by top bar search and advanced filter controls
  const getSearchedTasks = () => {
    let list = tasks;

    // Apply active project filter
    if (filterProject) {
      list = list.filter((t) => t.projectId === filterProject);
    }
    // Apply status filter
    if (filterStatus) {
      list = list.filter((t) => t.status === filterStatus);
    }
    // Apply assignee filter
    if (filterAssignee) {
      list = list.filter((t) => t.assigneeId === filterAssignee);
    }
    // Apply priority filter
    if (filterPriority) {
      list = list.filter((t) => t.priority === filterPriority);
    }
    // Apply tags/labels filter
    if (filterTag) {
      list = list.filter((t) => t.labels && t.labels.some(l => l.toLowerCase().includes(filterTag.toLowerCase())));
    }

    // Apply top bar text search
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(sq) || t.id.toLowerCase().includes(sq));
    }

    return list;
  };

  if (!isAuthenticated || !currentUser) {
    // ----------------------------------------------------
    // AUTHENTICATION GATES VIEW (LOGIN & REGISTER)
    // ----------------------------------------------------
    return (
      <div id="auth-root" className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? "dark bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <div id="auth-card" className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6 transition-all duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 mb-2">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">FlowForge</h1>
            <p className="text-xs text-gray-400">AI-Powered Project Management Console</p>
          </div>

          {authError && (
            <div id="auth-error-banner" className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg p-3 text-xs flex items-center space-x-2">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form id="auth-form" onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
            {!isLoginView && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase">Full Name</label>
                <input
                  id="register-name-input"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3.5 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase">Email Address</label>
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="you@organization.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3.5 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase">Password</label>
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3.5 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {!isLoginView && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase">Organization Role</label>
                <div className="relative">
                  <select
                    id="register-role-select"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                    className="w-full appearance-none rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3.5 py-2 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={UserRole.OWNER}>Organization Owner</option>
                    <option value={UserRole.MANAGER}>Project Manager</option>
                    <option value={UserRole.MEMBER}>Team Member</option>
                    <option value={UserRole.CLIENT}>Client (Read-only)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isLoginView ? "Sign In to Workspace" : "Register Organization Account"}
            </button>
          </form>

          {/* Seed credentials hint */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
            <p className="text-[10px] text-gray-400">
              Demo Sandbox Credentials: <strong className="text-gray-600 dark:text-gray-300">alex@forge.com</strong> / <strong className="text-gray-600 dark:text-gray-300">password</strong>
            </p>
          </div>

          <div className="text-center">
            <button
              id="auth-toggle-view"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError("");
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              {isLoginView ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN WORKSPACE INTERFACE LAYOUT
  // ----------------------------------------------------
  return (
    <div className={`min-h-screen flex ${darkMode ? "dark bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      {/* Floating Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-950 p-4 flex flex-col justify-between transition-transform duration-300 transform lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-black tracking-wider">FLOWFORGE</span>
            </div>
            <button className="lg:hidden p-1 rounded-md" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active User Segment */}
          <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-900/40 rounded-xl p-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold font-mono">
                {currentUser.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-gray-800 dark:text-gray-100">{currentUser.fullName}</div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40 uppercase tracking-wider font-mono">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="space-y-1">
            <button
              id="nav-projects"
              onClick={() => { setActiveTab("projects"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "projects"
                  ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Workspace hub</span>
            </button>

            <button
              id="nav-ai"
              onClick={() => { setActiveTab("ai"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ai"
                  ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>AI Scrum CoPilot</span>
            </button>

            <button
              id="nav-chat"
              onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Team discussion</span>
            </button>

            <button
              id="nav-analytics"
              onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "analytics"
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Analytics Center</span>
            </button>

            <button
              id="nav-settings"
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </button>
          </nav>

          {/* Active Projects Selector Drawer inside Sidebar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-mono tracking-wider font-extrabold text-slate-500 dark:text-slate-400 uppercase">
              <span>Active Projects</span>
              {(currentUser.role === UserRole.OWNER || currentUser.role === UserRole.MANAGER) && (
                <button
                  id="add-project-btn"
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 text-blue-500"
                  title="Create Project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-[160px] overflow-y-auto scrollbar-thin">
              {projects.map((p) => (
                <button
                  key={p.id}
                  id={`proj-sel-${p.id}`}
                  onClick={() => setActiveProject(p)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs truncate transition-all ${
                    activeProject?.id === p.id
                      ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {(currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MANAGER) && (
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-normal">${(p.budget / 1000).toFixed(0)}k</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout Block */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Navbar Section */}
        <header className="sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-900 bg-white/80 dark:bg-gray-950/85 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button className="lg:hidden p-1 rounded-md" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            {/* Global ticket Search bar */}
            <div className="relative max-w-lg w-full hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    id="global-search-input"
                    type="text"
                    placeholder="Search active project tickets, code labels, milestones... (Ctrl + K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <button
                  id="advanced-filter-toggle"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    showAdvancedSearch || filterProject || filterStatus || filterAssignee || filterPriority || filterTag
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  }`}
                  title="Advanced search filters"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {(filterProject || filterStatus || filterAssignee || filterPriority || filterTag) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </button>
              </div>

              {/* Advanced Search Dropdown Overlay */}
              {showAdvancedSearch && (
                <div id="advanced-search-dropdown" className="absolute top-11 left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-2xl z-30 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-2">
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider font-mono">Advanced Search Filters</h4>
                    {(filterProject || filterStatus || filterAssignee || filterPriority || filterTag) && (
                      <button
                        onClick={handleClearFilters}
                        className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-400 font-bold">Project</label>
                      <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">All Projects</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-400 font-bold">Ticket Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">All Statuses</option>
                        <option value={TaskStatus.TODO}>To Do</option>
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.REVIEW}>In Review</option>
                        <option value={TaskStatus.COMPLETED}>Completed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-400 font-bold">Assignee</label>
                      <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">All Assignees</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-400 font-bold">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-800 dark:text-gray-200"
                      >
                        <option value="">All Priorities</option>
                        <option value={TaskPriority.LOW}>Low</option>
                        <option value={TaskPriority.MEDIUM}>Medium</option>
                        <option value={TaskPriority.HIGH}>High</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] font-mono uppercase text-gray-400 font-bold">Label / Tag Keyword</label>
                      <input
                        type="text"
                        placeholder="e.g. Frontend, API, Bug..."
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  {/* Save current filters as saved search filter */}
                  <div className="border-t border-gray-100 dark:border-gray-950 pt-3">
                    <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-1.5">Save Current Search Configuration</span>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Filter name (e.g. My Urgent Frontend)..."
                        value={newFilterName}
                        onChange={(e) => setNewFilterName(e.target.value)}
                        className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden text-gray-800 dark:text-gray-200"
                      />
                      <button
                        onClick={handleSaveSearchFilter}
                        disabled={!newFilterName.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>

                  {/* Saved Search Filters list selection */}
                  {savedFiltersList.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-950 pt-3">
                      <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block mb-1.5">Saved Configurations</span>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {savedFiltersList.map(sf => (
                          <div
                            key={sf.id}
                            onClick={() => handleApplySavedFilter(sf)}
                            className={`px-2 py-1 rounded-md border text-[10px] font-medium flex items-center space-x-1.5 cursor-pointer transition-all ${
                              selectedFilter?.id === sf.id
                                ? "bg-blue-500/10 border-blue-500/40 text-blue-600"
                                : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            <span>{sf.name}</span>
                            <button
                              onClick={(e) => handleDeleteSearchFilter(sf.id, e)}
                              className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete filter configuration"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Dark/Light toggles */}
            <button
              id="theme-toggler"
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              title="Toggle Theme Preset"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Dropdown Tray */}
            <div className="relative">
              <button
                id="noti-bell-trigger"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) handleMarkNotificationsRead();
                }}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all relative"
              >
                <Bell className="h-4 w-4" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </button>

              {isNotificationOpen && (
                <div id="noti-dropdown" className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-4 shadow-2xl space-y-3 z-50">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Live Workspace Notifications</span>
                    <button onClick={() => setIsNotificationOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin divide-y divide-gray-50 dark:divide-gray-900">
                    {notifications.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-6 italic">No messages or inbox highlights.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="pt-2 text-xs">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.content}</p>
                          <span className="text-[9px] text-gray-400 font-mono mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Create ticket trigger shortcut */}
            {currentUser.role !== UserRole.CLIENT && (
              <button
                id="topbar-create-task"
                onClick={() => setIsCreateTaskOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Main body content layout */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Active project header segment */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-900 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-gray-950 dark:text-gray-50">
                  {activeProject ? activeProject.name : "Select/Create a Project to begin"}
                </h1>
                <span className="text-[9px] font-mono tracking-widest font-semibold px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-500 uppercase">
                  {currentUser.role} View
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
                {activeProject ? activeProject.description : "Manage tasks, AI sprints planning, chat boards, and overall health indexes."}
              </p>
            </div>
          </div>

          {/* ----------------------------------------------------
              CUSTOMIZABLE BENTO GRID DASHBOARD
              ---------------------------------------------------- */}
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-900 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider font-mono text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                  <LayoutGrid className="h-4 w-4 text-blue-500" />
                  <span>My Customizable {currentUser.role} Dashboard</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                  Rearrange, remove, or add metrics widgets in your workspace library.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {activeProject && currentUser && (
                  <button
                    id="export-project-pdf"
                    onClick={() => {
                      exportActiveProjectReport(activeProject, currentUser, tasks, users);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-750 dark:hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    title={`Export current dashboard to ${currentUser.role} formatted PDF Report`}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Export PDF Report</span>
                  </button>
                )}
                <button
                  id="toggle-customizer-btn"
                  onClick={() => setIsCustomizingWidgets(!isCustomizingWidgets)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isCustomizingWidgets
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>{isCustomizingWidgets ? "Close Customizer" : "Customize Widgets"}</span>
                </button>
                <button
                  onClick={handleResetDashboardLayout}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                  title="Reset layout to system default"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Customizer Drawer Panel */}
            {isCustomizingWidgets && (
              <div id="dashboard-customizer-drawer" className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Library of current widgets */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Active Widgets Layout Organizer</span>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                      {dashboardWidgets
                        .filter(w => {
                          if (w.type === "portfolio_revenue") {
                            return currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MANAGER;
                          }
                          return true;
                        })
                        .map((w, index) => (
                        <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-[9px] bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-400 font-mono">#{index + 1}</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{w.title}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleToggleWidgetVisibility(w.id)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                                w.visible ? "text-blue-500" : "text-gray-400"
                              }`}
                              title={w.visible ? "Hide widget" : "Show widget"}
                            >
                              {w.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleMoveWidget(index, "up")}
                              disabled={index === 0}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveWidget(index, "down")}
                              disabled={index === dashboardWidgets.length - 1}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Custom Metrics Widget */}
                  <div className="space-y-2 border-l border-gray-200 dark:border-gray-800 md:pl-4">
                    <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Create & Add Custom Metrics Widget</span>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono uppercase text-gray-400 block font-bold">Widget Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Server Ping"
                            value={customWidgetTitle}
                            onChange={(e) => setCustomWidgetTitle(e.target.value)}
                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono uppercase text-gray-400 block font-bold">Metric Value</label>
                          <input
                            type="text"
                            placeholder="e.g. 14ms (Optimal)"
                            value={customWidgetValue}
                            onChange={(e) => setCustomWidgetValue(e.target.value)}
                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono uppercase text-gray-400 block font-bold">Metric Summary / Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Calculated from continuous node ping probes."
                          value={customWidgetDesc}
                          onChange={(e) => setCustomWidgetDesc(e.target.value)}
                          className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden"
                        />
                      </div>
                      <button
                        onClick={handleAddCustomWidget}
                        disabled={!customWidgetTitle.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white text-xs py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Add Custom Widget to Layout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rendered Bento Grid of active widgets */}
            <div id="bento-widgets-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardWidgets.length === 0 ? (
                <div className="col-span-3 text-center text-xs text-gray-400 py-6 italic">
                  No active dashboard widgets. Click "Reset Defaults" or add some custom layouts!
                </div>
              ) : (
                dashboardWidgets
                  .filter(w => w.visible)
                  .filter(w => {
                    // Restrict portfolio_revenue from Team Member and Client roles
                    if (w.type === "portfolio_revenue") {
                      return currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MANAGER;
                    }
                    return true;
                  })
                  .map(w => {
                    // Sprint Burnout Widget (Interactive, role-specific)
                    if (w.type === "sprint_burnout") {
                      return (
                        <SprintBurnout
                          key={w.id}
                          tasks={tasks}
                          activeProject={activeProject || undefined}
                          currentUser={currentUser}
                          users={users}
                          onUpdateTaskStatus={handleUpdateTaskStatus}
                          onAddNotification={handleAddNotification}
                        />
                      );
                    }

                    // Portfolio Revenue Card
                    if (w.type === "portfolio_revenue") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold font-mono">$ spent</span>
                          </div>
                          <div className="mt-2 text-xl font-black text-emerald-500">
                            ${projects.reduce((sum, p) => sum + p.spent, 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">spent</span>
                          </div>
                          <div className="mt-1.5 text-[10px] text-gray-400 leading-relaxed">
                            Financial outlays calculated from {projects.length} active subsidiary project sheets.
                          </div>
                        </div>
                      );
                    }

                    // Project Progress Status Widget
                    if (w.type === "project_progress") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col col-span-1 md:col-span-2 justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold font-mono">Active Sprint</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {Object.values(TaskStatus).map(status => {
                              const count = tasks.filter(t => t.status === status && (!activeProject || t.projectId === activeProject.id)).length;
                              return (
                                <div key={status} className="bg-gray-50/50 dark:bg-gray-950 p-2 rounded-lg border border-gray-100 dark:border-gray-900">
                                  <div className="text-[8px] uppercase text-gray-500 dark:text-gray-400 font-mono tracking-wider font-bold">{status.replace("_", " ")}</div>
                                  <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">{count} tickets</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      );
                    }

                    // My Workload Checklist Widget
                    if (w.type === "workload_checklist") {
                      const pending = tasks.filter(t => t.assigneeId === currentUser?.id && t.status !== TaskStatus.COMPLETED);
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col col-span-1 md:col-span-2 justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-900 pb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] text-blue-500 font-mono font-bold">{pending.length} pending</span>
                          </div>
                          <div className="mt-2 space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                            {pending.length === 0 ? (
                              <p className="text-xs text-gray-400 italic py-4 text-center">No active tasks assigned to you. Ideal capacity match!</p>
                            ) : (
                              pending.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 hover:border-gray-200 transition-all text-xs">
                                  <div className="flex items-center space-x-2 truncate">
                                    <input
                                      type="checkbox"
                                      onChange={() => handleUpdateTaskStatus(t.id, TaskStatus.COMPLETED)}
                                      className="rounded-sm cursor-pointer border-gray-300 dark:border-gray-700"
                                    />
                                    <span className="text-xs text-gray-800 dark:text-gray-200 truncate font-semibold">{t.title}</span>
                                  </div>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-bold uppercase">{t.priority}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }

                    // AI Scrum Insights Widget
                    if (w.type === "ai_insights") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-1.5">
                            <Cpu className="h-4 w-4 text-purple-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs font-black text-purple-600 dark:text-purple-400">Stable Resource Balance</div>
                            <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
                              Dynamic models computed perfect resource velocity allocation indexes. No blockage detected.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Velocity Benchmark Card
                    if (w.type === "sprint_velocity") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] font-mono font-bold text-blue-500">Benchmark</span>
                          </div>
                          <div className="mt-2 text-xl font-black text-blue-500">22 story points</div>
                          <div className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                            Velocity benchmarks calculated spanning previous 14-day Scrum iterations.
                          </div>
                        </div>
                      );
                    }

                    // Blockers & Warnings Card
                    if (w.type === "blockers_risks") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] font-mono font-bold text-amber-500">Warnings</span>
                          </div>
                          <div className="mt-2 text-xl font-black text-amber-500">2 active overlaps</div>
                          <div className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                            Overlapping dates found. View the Calendar / Gantt charts tab to reconcile conflicts.
                          </div>
                        </div>
                      );
                    }

                    // Productivity card
                    if (w.type === "productivity_load") {
                      return (
                        <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">{w.title}</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-500">Efficiency</span>
                          </div>
                          <div className="mt-2 text-xl font-black text-emerald-500">98 / 100 score</div>
                          <div className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                            Calculated dynamically from relative ticket cycle times and task achievements.
                          </div>
                        </div>
                      );
                    }

                    // Custom Widget Rendering Fallback
                    return (
                      <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400 truncate">{w.title}</span>
                          <span className="text-[9px] text-blue-500 font-mono font-bold uppercase">Custom</span>
                        </div>
                        <div className="mt-2 text-xl font-black text-gray-900 dark:text-gray-100 truncate">{w.value || "Configured"}</div>
                        <div className="mt-1 text-[10px] text-gray-400 leading-relaxed truncate">
                          {w.description || "User-defined custom metrics widget."}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* ----------------------------------------------------
              TAB ROUTER SWITCHES (TICKETS, CO-PILOT, CHAT, CHARTS, SETTINGS)
              ---------------------------------------------------- */}
          {activeTab === "projects" && (
            <div id="tab-projects-root">
              <CalendarGantt
                tasks={getSearchedTasks()}
                projects={projects}
                users={users}
                activeProject={activeProject}
                onSelectTask={(id) => {
                  setActiveTaskId(id);
                  setIsTaskModalOpen(true);
                }}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddTask={(status) => {
                  setNewTaskStatus(status);
                  setIsCreateTaskOpen(true);
                }}
                calendarEvents={calendarEvents}
                onAddCalendarEvent={handleAddCalendarEvent}
              />
            </div>
          )}

          {activeTab === "ai" && (
            <div id="tab-ai-root">
              <AICoPilot
                activeProject={activeProject}
                users={users}
                onTaskCreated={fetchWorkspaceData}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === "chat" && (
            <div id="tab-chat-root">
              <ChatHub
                teams={teams}
                projects={projects}
                users={users}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === "analytics" && (
            <div id="tab-analytics-root">
              <AnalyticsPanel
                tasks={tasks}
                projects={projects}
                users={users}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <div id="tab-settings-root" className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider font-mono">Workspace Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400">Language preferences</label>
                  <select className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden">
                    <option>English (US) - Default</option>
                    <option>Español (ES)</option>
                    <option>Français (FR)</option>
                    <option>日本語 (JP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400">Time Zone Configuration</label>
                  <select className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400">Change password security</label>
                  <input type="password" placeholder="Enter new password block..." className="w-full bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400">Multi-Factor authentication</label>
                  <div className="text-xs text-gray-400 pt-2 flex items-center space-x-2">
                    <input type="checkbox" className="rounded-sm" />
                    <span>Enable Two-Factor SMS / Authenticator confirmation codes</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-900 pt-4 text-right">
                <button
                  id="settings-save-btn"
                  onClick={() => alert("Workspace preferences saved successfully!")}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Preference Nodes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ----------------------------------------------------
          MODAL DIALOGS: CREATE PROJECTS, NEW TICKET, TICKET DRAWER
          ---------------------------------------------------- */}

      {/* 1. Create Project Modal Overlay */}
      {isCreateProjectOpen && (currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MANAGER) && (
        <div id="create-project-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-2">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderPlus className="h-4.5 w-4.5 mr-1.5 text-blue-500" />
                <span>Initialize Workspace Project</span>
              </h4>
              <button type="button" onClick={() => setIsCreateProjectOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Project Title</label>
                <input
                  id="new-proj-name"
                  type="text"
                  required
                  placeholder="e.g. NextGen Client API Integration..."
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Strategic Objective</label>
                <textarea
                  id="new-proj-desc"
                  rows={3}
                  placeholder="Summarize high-level objectives..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Budget Allocation ($)</label>
                <input
                  id="new-proj-budget"
                  type="number"
                  value={newProjBudget}
                  onChange={(e) => setNewProjBudget(Number(e.target.value))}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              id="proj-submit"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition-all cursor-pointer"
            >
              Launch Project Track
            </button>
          </form>
        </div>
      )}

      {/* 2. Create Ticket Modal Overlay */}
      {isCreateTaskOpen && (
        <div id="create-task-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleCreateTask} className="w-full max-w-lg bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-2">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Plus className="h-4.5 w-4.5 mr-1.5 text-blue-500" />
                <span>Publish Issue Ticket</span>
              </h4>
              <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Ticket Title</label>
                <input
                  id="new-task-title"
                  type="text"
                  required
                  placeholder="Provide an actionable deliverable label..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Detailed Specifications</label>
                <textarea
                  id="new-task-desc"
                  rows={3}
                  placeholder="Specify task variables, criteria, references..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Workflow Status</label>
                <div className="relative">
                  <select
                    id="new-task-status"
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                    className="w-full appearance-none bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    {Object.values(TaskStatus).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2 h-4 w-4 text-slate-500 dark:text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Severity Priority</label>
                <div className="relative">
                  <select
                    id="new-task-priority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full appearance-none bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    {Object.values(TaskPriority).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2 h-4 w-4 text-slate-500 dark:text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Assignee Engineer</label>
                <div className="relative">
                  <select
                    id="new-task-assignee"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2 h-4 w-4 text-slate-500 dark:text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Due Date</label>
                <input
                  id="new-task-duedate"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Labels (Comma Separated)</label>
                <input
                  id="new-task-labels"
                  type="text"
                  placeholder="e.g. frontend, bug, api..."
                  value={newTaskLabels}
                  onChange={(e) => setNewTaskLabels(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <button
              id="task-submit"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              Publish Ticket
            </button>
          </form>
        </div>
      )}

      {/* 3. Task Details Overlay Drawer */}
      <TaskModal
        taskId={activeTaskId}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setActiveTaskId(null);
          fetchWorkspaceData();
        }}
        users={users}
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        currentUser={currentUser}
      />

      {/* Ctrl + K command palette floating system */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        users={users}
        tasks={tasks}
        projects={projects}
        onSelectTask={(id) => {
          setActiveTaskId(id);
          setIsTaskModalOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onSelectProject={(id) => {
          const p = projects.find((proj) => proj.id === id);
          if (p) setActiveProject(p);
          setIsCommandPaletteOpen(false);
        }}
        onTriggerAI={(goal) => {
          setActiveTab("ai");
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}
