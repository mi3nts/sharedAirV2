import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import customIconImg from "../assets/basicMarkerIcon.png";
import "./customMarker.css";

interface Props {
  position: [number, number];
  temperature: number;
  pollutionLevel: number;
}

function CustomMarker({ position, temperature, pollutionLevel }: Props) {
  const customIcon = L.icon({
    iconUrl: customIconImg,
    iconSize: [38, 38], // Specify the icon size in pixels
    iconAnchor: [19, 38], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -38], // Point from which the popup should open relative to the iconAnchor
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41], // Correct property name and size of the shadow
  });

  return (
    <>
      <Marker position={position} icon={customIcon}>
        <Popup closeButton={false} offset={[0, 20]} className="custom-popup">
          <div className="popup-content">
            <h2>Location Data</h2>
            <p>Temperature: {temperature} </p>
            <p>Pollution: {pollutionLevel}%</p>
            <p>Other Data: ...</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default CustomMarker;
