import React from 'react'
import './App.css';
import {
  HashRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './pages/Home';
import Scoreboard from './pages/Scoreboard';
import Standings from './pages/Standings';
import RosterPicks from './pages/RosterPicks';
import MyRoster from './pages/MyRoster';
import SignUp from './pages/SignUp';

export default function App() {

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/rosterpicks" element={<RosterPicks />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/myroster" element={<MyRoster />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  )
}
