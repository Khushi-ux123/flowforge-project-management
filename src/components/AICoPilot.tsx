import React, { useState, useEffect } from "react";
import { Sparkles, Play, ShieldAlert, Cpu, AlertTriangle, CheckSquare, Plus, Loader2, Gauge, TrendingUp, CalendarDays, RefreshCw, FileText, Upload, Calendar, Clock, CheckCircle2, Trash2, User, FileAudio, Check, BookOpen } from "lucide-react";
import { Project, Task, User as WorkspaceUser, TaskPriority, TaskStatus, MeetingSummary, UserRole } from "../types.ts";
import { Lock } from "lucide-react";

interface AICoPilotProps {
  activeProject: Project | null;
  users: WorkspaceUser[];
  onTaskCreated: () => void; // Trigger list refetch
  currentUser: WorkspaceUser | null;
}

type AITab = "breakdown" | "sprint" | "health" | "summarizer";

export default function AICoPilot({ activeProject, users, onTaskCreated, currentUser }: AICoPilotProps) {
  const [activeTab, setActiveTab] = useState<AITab>("breakdown");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Tab 1: Breakdown States
  const [breakdownGoal, setBreakdownGoal] = useState("");
  const [breakdownResult, setBreakdownResult] = useState<any>(null);

  // Tab 2: Sprint Planner States
  const [sprintResult, setSprintResult] = useState<any>(null);

  // Tab 3: Health Analysis States
  const [healthResult, setHealthResult] = useState<any>(null);

  // Tab 4: Meeting Summarizer States
  const [summariesList, setSummariesList] = useState<MeetingSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<MeetingSummary | null>(null);
  const [transcriptInput, setTranscriptInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const triggerLoader = (msgs: string[]) => {
    setIsLoading(true);
    let i = 0;
    setLoadingMsg(msgs[0]);
    const timer = setInterval(() => {
      i++;
      if (i < msgs.length) {
        setLoadingMsg(msgs[i]);
      } else {
        clearInterval(timer);
      }
    }, 1800);
    return () => clearInterval(timer);
  };

  // 1. Task Breakdown Query
  const handleAIByGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownGoal.trim()) return;

    const stopTimer = triggerLoader([
      "Establishing connection to Gemini 3.5 Flash server...",
      "Analyzing technical constraints and engineering requirements...",
      "Configuring priority metrics and technical label graphs...",
      "Compiling 4-point actionable sprint task tree..."
    ]);

    try {
      const res = await fetch("/api/ai/task-breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ title: breakdownGoal.trim(), description: "AI-generated Scrum Master breakdown." })
      });

      if (res.ok) {
        setBreakdownResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  // Inject generated tasks into our database
  const handleInjectTasks = async () => {
    if (!breakdownResult || !breakdownResult.tasks || !activeProject) return;

    setIsLoading(true);
    setLoadingMsg("Injecting AI-created tasks directly into the project backlog...");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      };

      for (const t of breakdownResult.tasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers,
          body: JSON.stringify({
            projectId: activeProject.id,
            title: t.title,
            description: t.description,
            status: TaskStatus.TODO,
            priority: t.priority as TaskPriority,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            labels: t.labels || []
          })
        });
      }

      setBreakdownResult(null);
      setBreakdownGoal("");
      onTaskCreated();
      alert("Successfully injected all generated tasks into your backlog!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Sprint Planner Query
  const handleSprintOptimize = async () => {
    const stopTimer = triggerLoader([
      "Scanning active backlog tickets & dependencies...",
      "Evaluating individual developer loading thresholds...",
      "Formulating suggested velocity quotients with Gemini AI...",
      "Mapping optimal task distributions..."
    ]);

    try {
      const res = await fetch("/api/ai/sprint-planning", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (res.ok) {
        setSprintResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  // 3. Project Health Diagnostics
  const handleHealthDiagnostics = async () => {
    if (!activeProject) return;

    const stopTimer = triggerLoader([
      "Retrieving project budget spend-rates...",
      "Checking task completion-to-milestone date margins...",
      "Evaluating blockers and dependent bottlenecks...",
      "Formulating custom risks matrices and remedies..."
    ]);

    try {
      const res = await fetch("/api/ai/project-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ projectId: activeProject.id })
      });

      if (res.ok) {
        setHealthResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  const fetchSummaries = async () => {
    try {
      const res = await fetch("/api/meeting-summaries", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setSummariesList(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch meeting summaries:", err);
    }
  };

  const handleDeleteSummary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this meeting summary?")) return;
    try {
      const res = await fetch(`/api/meeting-summaries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        if (selectedSummary?.id === id) {
          setSelectedSummary(null);
        }
        fetchSummaries();
      }
    } catch (err) {
      console.error("Failed to delete meeting summary:", err);
    }
  };

  const handleSummarizeMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcriptInput.trim() && !uploadedFile) return;

    const stopTimer = triggerLoader([
      "Reading uploaded meeting resources...",
      "Analyzing verbal frequencies and acoustic details...",
      "Invoking Gemini 3.5 Flash for high-fidelity summarizing...",
      "Structuring key decisions, milestone dates, and owner allocations..."
    ]);

    try {
      let fileBase64 = "";
      let mimeType = "";
      let fileName = "";

      if (uploadedFile) {
        fileName = uploadedFile.name;
        mimeType = uploadedFile.type;
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }

      const res = await fetch("/api/ai/meeting-summarizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          transcript: transcriptInput.trim(),
          fileName,
          fileBase64,
          mimeType
        })
      });

      if (res.ok) {
        const resultSummary = await res.json();
        
        // Auto-save generated summary
        const saveRes = await fetch("/api/meeting-summaries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(resultSummary)
        });

        if (saveRes.ok) {
          const saved = await saveRes.json();
          setSelectedSummary(saved);
        } else {
          setSelectedSummary(resultSummary);
        }
        
        setTranscriptInput("");
        setUploadedFile(null);
        fetchSummaries();
      }
    } catch (err) {
      console.error("Failed to process meeting summary:", err);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  const handleInjectActionItems = async () => {
    if (!selectedSummary || !selectedSummary.actionItems || !activeProject) return;

    setIsLoading(true);
    setLoadingMsg("Injecting meeting action items as sprint tasks into the backlog...");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      };

      for (const item of selectedSummary.actionItems) {
        // Try to match assigneeName with a workspace user
        const matchedUser = users.find(
          (u) =>
            u.fullName.toLowerCase().includes(item.assigneeName.toLowerCase()) ||
            item.assigneeName.toLowerCase().includes(u.fullName.toLowerCase())
        );

        // Map item priority to TaskPriority
        let priority = TaskPriority.MEDIUM;
        if (item.priority?.toLowerCase() === "high") {
          priority = TaskPriority.HIGH;
        } else if (item.priority?.toLowerCase() === "low") {
          priority = TaskPriority.LOW;
        }

        await fetch("/api/tasks", {
          method: "POST",
          headers,
          body: JSON.stringify({
            projectId: activeProject.id,
            title: item.task,
            description: `Meeting Action Item: Assigned to ${item.assigneeName}.`,
            status: TaskStatus.TODO,
            priority,
            assigneeId: matchedUser ? matchedUser.id : undefined,
            dueDate: item.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            labels: ["Meeting Action Item"]
          })
        });
      }

      onTaskCreated();
      alert("Successfully injected action items into the project backlog!");
    } catch (err) {
      console.error("Failed to inject action items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch Sprint/Health/Summaries on tab switch if not present
    if (activeTab === "sprint" && !sprintResult) {
      handleSprintOptimize();
    } else if (activeTab === "health" && !healthResult && activeProject) {
      handleHealthDiagnostics();
    } else if (activeTab === "summarizer") {
      fetchSummaries();
    }
  }, [activeTab]);

  return (
    <div id="ai-copilot-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Controller Nav */}
      <div className="lg:col-span-1 space-y-2 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-950 p-3 rounded-xl flex flex-row lg:flex-col overflow-x-auto gap-2 lg:gap-0">
        <button
          id="tab-ai-breakdown"
          onClick={() => setActiveTab("breakdown")}
          className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-left text-xs font-semibold transition-all ${
            activeTab === "breakdown"
              ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-l-2 border-purple-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          <Cpu className="h-4.5 w-4.5" />
          <span className="whitespace-nowrap">AI Task Breakdown</span>
        </button>

        <button
          id="tab-ai-sprint"
          onClick={() => setActiveTab("sprint")}
          className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-left text-xs font-semibold transition-all ${
            activeTab === "sprint"
              ? "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          <CalendarDays className="h-4.5 w-4.5" />
          <span className="whitespace-nowrap">Sprint Optimizer</span>
        </button>

        <button
          id="tab-ai-health"
          onClick={() => setActiveTab("health")}
          className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-left text-xs font-semibold transition-all ${
            activeTab === "health"
              ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-l-2 border-rose-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5" />
          <span className="whitespace-nowrap">Health & Risks</span>
        </button>

        <button
          id="tab-ai-summarizer"
          onClick={() => { setActiveTab("summarizer"); setSelectedSummary(null); }}
          className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-left text-xs font-semibold transition-all ${
            activeTab === "summarizer"
              ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-l-2 border-purple-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          }`}
        >
          <FileText className="h-4.5 w-4.5" />
          <span className="whitespace-nowrap font-bold">Meeting Summarizer</span>
        </button>
      </div>

      {/* Main Panel Output */}
      <div id="ai-output-panel" className="lg:col-span-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 min-h-[450px] relative flex flex-col justify-between">
        {isLoading ? (
          <div id="ai-loader-screen" className="flex-1 flex flex-col items-center justify-center space-y-4 py-16">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            <div className="text-center max-w-md">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gemini Scrum CoPilot Processing</h5>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-1.5 font-semibold leading-relaxed animate-pulse">
                {loadingMsg}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            {/* Header Description */}
            <div className="border-b border-gray-100 dark:border-gray-900 pb-4 mb-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-purple-500" />
                <span>
                  {activeTab === "breakdown" && "Interactive Feature breakdown"}
                  {activeTab === "sprint" && "Sprint Capacity & Balance Optimizer"}
                  {activeTab === "health" && "Project Health Audit & Risk Detection"}
                  {activeTab === "summarizer" && "AI-Powered Meeting Summarizer"}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {activeTab === "breakdown" && "Provide a high-level feature goal, and let Gemini compile detailed, actionable developer task cards."}
                {activeTab === "sprint" && "Evaluate backlogs against active member capacity ratios to prevent sprint over-commitments."}
                {activeTab === "health" && "Analyze timelines, budget tracking variables, and potential blockers with strategic fixes."}
                {activeTab === "summarizer" && "Input meeting transcripts or upload audio files to extract key decisions, action checklists, and assignees."}
              </p>
            </div>

            {/* TAB CONTENT: BREAKDOWN */}
            {activeTab === "breakdown" && (
              <div className="space-y-6">
                <form id="ai-breakdown-form" onSubmit={handleAIByGoal} className="flex space-x-2">
                  <input
                    id="ai-goal-input"
                    type="text"
                    required
                    placeholder="Enter goal (e.g. 'Build Stripe Payment checkout' or 'Mobile user signups')..."
                    value={breakdownGoal}
                    onChange={(e) => setBreakdownGoal(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3.5 py-2 text-xs focus:outline-hidden focus:border-purple-500 text-gray-950 dark:text-gray-100"
                  />
                  <button
                    id="ai-goal-submit"
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Generate</span>
                  </button>
                </form>

                {breakdownResult && breakdownResult.tasks ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider font-mono">Gemini Proposed Task Breakdown</h4>
                      {activeProject ? (
                        <button
                          id="inject-tasks-btn"
                          onClick={handleInjectTasks}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Inject into Project Backlog</span>
                        </button>
                      ) : (
                        <span className="text-xs text-rose-500 italic font-medium">Select an active project first to inject</span>
                      )}
                    </div>

                    <div id="ai-breakdown-list" className="space-y-3">
                      {breakdownResult.tasks.map((t: any, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/30 dark:bg-gray-900/10 hover:border-purple-500/30 transition-all">
                          <div className="flex items-start justify-between">
                            <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                              <span>{t.title}</span>
                            </h5>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              t.priority === "High" ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600" :
                              t.priority === "Medium" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600" :
                              "bg-gray-100 dark:bg-gray-800 text-gray-600"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{t.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {t.labels && t.labels.map((lbl: string) => (
                              <span key={lbl} className="text-[9px] font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-sm">
                                {lbl}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-10 w-10 text-purple-400/40 animate-pulse mb-3" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                      Enter a high-level feature ticket descriptor (e.g. "Build Stripe payments") and tap **Generate** to generate granular sprint tickets.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SPRINT PLANNING */}
             {activeTab === "sprint" && sprintResult && (
              <div id="ai-sprint-panel" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">Backlog Allocation Summary</h4>
                  <button id="refresh-sprint-btn" onClick={handleSprintOptimize} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all cursor-pointer" title="Recalculate Allocations">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Main sprint parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/10">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Suggested Velocity</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-1.5 text-indigo-500" />
                      <span>{sprintResult.suggestedVelocity} pts</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/10">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Suggested Sprint Goal</div>
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-1.5 leading-relaxed italic">
                      "{sprintResult.sprintGoal}"
                    </div>
                  </div>
                </div>

                {/* Allocation gauges */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200">Balanced Capacity Gauge</h5>
                  <div className="space-y-3">
                    {sprintResult.allocation && sprintResult.allocation.map((alloc: any) => {
                      const u = users.find((user) => user.id === alloc.assigneeId);
                      return (
                        <div key={alloc.assigneeId} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{u ? u.fullName : "Unassigned"}</span>
                            <span className={`font-mono font-bold ${alloc.loadPercentage > 85 ? "text-rose-500" : "text-emerald-500"}`}>
                              {alloc.loadPercentage}% Load
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                alloc.loadPercentage > 85 ? "bg-rose-500" :
                                alloc.loadPercentage > 60 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${alloc.loadPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scope Alerts */}
                {sprintResult.scopeAlerts && sprintResult.scopeAlerts.length > 0 && (
                  <div className="space-y-2 border border-amber-100 dark:border-amber-950/20 bg-amber-50/20 dark:bg-amber-950/5 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Sprint Scope Alerts</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1.5 pl-1.5">
                      {sprintResult.scopeAlerts.map((alert: string, index: number) => (
                        <li key={index} className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: HEALTH & RISKS */}
             {activeTab === "health" && healthResult && (
              <div id="ai-health-panel" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">Project Diagnostic Index</h4>
                  {activeProject && (
                    <button id="refresh-health-btn" onClick={handleHealthDiagnostics} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all cursor-pointer" title="Re-evaluate Project Health">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Score gauge and statuses */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-1 text-center border border-gray-100 dark:border-gray-900 rounded-xl p-4 bg-gray-50/20 dark:bg-gray-900/5">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Health Score</div>
                    <div className="relative flex items-center justify-center mt-3">
                      {/* Mini circular gauge */}
                      <svg className="w-20 h-20">
                        <circle cx="40" cy="40" r="34" strokeWidth="6" stroke="#e5e7eb" fill="transparent" className="dark:stroke-gray-800" />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          strokeWidth="6"
                          stroke={healthResult.healthScore > 80 ? "#10b981" : healthResult.healthScore > 50 ? "#f59e0b" : "#ef4444"}
                          fill="transparent"
                          strokeDasharray={213}
                          strokeDashoffset={213 - (213 * healthResult.healthScore) / 100}
                          className="transition-all duration-1000 rotate-270 origin-center"
                        />
                      </svg>
                      <div className="absolute text-sm font-black text-gray-900 dark:text-gray-100">{healthResult.healthScore}%</div>
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Status:</span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        healthResult.status === "On Track" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" :
                        healthResult.status === "At Risk" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600" :
                        "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                      }`}>
                        {healthResult.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Timeline Prediction</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium italic">
                        "{healthResult.timelinePrediction}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risks matrices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risks */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/20 dark:bg-gray-900/5">
                    <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 mb-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <span>Potential Risk Indicators</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {healthResult.riskAnalysis && healthResult.riskAnalysis.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Remedies */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/20 dark:bg-gray-900/5">
                    <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 mb-2">
                      <Gauge className="h-4 w-4 text-blue-500" />
                      <span>Strategic Remedies</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {healthResult.remedySuggestions && healthResult.remedySuggestions.map((rem: string, i: number) => (
                        <li key={i}>{rem}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEETING SUMMARIZER */}
            {activeTab === "summarizer" && (
              <div id="ai-summarizer-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Left side - History list */}
                <div className="lg:col-span-1 border-r border-gray-100 dark:border-gray-900 pr-0 lg:pr-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-900">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">Past Meetings</h4>
                    <button
                      id="summarizer-new-btn"
                      onClick={() => setSelectedSummary(null)}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>New</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                    {summariesList.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 italic">
                        No meeting summaries saved.
                      </div>
                    ) : (
                      summariesList.map((ms) => (
                        <div
                          key={ms.id}
                          onClick={() => setSelectedSummary(ms)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:border-purple-500/30 group relative ${
                            selectedSummary?.id === ms.id
                              ? "bg-purple-500/5 border-purple-500/40 dark:bg-purple-500/10"
                              : "bg-gray-50/30 dark:bg-gray-900/10 border-gray-100 dark:border-gray-900"
                          }`}
                        >
                          <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate pr-6">
                            {ms.title}
                          </h5>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {ms.date}
                            </span>
                            {ms.duration && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {ms.duration}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-1 leading-relaxed">
                            {ms.summary}
                          </p>

                          <button
                            onClick={(e) => handleDeleteSummary(ms.id, e)}
                            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                            title="Delete Summary"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Right side - Detail View or New Form */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedSummary ? (
                    /* Detail view of the report */
                    <div id="summarizer-detail" className="space-y-5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                        <div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-gray-50">
                            {selectedSummary.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            <span className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-purple-400" />
                              {selectedSummary.date}
                            </span>
                            {selectedSummary.duration && (
                              <span className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1 text-purple-400" />
                                {selectedSummary.duration}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedSummary(null)}
                            className="text-xs px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 font-bold transition-all cursor-pointer"
                          >
                            New Summary
                          </button>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 font-mono uppercase tracking-wider">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          <span>Meeting Narrative Overview</span>
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/50 dark:bg-gray-900/10 p-4 rounded-xl border border-gray-100 dark:border-gray-900 font-sans whitespace-pre-wrap">
                          {selectedSummary.summary}
                        </p>
                      </div>

                      {/* Decisions section */}
                      {selectedSummary.decisions && selectedSummary.decisions.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 font-mono uppercase tracking-wider">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Strategic Decisions Made</span>
                          </h5>
                          <ul className="space-y-2">
                            {selectedSummary.decisions.map((decision, index) => (
                              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>{decision}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action items table */}
                      {selectedSummary.actionItems && selectedSummary.actionItems.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 font-mono uppercase tracking-wider">
                              <CheckSquare className="h-4 w-4 text-purple-500" />
                              <span>Task Action Checklists</span>
                            </h5>
                            {activeProject ? (
                              <button
                                onClick={handleInjectActionItems}
                                className="flex items-center space-x-1 px-2.5 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Inject Action Items into Backlog</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-rose-500 italic">Select active project to inject</span>
                            )}
                          </div>

                          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/10 dark:bg-gray-900/5">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                                  <th className="p-3">Action Required</th>
                                  <th className="p-3">Assignee</th>
                                  <th className="p-3 text-center">Priority</th>
                                  <th className="p-3 text-right">Target Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                                {selectedSummary.actionItems.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50/25 dark:hover:bg-gray-900/10 transition-colors">
                                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{item.task}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400 font-medium">
                                      <div className="flex items-center space-x-1.5">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{item.assigneeName}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                        item.priority === "High" ? "bg-rose-50 dark:bg-rose-950/25 text-rose-600" :
                                        item.priority === "Medium" ? "bg-amber-50 dark:bg-amber-950/25 text-amber-600" :
                                        "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                      }`}>
                                        {item.priority}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-mono text-gray-500 font-medium">{item.dueDate || "Not set"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* The creation form */
                    <form id="summarizer-form" onSubmit={handleSummarizeMeeting} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-700 dark:text-slate-300">Pasted Meeting Transcript</label>
                        <textarea
                          id="summarizer-transcript-input"
                          rows={6}
                          value={transcriptInput}
                          onChange={(e) => setTranscriptInput(e.target.value)}
                          placeholder="Paste meeting discussion notes, automated zoom transcript records, or text-based sync logs here..."
                          className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs focus:outline-hidden focus:border-purple-500 text-gray-950 dark:text-gray-100 leading-relaxed font-sans"
                        />
                      </div>

                      <div className="text-center text-xs text-slate-600 dark:text-slate-400 font-bold font-mono">OR</div>

                      {/* Drag and Drop Zone */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-700 dark:text-slate-300">Meeting Audio / Document Upload</label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { setUploadedFile(e.dataTransfer.files[0]); } }}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 relative overflow-hidden ${
                            isDragging
                              ? "border-purple-500 bg-purple-500/5"
                              : "border-gray-200 dark:border-gray-800 hover:border-purple-400/40 hover:bg-gray-50/20"
                          }`}
                        >
                          <input
                            type="file"
                            accept="audio/*,.txt,.doc,.docx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setUploadedFile(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {uploadedFile ? (
                            <>
                              {uploadedFile.type.startsWith("audio/") ? (
                                <FileAudio className="h-10 w-10 text-purple-500 animate-pulse" />
                              ) : (
                                <FileText className="h-10 w-10 text-purple-500" />
                              )}
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{uploadedFile.name}</div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.type || "Unknown Format"}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedFile(null);
                                }}
                                className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer z-10"
                              >
                                Remove File
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-slate-500 dark:text-gray-400" />
                              <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Drag & Drop Meeting Audio or Text Files
                              </div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                Supports MP3, WAV, M4A or TXT files (Max 10MB)
                              </div>
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold underline mt-1">
                                or click to select from file browser
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 text-right">
                        <button
                          id="summarizer-submit-btn"
                          type="submit"
                          disabled={!transcriptInput.trim() && !uploadedFile}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2 text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer inline-flex"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Summarize Meeting Transcript</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Credit line without tech-larping */}
        <div className="border-t border-gray-100 dark:border-gray-900/60 pt-3 mt-4 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-1">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span>Powered by Gemini 3.5 Flash Model</span>
          </div>
          <div>
            <span>Smart Scrum CoPilot v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
