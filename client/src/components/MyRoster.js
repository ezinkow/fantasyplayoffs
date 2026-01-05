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
    const navigate = useNavigate();

    const [names, setNames] = useState([]);
    const [selectedName, setSelectedName] = useState("");
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [selectedRound, setSelectedRound] = useState(1);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [slots, setSlots] = useState({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
    const [firstLoad, setFirstLoad] = useState(true);

    /* Fetch names */
    useEffect(() => {
        async function fetchNames() {
            const res = await axios("/api/names");
            setNames(res.data.sort((a, b) => a.name.localeCompare(b.name)));
        }
        fetchNames();
    }, []);

    /* Verify password */
    const handleVerify = async () => {
        setAuthError(false);

        try {
            await axios.post("/api/names/verify", { name: selectedName, password });
            setAuthenticated(true);
            toast.success("Password verified");
        } catch {
            setAuthError(true);
            toast.error("Incorrect password");
        }
    };

    /* Fetch available players and existing roster */
    useEffect(() => {
        if (!authenticated || !selectedName) return;

        async function fetchData() {
            const [playersRes, rosterRes] = await Promise.all([
                axios.get("/api/rosters/getmyroster", { params: { name: selectedName } }),
                axios.get("/api/startingrosters/my", { params: { name: selectedName, round: selectedRound } }),
            ]);

            setAvailablePlayers(playersRes.data);

            if (rosterRes.data.length) {
                const grouped = { QB: [], RB: [], WR: [], SUPERFLEX: [] };
                rosterRes.data.forEach(p => grouped[p.slot].push(p));
                setSlots(grouped);

                if (firstLoad) {
                    toast("Editing existing roster");
                    setFirstLoad(false);
                }
            } else {
                setSlots({ QB: [], RB: [], WR: [], SUPERFLEX: [] });
            }
        }

        fetchData();
    }, [authenticated, selectedName, selectedRound, firstLoad]);

    const isLocked = ROUND_DEADLINES[selectedRound] && new Date() > ROUND_DEADLINES[selectedRound];

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
        if (!slot) return toast.error("No available slot");

        if (Object.values(slots).flat().some(p => p.player_name === player.player_name)) {
            return toast.error("Player already in your roster");
        }

        setSlots(prev => ({ ...prev, [slot]: [...prev[slot], player] }));
    };

    const removeFromSlot = (player, slot) => {
        setSlots(prev => ({ ...prev, [slot]: prev[slot].filter(p => p.player_name !== player.player_name) }));
    };

    const handleSubmit = async () => {
        if (isLocked) {
            toast.error("Roster is locked for this round");
            return;
        }

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

        if (!payload.length) return toast.error("No players selected");

        try {
            await axios.put("/api/startingrosters", payload);
            toast.success("Roster saved!");
            setTimeout(() => navigate("/scoreboard"), 1200);
        } catch (err) {
            if (err.response?.status === 409) toast.error("Roster already submitted");
            else if (err.response?.status === 403) toast.error("Roster locked");
            else toast.error("Submission failed");
        }
    };

    const handleNameChange = (e) => {
        setSelectedName(e.target.value);
        setPassword("");
        setAuthenticated(false);
        setAuthError(false);
        setAvailablePlayers([]);
        setFirstLoad(true);
    };

    const isComplete = () => {
        const rules = ROUND_RULES[Number(selectedRound)];
        return (
            slots.QB.length === rules.QB &&
            slots.RB.length === rules.RB &&
            slots.WR.length === rules.WR &&
            slots.SUPERFLEX.length === rules.SUPERFLEX
        );
    };

    let submitTooltip = "";
    if (isLocked) submitTooltip = "Roster is locked for this round";
    else if (!isComplete()) submitTooltip = "Fill all required slots before submitting";

    return (
        <div style={{ padding: "16px" }}>
            {/* Name + Password */}
            <div style={{ marginBottom: "16px" }}>
                <select value={selectedName} onChange={handleNameChange}>
                    <option value="">-- Select Name --</option>
                    {names.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                </select>

                {selectedName && !authenticated && (
                    <>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{ marginLeft: "8px" }}
                        />
                        <button onClick={handleVerify} style={{ marginLeft: "8px" }}>
                            Submit
                        </button>
                    </>
                )}

                {authError && <div style={{ color: "red", marginTop: "6px" }}>Incorrect password</div>}
            </div>

            {/* Main roster UI */}
            {authenticated && (
                <>
                    <label>
                        Round:
                        <select
                            value={selectedRound}
                            onChange={e => setSelectedRound(Number(e.target.value))}
                            style={{ marginLeft: "8px" }}
                        >
                            {[1, 2, 3, 4].map(r => <option key={r} value={r}>Round {r}</option>)}
                        </select>
                    </label>

                    <h4>Available Players</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {availablePlayers.map(player => {
                            const assigned = Object.values(slots).flat().some(p => p.player_name === player.player_name);
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

                    <h4 style={{ marginTop: "16px" }}>Roster Slots</h4>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {Object.entries(slots).map(([slot, players]) => (
                            <div key={slot}>
                                <h5>
                                    {slot}: {players.length} / {ROUND_RULES[Number(selectedRound)][slot]}
                                    {players.length < ROUND_RULES[Number(selectedRound)][slot] &&
                                        ` (${ROUND_RULES[Number(selectedRound)][slot] - players.length} more needed)`}
                                </h5>
                                {players.map(p => (
                                    <div key={p.player_name}>
                                        {p.player_name}
                                        <button onClick={() => removeFromSlot(p, slot)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <button
                        disabled={isLocked || !isComplete()}
                        onClick={handleSubmit}
                        title={submitTooltip} // tooltip on hover
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
