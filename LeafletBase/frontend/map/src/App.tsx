import { useState, useEffect } from "react";
import "./App.css";
import MainMap from "./components/MainMap.tsx";
import TaskBar from "./components/taskBar.tsx";
// import Dropdown from "./components/DropdownFolder/Dropdown.tsx";
// import MapSelector from "./components/MapSelector.tsx";

function App() {
  const [mapConfig, setMapConfig] = useState<{
    center: [number, number];
    zoom: number;
    markerPosition: [number, number];
  } | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/standard")
      .then((response) => response.json())
      .then((data) => setMapConfig(data))
      .catch((error) => console.error("Error fetching map config:", error));
  }, []);

  if (!mapConfig) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <TaskBar />
        <MainMap
          center={mapConfig.center}
          zoom={mapConfig.zoom}
          markerPosition={mapConfig.markerPosition}
        />
      </div>
    </>
  );
}

export default App;
