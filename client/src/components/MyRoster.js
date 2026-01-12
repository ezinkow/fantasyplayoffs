import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const ROUND_RULES = {
    1: { QB: 1, RB: 2, WR: 3, SUPERFLEX: 2 },
    2: { QB: 1, RB: 1, WR: 2, SUPERFLEX: 2 },
    3: { QB: 0, RB: 1, WR: 1, SUPERFLEX: 3 },
    4: { QB: 0, RB: 0, WR: 0, SUPERFLEX: 4 },
};

const ROUND_DEADLINES = {
    1: new Date("2026-01-10T23:00:00Z"),
    2: new Date("2026-01-17T21:30:00Z"),
    3: new Date("2026-01-25T20:00:00Z"),
    4: new Date("2026-02-08T23:30:00Z"),
};

const EMPTY_SLOTS = { QB: [], RB: [], WR: [], SUPERFLEX: [] };

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
    const [slots, setSlots] = useState(EMPTY_SLOTS);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [playerPoolMap, setPlayerPoolMap] = useState({});
    const [selectedRound, setSelectedRound] = useState(1);
    const [authError, setAuthError] = useState(false);
    const [verifying, setVerifying] = useState(false);

    /* ---------------- FETCH NAMES ---------------- */
    useEffect(() => {
        axios.get("/api/names").then((res) => {
            setNames(res.data.sort((a, b) => a.name.localeCompare(b.name)));
        });
    }, []);

    /* ---------------- VERIFY PASSWORD ---------------- */
    const handleVerify = async () => {
        if (!selectedName || !password || verifying) return;

        setVerifying(true);
        setAuthError(false);

        try {
            const res = await axios.post("/api/names/verify", {
                name: selectedName,
                password,
            });

            if (!res.data.success) throw new Error("Invalid");

            setAuthenticated(true);
            toast.success("Password verified!");

            // load roster
            const rosterRes = await axios.get("/api/rosters/getmyroster", {
                params: { name: selectedName },
            });

            // load playerpools once
            const poolsRes = await axios.get("/api/playerpools");
            const poolMap = {};
            poolsRes.data.forEach((p) => {
                poolMap[p.player_name] = p.eliminated ?? null;
            });
            console.log('poolmap', poolMap)

            // merge eliminated onto roster players
            const enriched = rosterRes.data.map((p) => ({
                ...p,
                eliminated: poolMap[p.player_name] ?? null,
            }));

            setPlayerPoolMap(poolMap);
            setAvailablePlayers(enriched);
        } catch {
            setAuthenticated(false);
            setSlots(EMPTY_SLOTS);
            setAvailablePlayers([]);
            setAuthError(true);
            toast.error("Incorrect password");
        } finally {
            setVerifying(false);
        }
    };

    /* ---------------- LOAD STARTING ROSTER ---------------- */
    useEffect(() => {
        if (!authenticated || !selectedName) return;

        setSlots(EMPTY_SLOTS);

        async function loadRoundRoster() {
            try {
                const res = await axios.get("/api/startingrosters/my", {
                    params: { name: selectedName, round: selectedRound },
                });

                if (!res.data.length) return;

                const grouped = { QB: [], RB: [], WR: [], SUPERFLEX: [] };
                res.data.forEach((p) => grouped[p.slot].push(p));
                setSlots(grouped);
            } catch (err) {
                console.error(err);
            }
        }

        loadRoundRoster();
    }, [selectedRound, authenticated, selectedName]);

    /* ---------------- SLOT LOGIC ---------------- */
    const determineSlot = (player) => {
        const rules = ROUND_RULES[selectedRound];
        if (player.position === "QB" && slots.QB.length < rules.QB) return "QB";
        if (player.position === "RB" && slots.RB.length < rules.RB) return "RB";
        if ((player.position === "WR" || player.position === "TE") && slots.WR.length < rules.WR)
            return "WR";
        if (slots.SUPERFLEX.length < rules.SUPERFLEX) return "SUPERFLEX";
        return null;
    };

    const addToSlot = (player) => {
        const slot = determineSlot(player);
        if (!slot) return toast.error("No available slot");

        if (Object.values(slots).flat().some((p) => p.player_name === player.player_name))
            return toast.error("Player already selected");

        setSlots((prev) => ({ ...prev, [slot]: [...prev[slot], player] }));
    };

    const removeFromSlot = (player, slot) => {
        setSlots((prev) => ({
            ...prev,
            [slot]: prev[slot].filter((p) => p.player_name !== player.player_name),
        }));
    };

    /* ---------------- UI ---------------- */
    return (
        <div style={{ padding: 16 }}>
            <Toaster />
            <h1>My Starting Roster</h1>

            {/* name select */}
            <select
                value={selectedName}
                onChange={(e) => {
                    setSelectedName(e.target.value);
                    setAuthenticated(false);
                    setPassword("");
                    setSlots(EMPTY_SLOTS);
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

            {/* auth */}
            {selectedName && !authenticated && (
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                    <button onClick={handleVerify}>Submit</button>
                    {authError && <div style={{ color: "red" }}>Incorrect password</div>}
                </div>
            )}

            {/* main */}
            {authenticated && (
                <>
                    <select value={selectedRound} onChange={(e) => setSelectedRound(Number(e.target.value))}>
                        {[1, 2, 3, 4].map((r) => (
                            <option key={r} value={r}>
                                Round {r}
                            </option>
                        ))}
                    </select>

                    <h3>Available Players</h3>

                    {availablePlayers
                        .filter(
                            (p) =>
                                p.eliminated === null ||
                                p.eliminated >= selectedRound // elimination logic
                        )
                        .map((p) => {
                            const used = Object.values(slots).flat().some((x) => x.player_name === p.player_name);
                            const c = positionColors[p.position] || positionColors.default;

                            return (
                                <div
                                    key={p.player_name}
                                    onClick={() => !used && addToSlot(p)}
                                    style={{
                                        background: c.bg,
                                        color: c.text,
                                        margin: 4,
                                        padding: 6,
                                        display: "inline-block",
                                        cursor: used ? "not-allowed" : "pointer",
                                        opacity: used ? 0.5 : 1,
                                    }}
                                >
                                    {p.player_name} ({p.position})
                                </div>
                            );
                        })}

                    <h3>Roster</h3>
                    {Object.entries(slots).map(([slot, players]) => (
                        <div key={slot}>
                            <strong>
                                {slot}: {players.length}/{ROUND_RULES[selectedRound][slot]}
                            </strong>
                            {players.map((p) => (
                                <div key={p.player_name}>
                                    {p.player_name} <button onClick={() => removeFromSlot(p, slot)}>✕</button>
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
