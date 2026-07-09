import React, { useState } from "react";
import {
  Kanban,
  List,
  CalendarDays,
  GanttChartSquare,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  User,
  Plus,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  X
} from "lucide-react";
import { Task, Project, User as WorkspaceUser, TaskStatus, TaskPriority, CalendarEvent, CalendarEventType } from "../types.ts";

interface CalendarGanttProps {
  tasks: Task[];
  projects: Project[];
  users: WorkspaceUser[];
  activeProject: Project | null;
  onSelectTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent: (event: Partial<CalendarEvent>) => void;
}

type ProjectView = "kanban" | "list" | "timeline" | "calendar" | "table";

export default function CalendarGantt({
  tasks,
  projects,
  users,
  activeProject,
  onSelectTask,
  onUpdateTaskStatus,
  onAddTask,
  calendarEvents,
  onAddCalendarEvent
}: CalendarGanttProps) {
  const [activeView, setActiveView] = useState<ProjectView>("kanban");

  // List View Collapsible States
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Table Sorting States
  const [sortField, setSortField] = useState<keyof Task | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date("2026-07-05")); // Mock baseline consistent with system date
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [selectedCalDate, setSelectedCalDate] = useState("");
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDesc, setMeetDesc] = useState("");

  const filteredTasks = activeProject
    ? tasks.filter((t) => t.projectId === activeProject.id)
    : tasks;

  const getUser = (id?: string) => {
    return users.find((u) => u.id === id);
  };

  // ----------------------------------------------------
  // KANBAN DRAG & DROP HANDLERS
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
  };

  // ----------------------------------------------------
  // LIST EXPAND/COLLAPSE HANDLERS
  // ----------------------------------------------------
  const toggleCollapse = (status: string) => {
    setCollapsedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  // ----------------------------------------------------
  // TABLE SORT HANDLERS
  // ----------------------------------------------------
  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSortedTasks = () => {
    if (!sortField) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (Array.isArray(valA) || Array.isArray(valB)) return 0;
      if (typeof valA === "object" || typeof valB === "object") return 0;

      if (valA === undefined) valA = "";
      if (valB === undefined) valB = "";

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  };

  // ----------------------------------------------------
  // CALENDAR CALCULATION HELPERS
  // ----------------------------------------------------
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells: React.ReactNode[] = [];

    // Empty spaces for previous month overflow
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-28 bg-gray-50/40 dark:bg-gray-900/10 border border-gray-100 dark:border-gray-900/40"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      
      // Match task deadlines
      const dayTasks = filteredTasks.filter((t) => t.dueDate === dateString);
      // Match meetings
      const dayEvents = calendarEvents.filter((e) => e.startDate.startsWith(dateString));

      cells.push(
        <div
          key={day}
          onClick={() => {
            setSelectedCalDate(dateString);
            setMeetTitle("");
            setMeetDesc("");
            setShowMeetModal(true);
          }}
          className="h-28 border border-gray-100 dark:border-gray-900/40 p-2 overflow-y-auto hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-bold font-mono ${dateString === "2026-07-05" ? "bg-blue-600 text-white px-1.5 py-0.5 rounded-sm" : "text-gray-500"}`}>
              {day}
            </span>
          </div>

          <div className="space-y-1 overflow-hidden mt-1.5">
            {/* Meetings mapping */}
            {dayEvents.map((ev) => (
              <div key={ev.id} className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-sm truncate flex items-center space-x-0.5" title={ev.title}>
                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{ev.title}</span>
              </div>
            ))}

            {/* Task deadlines mapping */}
            {dayTasks.map((t) => (
              <div
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask(t.id);
                }}
                className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-sm truncate hover:bg-blue-500/20 transition-all"
                title={t.title}
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    onAddCalendarEvent({
      projectId: activeProject?.id || "p-forge",
      title: meetTitle.trim(),
      description: meetDesc.trim(),
      startDate: `${selectedCalDate}T10:00:00Z`,
      endDate: `${selectedCalDate}T11:00:00Z`,
      type: CalendarEventType.MEETING,
      attendees: ["u-owner"]
    });

    setShowMeetModal(false);
  };

  return (
    <div id="calendar-gantt-root" className="space-y-4">
      {/* View Switch Toolbar */}
      <div className="flex flex-wrap items-center justify-between border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 bg-white dark:bg-gray-950 gap-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          <button
            id="view-kanban"
            onClick={() => setActiveView("kanban")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "kanban"
                ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <Kanban className="h-4 w-4 text-blue-500" />
            <span>Kanban Board</span>
          </button>

          <button
            id="view-list"
            onClick={() => setActiveView("list")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "list"
                ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <List className="h-4 w-4 text-purple-500" />
            <span>List View</span>
          </button>

          <button
            id="view-timeline"
            onClick={() => setActiveView("timeline")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "timeline"
                ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <GanttChartSquare className="h-4 w-4 text-indigo-500" />
            <span>Gantt Timeline</span>
          </button>

          <button
            id="view-calendar"
            onClick={() => setActiveView("calendar")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "calendar"
                ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            <span>Calendar View</span>
          </button>

          <button
            id="view-table"
            onClick={() => setActiveView("table")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "table"
                ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <TableIcon className="h-4 w-4 text-rose-500" />
            <span>Table Grid</span>
          </button>
        </div>

        {activeProject && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-sm">
              {filteredTasks.length} ISSUES
            </span>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          1. KANBAN BOARD VIEW
          ---------------------------------------------------- */}
      {activeView === "kanban" && (
        <div id="view-kanban-root" className="flex flex-row overflow-x-auto gap-4 pb-4 items-start scrollbar-thin">
          {Object.values(TaskStatus).map((status) => {
            const statusTasks = filteredTasks.filter((t) => t.status === status);

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="bg-gray-100/70 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800/80 rounded-xl p-3 flex flex-col w-[260px] md:w-[280px] shrink-0 max-h-[600px] shadow-xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      status === TaskStatus.BACKLOG ? "bg-gray-400" :
                      status === TaskStatus.TODO ? "bg-blue-500" :
                      status === TaskStatus.IN_PROGRESS ? "bg-amber-500" :
                      status === TaskStatus.REVIEW ? "bg-purple-500" :
                      status === TaskStatus.TESTING ? "bg-pink-500" : "bg-emerald-500"
                    }`}></span>
                    <span className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">{status}</span>
                  </div>
                  <span className="text-[10px] font-black font-mono text-slate-900 dark:text-slate-300 bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm">
                    {statusTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin min-h-[150px]">
                  {statusTasks.map((t) => {
                    const dev = getUser(t.assigneeId);

                    return (
                      <div
                        key={t.id}
                        id={`card-${t.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => onSelectTask(t.id)}
                        className="group border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500/80 bg-white dark:bg-gray-950 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
                      >
                        {/* Tags */}
                        {t.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {t.labels.slice(0, 2).map((lbl) => (
                              <span key={lbl} className="text-[9px] font-mono font-semibold bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-sm">
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}

                        <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 transition-colors">
                          {t.title}
                        </h5>

                        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-50 dark:border-gray-900">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-sm ${
                              t.priority === TaskPriority.HIGH ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" :
                              t.priority === TaskPriority.MEDIUM ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" :
                              "bg-gray-100 dark:bg-gray-800 text-gray-500"
                            }`}>
                              {t.priority}
                            </span>
                          </div>

                          {dev ? (
                            <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[9px] font-black font-mono text-blue-600 dark:text-blue-300" title={dev.fullName}>
                              {dev.avatar}
                            </div>
                          ) : (
                            <User className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column Footer Action */}
                <button
                  id={`add-task-${status}`}
                  onClick={() => onAddTask(status)}
                  className="w-full mt-3.5 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-950 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-slate-400 hover:text-black dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span>Create ticket</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------
          2. LIST VIEW (COLLAPSIBLE STATUSES)
          ---------------------------------------------------- */}
      {activeView === "list" && (
        <div id="view-list-root" className="space-y-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          {Object.values(TaskStatus).map((status) => {
            const statusTasks = filteredTasks.filter((t) => t.status === status);
            const isCollapsed = collapsedSections[status];

            return (
              <div key={status} className="border border-gray-100 dark:border-gray-900 rounded-lg overflow-hidden">
                {/* Section trigger */}
                <button
                  id={`list-toggle-${status}`}
                  onClick={() => toggleCollapse(status)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    <span className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">{status}</span>
                    <span className="text-[10px] font-black font-mono text-slate-900 dark:text-slate-300 bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm">
                      {statusTasks.length}
                    </span>
                  </div>
                </button>

                {/* Subtasks items row list */}
                {!isCollapsed && (
                  <div id={`list-content-${status}`} className="divide-y divide-gray-50 dark:divide-gray-900">
                    {statusTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 italic">No tasks active in this section.</div>
                    ) : (
                      statusTasks.map((t) => {
                        const dev = getUser(t.assigneeId);
                        return (
                          <div
                            key={t.id}
                            id={`row-${t.id}`}
                            onClick={() => onSelectTask(t.id)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/20 dark:hover:bg-gray-900/10 cursor-pointer transition-all"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <span className="text-[10px] font-bold font-mono text-gray-400 w-16">{t.id.toUpperCase()}</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{t.title}</span>
                            </div>

                            <div className="flex items-center space-x-4 ml-4">
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                t.priority === TaskPriority.HIGH ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" :
                                t.priority === TaskPriority.MEDIUM ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" :
                                "bg-gray-100 dark:bg-gray-800 text-gray-500"
                              }`}>
                                {t.priority}
                              </span>

                              {t.dueDate && (
                                <span className="text-[10px] text-gray-400 font-mono flex items-center">
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  <span>{t.dueDate}</span>
                                </span>
                              )}

                              {dev ? (
                                <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[9px] font-black font-mono text-blue-600 dark:text-blue-300" title={dev.fullName}>
                                  {dev.avatar}
                                </div>
                              ) : (
                                <User className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------
          3. TIMELINE (GANTT TIMELINE VIEW)
          ---------------------------------------------------- */}
      {activeView === "timeline" && (
        <div id="view-timeline-root" className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[700px] space-y-4">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider font-mono">Gantt Milestones & Timelines</h4>
            
            {/* Timeline scale header */}
            <div className="grid grid-cols-12 gap-1 border-b border-gray-100 dark:border-gray-900 pb-2 text-[10px] font-mono text-gray-400 uppercase font-semibold">
              <div className="col-span-3">Task / ticket</div>
              <div className="col-span-1 text-center">Jun</div>
              <div className="col-span-2 text-center">Jul (W1)</div>
              <div className="col-span-2 text-center">Jul (W2)</div>
              <div className="col-span-2 text-center">Jul (W3)</div>
              <div className="col-span-1 text-center">Aug</div>
              <div className="col-span-1 text-center">Sep</div>
            </div>

            {/* Rows mapping horizontal bars */}
            <div id="gantt-rows" className="space-y-3.5">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">No project task data to plot on timeline.</div>
              ) : (
                filteredTasks.map((t) => {
                  // Determine offset spans for visualization based on priorities & ids
                  let leftOffset = "25%";
                  let barWidth = "40%";

                  if (t.id === "tsk-1" || t.id.includes("1")) {
                    leftOffset = "8%";
                    barWidth = "25%";
                  } else if (t.id === "tsk-2" || t.id.includes("2")) {
                    leftOffset = "25%";
                    barWidth = "30%";
                  } else if (t.id === "tsk-3" || t.id.includes("3")) {
                    leftOffset = "45%";
                    barWidth = "45%";
                  } else if (t.id === "tsk-4" || t.id.includes("4")) {
                    leftOffset = "60%";
                    barWidth = "30%";
                  } else if (t.id === "tsk-5" || t.id.includes("5")) {
                    leftOffset = "40%";
                    barWidth = "20%";
                  }

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t.id)}
                      className="grid grid-cols-12 items-center gap-1 group py-1.5 hover:bg-gray-50/20 dark:hover:bg-gray-900/10 rounded-lg cursor-pointer transition-all"
                    >
                      <div className="col-span-3 min-w-0 pr-3">
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-500">{t.title}</div>
                        <div className="text-[9px] font-mono text-gray-400 mt-0.5">{t.id.toUpperCase()} • Due: {t.dueDate || "N/A"}</div>
                      </div>

                      {/* Timeline horizontal track */}
                      <div className="col-span-9 h-6 relative bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100/50 dark:border-gray-900/50 rounded-lg overflow-hidden">
                        {/* Task Gantt Bar */}
                        <div
                          className={`absolute top-1 h-4 rounded-full flex items-center justify-between px-2 text-[8px] font-bold text-white transition-all ${
                            t.status === TaskStatus.COMPLETED ? "bg-emerald-600 dark:bg-emerald-500" :
                            t.status === TaskStatus.IN_PROGRESS ? "bg-amber-600 dark:bg-amber-500" :
                            t.status === TaskStatus.REVIEW ? "bg-purple-600 dark:bg-purple-500" :
                            t.status === TaskStatus.TESTING ? "bg-pink-600 dark:bg-pink-500" :
                            t.status === TaskStatus.TODO ? "bg-blue-600 dark:bg-blue-500" :
                            "bg-gray-600 dark:bg-gray-500"
                          }`}
                          style={{ left: leftOffset, width: barWidth }}
                        >
                          <span className="truncate">{t.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          4. CALENDAR VIEW (MONTHLY GRID)
          ---------------------------------------------------- */}
      {activeView === "calendar" && (
        <div id="view-calendar-root" className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider font-mono">July 2026 Calendar Grid</h4>
            <div className="text-[10px] text-gray-400 font-mono">
              * Click any cell grid day to schedule sprint syncs or client milestones.
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Monthly days grid */}
          <div id="calendar-days-grid" className="grid grid-cols-7 gap-1">
            {renderCalendarCells()}
          </div>

          {/* Calendar Event Schedule Overlay Modal Dialog */}
          {showMeetModal && (
            <div id="meeting-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
              <form onSubmit={handleScheduleMeeting} className="w-full max-w-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-5 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-2">
                  <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <Calendar className="h-4.5 w-4.5 mr-1.5 text-emerald-500" />
                    <span>Schedule Meeting on {selectedCalDate}</span>
                  </h5>
                  <button type="button" onClick={() => setShowMeetModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Meeting Title</label>
                    <input
                      id="meet-title"
                      type="text"
                      required
                      placeholder="e.g. Daily Backlog Review..."
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Description</label>
                    <textarea
                      id="meet-desc"
                      rows={2}
                      placeholder="Link notes, summary, agenda outline..."
                      value={meetDesc}
                      onChange={(e) => setMeetDesc(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  id="meet-submit"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  Schedule Event Block
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          5. TABLE GRID VIEW
          ---------------------------------------------------- */}
      {activeView === "table" && (
        <div id="view-table-root" className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/30 text-gray-400 border-b border-gray-100 dark:border-gray-900 uppercase font-mono text-[9px] tracking-wider">
                  <th className="p-3.5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/50" onClick={() => handleSort("id")}>ID</th>
                  <th className="p-3.5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/50" onClick={() => handleSort("title")}>Title</th>
                  <th className="p-3.5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/50" onClick={() => handleSort("status")}>Status</th>
                  <th className="p-3.5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/50" onClick={() => handleSort("priority")}>Priority</th>
                  <th className="p-3.5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-900/50" onClick={() => handleSort("dueDate")}>Due Date</th>
                  <th className="p-3.5">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                {getSortedTasks().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400 italic">No task tickets found matching query.</td>
                  </tr>
                ) : (
                  getSortedTasks().map((t) => {
                    const dev = getUser(t.assigneeId);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => onSelectTask(t.id)}
                        className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-mono text-[10px] font-bold text-gray-400">{t.id.toUpperCase()}</td>
                        <td className="p-3.5 font-semibold text-gray-900 dark:text-gray-100">{t.title}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === TaskStatus.COMPLETED ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" :
                            t.status === TaskStatus.IN_PROGRESS ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600" :
                            "bg-blue-50 dark:bg-blue-950/20 text-blue-600"
                          }`}>
                            <span>{t.status}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-sm ${
                            t.priority === TaskPriority.HIGH ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" :
                            t.priority === TaskPriority.MEDIUM ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" :
                            "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-gray-400">{t.dueDate || "N/A"}</td>
                        <td className="p-3.5">
                          {dev ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[9px] font-black font-mono text-blue-600 dark:text-blue-300">
                                {dev.avatar}
                              </div>
                              <span className="font-semibold text-gray-800 dark:text-gray-300 text-xs">{dev.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-700 font-medium">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
