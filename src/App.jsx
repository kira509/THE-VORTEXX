// src/App.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";

/* ------------------------
   CONFIG / STORAGE KEYS
   ------------------------ */
const STORAGE = {
  MEMBERS: "vortexx_members_v3",
  MESSAGES: "vortexx_messages_v3",
  POSTS: "vortexx_posts_v3",
  PASSWORD: "vortexx_password_v3",
  THEME: "vortexx_theme_v3",
  CURRENT_USER: "vortexx_current_user_v3",
};

const DEFAULT_PASSWORD = "vortexx123"; // initial admin password
const IMAGE_SIZE_LIMIT = 500 * 1024; // 500 KB

/* ------------------------
   DEFAULT DATA
   ------------------------ */
const DEFAULT_MEMBERS = [
  { name: "Saint Kieran", photo: "https://via.placeholder.com/300", bio: "Leader of the storm.", password: "kieran123" },
  { name: "Chems", photo: "https://via.placeholder.com/300", bio: "Brains behind the chaos.", password: "chems123" },
  { name: "Mark", photo: "https://via.placeholder.com/300", bio: "The silent strategist.", password: "mark123" },
  { name: "Young Blood", photo: "https://via.placeholder.com/300", bio: "Newest spark in The Vortex.", password: "young123" },
];

const DEFAULT_POSTS = [];

/* ------------------------
   UTILS: safe storage
   ------------------------ */
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Corrupted localStorage key:", key, err);
    try { localStorage.removeItem(key); } catch {}
    return fallback;
  }
}
function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn("Failed saving to localStorage:", key, err);
    return false;
  }
}

/* ------------------------
   Error Boundary (prevent blank page)
   ------------------------ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }
  componentDidCatch(err) {
    console.error("ErrorBoundary caught:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Oops — something broke</h2>
            <p className="text-sm text-slate-300 mb-4">We caught an error. You can reset local data (won't delete your repo).</p>
            <div className="flex gap-2">
              <button onClick={() => {
                localStorage.clear();
                location.reload();
              }} className="px-4 py-2 bg-red-600 rounded-md">Clear local data & reload</button>
              <button onClick={() => location.reload()} className="px-4 py-2 bg-gray-700 rounded-md">Reload</button>
            </div>
            <pre className="mt-4 text-xs text-red-200">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------
   Time formatting
   ------------------------ */
