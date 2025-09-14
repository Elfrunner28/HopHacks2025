const express = require("express");
const cors = require("cors");
const { sendEmail } = require("./smsAlert"); 
const { createClient } = require("@supabase/supabase-js");


const app = express();
app.use(cors());
app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Example API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Node.js backend!" });
});


app.post("/api/send-email", async (req, res) => {
  const { to, subject, message } = req.body;
  const result = await sendEmail(to, subject, message);
  res.json(result);
});


app.post("/check-state", async (req, res) => {
  const { state, userEmail } = req.body;

  if (!state) {
    return res.status(400).json({ error: "State is required" });
  }

  const { data, error } = await supabase
    .from("eonet_events") // replace with your table
    .select("state_name, title")
    .eq("state_name", state);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Database query failed" });
  }

  if(data.length > 0) {
    await sendEmail(userEmail, 'ALERT', 'RUN');
  }
  else {
    await sendEmail(userEmail, 'You are Safe', `${state} does not have any danger`);
  }

  return res.json({ exists: data});
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


