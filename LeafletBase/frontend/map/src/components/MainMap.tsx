import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";
import io from "socket.io-client";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
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
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
    </>
  );
}

export default MainMap;
