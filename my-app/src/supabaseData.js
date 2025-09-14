import { supabase } from "./supabaseClient"; // adjust path if needed

// Fetch all disasters in batches
export async function fetchAllDisasters(batchSize = 1000) {
  let allData = [];
  let from = 0;
  let fetched = 0;

  do {
    const { data, error } = await supabase
      .from("disasters")
      .select("*")
      .range(from, from + batchSize - 1);

    if (error) {
      console.error("Error fetching disasters:", error);
      break;
    }

    const pins = data
      .map((d) => {
        if (!d.affected_area) return null;
        return {
          id: d.id,
          name: d.name,
          disaster_type: d.disaster_type,
          start_date: d.start_date,
          resources: [],
          longitude: parseFloat(d.affected_area[0]),
          latitude: parseFloat(d.affected_area[1]),
          type: "history",
        };
      })
      .filter(Boolean);

    allData = allData.concat(pins);
    fetched = data.length;
    from += batchSize;
  } while (fetched === batchSize);

  console.log(`Fetched total disasters: ${allData.length}`);
  return allData;
}


// Fetch live EONET events
export async function fetchEonetEvents() {
  const { data, error } = await supabase
    .from("eonet_events")
    .select("eonet_id, title, geometry");

  if (error) throw error;

  return data.map((event) => {
    if (!event.geometry || !Array.isArray(event.geometry) || event.geometry.length < 2) return null;
    return {
      id: event.eonet_id,
      name: event.title,
      resources: [],
      longitude: parseFloat(event.geometry[0]),
      latitude: parseFloat(event.geometry[1]),
      type: "eonet",
    };
  }).filter(Boolean);
}

// Function to fetch centers and their resources
export async function fetchCenters() {
  try {
    const { data: centers, error } = await supabase
      .from("centers")
      .select("id, name, location, created_at, resources");

    if (error) throw error;

    // Format data (unpack location JSON into lng/lat)
    const formattedCenters = centers.map(center => {
      const [lng, lat] = center.location || [];
      console.log(lng, lat);
      console.log(center.resources);
      return {
        id: center.id,
        name: center.name,
        created_at: center.created_at,
        longitude: lng,
        latitude: lat,
        resources: center.resources,
      };
    });

    return formattedCenters;
  } catch (err) {
    console.error("Error fetching centers:", err.message);
    return [];
  }
}
