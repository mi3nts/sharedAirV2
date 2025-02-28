import { useState } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MainMap from "./components/MainMap.tsx";
import TaskBar from "./components/taskBar.tsx";
function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
    <div>
      
    </div>
    <div>

    </div>
      <MainMap center={[37.7749, -122.4194]} zoom={12} />
      {/* <Marker position={[38.7749, -122.4194]}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker> */}
    </>
  );
}

export default App;
