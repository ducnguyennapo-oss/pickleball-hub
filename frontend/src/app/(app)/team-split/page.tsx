"use client";
import { useState, useEffect } from "react";

const TEAM_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-pink-100 border-pink-300 text-pink-800",
];

const AVATAR_COLORS = [
  "bg-blue-400", "bg-orange-400", "bg-purple-400", "bg-pink-400",
  "bg-teal-400", "bg-indigo-400", "bg-rose-400", "bg-emerald-400",
];

function shuffleAndSplit(players: string[], numTeams: number) {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const teams: { team_number: number; players: string[] }[] = Array.from(
    { length: numTeams },
    (_, i) => ({ team_number: i + 1, players: [] })
  );
  shuffled.forEach((p, i) => teams[i % numTeams].players.push(p));
  return teams;
}

export default function TeamSplitPage() {
  const [inputName, setInputName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [numTeams, setNumTeams] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [autoSplit, setAutoSplit] = useState(true);
  const [teams, setTeams] = useState<{ team_number: number; players: string[] }[]>([]);
  const [justSplit, setJustSplit] = useState(false);

  function addPlayer() {
    const name = inputName.trim();
    if (!name || players.includes(name)) return;
    setPlayers((prev) => [...prev, name]);
    setInputName("");
    setTeams([]);
  }

  function removePlayer(name: string) {
    setPlayers((prev) => prev.filter((p) => p !== name));
    setTeams([]);
  }

  function doSplit() {
    if (players.length < numTeams) return;
    setTeams(shuffleAndSplit(players, numTeams));
    setJustSplit(true);
    setTimeout(() => setJustSplit(false), 600);
  }

  // Auto-split when maxPlayers reached
  useEffect(() => {
    if (autoSplit && players.length === maxPlayers && players.length >= numTeams) {
      doSplit();
    }
  }, [players.length]);

  const isFull = players.length >= maxPlayers;
  const canSplit = players.length >= numTeams;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Chia đội ngẫu nhiên</h1>
      <p className="text-gray-500 mb-6">Người chơi tham gia phòng, máy sẽ chia đội khi đủ người</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Lobby join panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Phòng chờ</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
            }`}>
              {players.length}/{maxPlayers} người
            </span>
          </div>

          {!isFull ? (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Nhập tên của bạn..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addPlayer}
                disabled={!inputName.trim() || players.includes(inputName.trim())}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition disabled:opacity-40"
              >
                Tham gia
              </button>
            </div>
          ) : (
            <div className="text-center py-2 mb-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Phòng đã đầy!</p>
              {autoSplit && <p className="text-xs text-orange-400">Đang chia đội...</p>}
            </div>
          )}

          {/* Player list */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {players.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có ai tham gia</p>
            ) : (
              players.map((name, i) => (
                <div
                  key={name}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {name[0]}
                    </span>
                    <span className="text-sm text-gray-800">{name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(name)}
                    className="text-gray-300 hover:text-red-400 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Cài đặt</h2>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Số đội</label>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => { setNumTeams(n); setTeams([]); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    numTeams === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {n} đội
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Tối đa người chơi</label>
            <div className="flex gap-2">
              {[6, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => { setMaxPlayers(n); setTeams([]); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    maxPlayers === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setAutoSplit((v) => !v)}
              className={`relative w-10 h-6 rounded-full transition ${autoSplit ? "bg-green-500" : "bg-gray-300"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${autoSplit ? "left-5" : "left-1"}`} />
            </div>
            <span className="text-sm text-gray-700">Tự động chia khi đủ người</span>
          </label>

          <button
            onClick={doSplit}
            disabled={!canSplit}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40 mt-auto ${
              justSplit ? "scale-95" : ""
            }`}
          >
            {canSplit ? "🎲 Chia đội ngẫu nhiên" : `Cần ít nhất ${numTeams} người`}
          </button>

          {players.length > 0 && (
            <button
              onClick={() => { setPlayers([]); setTeams([]); setInputName(""); }}
              className="text-xs text-gray-400 hover:text-red-400 transition text-center"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {teams.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Kết quả chia đội</h2>
            <button
              onClick={doSplit}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              🔀 Chia lại
            </button>
          </div>
          <div className={`grid gap-3 ${teams.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
            {teams.map((team) => (
              <div
                key={team.team_number}
                className={`rounded-xl border-2 p-4 ${TEAM_COLORS[(team.team_number - 1) % TEAM_COLORS.length]}`}
              >
                <h3 className="font-bold text-base mb-3">
                  Đội {team.team_number}
                  <span className="ml-1 text-xs font-normal opacity-60">({team.players.length} người)</span>
                </h3>
                <ul className="space-y-1.5">
                  {team.players.map((player, i) => (
                    <li key={player} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-white/60 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {player}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
