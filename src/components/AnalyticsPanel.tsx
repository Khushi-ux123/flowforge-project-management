import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Task, Project, User as WorkspaceUser, TaskStatus, UserRole } from "../types.ts";
import { TrendingUp, DollarSign, CheckSquare, Users, AlertCircle, Lock } from "lucide-react";

interface AnalyticsPanelProps {
  tasks: Task[];
  projects: Project[];
  users: WorkspaceUser[];
  currentUser: WorkspaceUser | null;
}

export default function AnalyticsPanel({ tasks, projects, users, currentUser }: AnalyticsPanelProps) {
  const userRole = currentUser?.role || UserRole.MEMBER;
  const canViewFinancials = userRole === UserRole.OWNER || userRole === UserRole.MANAGER;

  // 1. Task Status Distribution
  const statusCounts = Object.values(TaskStatus).reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const COLORS = ["#9ca3af", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#10b981"];

  // 2. Workload Distribution (Active tasks per user)
  const workloadData = users.map((u) => {
    const activeCount = tasks.filter((t) => t.assigneeId === u.id && t.status !== TaskStatus.COMPLETED).length;
    return { name: u.fullName.split(" ")[0], Tasks: activeCount };
  });

  // 3. Project Budget vs Spent Comparison
  const budgetData = projects.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    Budget: p.budget,
    Spent: p.spent
  }));

  // 4. Sprint Velocity (Simulated actual historical data points)
  const velocityData = [
    { Sprint: "Sprint 1", Velocity: 12, Ideal: 14 },
    { Sprint: "Sprint 2", Velocity: 15, Ideal: 15 },
    { Sprint: "Sprint 3", Velocity: 14, Ideal: 16 },
    { Sprint: "Sprint 4", Velocity: 18, Ideal: 17 }
  ];

  // 5. Burndown / Burnup Charts
  // Standard 10-day sprint countdown (Ideal remaining tasks vs Actual remaining tasks)
  const totalSprintTasks = tasks.length || 10;
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

  const burndownData = [
    { Day: "Day 1", Ideal: totalSprintTasks, Actual: totalSprintTasks },
    { Day: "Day 2", Ideal: Math.round(totalSprintTasks * 0.9), Actual: totalSprintTasks },
    { Day: "Day 3", Ideal: Math.round(totalSprintTasks * 0.8), Actual: Math.round(totalSprintTasks * 0.9) },
    { Day: "Day 4", Ideal: Math.round(totalSprintTasks * 0.7), Actual: Math.round(totalSprintTasks * 0.8) },
    { Day: "Day 5", Ideal: Math.round(totalSprintTasks * 0.6), Actual: Math.round(totalSprintTasks * 0.7) },
    { Day: "Day 6", Ideal: Math.round(totalSprintTasks * 0.5), Actual: Math.round(totalSprintTasks * 0.5) },
    { Day: "Day 7", Ideal: Math.round(totalSprintTasks * 0.4), Actual: Math.round(totalSprintTasks * 0.5) },
    { Day: "Day 8", Ideal: Math.round(totalSprintTasks * 0.3), Actual: Math.round(totalSprintTasks * 0.4) },
    { Day: "Day 9", Ideal: Math.round(totalSprintTasks * 0.2), Actual: Math.round(totalSprintTasks * 0.3) },
    { Day: "Day 10", Ideal: 0, Actual: Math.max(0, totalSprintTasks - completedCount) }
  ];

  const burnupData = burndownData.map((d, index) => {
    const idealCompleted = Math.round((totalSprintTasks * index) / 9);
    const actualCompleted = Math.round(((totalSprintTasks - d.Actual) / totalSprintTasks) * completedCount);
    return {
      Day: d.Day,
      "Total Tasks Scope": totalSprintTasks,
      "Ideal Progress": idealCompleted > totalSprintTasks ? totalSprintTasks : idealCompleted,
      "Completed Progress": actualCompleted > completedCount ? completedCount : actualCompleted
    };
  });

  return (
    <div id="analytics-grid" className="space-y-6">
      {/* High-Level Overview Widget Bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Completed Scope</span>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100 block mt-1">
              {completedCount} <span className="text-xs font-normal text-gray-400">/ {tasks.length} tasks</span>
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total Budget</span>
            {canViewFinancials ? (
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 block mt-1">
                ${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
              </span>
            ) : (
              <div className="flex items-center space-x-1 mt-1">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gated (Admins)</span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Active Engineers</span>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100 block mt-1">
              {users.length} <span className="text-xs font-normal text-gray-400">contributors</span>
            </span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">SaaS Expense Ratio</span>
            {canViewFinancials ? (
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 block mt-1">
                {((projects.reduce((sum, p) => sum + p.spent, 0) / (projects.reduce((sum, p) => sum + p.budget, 0) || 1)) * 100).toFixed(0)}%
              </span>
            ) : (
              <div className="flex items-center space-x-1 mt-1">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gated (Admins)</span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Task Completion statuses */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-950 shadow-xs">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider font-mono">Task Status Distribution</h4>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Active Workload Distribution */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-950 shadow-xs">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider font-mono">Developer Resource Loading</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Burn-down Line Chart */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-950 shadow-xs">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider font-mono">Sprint Task Burndown</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="Day" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Ideal" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Actual" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Burn-up Chart */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-950 shadow-xs">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider font-mono">Sprint Task Burnup</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burnupData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="Day" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Total Tasks Scope" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Ideal Progress" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Completed Progress" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Budget tracking vs Spent */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-950 shadow-xs lg:col-span-2">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider font-mono">Financial Resource Burn Rate</h4>
          {canViewFinancials ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] w-full flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 p-6 text-center">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5" />
              </div>
              <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider font-mono">Financial Access Gated</h5>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm leading-relaxed">
                As a <span className="font-bold text-blue-500">{userRole}</span>, you are focused on engineering performance and milestone velocity. Detailed project budgets, financial burn rates, and margin indicators are restricted under organizational safety protocols.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
