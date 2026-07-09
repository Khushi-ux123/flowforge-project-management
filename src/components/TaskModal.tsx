import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  Paperclip,
  Plus,
  Trash2,
  MessageSquare,
  History,
  GitMerge,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Upload
} from "lucide-react";
import { Task, Subtask, Comment, Attachment, ActivityLog, TaskStatus, TaskPriority, User as WorkspaceUser, UserRole } from "../types.ts";
import { Lock } from "lucide-react";

interface TaskModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  users: WorkspaceUser[];
  tasks: Task[]; // For dependencies
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  currentUser: WorkspaceUser | null;
}

export default function TaskModal({
  taskId,
  isOpen,
  onClose,
  users,
  tasks,
  onUpdateTask,
  onDeleteTask,
  currentUser
}: TaskModalProps) {
  const userRole = currentUser?.role || UserRole.MEMBER;
  const isClient = userRole === UserRole.CLIENT;
  const isMember = userRole === UserRole.MEMBER;
  const canDelete = userRole === UserRole.OWNER || userRole === UserRole.MANAGER;
  const canChangeAdminFields = userRole === UserRole.OWNER || userRole === UserRole.MANAGER;

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Local input states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskData(taskId);
    }
  }, [isOpen, taskId]);

  const fetchTaskData = async (id: string) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      
      // Get main task details
      const allTasks = tasks;
      const activeTask = allTasks.find((t) => t.id === id);
      if (activeTask) setTask(activeTask);

      // Fetch subtasks
      const stRes = await fetch(`/api/tasks/${id}/subtasks`, { headers });
      if (stRes.ok) setSubtasks(await stRes.json());

      // Fetch comments
      const cRes = await fetch(`/api/tasks/${id}/comments`, { headers });
      if (cRes.ok) setComments(await cRes.json());

      // Fetch attachments
      const aRes = await fetch(`/api/tasks/${id}/attachments`, { headers });
      if (aRes.ok) setAttachments(await aRes.json());

      // Fetch general activity
      const actRes = await fetch(`/api/activity`, { headers });
      if (actRes.ok) {
        const allActs: ActivityLog[] = await actRes.json();
        setActivities(allActs.filter((a) => a.taskId === id));
      }
    } catch (err) {
      console.error("Failed to fetch task component data:", err);
    }
  };

  if (!isOpen || !task) return null;

  // Subtask Handlers
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ taskId: task.id, title: newSubtaskTitle.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setSubtasks((prev) => [...prev, data]);
        setNewSubtaskTitle("");
        fetchTaskData(task.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    try {
      const res = await fetch(`/api/subtasks/${sub.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ completed: !sub.completed })
      });

      if (res.ok) {
        setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, completed: !s.completed } : s)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    try {
      const res = await fetch(`/api/subtasks/${subId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setSubtasks((prev) => prev.filter((s) => s.id !== subId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comment Handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data]);
        setNewComment("");
        fetchTaskData(task.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attachment Handler
  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim() || !attachmentUrl.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: attachmentName.trim(),
          url: attachmentUrl.trim(),
          mimeType: "image/png",
          size: 250000
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, data]);
        setAttachmentName("");
        setAttachmentUrl("");
        fetchTaskData(task.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop attachment handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadMockFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMockFile(e.target.files[0]);
    }
  };

  const uploadMockFile = async (file: File) => {
    // Simulate uploading by converting to ObjectURL or random mock image
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/attachments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            name: file.name,
            url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
            mimeType: file.type || "application/octet-stream",
            size: file.size
          })
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments((prev) => [...prev, data]);
          fetchTaskData(task.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      const res = await fetch(`/api/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Field change updates
  const handleFieldChange = (field: keyof Task, value: any) => {
    if (!task) return;
    const updatedTask = { ...task, [field]: value };
    setTask(updatedTask);
    onUpdateTask(task.id, { [field]: value });
  };

  const getCreatorName = (id: string) => {
    const u = users.find((user) => user.id === id);
    return u ? u.fullName : "Unknown Reporter";
  };

  const getAssignee = () => {
    return users.find((u) => u.id === task.assigneeId);
  };

  return (
    <div id="task-modal-overlay" className="fixed inset-0 z-40 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-all duration-300">
      {/* Detail drawer sliding from the right */}
      <div
        id="task-drawer"
        className="h-full w-full max-w-3xl bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-950">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-400 bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded-md">
              {task.id.toUpperCase()}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Task Details</span>
          </div>

          <div className="flex items-center space-x-3">
            {canDelete ? (
              <button
                id="task-delete-btn"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this task ticket?")) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Task Ticket"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            ) : (
              <div
                className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10 border border-amber-500/20 flex items-center space-x-1"
                title="Only Organization Owners and Project Managers can delete tickets"
              >
                <Lock className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Gated</span>
              </div>
            )}
            <button
              id="task-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body content */}
        <div id="task-modal-body" className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Main Title Input */}
          <div className="space-y-1">
            <input
              id="task-title-input"
              type="text"
              value={task.title}
              disabled={isClient}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-800 focus:border-blue-500 focus:outline-hidden py-1 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          {/* Quick status & assignment Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-900/50 rounded-xl p-4">
            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-400 uppercase">Status</label>
              <div className="relative">
                <select
                  id="task-status-select"
                  value={task.status}
                  disabled={isClient}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="w-full appearance-none rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden disabled:opacity-65 disabled:bg-gray-100/50 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
                >
                  {Object.values(TaskStatus).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center space-x-1">
                <span>Priority</span>
                {!canChangeAdminFields && <Lock className="h-2 w-2 text-amber-500" />}
              </label>
              <div className="relative">
                <select
                  id="task-priority-select"
                  value={task.priority}
                  disabled={!canChangeAdminFields}
                  onChange={(e) => handleFieldChange("priority", e.target.value)}
                  className="w-full appearance-none rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden disabled:opacity-65 disabled:bg-gray-100/50 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
                >
                  {Object.values(TaskPriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Assignee Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-400 uppercase">Assignee</label>
              <div className="relative">
                <select
                  id="task-assignee-select"
                  value={task.assigneeId || ""}
                  disabled={isClient}
                  onChange={(e) => handleFieldChange("assigneeId", e.target.value || undefined)}
                  className="w-full appearance-none rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden disabled:opacity-65 disabled:bg-gray-100/50 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Due Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-400 uppercase">Due Date</label>
              <input
                id="task-date-input"
                type="date"
                value={task.dueDate || ""}
                disabled={isClient}
                onChange={(e) => handleFieldChange("dueDate", e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden disabled:opacity-65 disabled:bg-gray-100/50 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Story Points Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center space-x-1">
                <span>Story Points</span>
                {!canChangeAdminFields && <Lock className="h-2 w-2 text-amber-500" />}
              </label>
              <div className="relative">
                <select
                  id="task-points-select"
                  value={task.points || ""}
                  disabled={!canChangeAdminFields}
                  onChange={(e) => handleFieldChange("points", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full appearance-none rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-hidden disabled:opacity-65 disabled:bg-gray-100/50 dark:disabled:bg-gray-900/50 disabled:cursor-not-allowed"
                >
                  <option value="">Unestimated</option>
                  <option value="1">1 pt (Trivial)</option>
                  <option value="2">2 pts (Small)</option>
                  <option value="3">3 pts (Medium)</option>
                  <option value="5">5 pts (Average)</option>
                  <option value="8">8 pts (Large)</option>
                  <option value="13">13 pts (Epic)</option>
                  <option value="21">21 pts (Complex)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              Description
            </label>
            <textarea
              id="task-desc-area"
              value={task.description}
              rows={4}
              disabled={isClient}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Provide a detailed outline of tasks, objectives, and deliverables..."
              className="w-full text-xs text-gray-950 dark:text-gray-100 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 focus:border-blue-500 focus:outline-hidden rounded-lg p-3 transition-all leading-relaxed"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <span>Subtasks Checklist</span>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-mono">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length}
              </span>
            </h4>

            {/* Subtask items */}
            <div id="subtask-list" className="space-y-2">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between group bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-900/50 rounded-lg p-2.5">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <button id={`toggle-sub-${st.id}`} onClick={() => handleToggleSubtask(st)} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <CheckCircle2 className={`h-4.5 w-4.5 ${st.completed ? "text-emerald-500 fill-emerald-100 dark:fill-emerald-950/20" : ""}`} />
                    </button>
                    <span className={`text-xs truncate ${st.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    id={`del-sub-${st.id}`}
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            <form id="add-subtask-form" onSubmit={handleAddSubtask} className="flex space-x-2">
              <input
                id="subtask-title-input"
                type="text"
                placeholder="Add a new checklist subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden focus:border-blue-500"
              />
              <button
                id="add-subtask-btn"
                type="submit"
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-950 rounded-lg px-3.5 py-1.5 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Interactive File Drag & Drop + Attachments list */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-blue-500" />
              <span>File Attachments</span>
            </h4>

            {/* Drag & Drop Area */}
            <div
              id="attachment-dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${
                isDragActive
                  ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/20 dark:bg-gray-900/5"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto text-slate-500 dark:text-gray-400 mb-2 animate-bounce" />
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Drag & drop files here, or{" "}
                <label className="text-blue-600 font-semibold cursor-pointer hover:underline">
                  browse local files
                  <input
                    id="file-browse-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Supports images, documents, and code assets.
              </p>
            </div>

            {/* Web URL Attachment Fallback */}
            <form id="url-attachment-form" onSubmit={handleAddAttachment} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                id="att-name-input"
                type="text"
                placeholder="Attachment label (e.g. Design Spec)"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
              />
              <input
                id="att-url-input"
                type="text"
                placeholder="Paste web link or file URL..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden md:col-span-2"
              />
              <button
                id="att-add-btn"
                type="submit"
                className="md:col-span-3 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-800/80 transition-colors"
              >
                Link Attachment
              </button>
            </form>

            {/* List active attachments */}
            <div id="attachment-list" className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between border border-gray-100 dark:border-gray-900 rounded-xl p-3 bg-white dark:bg-gray-950/20 shadow-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg border border-gray-100 dark:border-gray-900 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      {att.mimeType.startsWith("image/") ? (
                        <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-gray-800 dark:text-gray-200">{att.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{(att.size / 1024).toFixed(0)} KB</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <a
                      id={`att-dl-${att.id}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                      title="Download/Preview Attachment"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      id={`att-del-${att.id}`}
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Streams */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>Comments Stream</span>
            </h4>

            {/* List active comments */}
            <div id="comments-list" className="space-y-4">
              {comments.map((c) => {
                const commentator = users.find((u) => u.id === c.userId);
                return (
                  <div key={c.id} className="flex space-x-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold font-mono border border-gray-200 dark:border-gray-700">
                      {commentator ? commentator.avatar : "U"}
                    </div>
                    <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-900/50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{commentator ? commentator.fullName : "Unknown"}</span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Comment Input Form */}
            <form id="comment-form" onSubmit={handleAddComment} className="flex space-x-2">
              <input
                id="comment-input"
                type="text"
                placeholder="Write a comment... use @Username to tag team contributors."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <button
                id="comment-submit-btn"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors shadow-xs"
              >
                Send
              </button>
            </form>
          </div>

          {/* Activity Logs Timeline */}
          {activities.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <History className="h-4 w-4 text-blue-500" />
                <span>Ticket Audit Log</span>
              </h4>
              <div id="audit-timeline" className="space-y-3 pl-2.5 border-l border-gray-200 dark:border-gray-800">
                {activities.map((act) => (
                  <div key={act.id} className="relative flex space-x-3 text-xs">
                    <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-950 bg-blue-500"></span>
                    <div className="flex-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{getCreatorName(act.userId)}</span>{" "}
                      {act.action} — <span className="italic">{act.details}</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
