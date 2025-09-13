import { useState } from "react";
import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome"
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import MapAddCenter from "./pages/Map";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<MapAddCenter />} />
      </Routes>
    </Router>
  );
}

export default App;