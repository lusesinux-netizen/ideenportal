import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { type, suggestion_id } = await req.json();

    // Fetch suggestion with submitter email
    const { data: suggestion, error: sugError } = await supabase
      .from('suggestions')
      .select('*, profiles!suggestions_submitted_by_fkey(email, display_name)')
      .eq('id', suggestion_id)
      .single();

    if (sugError || !suggestion) {
      throw new Error(`Suggestion not found: ${sugError?.message}`);
    }

    // Log the notification event (email sending will be activated when a domain is configured)
    console.log(`[Notification] Type: ${type}, Suggestion: ${suggestion.title}, User: ${suggestion.submitted_by}`);

    // Check for overdue suggestions (42-day rule)
    if (type === 'check_overdue') {
      const { data: overdue } = await supabase
        .from('suggestions')
        .select('id, title, submitted_by, review_started_at, created_at')
        .in('status', ['eingereicht', 'in_pruefung']);

      const now = Date.now();
      for (const s of (overdue || [])) {
        const reviewDate = s.review_started_at || s.created_at;
        const daysSince = Math.floor((now - new Date(reviewDate).getTime()) / 86400000);
        
        if (daysSince > 42) {
          // Create interim notice notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: s.submitted_by,
              suggestion_id: s.id,
              type: 'interim_notice',
              title: 'Zwischenbescheid: ' + s.title,
              message: `Ihr Vorschlag "${s.title}" befindet sich seit ${daysSince} Tagen in Bearbeitung. Gemäß §5.3 erhalten Sie hiermit einen Zwischenbescheid.`,
            });
          if (notifError) console.error('Notification insert error:', notifError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