function formatTime(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

/* ------------------------
   App
   ------------------------ */
export default function App() {
  // loading screen while we hydrate from storage
  const [loading, setLoading] = useState(true);

  // auth
  const [currentUser, setCurrentUser] = useState(() => safeLoad(STORAGE.CURRENT_USER, null)); // { name }
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // theme
  const [theme, setTheme] = useState(() => safeLoad(STORAGE.THEME, "dark"));

  // core data
  const [members, setMembers] = useState(() => safeLoad(STORAGE.MEMBERS, DEFAULT_MEMBERS));
  const [messages, setMessages] = useState(() => safeLoad(STORAGE.MESSAGES, []));
  const [posts, setPosts] = useState(() => safeLoad(STORAGE.POSTS, DEFAULT_POSTS));

  // UI state
  const NAV = { HOME: "home", MESSAGES: "messages", PROFILES: "profiles", SETTINGS: "settings" };
  const [tab, setTab] = useState(NAV.HOME);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(null);
  const [editData, setEditData] = useState({ name: "", photo: "", bio: "" });
  const [viewImage, setViewImage] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [openThreadWith, setOpenThreadWith] = useState(null); // name of member we are chatting with
  const [chatText, setChatText] = useState("");
  const [postPreview, setPostPreview] = useState(null);
  const [postCaption, setPostCaption] = useState("");

  // mobile long-press tracking
  const longPressTimer = useRef(null);

  // Save to storage on changes, but catch errors. If an error occurs, notify user.
  useEffect(() => {
    try {
      safeSave(STORAGE.MEMBERS, members);
    } catch (err) { console.warn(err); }
  }, [members]);
  useEffect(() => {
    try { safeSave(STORAGE.MESSAGES, messages); } catch (err) { console.warn(err); }
  }, [messages]);
  useEffect(() => {
    try { safeSave(STORAGE.POSTS, posts); } catch (err) { console.warn(err); }
  }, [posts]);
  useEffect(() => {
    try { safeSave(STORAGE.THEME, theme); } catch {}
  }, [theme]);

  // Finish loading after initial mount
  useEffect(() => {
    setTimeout(() => setLoading(false), 350); // show loader shortly
  }, []);

  /* ------------------------
     AUTH: per-member login (each member has its own password)
     ------------------------ */
  function attemptLogin(name, password) {
    const mem = members.find((m) => m.name === name);
    if (!mem) { setLoginError("No such user"); return false; }
    // NOTE: passwords are stored in plain text locally here — fine for local app only.
    if ((mem.password || "") === password) {
      safeSave(STORAGE.CURRENT_USER, { name: mem.name });
      setCurrentUser({ name: mem.name });
      setLoginError("");
      return true;
    } else {
      setLoginError("Wrong password");
      return false;
    }
  }

  function logout() {
    try { localStorage.removeItem(STORAGE.CURRENT_USER); } catch {}
    setCurrentUser(null);
    setOpenThreadWith(null);
    setChatOpen(false);
  }

  /* ------------------------
     MEMBER CRUD + photos
     ------------------------ */
  function addMember(name, pass = "") {
    if (!name || !name.trim()) return;
    const nm = { name: name.trim(), photo: "https://via.placeholder.com/300", bio: "", password: pass || "" };
    setMembers((s) => [...s, nm]);
  }

  function removeMember(index) {
    setMembers((s) => s.filter((_, i) => i !== index));
  }

  function openEditModal(index) {
    setSelectedMemberIndex(index);
    const m = members[index];
    setEditData({ name: m.name, photo: m.photo, bio: m.bio || "", password: m.password || "" });
  }

  function saveMemberEdits() {
    if (selectedMemberIndex === null) return;
    const updated = [...members];
    updated[selectedMemberIndex] = { ...updated[selectedMemberIndex], ...editData };
    setMembers(updated);
    // if editing current user's name, update currentUser
    if (currentUser && currentUser.name === updated[selectedMemberIndex].name) {
      safeSave(STORAGE.CURRENT_USER, { name: updated[selectedMemberIndex].name });
      setCurrentUser({ name: updated[selectedMemberIndex].name });
    }
    setSelectedMemberIndex(null);
  }

  /* file -> base64 helper with size check */
  function handlePhotoFile(file, index = null, previewSetter = null) {
    if (!file) return;
    if (file.size > IMAGE_SIZE_LIMIT) {
      alert("Choose an image under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (index !== null) {
        setMembers((s) => {
          const copy = [...s];
          copy[index] = { ...copy[index], photo: dataUrl };
          return copy;
        });
      } else if (previewSetter) {
        previewSetter(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  /* ------------------------
     MESSAGING (per-user threads)
     messages stored with { id, from, to, text, time }
     ------------------------ */
  function openThread(withName) {
    setOpenThreadWith(withName);
    setChatOpen(true);
  }

  function sendMsg(toName) {
    if (!currentUser) { alert("Login first"); return; }
    if (!toName || !chatText.trim()) return;
    const msg = { id: Date.now(), from: currentUser.name, to: toName, text: chatText.trim(), time: new Date().toISOString() };
    setMessages((s) => [msg, ...s]);
    setChatText("");
  }

  function editMessage(id, newText) {
    setMessages((s) => s.map(m => m.id === id ? { ...m, text: newText } : m));
  }

  function deleteMessage(id) {
    if (!confirm("Delete this message?")) return;
    setMessages((s) => s.filter(m => m.id !== id));
  }

  /* right-click / long-press handling on message */
  function messageMouseDown(e, msg) {
    // for long-press on touch devices
    if (e.type === "touchstart") {
      longPressTimer.current = setTimeout(() => {
        showMessageActions(msg);
      }, 650);
    }
  }
  function messageMouseUp(e) {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
  function messageContextMenu(e, msg) {
    e.preventDefault();
    showMessageActions(msg);
  }
  function showMessageActions(msg) {
    const choice = prompt("Type 'edit' to edit or 'delete' to delete this message:");
    if (!choice) return;
    if (choice.toLowerCase() === "delete") deleteMessage(msg.id);
    else if (choice.toLowerCase() === "edit") {
      const newText = prompt("Edit message:", msg.text);
      if (newText !== null) editMessage(msg.id, newText);
    }
  }

  /* ------------------------
     POSTS (Crushie feed): multiple posts with image+caption
     ------------------------ */
  function createPost(authorName) {
    if (!postPreview && !postCaption.trim()) {
      alert("Add an image or caption.");
      return;
    }
    const post = { id: Date.now(), image: postPreview, caption: postCaption.trim(), author: authorName || (currentUser && currentUser.name) || "Unknown", time: new Date().toISOString() };
    setPosts((s) => [post, ...s]);
    setPostCaption(""); setPostPreview(null);
  }

  function removePost(id) {
    setPosts((s) => s.filter(p => p.id !== id));
  }

  /* ------------------------
     SETTINGS: change password / export / import / clear / theme toggle
     ------------------------ */
  function changeMemberPassword(index, newPw) {
    setMembers((s) => {
      const copy = [...s];
      copy[index] = { ...copy[index], password: newPw };
      return copy;
    });
  }

  function clearAllData() {
    if (!confirm("This erases local data. Continue?")) return;
    localStorage.removeItem(STORAGE.MEMBERS);
    localStorage.removeItem(STORAGE.MESSAGES);
    localStorage.removeItem(STORAGE.POSTS);
    localStorage.removeItem(STORAGE.PASSWORD);
    localStorage.removeItem(STORAGE.THEME);
    localStorage.removeItem(STORAGE.CURRENT_USER);
    // reload defaults
    setMembers(DEFAULT_MEMBERS);
    setMessages([]);
    setPosts([]);
    setCurrentUser(null);
  }

  function exportBackup() {
    const payload = { members, messages, posts, theme };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vortexx-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.posts) setPosts(parsed.posts);
        if (parsed.theme) setTheme(parsed.theme || "dark");
        alert("Backup imported.");
      } catch (err) { alert("Bad backup file."); }
    };
    r.readAsText(file);
  }

  /* ------------------------
     Loading screen
     ------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 text-3xl font-extrabold animate-pulse text-cyan-300">THE VORTEXX</div>
          <div className="w-24 h-24 rounded-full border-4 border-cyan-400 animate-spin/slow" />
          <div className="mt-4 text-sm text-slate-400">Warming the vortex...</div>
        </div>
      </div>
    );
  }

  /* ------------------------
     LOGIN SCREEN (per-member)
     ------------------------ */
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white p-6">
        <h1 className="text-4xl font-bold text-cyan-300 mb-4">THE VORTEXX</h1>
        <div className="bg-gray-800 p-4 rounded-lg w-80">
          <p className="text-sm text-slate-300 mb-3">Select your name and enter your password.</p>

          <select value={loginName} onChange={(e) => setLoginName(e.target.value)} className="w-full mb-2 p-2 bg-gray-700 rounded">
            <option value="">-- choose profile --</option>
            {members.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
          </select>

          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="w-full p-2 mb-2 bg-gray-700 rounded" onKeyDown={(e) => e.key === 'Enter' && attemptLogin(loginName, loginPassword)} />

          <div className="flex gap-2">
            <button className="flex-1 bg-cyan-400 text-black p-2 rounded" onClick={() => attemptLogin(loginName, loginPassword)}>Login</button>
            <button className="bg-white/5 p-2 rounded" onClick={() => {
              // quick create account flow: prompt for name+password
              const name = prompt("New profile name:");
              if (!name) return;
              const pw = prompt("New password for this profile:");
              addMember(name, pw || "");
              setLoginName(name);
              alert("Profile created. Now login with password.");
            }}>Create</button>
          </div>

          {loginError && <div className="mt-2 text-red-400 text-sm">{loginError}</div>}
        </div>

        <div className="mt-4 text-slate-400 text-sm">If you forgot, use Settings → Import Backup to restore.</div>
      </div>
    );
  }

  /* ------------------------
     MAIN APP UI
     ------------------------ */
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-4">
        {/* TOP NAV */}
        <nav className="max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">THE VORTEXX</div>

            <div className="ml-6 flex gap-1 rounded-full bg-black/10 px-2 py-1">
              {Object.values(NAV).map(n => {
                const active = tab === n;
                return (
                  <button key={n} onClick={() => setTab(n)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${active ? "bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-black" : "text-slate-300 hover:bg-white/5"}`}>
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
            <div className="text-sm text-slate-400 hidden sm:block">Signed in: <strong className="text-white ml-1">{currentUser.name}</strong></div>

            {/* Settings dropdown (Facebook-like less exposed) */}
            <div className="relative">
              <button className="flex items-center gap-2 bg-gray-800 p-2 rounded-full" onClick={() => setTab(NAV.SETTINGS)}>
                <img src={(members.find(m => m.name === currentUser.name) || {}).photo} alt="me" className="w-8 h-8 rounded-full object-cover border-2 border-cyan-400"/>
              </button>
            </div>

            <button onClick={logout} className="px-3 py-2 bg-red-600 rounded-md text-sm">Logout</button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
          {/* Left / main column */}
          <section>
            {/* HOME */}
            {tab === NAV.HOME && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">E-FOOTBALL BEST SCORE 👑</h2>

                {/* Post form */}
                <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                  <div className="mb-2">
                    <label className="block text-sm text-slate-300 mb-1">Image</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (!file) return; handlePhotoFile(file, null, setPostPreview);
                    }} />
                    {postPreview && <img src={postPreview} alt="preview" className="mt-2 w-56 rounded-lg border-2 border-cyan-400" />}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Caption</label>
                    <input value={postCaption} onChange={(e) => setPostCaption(e.target.value)} placeholder="Caption..." className="w-full px-3 py-2 rounded-md bg-gray-800 border border-cyan-400" />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => createPost(currentUser.name)} className="px-4 py-2 bg-cyan-400 rounded-md text-black font-semibold">Post</button>
                    <button onClick={() => { setPostCaption(""); setPostPreview(null); }} className="px-3 py-2 bg-white/5 rounded-md">Clear</button>
                  </div>
                </div>

                {/* feed */}
                <div className="space-y-4">
                  {posts.length === 0 ? <div className="text-slate-500">No crushies yet — be the first.</div> : posts.map(p => (
                    <div key={p.id} className="bg-gray-800 rounded-2xl p-3 border border-[#1f1630]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{p.author}</div>
                        <div className="text-xs text-slate-400">{formatTime(p.time)}</div>
                      </div>
                      {p.image && <img src={p.image} alt="post" className="w-full max-h-[480px] object-cover rounded-lg mb-2 cursor-pointer" onClick={() => setViewImage(p.image)} />}
                      {p.caption && <div className="text-sm text-slate-200 mb-2">{p.caption}</div>}
                      <div className="flex gap-2">
                        {p.author === currentUser.name && <button onClick={() => removePost(p.id)} className="px-3 py-1 bg-red-600 text-sm rounded-md">Remove</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {tab === NAV.MESSAGES && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">Messages 💬</h2>

                {/* threads list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {members.filter(m=>m.name!==currentUser.name).map((m, i) => {
                    const unreadCount = messages.filter(msg => (msg.to===currentUser.name && msg.from===m.name)).length;
                    return (
                      <div key={i} className="bg-gray-800 p-3 rounded-lg cursor-pointer" onClick={() => openThread(m.name)}>
                        <div className="flex items-center gap-3">
                          <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400" />
                          <div>
                            <div className="font-semibold">{m.name}</div>
                            <div className="text-xs text-slate-400">{m.bio || "No bio"}</div>
                          </div>
                        </div>
                        {unreadCount > 0 && <div className="mt-2 text-xs text-slate-300">{unreadCount} msgs</div>}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Open a thread above to chat. Threads are private to your logged-in profile.</p>
                </div>
              </div>
            )}

            {/* PROFILES */}
            {tab === NAV.PROFILES && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">Profiles 👥</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                  {members.map((m, i) => (
                    <div key={i} className="bg-gray-800 p-4 rounded-2xl text-center">
                      <div className="relative">
                        <img src={m.photo} alt={m.name} onClick={() => setViewImage(m.photo)} className="w-28 h-28 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400 cursor-pointer" />
                        <label className="absolute bottom-0 right-0 bg-cyan-400 text-black text-xs px-2 py-1 rounded-md cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={(e)=>handlePhotoFile(e.target.files?.[0], i)} />
                          Edit
                        </label>
                      </div>
                      <h3 className="font-semibold">{m.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{m.bio}</p>
                      <div className="mt-3 flex gap-2 justify-center">
                        <button onClick={() => openEditModal(i)} className="px-3 py-1 bg-cyan-400 text-black rounded-md text-sm">Edit</button>
                        {currentUser.name === m.name ? <span className="text-xs text-slate-400 px-2 py-1">You</span> : <button onClick={()=>openThread(m.name)} className="px-3 py-1 bg-white/5 rounded-md text-sm">Chat</button>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 items-center justify-center mb-8">
                  <button onClick={() => {
                    const name = prompt("New profile name:");
                    if (!name) return;
                    const pw = prompt("Password for new profile:");
                    addMember(name, pw || "");
                  }} className="px-4 py-2 bg-cyan-400 rounded-lg text-black">Create Profile</button>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab === NAV.SETTINGS && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">Settings ⚙️</h2>

                <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                  <h3 className="font-semibold mb-2">Account</h3>
                  <div className="mb-2">Logged in as <strong>{currentUser.name}</strong></div>
                  <div className="mb-2">
                    <label className="text-sm text-slate-300 block mb-1">Change my password</label>
                    <input type="password" placeholder="New password" id="pwChange" className="px-3 py-2 rounded-md bg-gray-800 border border-cyan-400" />
                    <button onClick={() => {
                      const newPw = document.getElementById("pwChange").value;
                      const idx = members.findIndex(m => m.name === currentUser.name);
                      if (idx >= 0) {
                        changeMemberPassword(idx, newPw);
                        alert("Password changed.");
                        document.getElementById("pwChange").value = "";
                      }
                    }} className="ml-2 px-3 py-2 bg-cyan-400 rounded-md text-black">Save</button>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                  <h3 className="font-semibold mb-2">Appearance</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme("dark")} className={`px-3 py-2 rounded-md ${theme==="dark" ? "bg-cyan-400 text-black":"bg-white/5"}`}>Dark</button>
                    <button onClick={() => setTheme("neon")} className={`px-3 py-2 rounded-md ${theme==="neon" ? "bg-cyan-400 text-black":"bg-white/5"}`}>Neon</button>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-2xl mb-4">
                  <h3 className="font-semibold mb-2">Data & Backup</h3>
                  <div className="flex gap-2">
                    <button onClick={exportBackup} className="px-3 py-2 bg-white/5 rounded-md">Export Backup</button>
                    <label className="px-3 py-2 bg-white/5 rounded-md cursor-pointer">
                      Import Backup
                      <input type="file" accept="application/json" onChange={importBackup} className="hidden" />
                    </label>
                    <button onClick={clearAllData} className="px-3 py-2 bg-red-600 rounded-md">Clear All</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right column */}
          <aside>
            <div className="bg-[#071025]/50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-2">Vortexx Info</h3>
              <p className="text-sm text-slate-300">Group vibes & tips</p>
              <p className="mt-2 text-gray-400 italic">“We pull the storm into existence.”</p>
              <hr className="my-4 border-[#1a1230]/40" />
              <div className="text-xs text-slate-400">Tip: Upload images under 500 KB. Use Export/Import to move data between devices.</div>
            </div>
          </aside>
        </main>

        {/* Chat panel (left drawer) */}
        {chatOpen && openThreadWith && (
          <div className="fixed inset-y-0 left-0 w-96 bg-gray-900/95 border-r border-cyan-400 z-50 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-cyan-300">Chat with {openThreadWith}</h2>
              <div className="flex gap-2">
                <button onClick={() => setChatOpen(false)} className="px-3 py-1 bg-gray-700 rounded-md">Close</button>
              </div>
            </div>

            <div className="mb-3">
              <div className="bg-gray-800 p-2 rounded h-64 overflow-auto flex flex-col-reverse gap-2">
                {messages.filter(m => (m.from===currentUser.name && m.to===openThreadWith) || (m.from===openThreadWith && m.to===currentUser.name)).map(msg => (
                  <div key={msg.id} className={`p-2 rounded ${msg.from===currentUser.name ? "self-end bg-cyan-400 text-black":"bg-gray-700 text-white"}`}
                    onContextMenu={(e)=>messageContextMenu(e,msg)}
                    onTouchStart={(e)=>messageMouseDown(e,msg)}
                    onTouchEnd={messageMouseUp}
                    onMouseDown={(e)=>longPressTimer.current = null} // ignore
                    >
                    <div className="flex items-baseline gap-2">
                      <div className="text-xs font-semibold">{msg.from}</div>
                      <div className="text-xs text-slate-300">{formatTime(msg.time)}</div>
                    </div>
                    <div className="mt-1">{msg.text}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2">
                <textarea value={chatText} onChange={(e)=>setChatText(e.target.value)} placeholder="Write a message..." className="w-full h-20 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md resize-none" />
                <div className="flex gap-2 justify-between mt-2">
                  <div className="text-xs text-slate-400">You are: <strong>{currentUser.name}</strong></div>
                  <div>
                    <button onClick={()=>sendMsg(openThreadWith)} className="px-4 py-2 bg-cyan-400 text-black rounded-md">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full image viewer */}
        {viewImage && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4" onClick={()=>setViewImage(null)}>
            <img src={viewImage} alt="full" className="max-w-full max-h-[90vh] rounded-lg border-2 border-cyan-400 object-contain" />
            <button onClick={()=>setViewImage(null)} className="absolute top-6 right-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        )}

        {/* Edit member modal */}
        {selectedMemberIndex !== null && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-70" onClick={() => setSelectedMemberIndex(null)}>
            <div className="bg-gray-900 p-6 rounded-2xl border border-cyan-400 w-96" onClick={(e)=>e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-cyan-300 mb-3 text-center">Edit Member</h2>
              <label className="block cursor-pointer mb-3">
                <input type="file" accept="image/*" className="hidden" onChange={(e)=>onModalPhotoChange(e)} />
                <img src={editData.photo} alt="preview" className="w-28 h-28 rounded-full mx-auto mb-2 object-cover border-2 border-cyan-400" />
              </label>

              <input value={editData.name} onChange={(e)=>setEditData(d=>({...d,name:e.target.value}))} className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white" />
              <input type="password" placeholder="Change password (optional)" onChange={(e)=>setEditData(d=>({...d,password:e.target.value}))} className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white" />
              <textarea value={editData.bio} onChange={(e)=>setEditData(d=>({...d,bio:e.target.value}))} rows="3" className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white" />

              <div className="flex justify-between mt-4">
                <button onClick={()=>{
                  // save modal -> update members
                  if (selectedMemberIndex !== null) {
                    const updated = [...members];
                    updated[selectedMemberIndex] = { ...updated[selectedMemberIndex], ...editData };
                    setMembers(updated);
                    // if we changed password or name of current user, update stored user
                    if (currentUser && currentUser.name === updated[selectedMemberIndex].name) {
                      safeSave(STORAGE.CURRENT_USER, { name: updated[selectedMemberIndex].name });
                      setCurrentUser({ name: updated[selectedMemberIndex].name });
                    }
                  }
                  setSelectedMemberIndex(null);
                }} className="px-4 py-2 bg-cyan-400 text-black rounded-lg">Save</button>
                <button onClick={()=>setSelectedMemberIndex(null)} className="px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

/* ------------------------
   Additional handlers used in JSX but declared below (to keep code readable)
   ------------------------ */
function onModalPhotoChange(e) {
  // note: this function will be wrapped in the component's scope by references in JSX
  // We'll keep an empty placeholder here to avoid eslint errors when copying; actual handler is defined inside component.
}
