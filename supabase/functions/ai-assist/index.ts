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
    const { action, ...params } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiCall = async (messages: any[], tools?: any[], tool_choice?: any) => {
      const body: any = {
        model: "google/gemini-3-flash-preview",
        messages,
        stream: false,
      };
      if (tools) body.tools = tools;
      if (tool_choice) body.tool_choice = tool_choice;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          return { error: "Rate limit exceeded", status: 429 };
        }
        if (resp.status === 402) {
          return { error: "Payment required", status: 402 };
        }
        const t = await resp.text();
        console.error("AI gateway error:", resp.status, t);
        return { error: "AI gateway error", status: 500 };
      }
      return await resp.json();
    };

    let result: any;

    switch (action) {
      case "improve_text": {
        const { field, text, context } = params;
        const fieldLabels: Record<string, string> = {
          problem: "Problembeschreibung",
          solution: "Lösungsbeschreibung",
          benefit: "Erwarteter Nutzen",
          feasibility: "Realisierbarkeit",
        };
        const label = fieldLabels[field] || field;

        const aiResult = await aiCall([
          {
            role: "system",
            content: `Du bist ein Experte für Verbesserungsvorschläge bei der Handwerkskammer Berlin. Hilf beim Verfassen und Verbessern von Vorschlagstexten. Antworte IMMER auf Deutsch. Sei präzise, sachlich und professionell. Behalte die Kernaussage bei, verbessere aber Klarheit, Struktur und Überzeugungskraft.`,
          },
          {
            role: "user",
            content: `Verbessere den folgenden Text für das Feld "${label}" eines Verbesserungsvorschlags.${context ? `\n\nKontext des Vorschlags:\nTitel: ${context.title}\nKategorie: ${context.category}` : ""}

Aktueller Text:
"${text}"

Gib NUR den verbesserten Text zurück, ohne Erklärungen oder Anführungszeichen.`,
          },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { improved_text: aiResult.choices?.[0]?.message?.content?.trim() || text };
        break;
      }

      case "jury_assessment": {
        const { suggestion } = params;

        const aiResult = await aiCall(
          [
            {
              role: "system",
              content: `Du bist ein Experte für die Bewertung von Verbesserungsvorschlägen bei der Handwerkskammer Berlin. Analysiere den Vorschlag und gib eine strukturierte Einschätzung. Antworte IMMER auf Deutsch.`,
            },
            {
              role: "user",
              content: `Bewerte diesen Verbesserungsvorschlag:

Titel: ${suggestion.title}
Kategorie: ${suggestion.category}
Bereich: ${suggestion.scope}
Problem: ${suggestion.problem_description}
Lösung: ${suggestion.solution_description}
Nutzen: ${suggestion.expected_benefit}
Realisierbarkeit: ${suggestion.feasibility}
${suggestion.estimated_savings ? `Geschätzte Einsparungen: ${suggestion.estimated_savings}` : ""}

Gib eine Bewertung ab.`,
            },
          ],
          [
            {
              type: "function",
              function: {
                name: "jury_assessment",
                description: "Strukturierte Jury-Bewertung eines Vorschlags",
                parameters: {
                  type: "object",
                  properties: {
                    feasibility_score: {
                      type: "string",
                      enum: ["hoch", "mittel", "niedrig"],
                      description: "Einschätzung der Machbarkeit",
                    },
                    benefit_score: {
                      type: "string",
                      enum: ["hoch", "mittel", "niedrig"],
                      description: "Einschätzung des Nutzens",
                    },
                    suggested_premium_class: {
                      type: "integer",
                      enum: [1, 2, 3, 4],
                      description: "Vorgeschlagene Prämienklasse (1=Arbeitsplatz, 2=Abteilung, 3=Organisation, 4=Individuell)",
                    },
                    strengths: {
                      type: "array",
                      items: { type: "string" },
                      description: "Stärken des Vorschlags",
                    },
                    weaknesses: {
                      type: "array",
                      items: { type: "string" },
                      description: "Schwächen/Risiken des Vorschlags",
                    },
                    recommendation: {
                      type: "string",
                      enum: ["annehmen", "ablehnen", "ueberarbeiten"],
                      description: "Empfehlung",
                    },
                    comment_draft: {
                      type: "string",
                      description: "Entwurf für den Jury-Kommentar",
                    },
                  },
                  required: [
                    "feasibility_score",
                    "benefit_score",
                    "suggested_premium_class",
                    "strengths",
                    "weaknesses",
                    "recommendation",
                    "comment_draft",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          { type: "function", function: { name: "jury_assessment" } }
        );

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            result = { assessment: JSON.parse(toolCall.function.arguments) };
          } catch {
            result = { error: "Failed to parse AI response" };
          }
        } else {
          result = { error: "No assessment generated" };
        }
        break;
      }

      case "improve_protocol_notes": {
        const { text, context } = params;
        const aiResult = await aiCall([
          {
            role: "system",
            content: `Du bist Protokollführer der Jury für Verbesserungsvorschläge bei der Handwerkskammer Berlin. Du formulierst vertrauliche Beratungsnotizen einer Jury-Sitzung präzise, sachlich und neutral. Behalte alle inhaltlichen Aussagen, verbessere aber Struktur, Klarheit und Wortwahl. Verwende eine sachliche Protokollsprache (z.B. "Die Jury erörterte..."). Antworte IMMER auf Deutsch und gib NUR den verbesserten Text zurück, ohne Erklärungen oder Anführungszeichen.`,
          },
          {
            role: "user",
            content: `Verbessere folgende Beratungsnotizen einer Jury-Sitzung${context?.meeting_date ? ` vom ${context.meeting_date}` : ""}:

"${text}"`,
          },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = { improved_text: aiResult.choices?.[0]?.message?.content?.trim() || text };
        break;
      }

      case "improve_decisions": {
        const { text, context } = params;
        const aiResult = await aiCall([
          {
            role: "system",
            content: `Du bist Protokollführer der Jury für Verbesserungsvorschläge bei der Handwerkskammer Berlin. Du formulierst Beschlüsse einer Jury-Sitzung in klarer, eindeutiger und rechtssicherer Sprache. Jeder Beschluss steht in einer eigenen Zeile, beginnt mit einem Verb (z.B. "Annimmt...", "Lehnt ab...", "Vertagt..."). Behalte alle Inhalte, optimiere Klarheit und Präzision. Antworte IMMER auf Deutsch und gib NUR die verbesserten Beschlüsse zurück (eine Zeile pro Beschluss, ohne Nummerierung, ohne Erklärungen).`,
          },
          {
            role: "user",
            content: `Verbessere folgende Beschlüsse einer Jury-Sitzung${context?.meeting_date ? ` vom ${context.meeting_date}` : ""}:

"${text}"`,
          },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = { improved_text: aiResult.choices?.[0]?.message?.content?.trim() || text };
        break;
      }

      case "draft_decisions_from_notes": {
        const { notes, context } = params;
        if (!notes?.trim()) {
          return new Response(JSON.stringify({ error: "Keine Beratungsnotizen vorhanden" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const aiResult = await aiCall(
          [
            {
              role: "system",
              content: `Du extrahierst aus Beratungsnotizen einer Jury-Sitzung der Handwerkskammer Berlin die konkreten Beschlüsse. Formuliere jeden Beschluss klar, kurz und eindeutig in einer Zeile. Beginne mit einem Verb (z.B. "Nimmt an...", "Lehnt ab...", "Vertagt..."). Antworte auf Deutsch.`,
            },
            {
              role: "user",
              content: `Leite aus folgenden Beratungsnotizen${context?.meeting_date ? ` (Sitzung vom ${context.meeting_date})` : ""} die Beschlüsse ab:

"${notes}"`,
            },
          ],
          [
            {
              type: "function",
              function: {
                name: "draft_decisions",
                description: "Liste der formulierten Beschlüsse",
                parameters: {
                  type: "object",
                  properties: {
                    decisions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Ein Beschluss pro Eintrag, klar und prägnant formuliert",
                    },
                  },
                  required: ["decisions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          { type: "function", function: { name: "draft_decisions" } }
        );

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            result = { decisions: parsed.decisions || [] };
          } catch {
            result = { error: "Failed to parse AI response" };
          }
        } else {
          result = { error: "No decisions generated" };
        }
        break;
      }

      case "summarize": {
        const { suggestion } = params;

        const aiResult = await aiCall([
          {
            role: "system",
            content: `Du fasst Verbesserungsvorschläge in einem kurzen Satz zusammen (max. 120 Zeichen). Antworte NUR mit der Zusammenfassung, auf Deutsch.`,
          },
          {
            role: "user",
            content: `Fasse zusammen:\nTitel: ${suggestion.title}\nProblem: ${suggestion.problem_description}\nLösung: ${suggestion.solution_description}`,
          },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), {
            status: aiResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { summary: aiResult.choices?.[0]?.message?.content?.trim() || "" };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
