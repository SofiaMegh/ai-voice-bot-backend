import pkg from "@supabase/supabase-js";
const { createClient } = pkg;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Load LTM for a session
export async function loadLongTermMemory(sessionId) {
  const { data, error } = await supabase
    .from("long_term_memory")
    .select("facts")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return {};

  return data.facts || {};
}

// Save merged facts
export async function saveLongTermMemory(sessionId, newFacts) {
  // first load current facts
  const current = await loadLongTermMemory(sessionId);

  const updatedFacts = { ...current, ...newFacts };

  const { error } = await supabase
    .from("long_term_memory")
    .upsert({
      session_id: sessionId,
      facts: updatedFacts
    });

  if (error) console.error("LTM Save Error:", error);

  return updatedFacts;
}
