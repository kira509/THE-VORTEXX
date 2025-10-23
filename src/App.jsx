import React, { useEffect, useMemo, useState } from "react";

/* ---------------------------
  CONFIG / STORAGE KEYS
   --------------------------- */
const STORAGE = {
  MEMBERS: "vortexx_members_v2",
  MESSAGES: "vortexx_messages_v2",
  POSTS: "vortexx_posts_v2",
  PASSWORD: "vortexx_password_v2",
  THEME: "vortexx_theme_v2",
  SESSION: "vortexx_session_v2",
};

const DEFAULT_PASSWORD = "vortexx123";
const IMAGE_SIZE_LIMIT = 500 * 1024; // 500 KB

/* ---------------------------
  DEFAULT DATA
   --------------------------- */
const DEFAULT_MEMBERS = [
  { name: "Saint Kieran", photo: "https://via.placeholder.com/300", bio: "Leader of the storm." },
  { name: "Chems", photo: "https://via.placeholder.com/300", bio: "Brains behind the chaos." },
  { name: "Mark", photo: "https://via.placeholder.com/300", bio: "The silent strategist." },
  { name: "Young Blood", photo: "https://via.placeholder.com/300", bio: "Newest spark in The Vortex." },
];

const DEFAULT_POSTS = [
  // example
  // { id: 1, image: 'dataurl or url', caption: 'Yo', author: 'Saint Kieran', time: 'iso' }
];

/* ---------------------------
  UTIL - SAFE LOCALSTORAGE
   --------------------------- */
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn("LocalStorage corrupted for", key, "- resetting.", err);
    localStorage.removeItem(key);
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn("Failed to save to localStorage:", key, err);
    return false;
  }
}

/* ---------------------------
  TIME FORMAT
   --------------------------- */
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

/* ---------------------------
  MAIN APP
   --------------------------- */
