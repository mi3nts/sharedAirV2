import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css"; // Import the CSS file

interface Props {
  center: [number, number];
  zoom: number;
}

function MainMap({ center, zoom }: Props): JSX.Element {
  return (
    <>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100vh", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
    </>
  );
}

export default MainMap;
