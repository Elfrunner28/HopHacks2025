const path = require("path");
const express = require("express");
const { sendEmail } = require("./smsAlert");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const { getGPTResponse } = require("./gpt.js");

const app = express();
app.use(cors());
app.use(express.json());
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
  const { state, userEmail, name } = req.body;

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

  if (data.length > 0) {
    const prompt = `
You are an assistant that writes alert emails about natural disasters.
Here is the data of ongoing natural disasters for a user:

${JSON.stringify(data, null, 2)}

For each disaster, summarize it in a few lines, tell the user which direction to move to stay safe, and give practical tips. 
Then, create an email to the user with username : ${name} subject and body. 
Return the subject and email body in this format:

Subject: <subject>
Body: <email text>
`;

    const gptResult = await getGPTResponse(prompt);

    // Extract subject and body from GPT output
    // Assuming GPT returns exactly in "Subject: ...\nBody: ..." format
    const [subjectLine, ...bodyLines] = gptResult.split("\n");
    const subject = subjectLine.replace("Subject:", "").trim();
    const body = bodyLines.join("\n").replace("Body:", "").trim();

    await sendEmail(userEmail, subject, body);
  } else {
    const prompt = `
Write an email to a user with user name : ${name} whose state "${state}" is currently safe from natural disasters. 
Include reassurance, mention that the user will be notified if any disaster occurs in the future, 
and recommend checking the SafeZone website for more info. 
Create a subject line and email body. 
Return in this format:

Subject: <subject>
Body: <email text>
      `;
    const gptResult = await getGPTResponse(prompt);

    const [subjectLine, ...bodyLines] = gptResult.split("\n");
    const subject = subjectLine.replace("Subject:", "").trim();
    const body = bodyLines.join("\n").replace("Body:", "").trim();

    await sendEmail(userEmail, subject, body);
  }

  return res.json({ exists: data });
});


app.post("/gpt", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await getGPTResponse(prompt);
    res.json({ response });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Failed to get GPT response" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Serve React frontend (Vite build)
app.use(express.static(path.join(__dirname, "../dist")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});