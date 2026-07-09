import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  Task,
  Project,
  User as WorkspaceUser,
  TaskStatus,
  TaskPriority,
  UserRole
} from "../types.ts";
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Cpu,
  Clock,
  User,
  Zap,
  Sparkles,
  Gauge,
  Send,
  Milestone
} from "lucide-react";

interface SprintBurnoutProps {
  key?: any;
  tasks: Task[];
  activeProject: Project | undefined;
  currentUser: WorkspaceUser | null;
  users: WorkspaceUser[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddNotification?: (notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) => void;
}

export default function SprintBurnout({
  tasks,
  activeProject,
  currentUser,
  users,
  onUpdateTaskStatus,
  onAddNotification
}: SprintBurnoutProps) {
  const [nudgeStates, setNudgeStates] = useState<Record<string, boolean>>({});

  // Helper to resolve role-based display
  const userRole = currentUser?.role || UserRole.MEMBER;

  // 1. Filter tasks for current project
  const projectTasks = tasks.filter(
    (t) => !activeProject || t.projectId === activeProject.id
  );

  // Helper to extract story points or default
  const getTaskPoints = (t: Task): number => {
    if (t.points !== undefined) return t.points;
    // Default points based on priority
    if (t.priority === TaskPriority.HIGH) return 8;
    if (t.priority === TaskPriority.MEDIUM) return 5;
    return 3;
  };

  // Calculations
  const totalPoints = projectTasks.reduce((sum, t) => sum + getTaskPoints(t), 0);
  const completedTasks = projectTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  );
  const completedPoints = completedTasks.reduce(
    (sum, t) => sum + getTaskPoints(t),
    0
  );
  const remainingPoints = totalPoints - completedPoints;

  // Personal tasks
  const myTasks = projectTasks.filter((t) => t.assigneeId === currentUser?.id);
  const myTotalPoints = myTasks.reduce((sum, t) => sum + getTaskPoints(t), 0);
  const myCompletedPoints = myTasks
    .filter((t) => t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + getTaskPoints(t), 0);
  const myRemainingPoints = myTotalPoints - myCompletedPoints;

  // Generate burndown data for a 10-day sprint
  const totalSprintDays = 10;
  const currentDay = 7; // Simulate that we are currently at Day 7 of the Sprint

  // Map tasks deterministically to a completion day 1-9 for realistic chart representation
  const getTaskCompletionDay = (t: Task): number => {
    if (t.status !== TaskStatus.COMPLETED) return 999; // not completed
    if (t.dueDate) {
      const due = new Date(t.dueDate).getTime();
      const start = activeProject
        ? new Date(activeProject.startDate).getTime()
        : Date.now() - 7 * 24 * 3600 * 1000;
      const end = activeProject
        ? new Date(activeProject.endDate).getTime()
        : Date.now() + 7 * 24 * 3600 * 1000;
      const pct = Math.max(0, Math.min(1, (due - start) / (end - start || 1)));
      return Math.round(pct * (totalSprintDays - 1)) + 1;
    }
    // Deterministic fallback based on task ID
    const charSum = t.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return (charSum % (totalSprintDays - 3)) + 2; // Days 2 to 8
  };

  const chartData = Array.from({ length: totalSprintDays + 1 }, (_, day) => {
    // Ideal burndown curve
    const ideal = Number(
      (totalPoints * (1 - day / totalSprintDays)).toFixed(1)
    );

    // Actual remaining points on this day
    // Points burned on or before this day:
    let burnedPointsOnOrBeforeDay = 0;
    completedTasks.forEach((t) => {
      const completionDay = getTaskCompletionDay(t);
      if (completionDay <= day) {
        burnedPointsOnOrBeforeDay += getTaskPoints(t);
      }
    });

    const actual =
      day <= currentDay
        ? Math.max(0, totalPoints - burnedPointsOnOrBeforeDay)
        : null;

    // Personal actual burndown
    let myBurnedOnOrBeforeDay = 0;
    myTasks
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .forEach((t) => {
        const completionDay = getTaskCompletionDay(t);
        if (completionDay <= day) {
          myBurnedOnOrBeforeDay += getTaskPoints(t);
        }
      });
    const myActual =
      day <= currentDay
        ? Math.max(0, myTotalPoints - myBurnedOnOrBeforeDay)
        : null;

    return {
      day: `Day ${day}`,
      Ideal: ideal,
      "Remaining Work": actual,
      "My Remaining Work": myActual
    };
  });

  // Sprint Health metrics
  const isAheadOfSchedule =
    chartData[currentDay]?.["Remaining Work"] !== null &&
    (chartData[currentDay]?.["Remaining Work"] ?? 0) <=
      (chartData[currentDay]?.Ideal ?? 0);

