import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

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
  const [centerName, setCenterName] = useState("");
  const [centerResources, setCenterResources] = useState("");

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
      if (!mapRef.current) {
        console.warn("Map not ready yet");
        return;
      }

      const fly = ([lng, lat]) => {
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
        });
      };

      if (!("geolocation" in navigator)) {
        console.warn("Geolocation not supported");
        return;
      }

      console.log("hi");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("Got location:", { lat, lng });

          fly([lng, lat]);
        },
        (err) => {
          console.warn("Geolocation error:", err.code, err.message);
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
        el.title = c.description;

        el.addEventListener("click", () => {
          popupRef.current?.remove();
          const content = document.createElement("div");
          content.className = "popup-shell";
          content.innerHTML = `
            <div class="popup-header">${c.description}</div>
            <div class="popup-body">
              <div class="popup-line"><strong>Resources</strong></div>
              <ul class="popup-list">
                ${
                  c.category.map((r) => `<li>${escapeHtml(r)}</li>`).join("") ||
                  "<li>(none listed)</li>"
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
            .setLngLat([c.location[0], c.location[1]])
            .setDOMContent(content)
            .addTo(mapRef.current);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.location[0], c.location[1]])
          .addTo(mapRef.current);

        markersRef.current.set(c.description, marker);
      } else {
        markersRef.current
          .get(c.description)
          ?.setLngLat([c.location[0], c.location[1]]);
      }
    });
  }, [centers]);

  const submitCenter = async (e) => {
    e.preventDefault();

    if (!centerName) {
      alert("name not provided");
      return;
    }

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const resources = centerResources
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean); // removes empty resources

      const payload = {
        description: centerName.trim(),
        category: resources,
        location: [coords.longitude, coords.latitude],
      };

      const { data, error } = await supabase
        .from("reports")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Could not save to database.");
        return;
      }

      const saved = {
        description: data.description,
        category: data.category,
        location: data.location,
      };

      setCenters((prev) => [...prev, saved]);
      setShowCenter(false);
      setCenterName("");
      setCenterResources("");
      //resets info - may be an issue if multiple people trying to access at same time

      mapRef.current?.flyTo({
        center: [saved.location[0], saved.location[1]],
      });
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

      <style>
        {`
        .toolbar {
          position: fixed; bottom: 12px; right: 5px; z-index: 10;
          display: flex; gap: 8px;
        }
        .btn {
          background:rgb(0, 85, 255); color:rgb(255, 255, 255); border: 1px solid rgba(255,255,255,0.12);
          padding: 8px 12px; border-radius: 10px; cursor: pointer;
        }
        .btn.primary { background: #22c55e; color: #0b1220; border: none; }
        .btn:hover { filter: brightness(1.05); }

        .panel {
          position: fixed; bottom: 56px; right: 12px; z-index: 10;
          width: 300px; 
          background: #0b1220; color: #e5e7eb;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px; padding: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .panel-title { font-weight: 700; margin-bottom: 8px; }
        .form { display: grid; gap: 10px; }
        .label { display: grid; gap: 6px; font-size: 12px; color: #cbd5e1; }
        .input {
          background: #0f172a; color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 10px; border-radius: 8px; outline: none;
        }
          .pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background:rgb(0, 68, 255);        
          box-shadow: 0 0 0 3px rgba(22,163,74,0.25);
          cursor: pointer;
        }
        .pin:hover { transform: scale(1.12); box-shadow: 0 0 0 4px rgba(22,163,74,0.35); }

        `}
      </style>
    </>
  );
}
