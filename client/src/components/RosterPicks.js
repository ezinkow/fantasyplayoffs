import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import toast, { Toaster } from "react-hot-toast";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Roster_Selection_Steps from "./RosterSelectionSteps";

export default function RosterPicks() {
  const [playerpool, setPlayerpool] = useState({});
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [name, setName] = useState("SELECT YOUR NAME IN DROPDOWN!");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [names, setNames] = useState([]);
  const [sortMode, setSortMode] = useState("name"); // "name" | "position" | "team"
  const [showSteps, setShowSteps] = useState(true);

  const positionColors = {
    QB: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
    RB: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
    WR: { bg: "#dbeafe", text: "#1e3a8a", border: "#3b82f6" },
    TE: { bg: "#fef9c3", text: "#78350f", border: "#facc15" },
    default: { bg: "#f3f4f6", text: "#1f2937", border: "#d1d5db" },
  };

  const tierLimits = { 1: 3, 2: 3, 3: 3, 4: 2, 5: 2, 6: 1 };

  const positionOrder = { QB: 1, RB: 2, WR: 3, TE: 4 };

  /* -------------------- FETCH DATA -------------------- */
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get("/api/playerpools");
        const groupedByTier = response.data.reduce((acc, player) => {
          const tier = player.tier || "Unknown Tier";
          if (!acc[tier]) acc[tier] = [];
          acc[tier].push(player);
          return acc;
        }, {});

        Object.keys(groupedByTier).forEach((tier) => {
          groupedByTier[tier].sort((a, b) => a.player_name.localeCompare(b.player_name));
        });

        setPlayerpool(groupedByTier);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await axios.get("/api/names");
        setNames(response.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchNames();
  }, []);

  const namesList = names.map((n) => (
    <Dropdown.Item key={n.name} eventKey={n.name}>
      {n.name}
    </Dropdown.Item>
  ));

  const sortPlayers = (players) => {
    const list = [...players];
    switch (sortMode) {
      case "position":
        return list.sort((a, b) => {
          const posDiff = (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99);
          return posDiff !== 0 ? posDiff : a.player_name.localeCompare(b.player_name);
        });
      case "team":
        return list.sort((a, b) => {
          const teamDiff = (a.team || "").localeCompare(b.team || "");
          return teamDiff !== 0 ? teamDiff : a.player_name.localeCompare(b.player_name);
        });
      case "name":
      default:
        return list.sort((a, b) => a.player_name.localeCompare(b.player_name));
    }
  };

  /* -------------------- HELPERS -------------------- */
  const getTotalSelectedCount = () =>
    Object.values(selectedPlayers).reduce((sum, arr) => sum + arr.length, 0);

  const getQBCount = () =>
    Object.values(selectedPlayers)
      .flat()
      .map((p) => Object.values(playerpool).flat().find((pl) => pl.player_name === p))
      .filter((p) => p?.position === "QB").length;

  const validateRoster = () => {
    const total = getTotalSelectedCount();
    if (total !== 14) {
      toast.error(`You must select exactly 14 players (currently ${total})`);
      return false;
    }
    for (const [tier, required] of Object.entries(tierLimits)) {
      const count = (selectedPlayers[tier] || []).length;
      if (count !== required) {
        toast.error(`Tier ${tier}: ${required} players required (currently ${count})`);
        return false;
      }
    }
    return true;
  };

  /* -------------------- AUTH -------------------- */
  const handleNameSelect = (selectedName) => {
    setName(selectedName);
    setAuthenticated(false);
    setPassword("");
    setSelectedPlayers({});
  };

  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleVerifyPassword = async () => {
    if (!name || name === "SELECT YOUR NAME IN DROPDOWN!") return toast.error("Select your name first!");
    if (!password) return toast.error("Enter your password");

    try {
      const res = await axios.post("/api/names/verify", { name, password });
      if (res.data.success) {
        setAuthenticated(true);
        toast.success("Password verified! You can now select players and submit your roster.");
      } else {
        setAuthenticated(false);
        toast.error("Incorrect password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error verifying password");
    }
  };

  /* -------------------- PLAYER SELECT -------------------- */
  const handlePlayerSelect = (tier, playerName) => {
    if (!authenticated) return;

    setSelectedPlayers((prev) => {
      const tierSelected = prev[tier] || [];
      const allSelectedPlayers = Object.values(prev).flat();
      const qbCount = allSelectedPlayers
        .map((p) => Object.values(playerpool).flat().find((pl) => pl.player_name === p))
        .filter((p) => p?.position === "QB").length;

      const playerObj = Object.values(playerpool).flat().find((p) => p.player_name === playerName);
      if (!playerObj) return prev;

      // Deselect
      if (tierSelected.includes(playerName)) {
        return { ...prev, [tier]: tierSelected.filter((p) => p !== playerName) };
      }

      // QB limit
      if (playerObj.position === "QB" && qbCount >= 2) {
        toast.error("You can only select 2 QBs total");
        return prev;
      }

      // Tier limit
      if (tierSelected.length >= (tierLimits[tier] || 99)) {
        toast.error(`Tier limit reached: ${tierLimits[tier]}`);
        return prev;
      }

      return { ...prev, [tier]: [...tierSelected, playerName] };
    });
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmitClick = async () => {
    if (!authenticated) return toast.error("Verify password first");
    if (!validateRoster()) return;

    const allPlayersMap = Object.values(playerpool).flat().reduce((acc, p) => {
      acc[p.player_name] = p;
      return acc;
    }, {});

    const payload = Object.entries(selectedPlayers)
      .flatMap(([tier, players]) =>
        players.map((playerName) => {
          const playerObj = allPlayersMap[playerName];
          if (!playerObj) return null;
          return {
            name,
            player_name: playerObj.player_name,
            position: playerObj.position,
            team: playerObj.team,
            tier,
          };
        })
      )
      .filter(Boolean);

    try {
      await axios.post("/api/rosters", payload);
      toast.success(`Thanks, ${name}, your roster has been submitted!`);
      setSelectedPlayers({});
      setName("SELECT YOUR NAME IN DROPDOWN!");
      setPassword("");
      setAuthenticated(false);
    } catch (err) {
      console.error(err);
      toast.error("Error submitting your roster. Please try again.");
    }
  };

  const isRosterValid =
    getTotalSelectedCount() === 14 &&
    Object.entries(tierLimits).every(([tier, required]) => (selectedPlayers[tier] || []).length === required);

  const qbCount = getQBCount();

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            fontSize: '14px',
            padding: '8px 12px',
          },
          duration: 3000,
        }}
      />

      {/* Roster Steps */}
      <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px", backgroundColor: "#f9fafb" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setShowSteps((prev) => !prev)}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Roster Selection Steps</h3>
          <span style={{ fontSize: "14px", color: "#4f46e5" }}>{showSteps ? "Hide ▲" : "Show ▼"}</span>
        </div>
        {showSteps && <div style={{ marginTop: "8px" }}><Roster_Selection_Steps /></div>}
      </div>

      <h4>Name: {name}</h4>

      {/* Name + Password */}
      {!authenticated && (
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyPassword(); }} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <DropdownButton title="Select Name" onSelect={handleNameSelect}>{namesList}</DropdownButton>
          <input type="password" placeholder="Enter password" value={password} onChange={handlePasswordChange} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ccc" }} />
          <Button type="submit">Verify</Button>
        </form>
      )}

      {/* Player Columns */}
      {authenticated && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
          {Object.entries(playerpool).sort().map(([tier, players]) => {
            const tierSelected = selectedPlayers[tier] || [];
            const tierFull = tierSelected.length >= (tierLimits[tier] || 99);
            return (
              <div key={tier} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>Tier {tier}</h3>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{tierSelected.length} / {tierLimits[tier]}</span>
                </div>
                {sortPlayers(players).map((player) => {
                  const isSelected = tierSelected.includes(player.player_name);
                  const disable = !isSelected && (tierFull || (player.position === "QB" && qbCount >= 2));
                  const colors = positionColors[player.position] || positionColors.default;
                  return (
                    <label key={player.player_name} style={{
                      display: "flex",
                      alignItems: "center",
                      border: `1px solid ${isSelected ? colors.border : "#ccc"}`,
                      backgroundColor: isSelected ? colors.bg : "#fff",
                      borderRadius: "8px",
                      padding: "4px",
                      cursor: disable ? "not-allowed" : "pointer",
                      opacity: disable ? 0.5 : 1,
                      fontSize: "12px",
                      color: colors.text,
                    }}>
                      <input type="checkbox" checked={isSelected} disabled={disable} onChange={() => handlePlayerSelect(tier, player.player_name)} style={{ marginRight: "6px", width: "16px", height: "16px" }} />
                      <div>
                        <span style={{ fontWeight: "500" }}>{player.player_name}</span>
                        <span style={{ color: "#555", marginLeft: "4px" }}>({player.team} / {player.position})</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Roster */}
      {authenticated && (
        <div style={{ backgroundColor: "#f3f4f6", padding: "8px", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Your Roster:</h3>
          {Object.entries(selectedPlayers).map(([tier, players]) => (
            <div key={tier} style={{ marginBottom: "6px" }}>
              <h4 style={{ fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>{tier}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {players.map((player) => {
                  const playerObj = Object.values(playerpool).flat().find((p) => p.player_name === player);
                  const colors = positionColors[playerObj?.position] || positionColors.default;
                  return (
                    <span key={player} style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: "500",
                    }}>{player}</span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSubmitClick} disabled={!authenticated || !isRosterValid} style={{
        marginTop: "16px",
        padding: "8px 16px",
        backgroundColor: authenticated && isRosterValid ? "#4f46e5" : "#ccc",
        color: "#fff",
        borderRadius: "8px",
        cursor: authenticated && isRosterValid ? "pointer" : "not-allowed",
      }}>
        Submit Roster
      </Button>
    </div>
  );
}