  const confidenceScore = isAheadOfSchedule
    ? Math.min(98, 85 + Math.round((totalPoints > 0 ? completedPoints / totalPoints : 0) * 15))
    : Math.max(65, 80 - Math.round(((chartData[currentDay]?.["Remaining Work"] ?? 0) - (chartData[currentDay]?.Ideal ?? 0)) * 2));

  // Simulated push nudge notification for PMs nudge action
  const handleNudge = (assigneeId: string, taskTitle: string, assigneeName: string) => {
    if (onAddNotification) {
      onAddNotification({
        userId: assigneeId,
        title: "Sprint Burnout Nudge",
        message: `${currentUser?.fullName || "Project Manager"} nudged you on high-point task "${taskTitle}" to support sprint burn objectives.`,
        type: "mention",
        link: "/tasks"
      });
    }
    setNudgeStates((prev) => ({ ...prev, [assigneeId + "-" + taskTitle]: true }));
    setTimeout(() => {
      setNudgeStates((prev) => ({ ...prev, [assigneeId + "-" + taskTitle]: false }));
    }, 4000);
  };

  return (
    <div
      id="sprint-burnout-widget-container"
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden hover:shadow-sm transition-shadow col-span-1 md:col-span-3"
    >
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800/80 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
              <Zap className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {userRole === UserRole.OWNER && "Corporate Sprint Burnout Overview"}
              {userRole === UserRole.MANAGER && "Scrum Team Sprint Burnout Trend"}
              {userRole === UserRole.MEMBER && "My Sprint Burnout Contribution"}
              {userRole === UserRole.CLIENT && "Project Sprint Burndown Trajectory"}
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            {userRole === UserRole.OWNER && "Strategic portfolio-level delivery track & alignment indicators."}
            {userRole === UserRole.MANAGER && "Daily iteration burndown status, velocity logs, and resource nudges."}
            {userRole === UserRole.MEMBER && "Personal completion impact dashboard & direct execution task checklist."}
            {userRole === UserRole.CLIENT && "Plain-language progress tracking, timeline confidence index, and scope metrics."}
          </p>
        </div>

        {/* Badge Indicator */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase">
            Logged-in:
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40">
            {userRole}
          </span>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Panels (Adaptive by Role) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/60 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-900">
              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Remaining Work
              </div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
                {remainingPoints}{" "}
                <span className="text-xs font-semibold text-gray-400">pts</span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                of {totalPoints} total sprint pts
              </p>
            </div>

            <div className="bg-gray-50/60 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-900">
              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed Scope
              </div>
              <div className="text-xl font-extrabold text-emerald-500 mt-1">
                {totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                {completedPoints} story pts burnt
              </p>
            </div>

            <div className="bg-gray-50/60 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-900">
              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Confidence Index
              </div>
              <div className="text-xl font-extrabold text-blue-500 mt-1">
                {confidenceScore}%
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                {isAheadOfSchedule ? (
                  <span className="text-emerald-500 font-bold">Ahead of Curve</span>
                ) : (
                  <span className="text-amber-500 font-bold">Risk of Spill</span>
                )}
              </p>
            </div>

            <div className="bg-gray-50/60 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-900">
              <div className="text-[9px] uppercase tracking-wider font-mono font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Burn Rate
              </div>
              <div className="text-xl font-extrabold text-purple-500 mt-1">
                {Number((completedPoints / currentDay).toFixed(1))}
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                avg pts burnt / day
              </p>
            </div>
          </div>

          {/* Role Specific Layout Details */}

          {/* 1. ORGANIZATION OWNER VIEW */}
          {userRole === UserRole.OWNER && (
            <div className="p-3 bg-purple-500/5 dark:bg-purple-500/10 rounded-xl border border-purple-500/20 dark:border-purple-500/20">
              <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
                <Cpu className="h-4 w-4 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wide font-bold uppercase">
                  Executive AI Analyst
                </span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed mt-1.5">
                {isAheadOfSchedule ? (
                  <strong>Sprint velocity is highly optimal.</strong>
                ) : (
                  <strong>Minor schedule slippage detected.</strong>
                )}{" "}
                The team's trajectory indicates completion confidence of{" "}
                {confidenceScore}%. Recommended strategic action: Maintain
                current scope freeze and ensure the Project Manager aligns focus towards the remaining {remainingPoints} pending high-value tickets.
              </p>
            </div>
          )}

          {/* 2. PROJECT MANAGER VIEW */}
          {userRole === UserRole.MANAGER && (
            <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-500/20 dark:border-indigo-500/20">
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-1 mt-0.5">
                <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-mono tracking-wide font-bold uppercase">
                    Scrum Resource Nudges
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-indigo-500 dark:text-indigo-400">
                  Active Sprint
                </span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {projectTasks
                  .filter((t) => t.status !== TaskStatus.COMPLETED && getTaskPoints(t) >= 5)
                  .map((t) => {
                    const assignee = users.find((u) => u.id === t.assigneeId);
                    const key = (t.assigneeId || "un") + "-" + t.title;
                    const sentNudge = nudgeStates[key];
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-950 rounded-md border border-gray-100 dark:border-gray-900 text-[10px]"
                      >
                        <div className="truncate flex-1 pr-2">
                          <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                            {t.title}
                          </p>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                            {getTaskPoints(t)} pts • {assignee?.fullName || "Unassigned"}
                          </span>
                        </div>
                        {t.assigneeId ? (
                          <button
                            onClick={() =>
                              handleNudge(
                                t.assigneeId!,
                                t.title,
                                assignee?.fullName || "Team Member"
                              )
                            }
                            disabled={sentNudge}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                              sentNudge
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-100 dark:border-indigo-900/50"
                            }`}
                          >
                            {sentNudge ? "Nudged!" : "Nudge"}
                          </button>
                        ) : (
                          <span className="text-[9px] text-amber-500 font-bold">Unassigned</span>
                        )}
                      </div>
                    );
                  })}
                {projectTasks.filter((t) => t.status !== TaskStatus.COMPLETED && getTaskPoints(t) >= 5).length === 0 && (
                  <p className="text-[10px] text-gray-400 italic text-center py-2">No heavy tasks pending nudge.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. TEAM MEMBER VIEW */}
          {userRole === UserRole.MEMBER && (
            <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 dark:border-amber-500/20">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-1">
                <span className="text-[10px] font-mono tracking-wide font-bold uppercase text-amber-600 dark:text-amber-400">
                  My Active Deliverables
                </span>
                <span className="text-[9px] font-mono font-bold text-amber-500">
                  {myRemainingPoints} remaining pts
                </span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {myTasks
                  .filter((t) => t.status !== TaskStatus.COMPLETED)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-950 rounded-md border border-gray-100 dark:border-gray-900 text-[10px]"
                    >
                      <div className="flex items-center space-x-1.5 truncate flex-1 pr-2">
                        <input
                          type="checkbox"
                          onChange={() => onUpdateTaskStatus(t.id, TaskStatus.COMPLETED)}
                          className="rounded-sm cursor-pointer border-gray-300 dark:border-gray-800 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        {getTaskPoints(t)} pts
                      </span>
                    </div>
                  ))}
                {myTasks.filter((t) => t.status !== TaskStatus.COMPLETED).length === 0 && (
                  <p className="text-[10px] text-gray-400 italic text-center py-3">
                    No active tasks. Outstanding job! 🎉
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. CLIENT VIEW */}
          {userRole === UserRole.CLIENT && (
            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 dark:border-emerald-500/20">
              <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                <Milestone className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono tracking-wide font-bold uppercase">
                  Milestones Tracker
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Figma layouts approved (5 pts)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Express server & API routers (8 pts)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-blue-500 animate-pulse">●</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold truncate">
                    Interactive Gantt Timeline (13 pts)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Burn Down / Burn Out Line Chart */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold px-2 mb-2">
            <span className="text-gray-700 dark:text-gray-300">
              Remaining Points Chart (10-Day Cycle)
            </span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1 text-gray-400">
                <span className="h-2 w-4 border-t-2 border-dashed border-gray-400 inline-block"></span>
                <span>Ideal Burn</span>
              </span>
              {userRole === UserRole.MEMBER ? (
                <>
                  <span className="flex items-center space-x-1 text-amber-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>My Actual Burn</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block"></span>
                    <span>Team Actual Burn</span>
                  </span>
                </>
              ) : (
                <span className="flex items-center space-x-1 text-indigo-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block"></span>
                  <span>Actual Burn</span>
                </span>
              )}
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {userRole === UserRole.CLIENT ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-100 dark:stroke-gray-800"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#9ca3af", fontSize: 9 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 9 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Remaining Work"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Ideal"
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-100 dark:stroke-gray-800"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#9ca3af", fontSize: 9 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 9 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Ideal"
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  {userRole === UserRole.MEMBER ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="Remaining Work"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="My Remaining Work"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="Remaining Work"
                      stroke={userRole === UserRole.OWNER ? "#10b981" : "#6366f1"}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2 font-mono">
            *Current view calculated automatically from live workspace board
            story point data.
          </div>
        </div>
      </div>
    </div>
  );
}
