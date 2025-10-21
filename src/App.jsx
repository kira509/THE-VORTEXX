import React, { useState } from "react";

const defaultMembers = [
  { name: "Saint Kieran", photo: "https://via.placeholder.com/150", bio: "Leader of the storm." },
  { name: "Chems", photo: "https://via.placeholder.com/150", bio: "Brains behind the chaos." },
  { name: "Mark", photo: "https://via.placeholder.com/150", bio: "The silent strategist." },
  { name: "Young Blood", photo: "https://via.placeholder.com/150", bio: "Newest spark in The Vortex." },
];

export default function App() {
  const [members, setMembers] = useState(defaultMembers);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null); // modal target
  const [editData, setEditData] = useState({ name: "", photo: "", bio: "" });

  const addMember = () => {
    if (newName.trim() !== "") {
      setMembers([
        ...members,
        { name: newName, photo: "https://via.placeholder.com/150", bio: "A new force joins The Vortex." },
      ]);
      setNewName("");
    }
  };

  const removeMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(
      updated.length ? updated : [{ name: "Placeholder", photo: "https://via.placeholder.com/150", bio: "Awaiting new energy." }]
    );
  };

  const openModal = (member, index) => {
    setSelected(index);
    setEditData(member);
  };

  const saveChanges = () => {
    const updated = [...members];
    updated[selected] = editData;
    setMembers(updated);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex flex-col items-center p-6 text-white relative">
      <h1 className="text-5xl font-bold text-cyan-300 mb-6 animate-pulse drop-shadow-[0_0_10px_#00ffff]">
        THE VORTEXX 🌌
      </h1>

      {/* Profiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {members.map((m, i) => (
          <div
            key={i}
            onClick={() => openModal(m, i)}
            className="bg-gray-800 p-4 rounded-2xl text-center shadow-lg shadow-cyan-400/30 hover:shadow-cyan-300 hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-400" />
            <h2 className="text-lg font-semibold">{m.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{m.bio}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeMember(i);
              }}
              className="mt-2 px-3 py-1 bg-red-600 rounded-md hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add new member */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a name..."
          className="px-4 py-2 rounded-lg bg-gray-800 border border-cyan-400 text-white outline-none"
        />
        <button
          onClick={addMember}
          className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300 transition"
        >
          Add
        </button>
      </div>

      <footer className="mt-10 text-gray-500 text-sm">Made with 💙 by The Vortexx Crew</footer>

      {/* Edit Modal */}
      {selected !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl border border-cyan-400 shadow-[0_0_25px_#00ffff] w-80 relative">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Edit Member</h2>

            <input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white"
              placeholder="Name"
            />
            <input
              value={editData.photo}
              onChange={(e) => setEditData({ ...editData, photo: e.target.value })}
              className="w-full mb-3 px-3 py-2 bg-gray-800 border border-cyan-400 rounded-lg text-white"
              placeholder="Photo URL"
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
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
