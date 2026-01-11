import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  adminEmail?: string; // Email admin untuk notifikasi
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

  try {
    const body: RequestBody = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

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
        case "contact":
          // Send confirmation to customer
          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email,
            subject: `Terima Kasih atas Pengajuan Anda - ${body.service}`,
            html: generateContactConfirmationEmail(body),
          };

          // Also send notification to admin if adminEmail is provided
          if (body.adminEmail) {
            try {
              await sendEmailWithResend({
                from: "AlmondSense <onboarding@resend.dev>",
                to: body.adminEmail,
                subject: `[Pengajuan Baru] ${body.service} - ${body.name}`,
                html: generateAdminNotificationEmail(body),
              });
              console.log("Admin notification email sent to:", body.adminEmail);
            } catch (adminError) {
              console.error("Failed to send admin notification:", adminError);
              // Don't fail the whole request if admin email fails
            }
          }
          break;

        case "status_update":
          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email,
            subject: `Update Status Pengajuan - ${body.service}`,
            html: generateStatusUpdateEmail(body),
          };
          break;

        case "welcome":
          emailData = {
            from: "AlmondSense <onboarding@resend.dev>",
            to: body.email,
            subject: "Selamat Datang di AlmondSense",
            html: generateWelcomeEmail(body),
          };
          break;

        default:
          throw new Error("Invalid email type");
      }
    } else {
      // Generic email
      emailData = {
        from: body.from || "AlmondSense <onboarding@resend.dev>",
        to: body.to,
        subject: body.subject,
        html: body.html || body.text || "",
        reply_to: body.replyTo,
      };
    }

    console.log("Sending email to:", emailData.to);

    const emailResponse = await sendEmailWithResend(emailData);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
                    <td style="padding: 8px 0; color: #333;"><a href="mailto:${data.email}">${data.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Telepon:</td>
                    <td style="padding: 8px 0; color: #333;"><a href="tel:${data.phone}">${data.phone}</a></td>
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
                  <li>Pematangan Lahan & Land Clearing</li>
                  <li>Galian Tanah & Urugan</li>
                  <li>Pembangunan Jalan & Drainase</li>
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
