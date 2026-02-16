import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import BASE_URL from "./config";

const getColor = (sales) => {
  return sales > 1000000 ? "#800026" :
         sales > 500000  ? "#BD0026" :
         sales > 100000  ? "#E31A1C" :
         sales > 50000   ? "#FC4E2A" :
         sales > 10000   ? "#FD8D3C" :
         sales > 1000    ? "#FEB24C" :
         sales > 0       ? "#FED976" :
                           "#FFEDA0";
};

const IndiaMap = ({ onStateClick }) => {
  const [geoData, setGeoData] = useState(null);
  const [salesData, setSalesData] = useState({});

  // Fetch GeoJSON
  useEffect(() => {
    fetch("/india.geojson")
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("GeoJSON Error:", err));
  }, []);

  // Fetch sales data
  useEffect(() => {
    fetch(`api/sales/summary-by-state/`)  // <-- Update URL
      .then(res => res.json())
      .then(data => {
        const salesByState = {};
        data.forEach(item => {
          salesByState[item.state.toLowerCase()] = item.total_sales;
        });
        setSalesData(salesByState);
      })
      .catch(err => console.error("Sales API Error:", err));
  }, []);

  const onEachState = (feature, layer) => {
    const stateName = feature.properties.NAME_1;
    const stateKey = stateName?.toLowerCase();
    const sales = salesData[stateKey] || 0;

    layer.setStyle({
      fillColor: getColor(sales),
      weight: 1,
      opacity: 1,
      color: "blue",
      dashArray: "3",
      fillOpacity: 0.7
    });

    layer.on({
      click: () => onStateClick(stateName),
    });

    layer.bindTooltip(`${stateName} - ₹${sales.toLocaleString()}`, {
      permanent: false,
      direction: "top"
    });
  };

  return (
    <MapContainer center={[22.0, 79.0]} zoom={5} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {geoData && <GeoJSON data={geoData} onEachFeature={onEachState} />}
    </MapContainer>
  );
};

export default IndiaMap;
