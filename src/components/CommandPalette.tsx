import React, { useState, useEffect, useRef } from "react";
import { Search, Folder, CheckSquare, User, Terminal, X, Sparkles } from "lucide-react";
import { Task, Project, User as WorkspaceUser } from "../types.ts";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  users: WorkspaceUser[];
  onSelectTask: (taskId: string) => void;
  onSelectProject: (projectId: string) => void;
  onTriggerAI: (goal: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  projects,
  users,
  onSelectTask,
  onSelectProject,
  onTriggerAI
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search filter
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(query.toLowerCase()) ||
    u.title.toLowerCase().includes(query.toLowerCase())
  );

  const aiAction = query.trim().length > 3 ? [{
    id: "ai-breakdown",
    title: `Ask Gemini CoPilot to break down: "${query}"`,
    description: "Generates custom actionable sprint tasks directly into the backlog.",
    type: "ai"
  }] : [];

  const results = [
    ...aiAction.map((ai) => ({ ...ai, category: "AI Productivity CoPilot" })),
    ...filteredProjects.slice(0, 3).map((p) => ({ id: p.id, title: p.name, description: p.description, type: "project", category: "Projects" })),
    ...filteredTasks.slice(0, 5).map((t) => ({ id: t.id, title: t.title, description: t.description, type: "task", category: "Tasks" })),
    ...filteredUsers.slice(0, 3).map((u) => ({ id: u.id, title: u.fullName, description: u.title, type: "user", category: "Team Contributors" }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (item: any) => {
    if (item.type === "task") {
      onSelectTask(item.id);
    } else if (item.type === "project") {
      onSelectProject(item.id);
    } else if (item.type === "ai") {
      onTriggerAI(query);
    }
    onClose();
  };

  return (
    <div id="cmd-overlay" className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[10vh] backdrop-blur-xs transition-opacity duration-300">
      <div
        id="cmd-palette"
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl transition-all duration-300"
      >
        {/* Search header */}
        <div className="flex items-center border-b border-gray-100 dark:border-gray-900 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            id="cmd-input"
            ref={inputRef}
            type="text"
            placeholder="Type a command, search tasks, or ask Gemini CoPilot..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden"
          />
          <button id="cmd-close" onClick={onClose} className="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div id="cmd-results" className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          {results.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No matching elements or tasks found. Try typing another term.
            </div>
          ) : (
            <div>
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isFirstOfCategory = index === 0 || results[index - 1].category !== item.category;

                return (
                  <div key={`${item.type}-${item.id}`} className="space-y-1">
                    {isFirstOfCategory && (
                      <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-gray-400 dark:text-gray-500 uppercase font-semibold">
                        {item.category}
                      </div>
                    )}
                    <button
                      id={`cmd-item-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all ${
                        isSelected
                          ? "bg-gray-100 dark:bg-gray-900 text-gray-950 dark:text-gray-50"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      }`}
                    >
                      <div className="mr-3">
                        {item.type === "task" && <CheckSquare className="h-4 w-4 text-blue-500" />}
                        {item.type === "project" && <Folder className="h-4 w-4 text-indigo-500" />}
                        {item.type === "user" && <User className="h-4 w-4 text-emerald-500" />}
                        {item.type === "ai" && <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{item.title}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-[10px] font-mono bg-gray-200 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-sm">
                          Enter
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/25 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          <div className="flex space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Dismiss</span>
          </div>
          <div>
            <span>ctrl + K to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
