import React, { useState, useEffect } from "react";
import axios from "axios";

const ROUND_RULES = {
  1: { QB: 1, RB: 2, WR: 3, SUPERFLEX: 2 },
  2: { QB: 1, RB: 1, WR: 2, SUPERFLEX: 2 },
  3: { QB: 0, RB: 1, WR: 1, SUPERFLEX: 4 },
  4: { QB: 0, RB: 0, WR: 0, SUPERFLEX: 4 },
};

const ROUND_DEADLINES = {
  1: new Date("2026-01-10T21:30:00Z"),
  2: new Date("2026-01-17T21:30:00Z"),
  3: new Date("2026-01-25T20:00:00Z"),
  4: new Date("2026-02-08T23:30:00Z"),
};

const positionColors = {
  QB: { bg: "#fee2e2", text: "#991b1b" },
  RB: { bg: "#d1fae5", text: "#065f46" },
  WR: { bg: "#dbeafe", text: "#1e3a8a" },
  TE: { bg: "#dbeafe", text: "#1e3a8a" },
  SUPERFLEX: { bg: "#fef2f8", text: "#9d174d" },
  default: { bg: "#f3f4f6", text: "#1f2937" },
};

export default function MyRoster() {
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [roster, setRoster] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slots, setSlots] = useState({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
  const [selectedRound, setSelectedRound] = useState(1);

  // Fetch names on mount
  useEffect(() => {
    async function fetchNames() {
      try {
        const res = await axios.get("/api/names");
        setNames(res.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error(err);
      }
    }
    fetchNames();
  }, []);

  // Verify password
  const handleVerify = async () => {
    if (!selectedName || !password) return;

    try {
      const res = await axios.post("/api/names/verify", {
        name: selectedName,
        password,
      });

      if (res.data.success) {
        setAuthenticated(true);

        // Fetch roster
        const rosterRes = await axios.get("/api/startingrosters/my", {
          params: { name: selectedName, round: selectedRound },
        });
        setRoster(rosterRes.data);

        // Group into slots
        const grouped = { QB: [], RB: [], WR: [], SUPERFLEX: [] };
        rosterRes.data.forEach((p) => grouped[p.slot].push(p));
        setSlots(grouped);

        // Fetch available players
        const playersRes = await axios.get("/api/rosters/getmyroster", {
          params: { name: selectedName },
        });
        setAvailablePlayers(playersRes.data);
      } else {
        setAuthenticated(false);
        setRoster([]);
        setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
        setAvailablePlayers([]);
        alert("Incorrect password");
      }
    } catch (err) {
      console.error(err);
      setAuthenticated(false);
      setRoster([]);
      setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
      setAvailablePlayers([]);
      alert("Verification failed");
    }
  };

  // Handle adding/removing players
  const determineSlot = (player) => {
    const rules = ROUND_RULES[selectedRound];
    if (player.position === "QB" && slots.QB.length < rules.QB) return "QB";
    if (player.position === "RB" && slots.RB.length < rules.RB) return "RB";
    if ((player.position === "WR" || player.position === "TE") && slots.WR.length < rules.WR) return "WR";
    if (slots.SUPERFLEX.length < rules.SUPERFLEX) return "SUPERFLEX";
    return null;
  };

  const addToSlot = (player) => {
    const slot = determineSlot(player);
    if (!slot) return alert("No available slot");
    if (Object.values(slots).flat().some((p) => p.player_name === player.player_name)) return alert("Player already in roster");
    setSlots((prev) => ({ ...prev, [slot]: [...prev[slot], player] }));
  };

  const removeFromSlot = (player, slot) => {
    setSlots((prev) => ({ ...prev, [slot]: prev[slot].filter((p) => p.player_name !== player.player_name) }));
  };

  // Submit roster
  const isLocked = ROUND_DEADLINES[selectedRound] && new Date() > ROUND_DEADLINES[selectedRound];

  const isComplete = () => {
    const rules = ROUND_RULES[selectedRound];
    return (
      slots.QB.length === rules.QB &&
      slots.RB.length === rules.RB &&
      slots.WR.length === rules.WR &&
      slots.SUPERFLEX.length === rules.SUPERFLEX
    );
  };

  const handleSubmit = async () => {
    if (isLocked) return alert("Roster is locked for this round");
    const payload = Object.entries(slots).flatMap(([slot, players]) =>
      players.map((p) => ({
        name: selectedName,
        round: selectedRound,
        player_name: p.player_name,
        position: p.position,
        team: p.team,
        slot,
      }))
    );
    if (!payload.length) return alert("No players selected");

    try {
      await axios.put("/api/startingrosters", payload);
      alert("Roster saved!");
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1>My Roster</h1>

      {/* Name + Password */}
      <div style={{ marginBottom: "16px" }}>
        <label>
          Name:{" "}
          <select
            value={selectedName}
            onChange={(e) => {
              setSelectedName(e.target.value);
              setPassword("");
              setAuthenticated(false);
              setRoster([]);
              setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
              setAvailablePlayers([]);
            }}
          >
            <option value="">-- Select Name --</option>
            {names.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </label>

        {selectedName && !authenticated && (
          <div style={{ marginTop: "8px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <button onClick={handleVerify} style={{ marginLeft: "8px" }}>
              Submit
            </button>
          </div>
        )}
      </div>

      {/* Roster UI */}
      {authenticated && (
        <>
          <label>
            Round:{" "}
            <select value={selectedRound} onChange={(e) => setSelectedRound(Number(e.target.value))}>
              {[1, 2, 3, 4].map((r) => (
                <option key={r} value={r}>
                  Round {r}
                </option>
              ))}
            </select>
          </label>

          <h3>Available Players</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {availablePlayers.map((player) => {
              const assigned = Object.values(slots).flat().some((p) => p.player_name === player.player_name);
              const colors = positionColors[player.position] || positionColors.default;
              return (
                <div
                  key={player.player_name}
                  onClick={() => !assigned && addToSlot(player)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    cursor: assigned ? "not-allowed" : "pointer",
                    opacity: assigned ? 0.5 : 1,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.text}`,
                  }}
                >
                  {player.player_name} ({player.team} / {player.position})
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: "16px" }}>Roster Slots</h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {Object.entries(slots).map(([slot, players]) => (
              <div key={slot}>
                <h4>
                  {slot}: {players.length} / {ROUND_RULES[selectedRound][slot]}
                  {players.length < ROUND_RULES[selectedRound][slot] &&
                    ` (${ROUND_RULES[selectedRound][slot] - players.length} more needed)`}
                </h4>
                {players.map((p) => (
                  <div key={p.player_name}>
                    {p.player_name} <button onClick={() => removeFromSlot(p, slot)}>✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button
            disabled={isLocked || !isComplete()}
            onClick={handleSubmit}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              background: isLocked || !isComplete() ? "#a5b4fc" : "#4f46e5",
              color: "#fff",
              border: "none",
              cursor: isLocked || !isComplete() ? "not-allowed" : "pointer",
            }}
          >
            {isLocked ? "Roster Locked" : "Submit Roster"}
          </button>
        </>
      )}
    </div>
  );
}
