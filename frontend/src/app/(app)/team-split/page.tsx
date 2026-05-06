"use client";
import { useState } from "react";
import api from "@/lib/api";

const TEAM_COLORS = ["bg-blue-100 border-blue-300 text-blue-800", "bg-orange-100 border-orange-300 text-orange-800", "bg-purple-100 border-purple-300 text-purple-800", "bg-pink-100 border-pink-300 text-pink-800"];

export default function TeamSplitPage() {
  const [playersText, setPlayersText] = useState("");
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<{ team_number: number; players: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function splitTeams() {
    const players = playersText.split("\n").map((p) => p.trim()).filter(Boolean);
    if (players.length < numTeams) {
      setError(`Cần ít nhất ${numTeams} người chơi`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/team/split", { players, num_teams: numTeams });
      setTeams(data.teams);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  function reshuffle() {
    splitTeams();
  }

  const players = playersText.split("\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Chia đội ngẫu nhiên</h1>
      <p className="text-gray-500 mb-6">Nhập tên người chơi, mỗi tên một dòng</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <textarea
          value={playersText}
          onChange={(e) => setPlayersText(e.target.value)}
          placeholder={"Nguyễn Văn A\nTrần Thị B\nLê Văn C\nPhạm Thị D"}
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
        />
        <p className="text-xs text-gray-400 mt-1">{players.length} người chơi</p>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Số đội:</label>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setNumTeams(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${numTeams === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={splitTeams}
            disabled={loading || players.length < numTeams}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Đang chia..." : "Chia đội ngẫu nhiên"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {teams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Kết quả</h2>
            <button onClick={reshuffle} className="text-sm text-green-600 hover:text-green-700 font-medium">
              Chia lại
            </button>
          </div>
          <div className={`grid gap-4 ${teams.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
            {teams.map((team) => (
              <div key={team.team_number} className={`rounded-xl border-2 p-4 ${TEAM_COLORS[(team.team_number - 1) % TEAM_COLORS.length]}`}>
                <h3 className="font-bold mb-3">Đội {team.team_number}</h3>
                <ul className="space-y-1">
                  {team.players.map((player) => (
                    <li key={player} className="text-sm">• {player}</li>
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
