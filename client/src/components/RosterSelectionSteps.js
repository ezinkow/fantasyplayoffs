
import React from 'react'

export default function Rules() {


    return (
        <div
            style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                marginBottom: "20px",
            }}
        >
            <h3 style={{ fontWeight: 800, marginBottom: "12px" }}>
                📝 How to Build Your Roster
            </h3>

            <ol style={{ paddingLeft: "18px", marginBottom: "20px" }}>
                <li>Select your name from the dropdown</li>
                <li>
                    Build your roster by selecting the correct number of players per tier
                </li>
                <li>
                    <strong>Total roster size:</strong>{" "}
                    <span style={{ color: "#2563eb" }}>14 players</span>
                </li>
                <li>
                    <strong style={{ color: "#dc2626" }}>
                        Pick EXACTLY 2 Quarterbacks
                    </strong>
                </li>
                <li>
                    Quarterbacks represent the <strong>team QB</strong>. If the starter is
                    injured mid-game, you only receive the points scored before the injury.
                    The backup may be used in future games.
                </li>
                <li>Review your roster below before submitting</li>
                <li>Click <strong>Submit</strong></li>
                <li>
                    Head to <strong>My Roster</strong> to set your Wild Card starting lineup
                </li>
            </ol>

            <div
                style={{
                    borderTop: "1px dashed #e5e7eb",
                    paddingTop: "16px",
                }}
            >
                <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>
                    📊 Scoring Rules
                </h4>

                <ul style={{ paddingLeft: "18px" }}>
                    <li>
                        <strong>Passing:</strong> 1 yard = 0.04 pts · TD = 4 pts
                    </li>
                    <li>
                        <strong>Rushing / Receiving:</strong> 1 yard = 0.1 pts · TD = 6 pts ·
                        Reception = 1 pt
                    </li>
                    <li>
                        <strong>Tight Ends score as Wide Receivers</strong>
                    </li>
                </ul>
            </div>
        </div>
    )
}