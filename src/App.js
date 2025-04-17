import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login"; // Import the Login component
import Dashboard from "./components/Dashboard"; 
import AddReport from "./components/AddReport";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Default route to Login page */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-report" element={<AddReport />} />
      </Routes> 
    </Router>
  );
}

export default App;
