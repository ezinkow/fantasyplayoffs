import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <div className="home-hero">
        <div className="hero-content">
          <h1>🏈 NFL Playoff Pool</h1>
          <p>
            Build your roster. Survive each round.  
            Most points wins.
          </p>

          <div className="hero-actions">
            <Link to="/scoreboard" className="primary-btn">
              View Leaderboard
            </Link>

            <a
              href="https://www.nfl.com/scores"
              target="_blank"
              rel="noreferrer"
              className="secondary-btn"
            >
              Live NFL Scores
            </a>
          </div>
        </div>
      </div>

      <div className="home-section">
        <h2>How It Works</h2>

        <div className="steps">
          <Link to="/rosterpicks" className="step step-link">
            <span>1</span>
            Create your playoff roster
          </Link>

          <Link to="/myroster" className="step step-link">
            <span>2</span>
            Set your weekly lineup
          </Link>

          <Link to="/scoreboard" className="step step-link">
            <span>3</span>
            Climb the leaderboard 🏆
          </Link>
        </div>
      </div>
    </>
  );
}
