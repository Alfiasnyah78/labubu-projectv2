import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting using in-memory storage (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX = 10; // Max 10 emails per hour per IP

// HTML escape function to prevent XSS/injection attacks
function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\+\(\)]{6,20}$/;
  return phoneRegex.test(phone);
}

function validateLength(value: string | undefined | null, maxLength: number): boolean {
  if (!value) return true;
  return value.length <= maxLength;
}

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface ContactFormRequest {
  type: "contact";
  name: string;
  email: string;
  phone: string;
  company?: string;
  service: string;
  message?: string;
  landSize?: string;
  adminEmail?: string;
}

interface StatusUpdateRequest {
  type: "status_update";
  name: string;
  email: string;
  service: string;
  oldStatus: string;
  newStatus: string;
}

interface WelcomeEmailRequest {
  type: "welcome";
  name: string;
  email: string;
}

type RequestBody = EmailRequest | ContactFormRequest | StatusUpdateRequest | WelcomeEmailRequest;

// Sanitize contact form data
function sanitizeContactData(data: ContactFormRequest): ContactFormRequest {
  return {
    ...data,
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    phone: escapeHtml(data.phone),
    company: data.company ? escapeHtml(data.company) : undefined,
    service: escapeHtml(data.service),
    message: data.message ? escapeHtml(data.message) : undefined,
    landSize: data.landSize ? escapeHtml(data.landSize) : undefined,
    adminEmail: data.adminEmail ? escapeHtml(data.adminEmail) : undefined,
  };
}

// Sanitize status update data
function sanitizeStatusData(data: StatusUpdateRequest): StatusUpdateRequest {
  return {
    ...data,
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    service: escapeHtml(data.service),
    oldStatus: escapeHtml(data.oldStatus),
    newStatus: escapeHtml(data.newStatus),
  };
}

