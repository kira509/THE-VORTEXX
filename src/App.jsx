import React, { useEffect, useState } from "react";

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
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  // load persisted data or defaults
  const [members, setMembers] = useState(() => loadFromStorage(STORAGE_KEYS.MEMBERS, defaultMembers));
  const [messages, setMessages] = useState(() => loadFromStorage(STORAGE_KEYS.MESSAGES, []));
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null); // index of member being edited in modal
  const [editData, setEditData] = useState({ name: "", photo: "", bio: "" });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSender, setChatSender] = useState(() => (members[0] ? members[0].name : ""));
  const [chatText, setChatText] = useState("");

  // persist when members/messages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    // keep chat sender valid if names changed
    if (!members.find((m) => m.name === chatSender) && members[0]) setChatSender(members[0].name);
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // members actions
  const addMember = () => {
    if (!newName.trim()) return;
    const nm = { name: newName.trim(), photo: "https://via.placeholder.com/300", bio: "A new force joins The Vortex." };
    const updated = [...members, nm];
    setMembers(updated);
    setNewName("");
  };

  const removeMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated.length ? updated : [{ name: "Placeholder", photo: "https://via.placeholder.com/300", bio: "Awaiting new energy." }]);
    // also remove messages from removed name (optional) - keep messages but if sender not found show as Unknown
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

  const cancelEdit = () => {
    setSelected(null);
  };

  // image upload directly from grid (IG style)
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

  // chat actions
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
      return d.toLocaleString(); // includes date + time based on user's locale
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6 font-sans relative">
      {/* Page header */}
      <header className="max-w-6xl mx-auto text-center mb-6">
        <h1 className="text-5xl font-extrabold mb-2" style={{ textShadow: "0 0 18px rgba(6,182,212,0.2)" }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]">THE VORTEXX</span> 🌌
        </h1>
        <p className="text-slate-300"> our CREW HUB — MJIBAMBE😂😁. </p>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* center area: profiles + add */}
        <section className="order-1 md:order-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            {members.map((m, i) => (
              <div
                key={i}
                onClick={() => openModal(m, i)}
                className="bg-gray-800 p-4 rounded-2xl text-center shadow-lg hover:shadow-cyan-400/30 hover:scale-105 transition cursor-pointer relative"
              >
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handlePhotoUpload(e, i)}
                  />
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-28 h-28 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400"
                  />
                </label>

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

          {/* add new */}
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

            {/* Open chat button */}
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-2 ml-2 bg-[#111827] border border-cyan-400 rounded-lg text-cyan-300"
            >
              Message
            </button>
          </div>

          <footer className="text-center text-slate-400"> Made with 💙 by GENESIS </footer>
        </section>

        {/* right area: (placeholder for other content) */}
        <aside className="order-2 md:order-2">
          <div className="bg-[#071025]/50 p-4 rounded-2xl border border-[#2a1f3a]">
            <h3 className="font-semibold mb-2">Vortexx Info</h3>
            <p className="text-sm text-slate-300">Group quote / vibes:</p>
            <p className="mt-2 text-gray-400 italic">“We pull the storm into existence.”</p>
            <hr className="my-4 border-[#1a1230]/40" />
            <div className="text-xs text-slate-400">Tip: Click any profile photo to change it — saved locally.</div>
          </div>
        </aside>
      </main>

      {/* Left chat panel (appears when chatOpen true) */}
      {chatOpen && (
        <div
          className="fixed inset-y-0 left-0 w-96 bg-gray-900/95 border-r border-cyan-400 z-50 p-4 overflow-auto"
          role="dialog"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-cyan-300">Vortexx Chat</h2>
            <div className="flex gap-2">
              <button
                onClick={clearChat}
                className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
              >
                Clear
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="px-3 py-1 bg-gray-700 rounded-md text-sm hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>

          {/* sender selector */}
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Send as</label>
            <select
              value={chatSender}
              onChange={(e) => setChatSender(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md"
            >
              {members.map((m, idx) => (
                <option key={idx} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* message input */}
          <div className="mb-4">
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Write a message..."
              className="w-full h-20 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-md resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-slate-400">{messages.length} messages</div>
              <div className="flex gap-2">
                <button onClick={sendMessage} className="px-4 py-2 bg-cyan-400 text-black rounded-md">
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* messages list (newest first) */}
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-slate-500 text-sm">No messages yet — start the vibe.</div>
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

      {/* Edit Modal */}
      {selected !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-60">
          <div className="bg-gray-900 p-6 rounded-2xl border border-cyan-400 shadow-[0_0_25px_#00ffff] w-96 relative">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Edit Member</h2>

            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Photo (click to choose)</label>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setEditData((d) => ({ ...d, photo: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <img
                  src={editData.photo}
                  alt="preview"
                  className="w-28 h-28 rounded-full mx-auto mb-2 object-cover border-2 border-cyan-400"
                />
              </label>
            </div>

            <input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white"
              placeholder="Name"
            />

            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white"
              placeholder="Bio..."
              rows="3"
            />

            <div className="flex justify-between mt-4">
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300"
              >
                Save
              </button>
              <button onClick={cancelEdit} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

