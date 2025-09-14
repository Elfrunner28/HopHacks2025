import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  fetchAllDisasters,
  fetchEonetEvents,
  fetchCenters,
} from "../supabaseData";
import { supabase } from "../supabaseClient";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYm9ta2EtMjciLCJhIjoiY21maHd3a3htMDE1ZjJrcHU3cXNrYjF3YSJ9.vGnAnTPwaGpTDso10ytKgg";

export default function MapAddCenter() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const markersRef = useRef(new Map());

  const [centers, setCenters] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [eonetEvents, setEonetEvents] = useState([]);

  const [activeDataset, setActiveDataset] = useState("live"); // "live" or "history"
  const [filter, setFilter] = useState({ disasterTypes: [], year: 2025 });

  const [showCenter, setShowCenter] = useState(false);
  const [centerName, setCenterName] = useState("");
  const [resourceRows, setResourceRows] = useState([
    { name: "", status: "available" },
  ]);

  const RESOURCE_STATUSES = ["available", "low", "out"];

  // Major disaster types
  const majorDisasters = [
    "Fire",
    "Severe Storm",
    "Flood",
    "Hurricane",
    "Tornado",
    "Earthquake",
    "Winter Storm",
    "Tropical Storm",
  ];

  const allDisasterTypes = [
    "Fire",
    "Severe Storm",
    "Straight-Line Winds",
    "Flood",
    "Hurricane",
    "Biological",
    "Winter Storm",
    "Tornado",
    "Tropical Storm",
    "Earthquake",
    "Typhoon",
    "Snowstorm",
    "Freezing",
    "Mud/Landslide",
    "Coastal Storm",
    "Severe Ice Storm",
    "Dam/Levee Break",
    "Volcanic Eruption",
    "Tropical Depression",
    "Toxic Substances",
    "Chemical",
    "Terrorist",
    "Drought",
    "Human Cause",
    "Fishing Losses",
    "Tsunami",
    "Other",
  ];

  const uniqueTypes = Array.from(
    new Set(
      allDisasterTypes.map((type) =>
        majorDisasters.includes(type) ? type : "Other"
      )
    )
  );

  // Load centers from Supabase
  useEffect(() => {
    async function loadCenters() {
      const data = await fetchCenters();
      setCenters(data);
    }
    loadCenters();
  }, []);

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
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
          },
          (err) => console.warn("Geolocation error:", err)
        );
      }
    });

    return () => {
      popupRef.current?.remove();
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function addResourceRow() {
    setResourceRows((rows) => [...rows, { name: "", status: "available" }]);
  }
  function removeResourceRow(index) {
    setResourceRows((rows) => rows.filter((_, i) => i !== index));
  }
  function updateResourceName(index, val) {
    setResourceRows((rows) => {
      const copy = rows.slice();
      copy[index] = { ...copy[index], name: val };
      return copy;
    });
  }
  function updateResourceStatus(index, val) {
    setResourceRows((rows) => {
      const copy = rows.slice();
      copy[index] = { ...copy[index], status: val };
      return copy;
    });
  }

  // Fetch disasters
  useEffect(() => {
    async function getDisasters() {
      try {
        const pins = await fetchAllDisasters();
        setDisasters(pins);
      } catch (err) {
        console.error("Failed to fetch disasters:", err);
      }
    }
    getDisasters();
  }, []);

  // Fetch EONET events
  useEffect(() => {
    async function getEonetEvents() {
      try {
        const pins = await fetchEonetEvents();
        setEonetEvents(pins);
      } catch (err) {
        console.error("Failed to fetch eonet events:", err);
      }
    }
    getEonetEvents();
  }, []);

  // Render markers
  useEffect(() => {
    if (!mapRef.current) return;

    let allPins = [];
    if (activeDataset === "live") {
      allPins = [...eonetEvents, ...centers];
    } else if (activeDataset === "history") {
      allPins = disasters.filter((d) => {
        const type = majorDisasters.includes(d.disaster_type)
          ? d.disaster_type
          : "Other";

        const matchType =
          filter.disasterTypes.length > 0
            ? filter.disasterTypes.includes(type)
            : false;
        const matchYear =
          !filter.year || new Date(d.start_date).getFullYear() === filter.year;

        return matchType && matchYear;
      });
    }

    // Remove old markers
    for (const [id, marker] of markersRef.current.entries()) {
      if (!allPins.find((c) => c.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    allPins.forEach((c) => {
      if (!markersRef.current.has(c.id)) {
        const el = document.createElement("div");
        el.className = c.type === "eonet" ? "pin eonet-pin" : "pin";
        el.title = c.name;

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.longitude, c.latitude])
          .addTo(mapRef.current);

        // 3) build popup HTML NOW (not in click), using your dict
        let resourcesListHtml = "<li>(none listed)</li>";
        if (c.resources && typeof c.resources === "object") {
          const items = Object.entries(c.resources).map(
            ([name, status]) => `<li>${status} - ${name}</li>`
          );
          if (items.length) resourcesListHtml = items.join("");
        }

        const content = document.createElement("div");
        content.className = "popup-shell";
        content.innerHTML = `
      <div class="popup-header">${c.name ?? ""}</div>
      <div class="popup-body">
        <div class="popup-line"><strong>Resources</strong></div>
        <ul class="popup-list">${resourcesListHtml}</ul>
      </div>
    `;

        // 4) make a popup for THIS marker
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 12,
          className: "clean-popup",
        }).setDOMContent(content);

        // 5) attach it; clicking the marker will open it
        marker.setPopup(popup);

        markersRef.current.set(c.id, marker);
      } else {
        markersRef.current.get(c.id)?.setLngLat([c.longitude, c.latitude]);
      }
    });
  }, [activeDataset, eonetEvents, disasters, filter, centers]);

  const submitCenter = async (e) => {
    e.preventDefault();
    if (!centerName) return alert("Name not provided");
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      // Convert resourceRows to a JSON object
      const resources = resourceRows
        .filter((r) => r.name.trim().length > 0)
        .reduce((acc, r) => {
          acc[r.name.trim()] = r.status;
          return acc;
        }, {});

      try {
        // Insert into Supabase
        const { data, error } = await supabase
          .from("centers")
          .insert([
            {
              name: centerName.trim(),
              location: [coords.longitude, coords.latitude],
              resources,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Failed to insert center:", error);
          return alert("Failed to save center to database");
        }

        const newCenter = {
          id: data.id,
          name: data.name || centerName.trim(),
          resources: data.resources || resources,
          longitude: data.location[0],
          latitude: data.location[1],
        };
        console.log(newCenter);

        // Update local state with inserted center
        setCenters((prev) => [...prev, newCenter]);

        // Reset form
        setShowCenter(false);
        setCenterName("");
        setResourceRows([{ name: "", status: "available" }]);

        // Fly map to new center
        mapRef.current?.flyTo({
          center: [data.location[0], data.location[1]],
          zoom: 14,
          essential: true,
        });
      } catch (err) {
        console.error("Unexpected error inserting center:", err);
      }
    });
  };
  return (
    <>
      <div className="toolbar">
        <button
          className="btn"
          onClick={() => setActiveDataset("live")}
          style={{
            background: activeDataset === "live" ? "#22c55e" : undefined,
          }}
        >
          Live
        </button>
        <button
          className="btn"
          onClick={() => setActiveDataset("history")}
          style={{
            background: activeDataset === "history" ? "#22c55e" : undefined,
          }}
        >
          History
        </button>
        {activeDataset === "live" && (
          <button className="btn" onClick={() => setShowCenter((s) => !s)}>
            {showCenter ? "Close" : "Add Center"}
          </button>
        )}
      </div>

      {activeDataset === "history" && (
        <div className="panel">
          <div className="panel-title">Filter Disasters</div>
          <div className="checkbox-group">
            <button
              type="button"
              className="btn small"
              onClick={() => {
                if (filter.disasterTypes.length === uniqueTypes.length) {
                  // Deselect all
                  setFilter({ ...filter, disasterTypes: [] });
                } else {
                  // Select all
                  setFilter({ ...filter, disasterTypes: [...uniqueTypes] });
                }
              }}
            >
              All
            </button>

            {uniqueTypes.map((type) => (
              <label key={type} className="label">
                <input
                  type="checkbox"
                  checked={filter.disasterTypes.includes(type)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFilter((prev) => {
                      const types = new Set(prev.disasterTypes);
                      if (checked) types.add(type);
                      else types.delete(type);
                      return { ...prev, disasterTypes: Array.from(types) };
                    });
                  }}
                />
                {type}
              </label>
            ))}
          </div>

          <div className="year-slider">
            <label className="label">Year</label>
            <div className="slider-wrapper">
              <Slider
                min={2015}
                max={2025}
                step={1}
                value={filter.year}
                onChange={(v) => setFilter((prev) => ({ ...prev, year: v }))}
                marks={{ 2015: "2015", 2025: "2025" }} // only min/max labels
                railStyle={{ backgroundColor: "#1e293b", height: 6 }} // slider background
                trackStyle={{ backgroundColor: "#1e293b", height: 6 }} // same as rail so no green track
                handleStyle={{
                  borderColor: "#22c55e",
                  backgroundColor: "#22c55e",
                  width: 16,
                  height: 16,
                  marginTop: -5,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showCenter && (
        <div className="panel">
          <div className="panel-title">Create Center</div>
          <form onSubmit={submitCenter} className="form">
            <label className="label">
              Name
              <input
                className="input"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
              />
            </label>

            <label className="label">Resources</label>
            <div className="res-rows">
              {resourceRows.map((row, i) => (
                <div className="res-row" key={i}>
                  <input
                    className="input res-name"
                    placeholder=""
                    value={row.name}
                    onChange={(e) => updateResourceName(i, e.target.value)}
                  />
                  <select
                    className="input res-status"
                    value={row.status}
                    onChange={(e) => updateResourceStatus(i, e.target.value)}
                  >
                    {RESOURCE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => removeResourceRow(i)}
                    disabled={resourceRows.length === 1}
                    title={
                      resourceRows.length === 1
                        ? "Keep at least one row"
                        : "Remove"
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn small"
                onClick={addResourceRow}
              >
                + Add resource
              </button>
            </div>

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

      .panel {
  position: fixed;
  bottom: 56px;
  right: 12px;
  z-index: 10;
  max-width: 100%;
  box-sizing: border-box;
  width: 300px;
  background: #0b1220;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}
      
      .panel-title { font-weight: 700; margin-bottom: 8px; }
      .form { display: grid; gap: 10px; }
      .label { display: grid; gap: 6px; font-size: 12px; color: #cbd5e1; }
      .input { background: #0f172a; color: #e5e7eb; border: 1px solid rgba(255,255,255,0.1); padding: 8px 10px; border-radius: 8px; }

      .pin { width: 14px; height: 14px; border-radius: 50%; background: rgb(0,68,255); box-shadow: 0 0 0 3px rgba(22,163,74,0.25); cursor:pointer; }
      .pin:hover { transform: scale(1.12); box-shadow: 0 0 0 4px rgba(22,163,74,0.35); }

        .eonet-pin { background: #E53E3E; box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.3); }
        .eonet-pin:hover { box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.4); }
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .checkbox-group .label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #cbd5e1;
        }

        .btn.small {
          align-self: flex-start;
          background: #0b1220;
          color: #e5e7eb;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          margin-bottom: 6px;
        }
        .btn.small:hover {
          background: #1e293b;
        }
        .year-slider {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
          width: 100%; /* full panel width */
          align-items: center; /* center the wrapper */
        }

        .slider-wrapper {
          width: 90%; /* fixed slider width */
        }
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #cbd5e1;
        }
        .year-range-slider {
          margin-top: 6px;
        }
        .rc-slider-mark-text{
          color: #999;
          margin-top: -3px;
        } 
        .res-row {
          margin-bottom: 15px
        }

        .res-status {
          margin: 10px
          
        }`}</style>
    </>
  );
}