export default function App() {
  /* ---------- auth / password ---------- */
  const [authenticated, setAuthenticated] = useState(() => {
    // sessionStorage holds current session
    try {
      return sessionStorage.getItem(STORAGE.SESSION) === "1";
    } catch {
      return false;
    }
  });
  const [loginPassword, setLoginPassword] = useState("");
  const storedPassword = useMemo(() => safeLoad(STORAGE.PASSWORD, DEFAULT_PASSWORD), []);
  const [loginError, setLoginError] = useState("");

  const handleLogin = () => {
    if (loginPassword === storedPassword) {
      try {
        sessionStorage.setItem(STORAGE.SESSION, "1");
      } catch {}
      setAuthenticated(true);
      setLoginError("");
      setLoginPassword("");
    } else {
      setLoginError("Wrong password. Try again.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(STORAGE.SESSION);
    } catch {}
    setAuthenticated(false);
  };

  /* ---------- theme ---------- */
  const [theme, setTheme] = useState(() => safeLoad(STORAGE.THEME, "dark")); // 'dark' or 'neon'
  useEffect(() => safeSave(STORAGE.THEME, theme), [theme]);

  /* ---------- core data (members/messages/posts) ---------- */
  const [members, setMembers] = useState(() => safeLoad(STORAGE.MEMBERS, DEFAULT_MEMBERS));
  const [messages, setMessages] = useState(() => safeLoad(STORAGE.MESSAGES, []));
  const [posts, setPosts] = useState(() => safeLoad(STORAGE.POSTS, DEFAULT_POSTS));

  useEffect(() => safeSave(STORAGE.MEMBERS, members), [members]);
  useEffect(() => safeSave(STORAGE.MESSAGES, messages), [messages]);
  useEffect(() => safeSave(STORAGE.POSTS, posts), [posts]);

  /* ---------- navigation (top tabs) ---------- */
  const NAV = { HOME: "home", MESSAGES: "messages", PROFILES: "profiles", SETTINGS: "settings" };
  const [tab, setTab] = useState(NAV.HOME);

  /* ---------- UI state ---------- */
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(null); // index for edit modal
  const [editData, setEditData] = useState({ name: "", photo: "", bio: "" });
  const [viewImage, setViewImage] = useState(null); // for fullscreen image viewer
  const [chatOpen, setChatOpen] = useState(false); // left panel
  const [chatSender, setChatSender] = useState(() => (members[0] ? members[0].name : ""));
  const [chatText, setChatText] = useState("");

  /* ---------- crushie post inputs ---------- */
  const [postCaption, setPostCaption] = useState("");
  const [postImageFile, setPostImageFile] = useState(null); // File input pending
  const [postImagePreview, setPostImagePreview] = useState(null); // dataURL preview

  /* ---------- settings state ---------- */
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  /* ---------- effects keep chatSender valid ---------- */
  useEffect(() => {
    if (!members.find((m) => m.name === chatSender)) {
      setChatSender(members[0] ? members[0].name : "");
    }
  }, [members]);

  /* -----------------------
     MEMBER FUNCTIONS
     ----------------------- */
  const addMember = () => {
    const name = (newMemberName || "").trim();
    if (!name) return;
    const nm = { name, photo: "https://via.placeholder.com/300", bio: "A new force joins The Vortex." };
    setMembers((s) => [...s, nm]);
    setNewMemberName("");
  };

  const removeMember = (index) => {
    setMembers((s) => {
      const next = s.filter((_, i) => i !== index);
      return next.length ? next : [{ name: "Placeholder", photo: "https://via.placeholder.com/300", bio: "Awaiting new energy." }];
    });
    // do not purge messages automatically; messages will show sender name even if member removed
  };

  const openEditModal = (index) => {
    const mem = members[index];
    setSelectedMemberIndex(index);
    setEditData({ name: mem.name, photo: mem.photo, bio: mem.bio || "" });
  };

  const saveMemberEdits = () => {
    if (selectedMemberIndex === null) return;
    const updated = [...members];
    updated[selectedMemberIndex] = { ...updated[selectedMemberIndex], ...editData };
    setMembers(updated);
    setSelectedMemberIndex(null);
  };

  const cancelEdit = () => {
    setSelectedMemberIndex(null);
  };

  /* handle photo uploads (from grid or modal) */
  const handlePhotoFile = (file, index = null, directSet = false) => {
    if (!file) return false;
    if (file.size > IMAGE_SIZE_LIMIT) {
      alert("Image too large — choose under 500 KB to keep things stable.");
      return false;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (index === null && directSet) {
        // used for modal preview only
        setEditData((d) => ({ ...d, photo: dataUrl }));
      } else if (index === null) {
        // shouldn't happen
      } else {
        setMembers((s) => {
          const copy = [...s];
          copy[index] = { ...copy[index], photo: dataUrl };
          return copy;
        });
      }
    };
    reader.readAsDataURL(file);
    return true;
  };

  /* file input handlers wired in JSX */
  const onGridPhotoChange = (e, index) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    handlePhotoFile(file, index);
  };

  const onModalPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_SIZE_LIMIT) {
      alert("Image too large — choose under 500 KB.");
      return;
    }
    // preview inside modal
    const reader = new FileReader();
    reader.onloadend = () => setEditData((d) => ({ ...d, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  /* -----------------------
     CHAT (MESSAGES)
     ----------------------- */
  const sendMessage = () => {
    if (!chatText.trim()) return;
    const msg = { id: Date.now(), sender: chatSender || "Unknown", text: chatText.trim(), time: new Date().toISOString() };
    setMessages((s) => [msg, ...s]);
    setChatText("");
  };

  const clearMessages = () => {
    if (!confirm("Clear all messages?")) return;
    setMessages([]);
  };

  /* -----------------------
     POSTS (Crushie feed)
     ----------------------- */
  const onPostImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_SIZE_LIMIT) {
      alert("Image too large — choose under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPostImagePreview(reader.result);
      setPostImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const createPost = (author) => {
    if (!postImagePreview && !postCaption.trim()) {
      alert("Add an image or caption for the Crushie post.");
      return;
    }
    // author default
    const who = author || (members[0] ? members[0].name : "Unknown");
    const post = {
      id: Date.now(),
      image: postImagePreview,
      caption: postCaption.trim(),
      author: who,
      time: new Date().toISOString(),
    };
    setPosts((s) => [post, ...s]);
    setPostCaption("");
    setPostImageFile(null);
    setPostImagePreview(null);
  };

  const removePost = (id) => {
    setPosts((s) => s.filter((p) => p.id !== id));
  };

  /* -----------------------
     SETTINGS
     ----------------------- */
  const changePassword = () => {
    if (!newPasswordInput.trim()) {
      setPwMessage("Password cannot be empty.");
      return;
    }
    safeSave(STORAGE.PASSWORD, newPasswordInput);
    setPwMessage("Password updated.");
    setNewPasswordInput("");
  };

  const clearAllData = () => {
    if (!confirm("This will erase members, messages, posts and settings. Continue?")) return;
    localStorage.removeItem(STORAGE.MEMBERS);
    localStorage.removeItem(STORAGE.MESSAGES);
    localStorage.removeItem(STORAGE.POSTS);
    localStorage.removeItem(STORAGE.PASSWORD);
    localStorage.removeItem(STORAGE.THEME);
    // reload defaults
    setMembers(DEFAULT_MEMBERS);
    setMessages([]);
    setPosts([]);
    setTheme("dark");
    setPwMessage("Data cleared. Password reset to default.");
    // also logout
    handleLogout();
  };

  /* small convenience: export/import backup */
  const exportBackup = () => {
    const payload = {
      members,
      messages,
      posts,
      theme,
      password: safeLoad(STORAGE.PASSWORD, DEFAULT_PASSWORD),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vortexx-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.posts) setPosts(parsed.posts);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.password) safeSave(STORAGE.PASSWORD, parsed.password);
        alert("Backup imported.");
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  /* -----------------------
     RENDER - LOGIN SCREEN
     ----------------------- */
  if (!authenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === "dark" ? "bg-gradient-to-br from-black to-gray-900" : "bg-white"} text-white`}>
        <h1 className="text-5xl font-bold mb-6 text-cyan-400 animate-pulse">THE VORTEXX 🌌</h1>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-80 text-center">
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full px-4 py-2 mb-4 rounded-lg bg-gray-700 border border-cyan-400 text-white outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin} className="w-full px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold">Enter</button>
          {loginError && <div className="mt-3 text-red-400">{loginError}</div>}
        </div>

        <p className="text-gray-400 mt-6 text-sm">Authorized users only 🌀</p>
      </div>
    );
  }

  /* -----------------------
     RENDER - MAIN APP
     ----------------------- */
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-br from-black to-gray-900 text-white" : "bg-white text-black"} p-4`}>
      {/* TOP NAV - glowing tabs Option A */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold" style={{ textShadow: "0 0 12px rgba(124,58,237,0.15)" }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">THE VORTEXX</span>
          </div>
          <div className="ml-6 flex gap-1 rounded-full bg-black/10 px-2 py-1">
            {Object.values(NAV).map((n) => {
              const active = tab === n;
              return (
                <button
                  key={n}
                  onClick={() => setTab(n)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${active ? "bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-black shadow-[0_0_12px_rgba(6,182,212,0.12)]" : "text-slate-300 hover:bg-white/5"}`}
                >
                  {n === NAV.HOME && "🏠 Home"}
                  {n === NAV.MESSAGES && "💬 Messages"}
                  {n === NAV.PROFILES && "👥 Profiles"}
                  {n === NAV.SETTINGS && "⚙️ Settings"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400 hidden sm:block">Logged in</div>
          <button onClick={handleLogout} className="px-3 py-2 bg-red-600 rounded-md text-sm hover:bg-red-700">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* MAIN LEFT - page content changes with tab */}
        <section>
          {tab === NAV.HOME && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-cyan-300">Crushie of the Day 💞</h2>

              {/* New post form */}
              <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                <div className="mb-2">
                  <label className="block text-sm text-slate-300 mb-1">Image</label>
                  <input type="file" accept="image/*" onChange={onPostImageSelect} />
                  {postImagePreview && <img src={postImagePreview} alt="preview" className="mt-2 w-56 rounded-lg border-2 border-cyan-400" />}
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Caption</label>
                  <input value={postCaption} onChange={(e) => setPostCaption(e.target.value)} placeholder="Caption..." className="w-full px-3 py-2 rounded-md bg-gray-800 border border-cyan-400" />
                </div>
                <div className="mt-3 flex gap-2">
                  <select className="px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md" defaultValue={members[0] ? members[0].name : ""} onChange={(e) => setChatSender(e.target.value)}>
                    {members.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
                  </select>
                  <button onClick={() => createPost(chatSender)} className="px-4 py-2 bg-cyan-400 rounded-md text-black font-semibold">Post</button>
                  <button onClick={() => { setPostCaption(""); setPostImagePreview(null); setPostImageFile(null); }} className="px-3 py-2 bg-white/5 rounded-md">Clear</button>
                </div>
              </div>

              {/* Posts feed */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-slate-500">No crushies yet — be the first to post.</div>
                ) : (
                  posts.map((p) => (
                    <div key={p.id} className="bg-gray-800 rounded-2xl p-3 border border-[#1f1630]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{p.author}</div>
                        <div className="text-xs text-slate-400">{formatTime(p.time)}</div>
                      </div>
                      {p.image && <img src={p.image} alt="post" className="w-full max-h-[480px] object-cover rounded-lg mb-2 cursor-pointer" onClick={() => setViewImage(p.image)} />}
                      {p.caption && <div className="text-sm text-slate-200 mb-2">{p.caption}</div>}
                      <div className="flex gap-2">
                        <button onClick={() => removePost(p.id)} className="px-3 py-1 bg-red-600 text-sm rounded-md">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === NAV.MESSAGES && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-cyan-300">Messages 💬</h2>
              <div className="mb-3">
                <button onClick={() => setChatOpen(true)} className="px-4 py-2 bg-cyan-400 rounded-md text-black font-semibold">Open Chat Panel</button>
                <button onClick={clearMessages} className="ml-2 px-3 py-2 bg-red-600 rounded-md text-white">Clear</button>
              </div>

              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-slate-500">No messages yet — open the chat panel to send some.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-800 p-3 rounded-lg border border-[#1f1630]">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{msg.sender}</div>
                        <div className="text-xs text-slate-400">{formatTime(msg.time)}</div>
                      </div>
                      <div className="mt-1 text-sm">{msg.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === NAV.PROFILES && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-cyan-300">Profiles 👥</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                {members.map((m, i) => (
                  <div key={i} onClick={() => openEditModal(i)} className="bg-gray-800 p-4 rounded-2xl text-center cursor-pointer hover:shadow-cyan-400/30 transition">
                    <div className="relative">
                      <img src={m.photo} alt={m.name} onClick={(e) => { e.stopPropagation(); setViewImage(m.photo); }} className="w-28 h-28 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400" />
                      <label className="absolute bottom-0 right-0 bg-cyan-400 text-black text-xs px-2 py-1 rounded-md cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => onGridPhotoChange(e, i)} />
                        Edit
                      </label>
                    </div>
                    <h3 className="font-semibold">{m.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{m.bio}</p>
                    <div className="mt-3 flex gap-2 justify-center">
                      <button onClick={(e) => { e.stopPropagation(); removeMember(i); }} className="px-3 py-1 bg-red-600 rounded-md text-sm">Remove</button>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(i); }} className="px-3 py-1 bg-cyan-400 text-black rounded-md text-sm">Edit</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center justify-center mb-8">
                <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Add a name..." className="px-4 py-2 rounded-lg bg-gray-800 border border-cyan-400 text-white w-64" />
                <button onClick={addMember} className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold">Add</button>
              </div>
            </div>
          )}

          {tab === NAV.SETTINGS && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-cyan-300">Settings ⚙️</h2>

              <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                <h3 className="font-semibold mb-2">Password</h3>
                <p className="text-sm text-slate-400 mb-2">Change the app password (stored locally).</p>
                <input value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} placeholder="New password..." className="px-3 py-2 rounded-md bg-gray-800 border border-cyan-400 w-full mb-2" />
                <button onClick={changePassword} className="px-4 py-2 bg-cyan-400 text-black rounded-md">Update</button>
                {pwMessage && <div className="mt-2 text-sm text-slate-300">{pwMessage}</div>}
              </div>

              <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                <h3 className="font-semibold mb-2">Theme</h3>
                <div className="flex gap-2">
                  <button onClick={() => setTheme("dark")} className={`px-3 py-2 rounded-md ${theme === "dark" ? "bg-cyan-400 text-black" : "bg-white/5"}`}>Dark</button>
                  <button onClick={() => setTheme("neon")} className={`px-3 py-2 rounded-md ${theme === "neon" ? "bg-cyan-400 text-black" : "bg-white/5"}`}>Neon</button>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                <h3 className="font-semibold mb-2">Data</h3>
                <div className="flex gap-2">
                  <button onClick={clearAllData} className="px-3 py-2 bg-red-600 rounded-md">Clear All Data</button>
                  <button onClick={exportBackup} className="px-3 py-2 bg-white/5 rounded-md">Export Backup</button>
                  <label className="px-3 py-2 bg-white/5 rounded-md cursor-pointer">
                    Import Backup
                    <input type="file" accept="application/json" onChange={importBackup} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT - info area */}
        <aside>
          <div className="bg-[#071025]/50 p-4 rounded-2xl">
            <h3 className="font-semibold mb-2">Vortexx Info</h3>
            <p className="text-sm text-slate-300">Group vibes & tips</p>
            <p className="mt-2 text-gray-400 italic">“We pull the storm into existence.”</p>
            <hr className="my-4 border-[#1a1230]/40" />
            <div className="text-xs text-slate-400">Tip: Click any photo to view it large. Upload images under 500 KB for stability.</div>
          </div>
        </aside>
      </main>

      {/* CHAT PANEL (left) */}
      {chatOpen && (
        <div className="fixed inset-y-0 left-0 w-96 bg-gray-900/95 border-r border-cyan-400 z-50 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-cyan-300">Vortexx Chat</h2>
            <div className="flex gap-2">
              <button onClick={clearMessages} className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700">Clear</button>
              <button onClick={() => setChatOpen(false)} className="px-3 py-1 bg-gray-700 rounded-md text-sm hover:bg-gray-600">Close</button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Send as</label>
            <select value={chatSender} onChange={(e) => setChatSender(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md">
              {members.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <textarea value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Write a message..." className="w-full h-20 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md resize-none" />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-slate-400">{messages.length} messages</div>
              <div className="flex gap-2">
                <button onClick={sendMessage} className="px-4 py-2 bg-cyan-400 text-black rounded-md">Send</button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {messages.length === 0 ? <div className="text-slate-500 text-sm">No messages yet — start the vibe.</div> :
              messages.map((msg) => (
                <div key={msg.id} className="bg-gray-800 p-3 rounded-lg border border-[#1f1630]">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{msg.sender}</div>
                    <div className="text-xs text-slate-400">{formatTime(msg.time)}</div>
                  </div>
                  <div className="mt-1 text-sm">{msg.text}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* FULL IMAGE VIEWER (IG-like) */}
      {viewImage && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="full" className="max-w-full max-h-[90vh] rounded-lg border-2 border-cyan-400 object-contain" />
          <button onClick={() => setViewImage(null)} className="absolute top-6 right-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {selectedMemberIndex !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-70" onClick={() => setSelectedMemberIndex(null)}>
          <div className="bg-gray-900 p-6 rounded-2xl border border-cyan-400 shadow-[0_0_25px_#00ffff] w-96 relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-cyan-300 mb-3 text-center">Edit Member</h2>

            <label className="block cursor-pointer mb-3">
              <input type="file" accept="image/*" className="hidden" onChange={onModalPhotoChange} />
              <img src={editData.photo} alt="preview" className="w-28 h-28 rounded-full mx-auto mb-2 object-cover border-2 border-cyan-400" />
            </label>

            <input value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white" />
            <textarea value={editData.bio} onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))} rows="3" className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white" />

            <div className="flex justify-between mt-4">
              <button onClick={() => { // saving modal photo data into members
                if (selectedMemberIndex !== null && editData.photo) {
                  const updated = [...members];
                  updated[selectedMemberIndex] = { ...updated[selectedMemberIndex], ...editData };
                  setMembers(updated);
                }
                saveMemberEdits();
              }} className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold">Save</button>
              <button onClick={() => cancelEdit()} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
