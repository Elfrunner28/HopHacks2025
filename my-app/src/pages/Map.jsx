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

  // --- STATE MODIFICATION ---
  // Replaced showCenter boolean with an object to manage panel state
  const [activeFormCenter, setActiveFormCenter] = useState(null);
  // This state will be:
  // null = panel is hidden
  // { isNew: true } = panel is open in "Add New" mode
  // { ...centerObject } = panel is open in "Edit" mode

  const [centerName, setCenterName] = useState("");
  const [resourceRows, setResourceRows] = useState([
    { name: "", status: "available" },
  ]);
  const [needs, setNeeds] = useState([""]);

  const RESOURCE_STATUSES = ["available", "low", "out"];

  function getPinGroup(c) {
    if (c.disaster_type) {
      // for disasters
      return getDisasterGroup(c.disaster_type);
    } else if (c.resources) {
      // user-created centers
      return "Center";
    }
    return "Others";
  }
  function getPinColor(group) {
    switch (group) {
      case "Fire":
        return "#FF4500"; // orange-red
      case "Flood":
        return "#1E90FF"; // dodger blue
      case "Earthquake":
        return "#8B0000"; // dark red
      case "Severe Storms":
        return "#FFD700"; // gold
      case "Tropical Cyclones":
        return "#00CED1"; // dark turquoise
      case "Tornadoes":
        return "#800080"; // purple
      case "Center":
        return "#22c55e"; // green
      default:
        return "#808080"; // gray for Others
    }
  }
  function getDisasterGroup(type) {
    const t = type.toLowerCase();

    if (t.includes("fire")) return "Fire";
    if (t.includes("flood")) return "Flood";
    if (t.includes("earthquake")) return "Earthquake";
    if (t.includes("tornado")) return "Tornado";

    // Severe Storms group
    const severeStorms = [
      "Straight-Line Winds",
      "Winter Storm",
      "Snowstorm",
      "Coastal Storm",
      "Severe Ice Storm",
    ];
    if (severeStorms.includes(type)) return "Severe Storms";

    // Tropical Cyclones group
    const tropicalCyclones = [
      "Hurricane",
      "Typhoon",
      "Tropical Storm",
      "Tropical Depression",
    ];
    if (tropicalCyclones.includes(type)) return "Tropical Cyclones";

    // Everything else goes into Others
    return "Others";
  }

  const uniqueTypes = [
    "Fire",
    "Flood",
    "Earthquake",
    "Severe Storms",
    "Tropical Cyclones",
    "Tornadoes",
    "Others",
  ];

  useEffect(() => {
    // --- Disasters table realtime subscription ---
    const disastersChannel = supabase
      .channel("disasters-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disasters" },
        (payload) => {
          console.log("Disasters change:", payload);

          if (payload.eventType === "DELETE") {
            setEonetEvents((prev) =>
              prev.filter((e) => e.id !== payload.old.id)
            );
          } else {
            const data = payload.new;
            const newDisaster = {
              id: data.id,
              name: data.name,
              disaster_type: data.disaster_type,
              start_date: data.start_date,
              longitude: parseFloat(data.affected_area[0]),
              latitude: parseFloat(data.affected_area[1]),
              type: "history",
            };
            if (payload.eventType === "INSERT") {
              setEonetEvents((prev) => [...prev, newDisaster]);
            }

            if (payload.eventType === "UPDATE") {
              setEonetEvents((prev) =>
                prev.map((e) => (e.id === payload.new.id ? newDisaster : e))
              );
            }
          }
        }
      )
      .subscribe();

    // --- EONET Events table realtime subscription ---
    const eonetChannel = supabase
      .channel("eonet_events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eonet_events" },
        (payload) => {
          console.log("EONET change:", payload);

          if (payload.eventType === "DELETE") {
            setEonetEvents((prev) =>
              prev.filter((e) => e.id !== payload.old.id)
            );
          } else {
            const data = payload.new;
            const newEonet = {
              id: data.id,
              name: data.title,
              disaster_type: data.disaster_type,
              longitude: parseFloat(data.geometry[0]),
              latitude: parseFloat(data.geometry[1]),
              type: "eonet",
            };
            if (payload.eventType === "INSERT") {
              setEonetEvents((prev) => [...prev, newEonet]);
            }

            if (payload.eventType === "UPDATE") {
              setEonetEvents((prev) =>
                prev.map((e) => (e.id === payload.new.id ? newEonet : e))
              );
            }
          }
        }
      )
      .subscribe();

    // Create a realtime channel for the centers table
    const centersChannel = supabase
      .channel("realtime-centers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "centers", old: "required" },
        (payload) => {
          // console.log("Realtime event:", JSON.stringify(payload, null, 2));
          const data = payload.new;

          if (payload.eventType === "INSERT") {
            const newCenter = {
              id: data.id,
              name: data.name,
              resources: data.resources,
              needs: data.needs, // Make sure needs are included
              longitude: data.location[0],
              latitude: data.location[1],
              type: "center",
            };
            setCenters((prev) => [...prev, newCenter]);
          } else if (payload.eventType === "UPDATE") {
            const data = payload.new; // Moved data definition up

            // --- ADD THIS BLOCK ---
            // Force remove the old marker so it can be completely rebuilt
            const oldMarker = markersRef.current.get(data.id);
            if (oldMarker) {
              oldMarker.remove(); // Remove from map
              markersRef.current.delete(data.id); // Remove from our ref
            }
            // --- END OF ADDED BLOCK ---

            const newCenter = {
              id: data.id,
              name: data.name,
              resources: data.resources,
              needs: data.needs, // Make sure needs are included
              longitude: data.location[0],
              latitude: data.location[1],
              type: "center",
            };
            setCenters((prev) =>
              prev.map((c) => (c.id === newCenter.id ? newCenter : c))
            );
          } else if (payload.eventType === "DELETE") {
            if (!payload.old) return; // safety check
            setCenters((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup when component unmounts
    return () => {
      supabase.removeChannel(disastersChannel);
      supabase.removeChannel(eonetChannel);
      supabase.removeChannel(centersChannel);
    };
  }, []);

  // Load centers from Supabase
  useEffect(() => {
    async function loadCenters() {
      const data = await fetchCenters();
      // Manually add type: "center" to all fetched data for consistency
      const typedData = data.map((c) => ({ ...c, type: "center" }));
      setCenters(typedData);
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
  function addNeedRow() {
    setNeeds((rows) => [...rows, ""]);
  }

  const updateNeedName = (index, val) =>
    setNeeds((rows) => {
      const copy = rows.slice();
      copy[index] = val;
      return copy;
    });
  const removeNeedRow = (index) =>
    setNeeds((rows) => rows.filter((_, i) => i !== index));

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
        const typeGroup = getDisasterGroup(d.disaster_type);
        const matchType =
          filter.disasterTypes.length > 0
            ? filter.disasterTypes.includes(typeGroup)
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
        const wrapper = document.createElement("div");
        wrapper.className = "pin-wrapper";
        const el = document.createElement("div");
        el.className = c.type !== "history" ? "pin eonet-pin blinking" : "pin";
        el.title = c.name;
        wrapper.appendChild(el);

        const marker = new mapboxgl.Marker({
          element: wrapper,
          anchor: "bottom",
        })
          .setLngLat([c.longitude, c.latitude])
          .addTo(mapRef.current);

        // --- Generate HTML lists for resources and needs ---
        let resourcesListHtml = null;
        if (c.resources && typeof c.resources === "object") {
          const items = Object.entries(c.resources).map(
            ([name, status]) => `<li>${status} - ${name}</li>`
          );
          if (items.length) resourcesListHtml = items.join("");
        }

        let needsListHtml = null;
        if (Array.isArray(c.needs) && c.needs.length > 0) {
          const items = c.needs.map((need) => `<li>${need}</li>`);
          if (items.length) needsListHtml = items.join("");
        }
        // --- End of list generation ---

        const content = document.createElement("div");
        content.className = "popup-shell";

        const gmapsUrl =
          `https://www.google.com/maps/dir/?api=1` +
          `&origin=${encodeURIComponent("Current+Location")}` +
          `&destination=${encodeURIComponent(`${c.latitude},${c.longitude}`)}` +
          `&travelmode=driving`;
        if (!resourcesListHtml && !needsListHtml) {
          // For items with no resources or needs (like disasters)
          content.innerHTML = `<div class="popup-header">${c.name}</div>`;
        } else {
          // For centers that have resources and/or needs
          content.innerHTML = `
            <div class="popup-header">${c.name}</div>
            <div class="popup-body">
              ${
                resourcesListHtml
                  ? `
                  <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">
          ${c.name ?? ""}
        </a>
                <div class="popup-line"><strong>Resources</strong></div>
                <ul class="popup-list">${resourcesListHtml}</ul>
              `
                  : ""
              }
              ${
                needsListHtml
                  ? `
                  <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">
          ${c.name ?? ""}
        </a>
                <div class="popup-line"><strong>Needs</strong></div>
                <ul class="popup-list">${needsListHtml}</ul>
              `
                  : ""
              }
            </div>
          `;
        }

        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 12,
        });

        // --- ADD EDIT/DELETE BUTTONS ---
        if (getPinGroup(c) === "Center") {
          const footer = document.createElement("div");
          footer.className = "popup-footer";

          // --- NEW EDIT BUTTON ---
          const editBtn = document.createElement("button");
          editBtn.className = "btn-popup-edit"; // New class for styling
          editBtn.innerText = "Edit";

          editBtn.addEventListener("click", () => {
            // 1. Populate form state with this center's data
            setCenterName(c.name);

            // Convert resources object back to an array of rows
            const resArray = Object.entries(c.resources || {}).map(
              ([name, status]) => ({ name, status })
            );
            setResourceRows(
              resArray.length ? resArray : [{ name: "", status: "available" }]
            );

            // Populate needs array
            const needsArray = c.needs || [];
            setNeeds(needsArray.length ? needsArray : [""]);

            // 2. Set the active form panel to THIS center (which opens the panel)
            setActiveFormCenter(c);

            // 3. Close the popup
            popup.remove();
          });
          // --- END OF NEW EDIT BUTTON ---

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "btn-popup-delete"; // New class for styling
          deleteBtn.innerText = "Delete Center";

          // Add event listener to call our delete function
          deleteBtn.addEventListener("click", async () => {
            const success = await handleDeleteCenter(c.id);
            if (success) {
              popup.remove(); // Close this popup instance on success
            }
          });

          footer.appendChild(editBtn); // Add Edit button first
          footer.appendChild(deleteBtn); // Then Delete button
          content.appendChild(footer); // Add the footer to the popup content
        }
        // --- END OF BUTTON LOGIC ---

        popup.setDOMContent(content);
        marker.setPopup(popup);

        markersRef.current.set(c.id, marker);
        const group = getPinGroup(c);
        el.style.backgroundColor = getPinColor(group);
        el.style.border = "1px solid black";
        if (group === "Center") {
          el.style.boxShadow = "0 0 0 4px rgba(34,197,94,0.25)";
        }
        markersRef.current.set(c.id, marker);
      } else {
        markersRef.current.get(c.id)?.setLngLat([c.longitude, c.latitude]);
      }
    });
  }, [activeDataset, eonetEvents, disasters, filter, centers]);

  // --- UPDATED CREATE FUNCTION ---
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

      const needsArray = needs.map((n) => n.trim()).filter(Boolean);

      try {
        // Insert into Supabase
        const { data, error } = await supabase
          .from("centers")
          .insert([
            {
              name: centerName.trim(),
              location: [coords.longitude, coords.latitude],
              resources,
              needs: needsArray,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Failed to insert center:", error);
          return alert("Failed to save center to database");
        }

        // Close the panel. Realtime will add the marker.
        setActiveFormCenter(null);

        // Fly map to new center
        mapRef.current?.flyTo({
          center: [data.location[0], data.location[1]],
          zoom: 18,
          essential: true,
        });
      } catch (err) {
        console.error("Unexpected error inserting center:", err);
      }
    });
  };

  const handleDeleteCenter = async (centerId) => {
    // 1. Confirm with the user
    if (!window.confirm("Are you sure you want to delete this center?")) {
      return false; // User canceled
    }

    // 2. Send delete request to Supabase
    try {
      const { error } = await supabase
        .from("centers")
        .delete()
        .eq("id", centerId); // Use .eq for precise matching on the primary key

      if (error) {
        throw error; // Throw error to be caught below
      }

      return true; // Signal success
    } catch (error) {
      console.error("Error deleting center:", error.message);
      alert("Failed to delete the center.");
      return false; // Signal failure
    }
  };

  // --- NEW UPDATE FUNCTION ---
  const handleUpdateCenter = async (e) => {
    e.preventDefault();
    if (!centerName) return alert("Center name not provided");
    if (!activeFormCenter || activeFormCenter.isNew) return; // Safety check

    // Convert resourceRows back into a JSON object
    const resources = resourceRows
      .filter((r) => r.name.trim().length > 0)
      .reduce((acc, r) => {
        acc[r.name.trim()] = r.status;
        return acc;
      }, {});

    const needsArray = needs.map((n) => n.trim()).filter(Boolean);

    // Run the Supabase UPDATE query
    try {
      const { error } = await supabase
        .from("centers")
        .update({
          name: centerName.trim(),
          resources: resources,
          needs: needsArray,
        })
        .eq("id", activeFormCenter.id); // Match the ID of the center we are editing

      if (error) {
        throw error;
      }

      // Close the panel on success. The realtime subscription will update the UI.
      setActiveFormCenter(null);
    } catch (error) {
      console.error("Failed to update center:", error);
      alert("Failed to update center.");
    }
  };

  useEffect(() => {
    if (activeDataset === "history") {
      // If user switches to history, close any open form panel
      setActiveFormCenter(null);
    }
  }, [activeDataset]);

  // --- NEW HANDLER TO OPEN "ADD" PANEL ---
  const openAddCenterPanel = () => {
    // Reset form state to defaults for a new entry
    setCenterName("");
    setResourceRows([{ name: "", status: "available" }]);
    setNeeds([""]);
    // Open the panel in "new" mode
    setActiveFormCenter({ isNew: true });
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
        {/* --- UPDATED "ADD/CLOSE" BUTTON --- */}
        <button
          className="btn"
          onClick={() => {
            if (activeDataset === "history") return; // prevent click

            // New logic: If panel is open (for add OR edit), close it.
            // If panel is closed, open it in "Add" mode.
            if (activeFormCenter) {
              setActiveFormCenter(null);
            } else {
              openAddCenterPanel();
            }
          }}
          style={{
            background: activeDataset === "live" ? "#0055ff" : "#555",
            cursor: activeDataset === "live" ? "pointer" : "not-allowed",
          }}
        >
          {activeFormCenter ? "Close" : "Add Center"}
        </button>
      </div>

      {activeDataset === "history" && (
        <div className="panel history">
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
            <label className="label">Year: {filter.year}</label>
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

      {/* --- UPDATED DYNAMIC FORM PANEL --- */}
      {activeFormCenter && (
        <>
          <div
            className="modal"
            onClick={() => setActiveFormCenter(null)}
          ></div>
          <div className="panel">
            <div className="panel-title">
              {activeFormCenter.isNew ? "Create Center" : "Edit Center"}
            </div>
            <form
              onSubmit={
                activeFormCenter.isNew ? submitCenter : handleUpdateCenter
              }
              className="form"
            >
              <label className="label" style={{ fontSize: "25px" }}>
                Name
                <input
                  className="input"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                />
              </label>

              <label className="label" style={{ fontSize: "25px" }}>
                Resources
              </label>
              <div className="res-rows">
                {resourceRows.map((row, i) => (
                  <div className="res-row" key={i}>
                    <input
                      className="res-name"
                      placeholder="Resource"
                      value={row.name}
                      onChange={(e) => updateResourceName(i, e.target.value)}
                    />
                    <select
                      className="res-status"
                      placeholder="status"
                      value={row.status}
                      onChange={(e) => updateResourceStatus(i, e.target.value)}
                    >
                      {RESOURCE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn small add-resource"
                  onClick={addResourceRow}
                >
                  + Add resource
                </button>

                <button
                  type="button"
                  className="btn small delete-resource"
                  onClick={() => removeResourceRow(resourceRows.length - 1)}
                  disabled={resourceRows.length === 1}
                >
                  - Delete last resource
                </button>
              </div>

              <label className="label" style={{ fontSize: "25px" }}>
                Needs
              </label>
              <div className="needs-rows">
                {needs.map((name, i) => (
                  <div className="needs-row" key={i}>
                    <input
                      className="needs-input"
                      placeholder="Need"
                      value={name}
                      onChange={(e) => updateNeedName(i, e.target.value)}
                    />
                    <div className="needs-row-actions">
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => removeNeedRow(i)}
                        disabled={needs.length === 1}
                        title={
                          needs.length === 1
                            ? "Keep at least one row"
                            : "Remove"
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn small add-need"
                  onClick={addNeedRow}
                >
                  + Add need
                </button>
              </div>

              <button type="submit" className="btn primary">
                {activeFormCenter.isNew ? "Create" : "Save Changes"}
              </button>
            </form>
          </div>
        </>
      )}

      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />

      <style>{`
      
      .mapboxgl-popup {
        max-width: 480px;
        font-family: system-ui, sans-serif;
        z-index: 9999;
      }

      .mapboxgl-popup-content {
        background: #0b1220; 
        color: #e5e7eb;
        border-radius: 12px;
        padding: 0; 
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }

    
      .popup-header {
      align-content: center;
        font-size: 16px;
        font-weight: 700;
        padding: 12px 16px;
        background: #111827;
        color: #fff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        margin-right: 24px; 
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Body section */
      .popup-body {
        padding: 12px 16px;
        font-size: 14px;
      }

      .popup-line {
        margin-bottom: 6px;
        font-weight: 600;
      }

      .popup-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .popup-list li {
        margin-bottom: 4px;
        font-size: 13px;
      }

      /* Close button adjustments */
      .mapboxgl-popup-close-button {
        top: 8px !important;
        right: 8px !important;
        color: #aaa;
        font-size: 18px;
      }

      .mapboxgl-popup-close-button:hover {
        color: #fff;
      }

      /* --- CSS MODIFICATION: UPDATED POPUP FOOTER --- */
      .popup-footer {
        display: flex;
        justify-content: flex-end; /* Aligns buttons to the right */
        gap: 8px; /* Adds space between buttons */
        padding: 8px 16px;
        background: #111827; /* Match header background */
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* --- NEW CSS: EDIT BUTTON --- */
      .btn-popup-edit {
        background-color: #3b82f6; /* Blue */
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .btn-popup-edit:hover {
        background-color: #2563eb; /* Darker blue */
      }

      /* --- EXISTING CSS: DELETE BUTTON --- */
      .btn-popup-delete {
        background-color: #ef4444; /* Red */
        color: white;
        border: none;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .btn-popup-delete:hover {
        background-color: #dc2626; /* Darker red on hover */
      }
      /* --- END OF POPUP BUTTON STYLES --- */


      .toolbar { position: fixed; bottom: 20px; right: 12px; z-index: 10; display: flex; gap: 8px; }
      .btn { background:rgb(0, 85, 255); color:white; padding: 8px 12px; border-radius: 10px; cursor: pointer; border:none; }
      .btn.primary { background: #22c55e; color: #0b1220; }
      .btn:hover { filter: brightness(1.05); }

            .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 9;
      }

      .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        max-width: 100%;
        box-sizing: border-box;
        width: 550px;
        background: #0b1220;
        color: #e5e7eb;
        border-radius: 12px;
        padding: 12px;
      }
      .panel.history{
        top: 69%;
        left: 88%;
        width: 300px;
      }
      
      .panel-title { font-weight: 700; margin-bottom: 8px; font-size: 40px }
      .form { display: grid; gap: 10px; }
      .label { display: grid; gap: 6px; font-size: 12px; color: #cbd5e1; }
      .input {
        background: #0f172a;
        color: #e5e7eb;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 14px;
        width: 100%; /* full width */
        box-sizing: border-box;
      }

      .pin { width: 10px; height: 10px; border-radius: 50%; cursor:pointer; display: block;}
      .pin:hover { transform: scale(1.12); box-shadow: 0 0 0 3px rgba(22,163,74,0.35); }
      .pin.eonet-pin {
        width: 15px; 
        height: 15px;
        box-shadow: 0 0 0 3px rgba(0,0,0,0.25);
      }

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
      .res-rows {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .needs-rows {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
      }

      .needs-row {
        display: grid;
        grid-template-columns: 1fr auto; /* input + small button */
        gap: 6px;
        align-items: center;
      }

      .needs-input {
        background: #0f172a;
        color: #e5e7eb;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 14px;
        height: 36px;
        box-sizing: border-box;
        width: 100%;
      }

      .needs-row-actions .btn.small {
        height: 28px;
        padding: 2px 8px;
      }
        .resource-row-actions .btn.small {
        height: 28px;
        padding: 2px 8px;
      }

      .btn.small.add-need {
        width: 100%;
        text-align: center;
        margin-top: 4px;
        font-size: 14px
      }

      .res-row {
        display: flex;
        gap: 4px;
        flex-direction: column;
      }

      .res-name {
        width: 100%;
        box-sizing: border-box;
        background: #0f172a;
        color: #e5e7eb;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 14px;
        height: 36px; /* same height for name and status */
      }

      .res-status {
        width: 100%;
        box-sizing: border-box;
        background: #ffffff;
        color: #000000;
        border: 1px solid #000000;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 14px;
        height: 36px; /* same height for name and status */
      }
      .btn.small.add-resource,
      .btn.small.delete-resource {
        width: 100%;
        text-align: center;
        margin-top: 2px; /* less gap above buttons */
        margin-bottom: 2px; /* less gap below buttons */
        font-size: 14px
      }
      @keyframes blink {
        0%, 100% { opacity: 1.2; transform: scale(1) }
        50% { opacity: 0.4; transform: scale(1.2) }
      }

      .blinking {
        animation: blink 2s infinite;
      }`}</style>
    </>
  );
}
