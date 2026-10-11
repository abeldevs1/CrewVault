"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  Plus,
  Lock,
  Globe,
  Search,
  Send,
  UserPlus,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  LogOut,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Plane,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  course: string | null;
  aircraft: string | null;
  airline: string | null;
  is_private: number | boolean;
  created_by: string;
  creator_name: string;
  member_count: number;
  is_member?: boolean;
  user_role?: string;
  admin_bypass?: boolean;
}

interface GroupMember {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  airline: string | null;
  platform_role: string;
  role: string;
}

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_platform_role: string;
  sender_airline: string | null;
}

interface Conversation {
  conversation_id: string;
  peer_id: string;
  peer_name: string;
  peer_role: string;
  peer_airline: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
}

interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface PeerUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  airline: string | null;
  aircraft_studied: string[];
}

export default function DiscussionsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"groups" | "direct">("groups");

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newGroupMsg, setNewGroupMsg] = useState("");
  const [sendingGroupMsg, setSendingGroupMsg] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [groupSearch, setGroupSearch] = useState("");

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupAircraft, setNewGroupAircraft] = useState("B787-9");
  const [newGroupCourse, setNewGroupCourse] = useState("Safety & Evacuation Drills");
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [peerSearchQuery, setPeerSearchQuery] = useState("");
  const [availablePeers, setAvailablePeers] = useState<PeerUser[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Direct messaging state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [newDirectMsg, setNewDirectMsg] = useState("");
  const [sendingDirectMsg, setSendingDirectMsg] = useState(false);
  const [showNewDirectModal, setShowNewDirectModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const directMessagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(console.error);
  }, []);

  // Load groups
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Load conversations
  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "direct") {
      loadConversations();
    }
  }, [activeTab]);

  // Load active group discussion
  const loadGroupDetails = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedGroup(data.group);
        setGroupMembers(data.members || []);
        setGroupMessages(data.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        alert(data.error || "Could not load group");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load direct conversation messages
  const loadDirectMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.success) {
        setDirectMessages(data.messages || []);
        setTimeout(() => {
          directMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Search peers for invite or new chat
  const searchPeers = async (query: string) => {
    setLoadingPeers(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setAvailablePeers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPeers(false);
    }
  };

  useEffect(() => {
    if (showInviteModal || showNewDirectModal) {
      searchPeers(peerSearchQuery);
    }
  }, [showInviteModal, showNewDirectModal, peerSearchQuery]);

  // Send group message
  const handleSendGroupMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGroup || !newGroupMsg.trim() || sendingGroupMsg) return;

    setSendingGroupMsg(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", content: newGroupMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewGroupMsg("");
        setGroupMessages((prev) => [...prev, data.message]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        alert(data.error || "Failed to post message");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingGroupMsg(false);
    }
  };

  // Join group
  const handleJoinGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const data = await res.json();
      if (data.success) {
        loadGroups();
        if (selectedGroup?.id === groupId) {
          loadGroupDetails(groupId);
        }
      } else {
        alert(data.error || "Failed to join");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to leave this study group?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedGroup(null);
        loadGroups();
      } else {
        alert(data.error || "Failed to leave");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Permanently delete this group and all its discussion history?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSelectedGroup(null);
        loadGroups();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || creatingGroup) return;

    setCreatingGroup(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          aircraft: newGroupAircraft,
          course: newGroupCourse,
          is_private: newGroupIsPrivate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateGroupModal(false);
        setNewGroupName("");
        setNewGroupDesc("");
        loadGroups();
        loadGroupDetails(data.group_id);
      } else {
        alert(data.error || "Failed to create group");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Invite user to group
  const handleInviteUser = async (user: PeerUser) => {
    if (!selectedGroup) return;
    setInviteFeedback(null);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteFeedback(data.message);
        loadGroupDetails(selectedGroup.id);
      } else {
        alert(data.error || "Failed to invite");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send direct message
  const handleSendDirectMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConv || !newDirectMsg.trim() || sendingDirectMsg) return;

    setSendingDirectMsg(true);
    try {
      const res = await fetch(`/api/messages/${selectedConv.conversation_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newDirectMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewDirectMsg("");
        setDirectMessages((prev) => [
          ...prev,
          {
            ...data.message,
            sender_name: currentUser?.full_name || "You",
          },
        ]);
        loadConversations();
        setTimeout(() => {
          directMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        alert(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingDirectMsg(false);
    }
  };

  // Start new direct chat
  const handleStartDirectChat = async (peer: PeerUser) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: peer.id,
          content: "👋 Hello! Ready to practice cabin crew drills together?",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewDirectModal(false);
        setActiveTab("direct");
        await loadConversations();
        setSelectedConv({
          conversation_id: data.conversation_id,
          peer_id: peer.id,
          peer_name: peer.full_name,
          peer_role: peer.role,
          peer_airline: peer.airline,
          last_message: "👋 Hello! Ready to practice cabin crew drills together?",
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        });
        loadDirectMessages(data.conversation_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g.aircraft && g.aircraft.toLowerCase().includes(groupSearch.toLowerCase())) ||
      (g.description && g.description.toLowerCase().includes(groupSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (groupFilter === "my") return g.is_member || g.created_by === currentUser?.id;
    if (groupFilter === "safety") return (g.course || "").toLowerCase().includes("safety") || (g.name || "").toLowerCase().includes("safety");
    if (groupFilter === "service") return (g.course || "").toLowerCase().includes("service") || (g.name || "").toLowerCase().includes("service");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 p-6 rounded-2xl border border-sky-500/20 shadow-xl shadow-sky-950/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Cabin Crew Collaboration
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Bypass Entry Active
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-400" />
            Study Groups & Peer Discussions
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Collaborate in cabin crew cohorts, practice emergency evacuation commands, master service sequence drills, and chat directly with peers.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              setActiveTab("groups");
              setSelectedConv(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "groups"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Study Groups ({groups.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("direct");
              setSelectedGroup(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "direct"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            1-on-1 Direct Chat
          </button>
        </div>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Administrator Privilege:</strong> You can view, enter, and supervise all public and private study groups, invite trainees, and delete inappropriate cohort discussions.
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: STUDY GROUPS */}
      {activeTab === "groups" && (
        <>
          {!selectedGroup ? (
            /* GROUP LIST VIEW */
            <div className="space-y-5">
              {/* Filter and Action bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "All Groups" },
                    { id: "my", label: "My Groups" },
                    { id: "safety", label: "Safety Drills" },
                    { id: "service", label: "Service Mockup" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setGroupFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        groupFilter === filter.id
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : "bg-white/[0.04] text-slate-400 hover:text-white border border-transparent"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search group or aircraft..."
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </button>
                </div>
              </div>

              {/* Group Cards Grid */}
              {loadingGroups ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  Loading study groups and cohorts...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-16 text-center bg-slate-900/40 border border-white/5 rounded-2xl p-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No study groups found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Create the first study group for your batch cohort to practice evacuation drills and mockups together.
                  </p>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Study Group
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map((g) => {
                    const isPrivate = Boolean(g.is_private);
                    const canEnter = !isPrivate || g.is_member || isAdmin || g.created_by === currentUser?.id;

                    return (
                      <div
                        key={g.id}
                        className="bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-sky-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group relative shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                isPrivate
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                              {isPrivate ? "Private Cohort" : "Public Squad"}
                            </span>

                            {g.aircraft && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.06] text-sky-300 border border-white/10 flex items-center gap-1">
                                <Plane className="w-2.5 h-2.5" />
                                {g.aircraft}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 mb-1">
                            {g.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                            {g.description || "Cabin crew drill preparation and knowledge sharing group."}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Users className="w-3 h-3 text-sky-400" />
                              <strong>{g.member_count || 1}</strong> members
                            </span>
                            <span>•</span>
                            <span className="truncate">By {g.creator_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                          {canEnter ? (
                            <button
                              onClick={() => loadGroupDetails(g.id)}
                              className="flex-1 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {isAdmin && !g.is_member ? "Admin Enter" : "Enter Discussion"}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinGroup(g.id)}
                              className="flex-1 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Join Group
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              title="Admin Delete Group"
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE GROUP DISCUSSION VIEW */
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
              {/* Group Discussion Header */}
              <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedGroup.name}</h2>
                      {Boolean(selectedGroup.is_private) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </span>
                      )}
                      {selectedGroup.aircraft && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {selectedGroup.aircraft}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {selectedGroup.description || "Drill study and question exchange forum"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInviteFeedback(null);
                      setShowInviteModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite Trainees
                  </button>

                  {selectedGroup.is_member && selectedGroup.created_by !== currentUser?.id && (
                    <button
                      onClick={() => handleLeaveGroup(selectedGroup.id)}
                      title="Leave Group"
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}

                  {(isAdmin || selectedGroup.created_by === currentUser?.id) && (
                    <button
                      onClick={() => handleDeleteGroup(selectedGroup.id)}
                      title="Delete Group"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content: Message Feed & Members Drawer */}
              <div className="flex-1 flex overflow-hidden">
                {/* Messages stream */}
                <div className="flex-1 flex flex-col justify-between bg-black/20">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Welcome message bubble */}
                    <div className="text-center my-4">
                      <div className="inline-block p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 max-w-md">
                        <Sparkles className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                        Welcome to <strong>{selectedGroup.name}</strong>. Share safety drill commands,
                        ask questions about door arming/disarming, and review aircraft specific manuals together!
                      </div>
                    </div>

                    {groupMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        No messages yet in this group discussion. Be the first to start the drill!
                      </div>
                    ) : (
                      groupMessages.map((msg) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        const isSenderAdmin = msg.sender_platform_role === "ADMIN";

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-300">
                                {isMe ? "You" : msg.sender_name}
                              </span>
                              {isSenderAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ADMIN
                                </span>
                              )}
                              {msg.sender_airline && (
                                <span className="text-[10px] text-slate-500">
                                  • {msg.sender_airline}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                • {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                                isMe
                                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-none shadow-md"
                                  : "bg-slate-800 border border-white/10 text-slate-200 rounded-tl-none shadow-md"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick drill questions suggestions */}
                  <div className="px-4 py-2 bg-slate-950/60 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-[11px]">
                    <span className="text-slate-500 font-medium shrink-0">Quick Drill:</span>
                    {[
                      "🚨 Evacuation Command: UNFASTEN SEATBELTS! LEAVE EVERYTHING BEHIND!",
                      "🚪 B787 Door: Verify slide armed indicator is illuminated green.",
                      "☕ Service Sequence: Hot meal distribution from Row 1 aft.",
                      "🧯 Preflight: Halon pressure gauge in green zone and safety pin intact.",
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setNewGroupMsg(prompt)}
                        className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-sky-500/10 hover:text-sky-300 text-slate-400 border border-white/5 hover:border-sky-500/20 transition-all shrink-0"
                      >
                        {prompt.slice(0, 32)}...
                      </button>
                    ))}
                  </div>

                  {/* Group Message Composer */}
                  <form
                    onSubmit={handleSendGroupMessage}
                    className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type your drill question, command response, or notes... (Press Enter to send)"
                      value={newGroupMsg}
                      onChange={(e) => setNewGroupMsg(e.target.value)}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={!newGroupMsg.trim() || sendingGroupMsg}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </div>

                {/* Right drawer: Roster */}
                <div className="w-64 border-l border-white/10 bg-slate-950/40 p-4 hidden md:flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      Members ({groupMembers.length})
                    </span>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="p-1 rounded bg-white/[0.05] hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-colors"
                      title="Add Member"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {groupMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between"
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {member.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {member.airline || "Trainee"}
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            member.role === "owner"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : "bg-white/[0.05] text-slate-400"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: 1-TO-1 PEER DIRECT CHAT */}
      {activeTab === "direct" && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex h-[750px]">
          {/* Left panel: Conversations List */}
          <div className="w-80 border-r border-white/10 flex flex-col bg-slate-950/60">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                Direct Chats
              </span>
              <button
                onClick={() => setShowNewDirectModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loadingConvs ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400 mb-2">No direct chats yet</p>
                  <button
                    onClick={() => setShowNewDirectModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Start Chat with a Peer
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedConv?.conversation_id === conv.conversation_id;
                  return (
                    <button
                      key={conv.conversation_id}
                      onClick={() => {
                        setSelectedConv(conv);
                        loadDirectMessages(conv.conversation_id);
                      }}
                      className={`w-full p-4 text-left flex items-start justify-between gap-3 transition-colors ${
                        isSelected
                          ? "bg-indigo-600/15 border-l-4 border-indigo-500"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {conv.peer_name}
                          </span>
                          {conv.peer_airline && (
                            <span className="text-[10px] text-slate-500 truncate">
                              • {conv.peer_airline}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {conv.last_message || "No messages"}
                        </p>
                      </div>

                      {Boolean(conv.unread_count) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active Chat */}
          <div className="flex-1 flex flex-col justify-between bg-black/20">
            {selectedConv ? (
              <>
                {/* Peer Header */}
                <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                      {selectedConv.peer_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedConv.peer_name}</h3>
                      <p className="text-[10px] text-slate-400">
                        {selectedConv.peer_airline || "Cabin Crew Trainee"} • {selectedConv.peer_role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {directMessages.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      Send a message to start practicing together!
                    </div>
                  ) : (
                    directMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] text-slate-400">
                              {isMe ? "You" : selectedConv.peer_name} •{" "}
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                              isMe
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md"
                                : "bg-slate-800 border border-white/10 text-slate-200 rounded-tl-none shadow-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={directMessagesEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendDirectMessage}
                  className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Message ${selectedConv.peer_name}...`}
                    value={newDirectMsg}
                    onChange={(e) => setNewDirectMsg(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newDirectMsg.trim() || sendingDirectMsg}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Select a Peer Conversation</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Choose a peer on the left to review evacuation drills, emergency scenarios, and service sequences 1-on-1.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE STUDY GROUP */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateGroupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Create Cabin Crew Study Group
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Form a squad with peers to practice school final questions and practical drills.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ethiopian B787 Final Drill Squad"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description / Study Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Practicing evacuation drill commands, door arming, and ShebaMiles mock..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Aircraft Focus
                  </label>
                  <select
                    value={newGroupAircraft}
                    onChange={(e) => setNewGroupAircraft(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="B787-9">Boeing 787-9</option>
                    <option value="B737-800">Boeing 737-800 / MAX</option>
                    <option value="A350-900">Airbus A350-900</option>
                    <option value="Q400">Bombardier Dash 8 Q400</option>
                    <option value="B777-300ER">Boeing 777-300ER</option>
                    <option value="General Fleet">All Aircraft / Fleet-Wide</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Track / Course
                  </label>
                  <select
                    value={newGroupCourse}
                    onChange={(e) => setNewGroupCourse(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Safety & Evacuation Drills">Safety & Evac Drills</option>
                    <option value="Service Sequence & ShebaMiles">Service & ShebaMiles</option>
                    <option value="Dangerous Goods (DGR)">Dangerous Goods (DGR)</option>
                    <option value="School Final Mock Exam">School Final Mock Prep</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <input
                  type="checkbox"
                  id="groupPrivate"
                  checked={newGroupIsPrivate}
                  onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                  className="rounded border-white/20 text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="groupPrivate" className="text-xs text-slate-300 cursor-pointer">
                  <strong>Make this group Private</strong> (Requires invite to join)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroupName.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold disabled:opacity-50 transition-all shadow-md"
                >
                  {creatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE TRAINEE TO GROUP */}
      {showInviteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteFeedback(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-400" />
              Invite Trainees to {selectedGroup.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Search by name or email to add peers to this study squad.
            </p>

            {inviteFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {inviteFeedback}
              </div>
            )}

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search peers by name or email..."
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {loadingPeers ? (
                <div className="py-6 text-center text-slate-500 text-xs">Searching peers...</div>
              ) : availablePeers.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">No peers found matching query.</div>
              ) : (
                availablePeers.map((peer) => {
                  const isAlreadyMember = groupMembers.some((m) => m.user_id === peer.id);
                  return (
                    <div
                      key={peer.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{peer.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {peer.email} • {peer.airline || "Trainee"}
                        </div>
                      </div>

                      {isAlreadyMember ? (
                        <span className="text-[10px] text-slate-500 font-semibold px-2 py-1 rounded bg-white/[0.05]">
                          Joined
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInviteUser(peer)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Add to Group
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteFeedback(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.05] text-slate-300 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: START NEW DIRECT CHAT */}
      {showNewDirectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewDirectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Start 1-on-1 Peer Chat
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select a peer trainee to practice cabin crew drills and exchange study advice.
            </p>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search peers by name or email..."
                value={peerSearchQuery}
                onChange={(e) => setPeerSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {loadingPeers ? (
                <div className="py-6 text-center text-slate-500 text-xs">Searching peers...</div>
              ) : availablePeers.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">No peers found.</div>
              ) : (
                availablePeers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => handleStartDirectChat(peer)}
                    className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-indigo-600/15 border border-white/5 hover:border-indigo-500/30 text-left flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{peer.full_name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {peer.email} • {peer.airline || "Trainee"}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      Chat <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
