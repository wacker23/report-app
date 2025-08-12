import React, { useEffect, useState, useRef } from "react";

import { useNavigate } from "react-router-dom";
import "../styles/Map.css";
import asDoneIcon from "../styles/install-not.png";
import userloc from "../styles/location.png";
import { db } from "./DB";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import List from "./list";

const KakaoMap = () => {
  const [map, setMap] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showPanelButtons, setShowPanelButtons] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load Kakao Map script
  useEffect(() => {
    const kakaoMapScript = document.createElement("script");
    kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=f2a8a631a84a3d469959c8ba490c3ee1&libraries=services&autoload=false`;
    kakaoMapScript.async = true;
    document.head.appendChild(kakaoMapScript);

    kakaoMapScript.onload = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };

    return () => {
      document.head.removeChild(kakaoMapScript);
    };
  }, []);

  const initMap = async () => {
    const container = document.getElementById("map");
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(36.883771, 127.158570),
      level: 3,
    };

    const newMap = new window.kakao.maps.Map(container, options);
    setMap(newMap);
     
  if (!markerRef.current) {
    markerRef.current = new window.kakao.maps.Marker({
      position: options.center,
    });
    markerRef.current.setMap(newMap);
  }

  // Add events after map is initialized
  addMapEvents(newMap);

    // Add map events with mobile support
    addMapEvents(newMap);

    // Load saved markers from Firestore
    await loadSavedMarkers(newMap);

    // Get user location
    getUserLocation();
  };

  const addMapEvents = (newMap) => {
    // Hide UI panels when clicking on the map (if no marker is selected)
    window.kakao.maps.event.addListener(newMap, "click", (mouseEvent) => {
      if (!selectedMarker) {
        setShowButtons(false);
        setShowPanelButtons(false);
      }
  
      // Always handle map interaction on click
      handleMapInteraction(mouseEvent);
    });
  };
  
  const handleMapInteraction = (mouseEvent) => {
    const position = mouseEvent.latLng;
  
    // 🔥 Move marker to clicked position
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    }
  
    setCurrentPosition(position);
    setSelectedMarker(position);
    setShowButtons(true);
    getAddress(position);
  };
  
  

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng = new window.kakao.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        setCurrentPosition(userLatLng);
        if (map) {
          map.setCenter(userLatLng);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };
  const loadSavedMarkers = async (map) => {
    try {
      const querySnapshot = await getDocs(collection(db, "address"));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const position = new window.kakao.maps.LatLng(data.lat, data.lng);
        const imagePath = asDoneIcon; // Always use asDoneIcon

        // Add marker to the map without saving it back to Firestore
        addMarker(position, map, imagePath, false);
      });
    } catch (error) {
      console.error("Error loading saved markers:", error);
    }
  };

  const handleSearch = () => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error("Kakao Maps services are not loaded.");
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchTerm, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const newCenter = new window.kakao.maps.LatLng(data[0].y, data[0].x);
        map.setCenter(newCenter);
      } else {
        console.error("Search failed: ", status);
      }
    });
  };

  const addMarker = async (position, map, imagePath, saveToDB = true) => {
    const imageSize = new window.kakao.maps.Size(50, 50);
    const markerImage = new window.kakao.maps.MarkerImage(imagePath, imageSize);
  
    const marker = new window.kakao.maps.Marker({
      position,
      image: markerImage,
      map: map,
    });
  
    marker.setMap(map);
  
    // Store marker in a custom array on the map object for tracking
    map.markers = map.markers || [];
    map.markers.push(marker);
  
    window.kakao.maps.event.addListener(marker, "click", () => {
      setSelectedMarker(position);
      getAddress(position);
      setShowPanelButtons(true);
    });
  
    if (saveToDB) {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(position.getLng(), position.getLat(), async (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const address = result[0].road_address?.address_name || result[0].address.address_name;
  
            await addDoc(collection(db, "address"), {
              lat: position.getLat(),
              lng: position.getLng(),
              address: address,
              type: "as", // Always "as" for this example
              timestamp: new Date(),
            });
  
            console.log("Marker added to Firestore with address:", address);
          } else {
            console.error("Error retrieving address for marker");
          }
        });
      } catch (error) {
        console.error("Error adding marker to Firestore:", error);
      }
    }
  };
  

  const getAddress = (position) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      position.getLng(),
      position.getLat(),
      (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setAddress(result[0].road_address?.address_name || result[0].address.address_name);
        } else {
          setAddress("주소를 찾을 수 없습니다.");
        }
      }
    );
  };

  const deleteMarker = async (markerPosition) => {
  if (!markerPosition) {
    console.error("No marker selected.");
    return;
  }

  try {
    // Get latitude and longitude of the marker
    const markerLat = markerPosition.getLat();
    const markerLng = markerPosition.getLng();

    // Query Firestore for the marker with matching lat and lng
    const q = query(
      collection(db, "address"),
      where("lat", "==", markerLat),
      where("lng", "==", markerLng),
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (docSnap) => {
        // Delete the document from Firestore
        await deleteDoc(doc(db, "address", docSnap.id));
        console.log(`Marker deleted from Firestore with ID: ${docSnap.id}`);
      });
    } else {
      console.log("No matching marker found in Firestore.");
    }

    // Find the marker in the map.markers array and visually remove it
    map.markers = map.markers || []; // Fallback if markers are not tracked yet
    map.markers = map.markers.filter((m) => {
      const mLat = m.getPosition().getLat();
      const mLng = m.getPosition().getLng();
      if (mLat === markerLat && mLng === markerLng) {
        m.setMap(null); // Remove from Kakao Map
        return false;
      }
      return true;
    });

    // Clear selected marker and panel info
    setSelectedMarker(null);
    setShowPanelButtons(false);
    setAddress(""); // Clear displayed address
    console.log("Marker visually removed from the map");
  } catch (error) {
    console.error("Error deleting marker:", error);
  }
};
  // ... (keep your existing loadSavedMarkers, handleSearch, addMarker, getAddress, deleteMarker functions)

  return (
    <div className="map-page-container">
      {/* Search Bar */}
      <div className={`search-container ${isMobile ? "mobile-search" : ""}`}>
        <input
          type="text"
          placeholder="Search location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          검색
        </button>
      </div>

      {/* Map Container */}
      <div id="map" className="map-container">
        {/* My Location Button */}
        <button className="my-location-button" onClick={getUserLocation}>
          <img src={userloc} alt="My Location" className="location-icon" />
        </button>

        {/* Context Menu - Now positioned at bottom left */}
        {showButtons && (
          <div className={`context-menu ${isMobile ? "mobile-context" : ""}`}>
            <button
              onClick={() => {
                if (currentPosition && map) {
                  addMarker(currentPosition, map, asDoneIcon);
                  setShowButtons(false);
                }
              }}
              className="context-button"
            >
              AS 추가
            </button>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className={`bottom-panel ${isMobile ? "mobile-panel" : ""}`}>
        <h3>선택된 위치</h3>
        <p>{address || "No address selected"}</p>

        {showPanelButtons && (
          <div className="panel-buttons">
            <button
              onClick={() => navigate("/add-report", { state: { address } })}
              className="panel-button"
            >
            보고서 추가
            </button>
            <button
                onClick={() => {
                    console.log("List button clicked"); // Debug
                    setIsListOpen(true);
                }}
                className="panel-button"
                >
                리스트
                </button>
            <button
              onClick={() => deleteMarker(selectedMarker)}
              className="panel-button delete-button"
            >
            삭제
            </button>
          </div>
        )}
      </div>

      {/* List Drawer */}
     
{isListOpen && (
  <div className={`list-drawer ${isMobile ? "mobile-drawer" : ""} ${isListOpen ? "open" : ""}`}>
    <button className="close-drawer" onClick={() => setIsListOpen(false)}>
      ×
    </button>
    <List address={address} />
  </div>
)}
    </div>
  );
};

export default KakaoMap;