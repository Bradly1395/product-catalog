import nodemailer from "nodemailer";
import type { Product } from "./types";

export interface ProductInquiryPayload {
  product: Product;
  customerName: string;
  customerEmail: string;
  message: string;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const port = Number.parseInt(portRaw, 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureEnv === "true" ? true : secureEnv === "false" ? false : port === 465;

  if (!host || Number.isNaN(port)) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST and SMTP_PORT in your environment."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

export async function sendProductInquiryEmail(
  payload: ProductInquiryPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    throw new Error(
      "ADMIN_EMAIL is not configured. Set ADMIN_EMAIL in your environment."
    );
  }

  const storeName =
    process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Atelier Foundry";
  const fromAddress =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    `"${sanitizeHeaderValue(storeName)}" <no-reply@localhost>`;

  const safeName = sanitizeHeaderValue(payload.customerName);
  const safeEmail = sanitizeHeaderValue(payload.customerEmail);
  const safeProductTitle = sanitizeHeaderValue(payload.product.title);
  const availabilityLabel = payload.product.available
    ? "Available"
    : "Currently Unavailable";

  const subject = `[${sanitizeHeaderValue(storeName)}] Inquiry: ${safeProductTitle}`;

  const textBody = [
    `New product inquiry from ${storeName}`,
    ``,
    `Product:      ${payload.product.title}`,
    `Category:     ${payload.product.category}`,
    `Price/Quote:  ${payload.product.priceText}`,
    `Status:       ${availabilityLabel}`,
    ``,
    `Customer:     ${safeName}`,
    `Email:        ${safeEmail}`,
    ``,
    `Message:`,
    payload.message.trim(),
    ``,
    `---`,
    `Reply directly to this email to respond to ${safeName} (${safeEmail}).`,
  ].join("\n");

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #171716; max-width: 600px; margin: 0 auto; padding: 24px; background: #f7f5f0;">
      <div style="background: #fdfcfa; border: 1px solid #e4dfd5; padding: 28px;">
        <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #625f58;">
          ${escapeHtml(storeName)} · Product Inquiry
        </p>
        <h1 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #171716;">
          ${escapeHtml(payload.product.title)}
        </h1>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #625f58; width: 130px;">Category</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #171716;">${escapeHtml(payload.product.category)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #625f58;">Price / Quote</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #171716;">${escapeHtml(payload.product.priceText)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #625f58;">Availability</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #171716;">${escapeHtml(availabilityLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #625f58;">From</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #ece8e0; color: #171716;">
              ${escapeHtml(safeName)} &lt;<a href="mailto:${escapeHtml(safeEmail)}" style="color: #b84a27;">${escapeHtml(safeEmail)}</a>&gt;
            </td>
          </tr>
        </table>

        <div style="background: #f7f5f0; border-left: 3px solid #b84a27; padding: 14px 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #625f58;">Customer Message</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(payload.message.trim())}</p>
        </div>

        <p style="margin: 0; font-size: 12px; color: #625f58;">
          Reply directly to this email to reach ${escapeHtml(safeName)} at ${escapeHtml(safeEmail)}.
        </p>
      </div>
    </div>
  `.trim();

  const transporter = createTransporter();

  await transporter.sendMail({
    from: fromAddress,
    to: adminEmail,
    replyTo: `"${safeName.replace(/"/g, "")}" <${safeEmail}>`,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
