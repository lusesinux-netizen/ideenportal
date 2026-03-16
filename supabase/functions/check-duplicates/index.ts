import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, problem } = await req.json();
    if (!title || title.trim().length < 5) {
      return new Response(JSON.stringify({ duplicates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent suggestions (last 12 months per business rule)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: existing } = await supabase
      .from("suggestions")
      .select("id, title, problem_description, category, status")
      .gte("created_at", twelveMonthsAgo.toISOString())
      .limit(100);

    if (!existing || existing.length === 0) {
      return new Response(JSON.stringify({ duplicates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact list for the AI
    const existingList = existing
      .map((s, i) => `[${i}] "${s.title}" — ${s.problem_description.slice(0, 120)}`)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Du bist ein Experte für die Erkennung inhaltlich ähnlicher Verbesserungsvorschläge. Vergleiche den neuen Vorschlag mit der Liste bestehender Vorschläge. Identifiziere semantisch ähnliche Vorschläge – auch bei unterschiedlichem Wortlaut. Berücksichtige Thema, Problem und Lösungsansatz.`,
            },
            {
              role: "user",
              content: `Neuer Vorschlag:
Titel: "${title}"
${problem ? `Problem: "${problem}"` : ""}

Bestehende Vorschläge:
${existingList}

Welche der bestehenden Vorschläge sind inhaltlich ähnlich zum neuen Vorschlag? Antworte NUR mit den Index-Nummern der ähnlichen Vorschläge als JSON-Array, z.B. [0, 3, 5]. Wenn keine ähnlich sind, antworte mit [].`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_similar",
                description:
                  "Report indices of semantically similar suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    similar_indices: {
                      type: "array",
                      items: { type: "integer" },
                      description:
                        "Array of indices from the existing suggestions list that are semantically similar",
                    },
                  },
                  required: ["similar_indices"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "report_similar" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later.", duplicates: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required.", duplicates: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify({ duplicates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    let indices: number[] = [];

    // Extract from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        indices = parsed.similar_indices || [];
      } catch {
        indices = [];
      }
    }

    // Map indices back to suggestion data
    const duplicates = indices
      .filter((i) => i >= 0 && i < existing.length)
      .slice(0, 5)
      .map((i) => ({
        id: existing[i].id,
        title: existing[i].title,
        status: existing[i].status,
        category: existing[i].category,
      }));

    return new Response(JSON.stringify({ duplicates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-duplicates error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        duplicates: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
