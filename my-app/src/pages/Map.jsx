import React, { useEffect, useRef } from "react";

import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYm9ta2EtMjciLCJhIjoiY21maHd3a3htMDE1ZjJrcHU3cXNrYjF3YSJ9.vGnAnTPwaGpTDso10ytKgg";

const Map = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/bomka-27/cmfhzsoks008b01qw9nomcja3",
      center: [-90.049, 35.146],
      zoom: 10,
    });

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
    } else {
      console.log("nice");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitute = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          mapRef.current?.setCenter([longitude, latitute]);
        },
        (err) => {
          console.warn("Geolocation error:", err);
        }
      );
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);
  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
};

export default Map;
