import React, { useState, useEffect } from "react";

const STORAGE_KEYS = {
  MEMBERS: "vortexx_members_v1",
  MESSAGES: "vortexx_messages_v1",
};

const defaultMembers = [
  { name: "Saint Kieran", photo: "https://via.placeholder.com/300", bio: "Leader of the storm." },
  { name: "Chems", photo: "https://via.placeholder.com/300", bio: "Brains behind the chaos." },
  { name: "Mark", photo: "https://via.placeholder.com/300", bio: "The silent strategist." },
  { name: "Young Blood", photo: "https://via.placeholder.com/300", bio: "Newest spark in The Vortex." },
];

function loadFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  // 🔐 Login State
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const correctPassword = "vortexx123"; // change this 🔒

  const handleLogin = () => {
    if (password === correctPassword) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Wrong password. Try again.");
    }
  };

  // 🧠 Vortexx App State
  const [members, setMembers] = useState(() => loadFromStorage(STORAGE_KEYS.MEMBERS, defaultMembers));
  const [messages, setMessages] = useState(() => loadFromStorage(STORAGE_KEYS.MESSAGES, []));
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState({ name: "", photo: "", bio: "" });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSender, setChatSender] = useState(() => (members[0] ? members[0].name : ""));
  const [chatText, setChatText] = useState("");
  const [viewPhoto, setViewPhoto] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    if (!members.find((m) => m.name === chatSender) && members[0]) setChatSender(members[0].name);
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  const addMember = () => {
    if (!newName.trim()) return;
    const nm = { name: newName.trim(), photo: "https://via.placeholder.com/300", bio: "A new force joins The Vortex." };
    setMembers([...members, nm]);
    setNewName("");
  };

  const removeMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated.length ? updated : [{ name: "Placeholder", photo: "https://via.placeholder.com/300", bio: "Awaiting new energy." }]);
  };

  const openModal = (member, index) => {
    setSelected(index);
    setEditData({ name: member.name, photo: member.photo, bio: member.bio || "" });
  };

  const saveChanges = () => {
    if (selected === null) return;
    const updated = [...members];
    updated[selected] = { ...updated[selected], ...editData };
    setMembers(updated);
    setSelected(null);
  };

  const cancelEdit = () => setSelected(null);

  const handlePhotoUpload = (e, index) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...members];
      updated[index] = { ...updated[index], photo: reader.result };
      setMembers(updated);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (!chatText.trim()) return;
    const now = new Date().toISOString();
    const msg = { id: Date.now(), sender: chatSender || "Unknown", text: chatText.trim(), time: now };
    setMessages((m) => [msg, ...m]);
    setChatText("");
  };

  const clearChat = () => {
    if (!confirm("Clear all chat messages?")) return;
    setMessages([]);
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  // 🔒 Password screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
        <h1 className="text-5xl font-bold mb-6 text-cyan-400 animate-pulse">THE VORTEXX 🌌</h1>
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="px-4 py-2 mb-4 rounded-lg bg-gray-700 border border-cyan-400 text-white outline-none"
          />
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-cyan-400 text-black font-bold rounded-lg hover:bg-cyan-300 transition"
          >
            Enter
          </button>
          {error && <p className="text-red-500 mt-3">{error}</p>}
        </div>
        <p className="text-gray-500 text-sm mt-6">Authorized users only 🌀</p>
      </div>
    );
  }

  // 🌪 Main Vortexx UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 relative">
      <header className="max-w-6xl mx-auto text-center mb-6">
        <h1 className="text-5xl font-extrabold mb-2" style={{ textShadow: "0 0 18px rgba(6,182,212,0.2)" }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">THE VORTEXX</span> 🌌
        </h1>
        <p className="text-slate-300">Your private crew hub — click photos to view or change.</p>
      </header>

      {/* Members grid + chat */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            {members.map((m, i) => (
              <div
                key={i}
                onClick={() => openModal(m, i)}
                className="bg-gray-800 p-4 rounded-2xl text-center shadow-lg hover:shadow-cyan-400/30 hover:scale-105 transition cursor-pointer"
              >
                <div className="relative group">
                  <img
                    src={m.photo}
                    alt={m.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPhoto(m.photo);
                    }}
                    className="w-28 h-28 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400 hover:opacity-90"
                  />
                  <label className="absolute bottom-0 right-0 bg-cyan-400 text-black text-xs px-2 py-1 rounded-md cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handlePhotoUpload(e, i)}
                    />
                    Edit
                  </label>
                </div>

                <h2 className="text-lg font-semibold">{m.name}</h2>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{m.bio}</p>

                <div className="mt-3 flex justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMember(i);
                    }}
                    className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
                  >
                    Remove
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(m, i);
                    }}
                    className="px-3 py-1 bg-cyan-400 text-black rounded-md text-sm hover:bg-cyan-300"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center justify-center mb-8">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a name..."
              className="px-4 py-2 rounded-lg bg-gray-800 border border-cyan-400 text-white w-64"
            />
            <button onClick={addMember} className="px-4 py-2 bg-cyan-400 text-black rounded-lg font-semibold">
              Add
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-2 ml-2 bg-[#111827] border border-cyan-400 rounded-lg text-cyan-300"
            >
              Message
            </button>
          </div>

          <footer className="text-center text-slate-400">Made with 💙 by The Vortexx Crew</footer>
        </section>

        <aside>
          <div className="bg-[#071025]/50 p-4 rounded-2xl border border-[#2a1f3a]">
            <h3 className="font-semibold mb-2">Vortexx Info</h3>
            <p className="text-sm text-slate-300">Group quote / vibes:</p>
            <p className="mt-2 text-gray-400 italic">“We pull the storm into existence.”</p>
          </div>
        </aside>
      </main>

      {/* Photo viewer, chat, edit modals go here (same as your version) */}
      {/* ... keep all your modal & chat code here unchanged */}
    </div>
  );
}
