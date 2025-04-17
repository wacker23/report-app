import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./DB";
import "../styles/Dashboard.css";
import houseIcon from "../styles/house.png";
import searchIcon from "../styles/search.png";
import infoIcon from "../styles/info.png";
import logoicon from "../styles/logo.png";
// import KakaoMap from "./Map";
import SearchList from "./SearchList";
import KakaoMap from "./Map";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("map");
  const [isDrawerOpen, setDrawerOpen] = useState(window.innerWidth > 768);
  const drawerRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDrawerOpen(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close drawer when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 &&
          isDrawerOpen &&
          drawerRef.current &&
          !drawerRef.current.contains(event.target) &&
          !event.target.classList.contains('hamburger-button')) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="hamburger-button"
          onClick={() => setDrawerOpen(!isDrawerOpen)}
        >
          <div className={`hamburger-line ${isDrawerOpen ? "open" : ""}`}></div>
          <div className={`hamburger-line ${isDrawerOpen ? "open" : ""}`}></div>
          <div className={`hamburger-line ${isDrawerOpen ? "open" : ""}`}></div>
        </button>
        <h1 className="app-title">AS Reports</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Side Drawer */}
      <aside
        ref={drawerRef}
        className={`side-drawer ${isDrawerOpen ? "open" : ""}`}
      >
       <div className="drawer-header">
  <h2>
    <img src={logoicon} alt="Logo" style={{ width: "170px", height: "auto" }} />
  </h2>
</div>

        <nav className="drawer-nav">
          <button
            className={`nav-item ${activeTab === "map" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("map");
              if (window.innerWidth <= 768) setDrawerOpen(false);
            }}
          >
            <img src={houseIcon} alt="Map" className="nav-icon" />
            <span>홈</span>
          </button>
          <button
            className={`nav-item ${activeTab === "search" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("search");
              if (window.innerWidth <= 768) setDrawerOpen(false);
            }}
          >
            <img src={searchIcon} alt="Search" className="nav-icon" />
            <span>검색</span>
          </button>
          <button
            className={`nav-item ${activeTab === "info" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("info");
              if (window.innerWidth <= 768) setDrawerOpen(false);
            }}
          >
            <img src={infoIcon} alt="Info" className="nav-icon" />
            <span>정보</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile drawer */}
      {isDrawerOpen && window.innerWidth <= 768 && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Main Content */}
      <main className={`main-content ${isDrawerOpen ? "" : "full-width"}`}>
        {activeTab === "map" && <KakaoMap/> }
        {activeTab === "search"&& <SearchList />}
        {activeTab === "info" && (
          <div className="info-content">
            <h2>STL AS Report v1.1</h2>
            <p>Welcome to the STL dashboard application.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;