// Sanitize welcome email data
function sanitizeWelcomeData(data: WelcomeEmailRequest): WelcomeEmailRequest {
  return {
    ...data,
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
  };
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  
  // Clean up old entries
  if (record && now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.delete(clientIp);
  }
  
  const currentRecord = rateLimitMap.get(clientIp);
  
  if (!currentRecord) {
    rateLimitMap.set(clientIp, { count: 1, timestamp: now });
    return true;
  }
  
  if (currentRecord.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  currentRecord.count++;
  return true;
}

async function sendEmailWithResend(emailData: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailData),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await res.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Email function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    console.log(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const body: RequestBody = await req.json();
    console.log("Request type:", "type" in body ? body.type : "generic");

    let emailData: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      reply_to?: string;
    };

    // Determine email type and build email data
    if ("type" in body) {
      switch (body.type) {
        case "contact": {
          // Validate required fields
          if (!body.name || !body.email || !body.phone || !body.service) {
            throw new Error("Missing required fields: name, email, phone, service");
          }

          // Validate email format
          if (!isValidEmail(body.email)) {
            throw new Error("Invalid email format");
          }

          // Validate phone format
          if (!isValidPhone(body.phone)) {
            throw new Error("Invalid phone format");
          }

          // Validate length limits
          if (!validateLength(body.name, 200)) {
            throw new Error("Name too long (max 200 characters)");
          }
          if (!validateLength(body.company, 200)) {
            throw new Error("Company name too long (max 200 characters)");
          }
          if (!validateLength(body.message, 5000)) {
            throw new Error("Message too long (max 5000 characters)");
          }
          if (!validateLength(body.service, 100)) {
            throw new Error("Service name too long (max 100 characters)");
          }
          if (!validateLength(body.landSize, 100)) {
            throw new Error("Land size too long (max 100 characters)");
          }

          // Sanitize all input data
          const sanitizedData = sanitizeContactData(body);

          // Send confirmation to customer
          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email, // Use original email for sending
            subject: `Terima Kasih atas Pengajuan Anda - ${sanitizedData.service}`,
            html: generateContactConfirmationEmail(sanitizedData),
          };

          // Also send notification to admin if adminEmail is provided
          if (body.adminEmail && isValidEmail(body.adminEmail)) {
            try {
              await sendEmailWithResend({
                from: "AlmondSense <onboarding@resend.dev>",
                to: body.adminEmail,
                subject: `[Pengajuan Baru] ${sanitizedData.service} - ${sanitizedData.name}`,
                html: generateAdminNotificationEmail(sanitizedData),
              });
              console.log("Admin notification email sent");
            } catch (adminError) {
              console.error("Failed to send admin notification:", adminError);
              // Don't fail the whole request if admin email fails
            }
          }
          break;
        }

        case "status_update": {
          // Validate required fields
          if (!body.name || !body.email || !body.service || !body.newStatus) {
            throw new Error("Missing required fields for status update");
          }

          // Validate email format
          if (!isValidEmail(body.email)) {
            throw new Error("Invalid email format");
          }

          // Validate length limits
          if (!validateLength(body.name, 200)) {
            throw new Error("Name too long (max 200 characters)");
          }

          // Sanitize data
          const sanitizedStatusData = sanitizeStatusData(body);

          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email,
            subject: `Update Status Pengajuan - ${sanitizedStatusData.service}`,
            html: generateStatusUpdateEmail(sanitizedStatusData),
          };
          break;
        }

        case "welcome": {
          // Validate required fields
          if (!body.name || !body.email) {
            throw new Error("Missing required fields for welcome email");
          }

          // Validate email format
          if (!isValidEmail(body.email)) {
            throw new Error("Invalid email format");
          }

          // Validate length limits
          if (!validateLength(body.name, 200)) {
            throw new Error("Name too long (max 200 characters)");
          }

          // Sanitize data
          const sanitizedWelcomeData = sanitizeWelcomeData(body);

          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email,
            subject: "Selamat Datang di AlmondSense",
            html: generateWelcomeEmail(sanitizedWelcomeData),
          };
          break;
        }

        default:
          throw new Error("Invalid email type");
      }
    } else {
      // Generic email - requires authentication for security
      // For now, just validate the inputs
      if (!body.to || !body.subject) {
        throw new Error("Missing required fields: to, subject");
      }

      const toEmails = Array.isArray(body.to) ? body.to : [body.to];
      for (const email of toEmails) {
        if (!isValidEmail(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }

      emailData = {
        from: body.from || "AlmondSense <onboarding@resend.dev>",
        to: body.to,
        subject: escapeHtml(body.subject),
        html: body.html || escapeHtml(body.text) || "",
        reply_to: body.replyTo,
      };
    }

    console.log("Sending email to:", Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to);

    const emailResponse = await sendEmailWithResend(emailData);

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email function:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateAdminNotificationEmail(data: ContactFormRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengajuan Baru</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-align: center;">🔔 Pengajuan Baru Masuk!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 20px; margin-bottom: 20px; border-radius: 0 4px 4px 0;">
                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">📋 Detail Pengajuan:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; width: 140px; font-weight: bold;">Nama:</td>
                    <td style="padding: 8px 0; color: #333;">${data.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">${data.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Telepon:</td>
                    <td style="padding: 8px 0; color: #333;">${data.phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Layanan:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.service}</td>
                  </tr>
                  ${data.company ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Perusahaan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.company}</td>
                  </tr>
                  ` : ''}
                  ${data.landSize ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Luas Lahan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.landSize}</td>
                  </tr>
                  ` : ''}
                  ${data.message ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">Pesan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.message}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
                Silakan tindak lanjuti pengajuan ini secepatnya.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                Email ini dikirim otomatis dari sistem AlmondSense.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateContactConfirmationEmail(data: ContactFormRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pengajuan</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-align: center;">AlmondSense</h1>
              <p style="color: #c8e6c9; margin: 10px 0 0 0; text-align: center; font-size: 14px;">Pertanian Digital Cerdas</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a5f2a; margin: 0 0 20px 0; font-size: 20px;">Halo, ${data.name}! 👋</h2>
              
              <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                Terima kasih telah menghubungi kami. Kami telah menerima pengajuan Anda dan tim kami akan segera menindaklanjuti.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #1a5f2a; padding: 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <h3 style="color: #1a5f2a; margin: 0 0 15px 0; font-size: 16px;">📋 Detail Pengajuan:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; width: 140px;">Layanan:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 500;">${data.service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">No. Telepon:</td>
                    <td style="padding: 8px 0; color: #333;">${data.phone}</td>
                  </tr>
                  ${data.company ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Perusahaan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.company}</td>
                  </tr>
                  ` : ''}
                  ${data.landSize ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Luas Lahan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.landSize}</td>
                  </tr>
                  ` : ''}
                  ${data.message ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; vertical-align: top;">Pesan:</td>
                    <td style="padding: 8px 0; color: #333;">${data.message}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                  <strong>⏱️ Estimasi Waktu:</strong> Tim kami akan menghubungi Anda dalam 1x24 jam kerja.
                </p>
              </div>
              
              <p style="color: #333; line-height: 1.6; margin: 20px 0 0 0;">
                Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <table style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                      📧 info@berkahjaya.com | 📞 (021) 1234-5678
                    </p>
                    <p style="color: #999; margin: 0; font-size: 12px;">
                      © 2024 PT Berkah Jaya Kontraktor. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateStatusUpdateEmail(data: StatusUpdateRequest): string {
  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "Menunggu", color: "#f59e0b", icon: "⏳" },
    negosiasi: { label: "Negosiasi", color: "#3b82f6", icon: "💬" },
    success: { label: "Berhasil", color: "#10b981", icon: "✅" },
  };

  const newStatusInfo = statusLabels[data.newStatus] || { label: data.newStatus, color: "#666", icon: "📋" };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update Status</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-align: center;">PT Berkah Jaya Kontraktor</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Halo, ${data.name}!</h2>
              
              <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                Status pengajuan layanan <strong>${data.service}</strong> Anda telah diperbarui.
              </p>
              
              <div style="text-align: center; padding: 30px 0;">
                <div style="display: inline-block; background-color: ${newStatusInfo.color}20; padding: 20px 40px; border-radius: 8px; border: 2px solid ${newStatusInfo.color};">
                  <span style="font-size: 32px;">${newStatusInfo.icon}</span>
                  <p style="color: ${newStatusInfo.color}; font-size: 18px; font-weight: 600; margin: 10px 0 0 0;">
                    Status: ${newStatusInfo.label}
                  </p>
                </div>
              </div>
              
              ${data.newStatus === 'success' ? `
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
                <p style="color: #2e7d32; margin: 0; font-size: 16px;">
                  🎉 Selamat! Pengajuan Anda telah berhasil diproses.
                </p>
              </div>
              ` : ''}
              
              ${data.newStatus === 'negosiasi' ? `
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #1565c0; margin: 0; font-size: 14px;">
                  💼 Tim kami akan segera menghubungi Anda untuk proses negosiasi lebih lanjut.
                </p>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 0; font-size: 14px; text-align: center;">
                📧 info@berkahjaya.com | 📞 (021) 1234-5678
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateWelcomeEmail(data: WelcomeEmailRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Selamat Datang!</h1>
              <p style="color: #c8e6c9; margin: 15px 0 0 0; font-size: 16px;">PT Berkah Jaya Kontraktor</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Halo, ${data.name}! 👋</h2>
              
              <p style="color: #333; line-height: 1.8; margin: 0 0 20px 0; font-size: 16px;">
                Terima kasih telah bergabung dengan PT Berkah Jaya Kontraktor. Kami sangat senang Anda mempercayakan kebutuhan konstruksi Anda kepada kami.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1a5f2a; margin: 0 0 15px 0; font-size: 16px;">🏗️ Layanan Kami:</h3>
                <ul style="color: #555; line-height: 2; margin: 0; padding-left: 20px;">
                  <li>Pematangan Lahan &amp; Land Clearing</li>
                  <li>Galian Tanah &amp; Urugan</li>
                  <li>Pembangunan Jalan &amp; Drainase</li>
                  <li>Konstruksi Bangunan Komersial</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background-color: #1a5f2a; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Mulai Konsultasi
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                📧 info@berkahjaya.com | 📞 (021) 1234-5678
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                © 2024 PT Berkah Jaya Kontraktor. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(handler);
