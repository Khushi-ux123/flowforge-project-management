import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Users, Send, Bell, Hash, ChevronRight, Plus } from "lucide-react";
import { ChatMessage, Team, Project, User as WorkspaceUser } from "../types.ts";

interface ChatHubProps {
  teams: Team[];
  projects: Project[];
  users: WorkspaceUser[];
  currentUser: WorkspaceUser;
}

export default function ChatHub({ teams, projects, users, currentUser }: ChatHubProps) {
  const [activeChannel, setActiveChannel] = useState<string>("global");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 3 seconds to simulate Socket.IO real-time stream
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${activeChannel}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to sync chat messages stream:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/${activeChannel}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ content: inputMessage.trim() })
      });

      if (res.ok) {
        setInputMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const getUserNameAndAvatar = (id: string) => {
    const u = users.find((user) => user.id === id);
    return u ? { name: u.fullName, avatar: u.avatar, title: u.title } : { name: "Collaborator", avatar: "C", title: "Member" };
  };

  const getChannelLabel = () => {
    if (activeChannel === "global") return "Global Organization Lounge";
    if (activeChannel.startsWith("team_")) {
      const teamId = activeChannel.substring(5);
      const t = teams.find((team) => team.id === teamId);
      return t ? `Team: ${t.name}` : "Team Workspace";
    }
    if (activeChannel.startsWith("project_")) {
      const projId = activeChannel.substring(8);
      const p = projects.find((project) => project.id === projId);
      return p ? `Project Stream: ${p.name}` : "Project Chat";
    }
    return "Discussion";
  };

  return (
    <div id="chathub-container" className="grid grid-cols-1 lg:grid-cols-4 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden h-[550px] bg-white dark:bg-gray-950">
      {/* Sidebar Channel Navigator */}
      <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 p-4 overflow-y-auto space-y-5 scrollbar-thin">
        <h3 className="text-[10px] font-mono tracking-wider font-semibold text-gray-400 uppercase flex items-center justify-between">
          <span>Channels</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </h3>

        {/* Global Channel */}
        <div className="space-y-1">
          <button
            id="chan-global"
            onClick={() => setActiveChannel("global")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              activeChannel === "global"
                ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
            }`}
          >
            <Hash className="h-4 w-4 mr-2 text-gray-400" />
            <span>Global Lounge</span>
          </button>
        </div>

        {/* Team Channels */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase flex items-center">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span>Teams chat</span>
          </h4>
          <div className="space-y-0.5">
            {teams.map((t) => (
              <button
                key={t.id}
                id={`chan-team-${t.id}`}
                onClick={() => setActiveChannel(`team_${t.id}`)}
                className={`w-full flex items-center px-3 py-1.5 rounded-lg text-left text-xs transition-all ${
                  activeChannel === `team_${t.id}`
                    ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Project Channels */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase flex items-center">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            <span>Projects discussion</span>
          </h4>
          <div className="space-y-0.5">
            {projects.map((p) => (
              <button
                key={p.id}
                id={`chan-project-${p.id}`}
                onClick={() => setActiveChannel(`project_${p.id}`)}
                className={`w-full flex items-center px-3 py-1.5 rounded-lg text-left text-xs transition-all ${
                  activeChannel === `project_${p.id}`
                    ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Conversation Pane */}
      <div className="lg:col-span-3 flex flex-col h-full overflow-hidden bg-gray-50/10 dark:bg-gray-950">
        {/* Chat stream header */}
        <div className="px-6 py-3.5 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-white dark:bg-gray-950">
          <div className="flex items-center space-x-2">
            <Hash className="h-4.5 w-4.5 text-blue-500" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{getChannelLabel()}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{messages.length} messages active</span>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div id="messages-container" className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-800 animate-pulse mb-3" />
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                This discussion channel is empty. Be the first to tag contributors or kick off the daily sprint review!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const sender = getUserNameAndAvatar(m.userId);
              const isMe = m.userId === currentUser.id;

              return (
                <div key={m.id} className={`flex items-start space-x-3 ${isMe ? "flex-row-reverse space-x-reverse" : ""}`}>
                  <div className="h-8.5 w-8.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-black font-mono shadow-xs">
                    {sender.avatar}
                  </div>
                  <div className="max-w-[70%]">
                    <div className={`flex items-center space-x-2 text-[10px] text-gray-400 mb-1 ${isMe ? "justify-end" : ""}`}>
                      <span className="font-bold text-gray-900 dark:text-gray-200">{sender.name}</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`rounded-xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                      isMe
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer Form */}
        <form id="chat-input-form" onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 flex space-x-2 items-center">
          <input
            id="chat-text-input"
            type="text"
            placeholder="Send message... try typing @Alex or @Sarah Chen to tag contributors"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-xs text-gray-950 dark:text-gray-100 focus:outline-hidden focus:border-blue-500"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
