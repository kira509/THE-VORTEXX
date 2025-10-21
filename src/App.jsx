import React, { useState } from "react";

const defaultMembers = [
  { name: "Saint Kieran", photo: "https://via.placeholder.com/150" },
  { name: "Chems", photo: "https://via.placeholder.com/150" },
  { name: "Mark", photo: "https://via.placeholder.com/150" },
  { name: "Young Blood", photo: "https://via.placeholder.com/150" },
];

export default function App() {
  const [members, setMembers] = useState(defaultMembers);
  const [newName, setNewName] = useState("");

  const addMember = () => {
    if (newName.trim() !== "") {
      setMembers([...members, { name: newName, photo: "https://via.placeholder.com/150" }]);
      setNewName("");
    }
  };

  const removeMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated.length ? updated : [{ name: "Placeholder", photo: "https://via.placeholder.com/150" }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex flex-col items-center p-6">
      <h1 className="text-5xl font-bold text-neon mb-6 animate-pulse">THE VORTEXX 🌌</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {members.map((m, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-2xl text-center shadow-lg shadow-neon/30 hover:scale-105 transition-transform duration-300"
          >
            <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
            <h2 className="text-lg font-semibold">{m.name}</h2>
            <button
              onClick={() => removeMember(i)}
              className="mt-2 px-3 py-1 bg-red-600 rounded-md hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a name..."
          className="px-4 py-2 rounded-lg bg-gray-800 border border-neon text-white outline-none"
        />
        <button
          onClick={addMember}
          className="px-4 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-cyan-300 transition"
        >
          Add
        </button>
      </div>

      <footer className="mt-10 text-gray-500 text-sm">
        Made with 💙 by The Vorexx Crew
      </footer>
    </div>
  );
}
