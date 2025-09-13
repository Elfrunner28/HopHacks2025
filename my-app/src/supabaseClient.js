
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://fffgsgdyduarnpefbofg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdzZ2R5ZHVhcm5wZWZib2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTAxMjcsImV4cCI6MjA3MzMyNjEyN30.nRn-O63lvAanEmMnF2mtOl7p0INcVgXR8n8S6fTk_BY"
);