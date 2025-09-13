import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../supabaseClient"; // adjust path if needed

mapboxgl.accessToken =
  "pk.eyJ1IjoiYm9ta2EtMjciLCJhIjoiY21maHd3a3htMDE1ZjJrcHU3cXNrYjF3YSJ9.vGnAnTPwaGpTDso10ytKgg";

export default function MapAddCenter() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const markersRef = useRef(new Map());

  const [centers, setCenters] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [showCenter, setShowCenter] = useState(false);
  const [centerName, setCenterName] = useState("");
  const [centerResources, setCenterResources] = useState("");

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/bomka-27/cmfhzsoks008b01qw9nomcja3",
      center: [-90.049, 35.146],
      zoom: 2,
    });

    mapRef.current.once("load", () => {
      centerToMyLocation();
    });

    function centerToMyLocation() {
      if (!("geolocation" in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        },
        (err) => console.warn("Geolocation error:", err)
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

  // Fetch disasters from Supabase
  useEffect(() => {
    async function fetchDisasters() {
      const { data, error } = await supabase
        .from("disasters")
        .select("*", { count: "exact" })
        .limit(10000);
        // .select("id, name, disaster_type, affected_area, start_date") // pick only necessary columns
        // .eq("disaster_type", "Flood") // filter for specific type
        // .order("start_date", { ascending: false });

      if (error) {
        console.error("Failed to fetch disasters:", error);
        return;
      }
      console.log(data);

      const pins = data.map(d => {
        if (!d.affected_area) return null;
        let lon = parseFloat(d.affected_area[0]);
        let lat = parseFloat(d.affected_area[1]);
        return {
          id: d.id,
          name: d.name,
          resources: [], // if any resources or extra info
          longitude: lon,
          latitude: lat,
        };
      }).filter(Boolean);

      setCenters(pins);
    };
      
    fetchDisasters();
  }, []);

  // Render markers for centers + disasters
  useEffect(() => {
    if (!mapRef.current) return;
    const allPins = [...disasters, ...centers];

    // remove old markers
    for (const [id, marker] of markersRef.current.entries()) {
      if (!allPins.find((c) => c.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    allPins.forEach((c) => {
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
                  (c.resources?.length
                    ? c.resources.map((r) => `<li>${escapeHtml(r)}</li>`).join("")
                    : "<li>(none listed)</li>")
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
  }, [centers, disasters]);

  const submitCenter = async (e) => {
    e.preventDefault();
    if (!centerName) return alert("name not provided");
    if (!navigator.geolocation) return console.log("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const resources = centerResources
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const newCenter = {
        id: String(Date.now()),
        name: centerName.trim(),
        resources,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setCenters((prev) => [...prev, newCenter]);
      setShowCenter(false);
      setCenterName("");
      setCenterResources("");

      mapRef.current?.flyTo({ center: [newCenter.longitude, newCenter.latitude] });
    });
  };

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowCenter((s) => !s)}>
          {showCenter ? "Close" : "Add Center"}
        </button>
      </div>
      {showCenter && (
        <div className="panel">
          <div className="panel-title">Create Center</div>
          <form onSubmit={submitCenter} className="form">
            <label className="label">
              Name
              <input
                className="input"
                placeholder=""
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
              />
            </label>

            <label className="label">
              Resources
              <input
                className="input"
                placeholder=""
                value={centerResources}
                onChange={(e) => setCenterResources(e.target.value)}
              />
            </label>

            <button type="submit" className="btn primary">
              Create
            </button>
          </form>
        </div>
      )}
      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />

      <style>{`
        .toolbar { position: fixed; bottom: 12px; right: 5px; z-index: 10; display: flex; gap: 8px; }
        .btn { background:rgb(0, 85, 255); color:white; padding: 8px 12px; border-radius: 10px; cursor: pointer; border:none; }
        .btn.primary { background: #22c55e; color: #0b1220; }
        .btn:hover { filter: brightness(1.05); }

        .panel { position: fixed; bottom: 56px; right: 12px; z-index: 10; width: 300px; background: #0b1220; color: #e5e7eb; border-radius: 12px; padding: 12px; }
        .panel-title { font-weight: 700; margin-bottom: 8px; }
        .form { display: grid; gap: 10px; }
        .label { display: grid; gap: 6px; font-size: 12px; color: #cbd5e1; }
        .input { background: #0f172a; color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); padding: 8px 10px; border-radius: 8px; }

        .pin { width: 14px; height: 14px; border-radius: 50%; background: rgb(0,68,255); box-shadow: 0 0 0 3px rgba(22,163,74,0.25); cursor:pointer; }
        .pin:hover { transform: scale(1.12); box-shadow: 0 0 0 4px rgba(22,163,74,0.35); }
      `}</style>
    </>
  );
}
