import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ROUND_RULES = {
    1: { QB: 1, RB: 2, WR: 3, SUPERFLEX: 2 },
    2: { QB: 1, RB: 1, WR: 2, SUPERFLEX: 2 },
    3: { QB: 0, RB: 1, WR: 1, SUPERFLEX: 4 },
    4: { QB: 0, RB: 0, WR: 0, SUPERFLEX: 4 },
};

const positionColors = {
    QB: { bg: "#fee2e2", text: "#991b1b" },
    RB: { bg: "#d1fae5", text: "#065f46" },
    WR: { bg: "#dbeafe", text: "#1e3a8a" },
    TE: { bg: "#dbeafe", text: "#1e3a8a" }, // TE same as WR
    SUPERFLEX: { bg: "#fef2f8", text: "#9d174d" },
    default: { bg: "#f3f4f6", text: "#1f2937" },
};

export default function MyRoster() {
    const [names, setNames] = useState([]);
    const [selectedName, setSelectedName] = useState("");
    const [selectedRound, setSelectedRound] = useState("1");
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [slots, setSlots] = useState({
        QB: [],
        RB: [],
        WR: [],
        SUPERFLEX: [],
    });

    // Fetch names
    useEffect(() => {
        async function fetchNames() {
            try {
                const response = await axios("/api/names");
                const sorted = response.data.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setNames(sorted);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNames();
    }, []);

    // Fetch players on name or round change
    useEffect(() => {
        if (!selectedName) return;

        async function fetchPlayers() {
            try {
                const response = await axios.get(
                    "/api/rosters/getmyroster",
                    { params: { name: selectedName } }
                );
                setAvailablePlayers(response.data);
                setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
            } catch (err) {
                console.error(err);
            }
        }

        fetchPlayers();
    }, [selectedName, selectedRound]);

    // Determine slot for a player
    const determineSlot = (player) => {
        const rules = ROUND_RULES[selectedRound];

        // QB → QB first
        if (
            player.position === "QB" &&
            slots.QB.length < rules.QB
        ) {
            return "QB";
        }

        // RB → RB first
        if (
            player.position === "RB" &&
            slots.RB.length < rules.RB
        ) {
            return "RB";
        }

        // WR / TE → WR first
        if (
            (player.position === "WR" || player.position === "TE") &&
            slots.WR.length < rules.WR
        ) {
            return "WR";
        }

        // Overflow → SUPERFLEX
        if (slots.SUPERFLEX.length < rules.SUPERFLEX) {
            return "SUPERFLEX";
        }

        return null;
    };


    const addToSlot = (player) => {
        const slot = determineSlot(player);
        if (!slot) {
            toast.error("No available slot for this player");
            return;
        }

        const alreadyAssigned = Object.values(slots)
            .flat()
            .some(p => p.player_name === player.player_name);
        if (alreadyAssigned) return;

        setSlots(prev => ({
            ...prev,
            [slot]: [...prev[slot], player],
        }));
    };

    const removeFromSlot = (player, slot) => {
        setSlots(prev => ({
            ...prev,
            [slot]: prev[slot].filter(p => p.player_name !== player.player_name),
        }));
    };

    const handleSubmit = async () => {
        if (!selectedName) return toast.error("Select your name!");

        const payload = Object.entries(slots).flatMap(([slot, players]) =>
            players.map(p => ({
                name: selectedName,
                round: selectedRound,
                player_name: p.player_name,
                position: p.position,
                team: p.team,
                slot,
            }))
        );

        if (!payload.length) {
            return toast.error("No players selected for this round");
        }

        try {
            await axios.post("/api/startingrosters", payload);

            toast.success(`Round ${selectedRound} roster submitted!`);

            // Optional: clear slots so user sees it's "done"
            setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });

            // Redirect to scoreboard after short delay
            setTimeout(() => {
                navigate("/scoreboard");
            }, 1200);
        } catch (err) {
            console.error(err);
            toast.error("Error submitting roster");
        }
    };

    const navigate = useNavigate();

    return (
        <div style={{ padding: "16px" }}>
            {/* Name & Round Selection */}
            <div style={{ marginBottom: "16px" }}>
                <label>
                    Name:{" "}
                    <select
                        value={selectedName}
                        onChange={e => setSelectedName(e.target.value)}
                    >
                        <option value="">-- Select Name --</option>
                        {names.map(n => (
                            <option key={n.id} value={n.name}>
                                {n.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label style={{ marginLeft: "16px" }}>
                    Round:{" "}
                    <select
                        value={selectedRound}
                        onChange={e => setSelectedRound(e.target.value)}
                    >
                        <option value="1">Round 1</option>
                        <option value="2">Round 2</option>
                        <option value="3">Round 3</option>
                        <option value="4">Round 4</option>
                    </select>
                </label>
            </div>

            {/* Available Players */}
            <div style={{ marginBottom: "16px" }}>
                <h4>Available Players</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {availablePlayers.map(player => {
                        const isAssigned = Object.values(slots)
                            .flat()
                            .some(p => p.player_name === player.player_name);

                        const colors =
                            positionColors[player.position] ||
                            positionColors.default;

                        return (
                            <div
                                key={player.player_name}
                                onClick={() => addToSlot(player)}
                                style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    cursor: isAssigned ? "not-allowed" : "pointer",
                                    opacity: isAssigned ? 0.5 : 1,
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
            </div>

            {/* Roster Slots */}
            <div style={{ marginBottom: "16px" }}>
                <h4>Roster Slots</h4>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {Object.entries(slots).map(([slot, players]) => (
                        <div key={slot} style={{ flex: 1, minWidth: "120px" }}>
                            <h5>{slot} (limit: {ROUND_RULES[selectedRound][slot]})</h5>
                            <ul style={{ padding: 0, listStyle: "none" }}>
                                {players.map(p => {
                                    const colors =
                                        positionColors[p.position] ||
                                        positionColors.default;

                                    return (
                                        <li
                                            key={p.player_name}
                                            style={{
                                                marginBottom: "4px",
                                                backgroundColor: colors.bg,
                                                color: colors.text,
                                                padding: "4px",
                                                borderRadius: "4px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            {p.player_name}
                                            <button
                                                onClick={() => removeFromSlot(p, slot)}
                                                style={{ marginLeft: "4px" }}
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    border: "none",
                }}
            >
                Submit Roster
            </button>
        </div>
    );
}
