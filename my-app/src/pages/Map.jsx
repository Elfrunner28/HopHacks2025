import React, { useEffect, useRef } from "react";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYm9ta2EtMjciLCJhIjoiY21maHd3a3htMDE1ZjJrcHU3cXNrYjF3YSJ9.vGnAnTPwaGpTDso10ytKgg";

export default function MapAddCenter() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const markersRef = useRef(new Map());

  const [centers, setCenters] = useState([]);
  const [showCenter, setShowCenter] = useState(false);
  const [CenterName, setCenterName] = useState("");
  const [centerResources, setCenterResources] = useState("");

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
          mapRef.current?.flyTo([longitude, latitute]);
        },
        (err) => {
          console.warn("Geolocation error:", err);
        }
      );
    }

    return () => {
      popupRef.current?.remove();
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // delete markers that no longer exist
    for (const [id, marker] of markersRef.current.entries()) {
      if (!centers.find((c) => c.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    centers.forEach((c) => {
      if (!markersRef.current.has(c.id)) {
        const el = document.createElement("div");
        el.className = "pin";
        el.title = c.name;

        el.addEventListener("click", () => {
          popupRef.current?.remove();
          const content = document.createElement("div");
          content.className = "popup-shell";
          content.innerHTML = `
            <div class="popup-header">${c.name}</div>
            <div class="popup-body">
              <div class="popup-line"><strong>Resources</strong></div>
              <ul class="popup-list">
                ${
                  c.resources
                    .map((r) => `<li>${escapeHtml(r)}</li>`)
                    .join("") || "<li>(none listed)</li>"
                }
              </ul>
            </div>
          `;
          popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            offset: 12,
            className: "clean-popup",
          })
            .setLngLat([c.longitude, c.latitude])
            .setDOMContent(content)
            .addTo(mapRef.current);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.longitude, c.latitude])
          .addTo(mapRef.current);

        markersRef.current.set(c.id, marker);
      } else {
        markersRef.current.get(c.id)?.setLngLat([c.longitude, c.latitude]);
      }
    });
  }, [centers]);

  const submitCenter = async (e) => {
    e.preventDefault();

    if (!CenterName) {
      alert("Please enter a center name");
      return;
    }

    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported on this device.");
      return;
    }
  };

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}
