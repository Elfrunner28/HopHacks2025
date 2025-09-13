    // src/authHelpers.js
import { supabase } from "./supabaseClient";

export async function logout() {
  await supabase.auth.signOut();
}
