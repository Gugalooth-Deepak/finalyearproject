import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Parse request body
    const { eventId, userId, type } = await req.json();

    if (!eventId || !userId || !type) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: eventId, userId, or type",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get event data
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("title, event_date, location, description")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format date
    const eventDate = new Date(eventData.event_date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Prepare email content based on type
    let subject, content;

    if (type === "registration") {
      subject = `Registration Confirmation: ${eventData.title}`;
      content = `
        <h2>Thank you for registering, ${userData.full_name}!</h2>
        <p>You have successfully registered for <strong>${eventData.title}</strong>.</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
        <p>We look forward to seeing you there!</p>
      `;
    } else if (type === "reminder") {
      subject = `Reminder: ${eventData.title} is Tomorrow`;
      content = `
        <h2>Event Reminder</h2>
        <p>Hello ${userData.full_name},</p>
        <p>This is a friendly reminder that <strong>${eventData.title}</strong> is happening tomorrow.</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
        <p>We look forward to seeing you there!</p>
      `;
    } else if (type === "cancellation") {
      subject = `Registration Cancelled: ${eventData.title}`;
      content = `
        <h2>Registration Cancelled</h2>
        <p>Hello ${userData.full_name},</p>
        <p>Your registration for <strong>${eventData.title}</strong> has been cancelled as requested.</p>
        <p>If this was a mistake, you can register again if seats are still available.</p>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In a real application, we would send an actual email here
    // For now, we'll just log the email information and return success
    console.log({
      to: userData.email,
      subject,
      content,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${type} would be sent to ${userData.email}` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});