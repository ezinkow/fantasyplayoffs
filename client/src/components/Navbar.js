import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-center">
        <nav className="navbar-links">
          <Link to="/rosterpicks" className={isActive("/rosterpicks") ? "active" : ""}>
            Create Roster
          </Link>
          <Link to="/myroster" className={isActive("/myroster") ? "active" : ""}>
            My Roster
          </Link>
          <Link to="/scoreboard" className={isActive("/scoreboard") ? "active" : ""}>
            Scoreboard
          </Link>
        </nav>

        <Link to="/" className="navbar-brand">
          🏈 Playoff Pool
        </Link>
      </div>
    </header>
  );
}
