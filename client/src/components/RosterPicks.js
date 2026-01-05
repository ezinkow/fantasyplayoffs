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

  const positionColors = {
    QB: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
    RB: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
    WR: { bg: "#dbeafe", text: "#1e3a8a", border: "#3b82f6" },
    TE: { bg: "#fef9c3", text: "#78350f", border: "#facc15" },
    default: { bg: "#f3f4f6", text: "#1f2937", border: "#d1d5db" },
  };

  const tierLimits = { 1: 2, 2: 3, 3: 2, 4: 4, 5: 2, 6: 1 };

  // Fetch players grouped by tier
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
        setPlayerpool(groupedByTier);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, []);

  // Fetch names
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
    <Dropdown.Item eventKey={n.name} key={n.name}>
      {n.name}
    </Dropdown.Item>
  ));

  const handleNameSelect = (event) => {
    setName(event);
    setAuthenticated(false); // reset authentication
    setPassword("");
    setSelectedPlayers({});
  };

  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleVerifyPassword = async () => {
    if (!name || name === "SELECT YOUR NAME IN DROPDOWN!") {
      return toast.error("Please select your name first!");
    }
    if (!password) {
      return toast.error("Please enter your password!");
    }

    try {
      const response = await axios.post("/api/names/verify", { name, password });
      if (response.data.success) {
        setAuthenticated(true);
        toast.success("Password verified! You can now select players and submit your roster.");
      } else {
        setAuthenticated(false);
        toast.error("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error verifying password. Try again.");
    }
  };

  const handlePlayerSelect = (tier, playerName) => {
    if (!authenticated) return; // block selection if not verified

    setSelectedPlayers((prev) => {
      const tierSelected = prev[tier] || [];
      const allSelectedPlayers = Object.values(prev).flat();

      const qbCount = allSelectedPlayers
        .map((p) => Object.values(playerpool).flat().find((pl) => pl.player_name === p))
        .filter((p) => p?.position === "QB").length;

      const playerObj = Object.values(playerpool)
        .flat()
        .find((p) => p.player_name === playerName);

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

  const handleSubmitClick = async () => {
    if (!authenticated) return toast.error("Please verify your password first!");
    if (!name || name === "SELECT YOUR NAME IN DROPDOWN!") return;

    const allPlayersMap = Object.values(playerpool)
      .flat()
      .reduce((acc, p) => {
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

    if (!payload.length) return toast.error("No players selected!");

    try {
      await axios.post("/api/rosters", payload);
      toast.success(`Thanks, ${name}, your roster has been submitted!`);
      setSelectedPlayers({});
      setName("SELECT YOUR NAME IN DROPDOWN!");
      setPassword("");
      setAuthenticated(false);
    } catch (err) {
      console.error("Error submitting roster:", err);
      toast.error("Error submitting your roster. Please try again.");
    }
  };

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Toaster />
      <Roster_Selection_Steps />

      <h4>Name: {name}</h4>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <DropdownButton id="dropdown-basic-button" title="Select Name" onSelect={handleNameSelect}>
          {namesList}
        </DropdownButton>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={handlePasswordChange}
          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <Button onClick={handleVerifyPassword} style={{ padding: "6px 12px" }}>
          Verify
        </Button>
      </div>

      {authenticated && (
        <>
          {/* Player Columns (vertical) */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            {Object.entries(playerpool).map(([tier, players]) => (
              <div key={tier} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
                  Tier {tier} (Pick {tierLimits[tier] || "—"})
                </h3>
                {players.map((player) => {
                  const tierSelected = selectedPlayers[tier] || [];
                  const isSelected = tierSelected.includes(player.player_name);

                  const allSelectedPlayers = Object.values(selectedPlayers).flat();
                  const qbCount = allSelectedPlayers
                    .map((p) => Object.values(playerpool).flat().find((pl) => pl.player_name === p))
                    .filter((p) => p?.position === "QB").length;

                  const disableCheckbox = !isSelected && (
                    tierSelected.length >= (tierLimits[tier] || 99) ||
                    (player.position === "QB" && qbCount >= 2)
                  );

                  const colors = positionColors[player.position] || positionColors.default;

                  return (
                    <label
                      key={player.player_name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: `1px solid ${isSelected ? colors.border : "#ccc"}`,
                        backgroundColor: isSelected ? colors.bg : "#fff",
                        borderRadius: "8px",
                        padding: "4px",
                        cursor: disableCheckbox ? "not-allowed" : "pointer",
                        opacity: disableCheckbox ? 0.5 : 1,
                        fontSize: "12px",
                        color: colors.text,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={disableCheckbox}
                        onChange={() => handlePlayerSelect(tier, player.player_name)}
                        style={{ marginRight: "6px", width: "16px", height: "16px" }}
                      />
                      <div>
                        <span style={{ fontWeight: "500" }}>{player.player_name}</span>
                        <span style={{ color: "#555", marginLeft: "4px" }}>
                          ({player.team} / {player.position})
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected Roster */}
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
                      <span
                        key={player}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          padding: "2px 6px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: "500",
                        }}
                      >
                        {player}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Button
        onClick={handleSubmitClick}
        style={{
          marginTop: "16px",
          padding: "8px 16px",
          backgroundColor: authenticated ? "#4f46e5" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: authenticated ? "pointer" : "not-allowed",
          fontSize: "14px",
        }}
        disabled={!authenticated}
      >
        Submit Roster
      </Button>
    </div>
  );
}
