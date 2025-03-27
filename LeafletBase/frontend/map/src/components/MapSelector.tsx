import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Define a mapping of map style keys to their respective tile layer configurations
const mapStyles: { [key: string]: { url: string; attribution: string } } = {
  openstreetmap: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  cartodb: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  stamenWatercolor: {
    url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg",
    attribution:
      "Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors",
  },
  stamenTonerLite: {
    url: "https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",
    attribution:
      "Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors",
  },
};

function MapSelector(): JSX.Element {
  // State for the currently selected map style
  const [currentStyle, setCurrentStyle] = useState("openstreetmap");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentStyle(e.target.value);
  };

  return (
    <div>
      {/* Dropdown to select map style */}
      <div style={{ margin: "10px" }}>
        <label htmlFor="map-style-select">Select Map Style: </label>
        <select
          id="map-style-select"
          value={currentStyle}
          onChange={handleChange}
        >
          <option value="openstreetmap">OpenStreetMap</option>
          <option value="cartodb">CartoDB Positron</option>
          <option value="stamenWatercolor">Stamen Watercolor</option>
          <option value="stamenTonerLite">Stamen Toner Lite</option>
        </select>
      </div>
    </div>
  );
}

export default MapSelector;
