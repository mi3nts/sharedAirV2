// import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import CustomMarker from "./customMarker";
import "leaflet/dist/leaflet.css";
// import L from "leaflet";
import "./MapComponent.css"; // Import the CSS file

interface Props {
  center: [number, number];
  zoom: number;
  markerPosition: [number, number];
}
function MainMap({ center, zoom, markerPosition }: Props): JSX.Element {
  return (
    <>
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100vh", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
            attribution="Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors"
          />
          <CustomMarker
            position={markerPosition}
            temperature={20}
            pollutionLevel={40}
          />
        </MapContainer>
      </div>
    </>
  );
}

export default MainMap;
