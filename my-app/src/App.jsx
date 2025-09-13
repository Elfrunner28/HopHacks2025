import { useState } from "react";
import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import MapAddCenter from "./pages/Map";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<MapAddCenter />} />
      </Routes>
    </Router>
  );
}

export default App;