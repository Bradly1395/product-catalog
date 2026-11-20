"use server";

import { getProductById } from "@/lib/db";
import { sendProductInquiryEmail } from "@/lib/mailer";
import type { ActionState } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Basic bot honeypot field (should remain empty for human users)
  const honeypot = String(formData.get("companyWebsite") ?? "").trim();
  if (honeypot) {
    return {
      status: "success",
      message: "Your inquiry has been sent. We will reply shortly.",
    };
  }

  const productId = Number.parseInt(String(formData.get("productId") ?? ""), 10);
  const customerName = String(formData.get("name") ?? "").trim();
  const customerEmail = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (Number.isNaN(productId) || productId <= 0) {
    return { status: "error", message: "Invalid product reference." };
  }

  if (customerName.length < 2) {
    fieldErrors.name = "Please enter your name.";
  } else if (customerName.length > 100) {
    fieldErrors.name = "Name must be 100 characters or fewer.";
  }

  if (!EMAIL_RE.test(customerEmail) || customerEmail.length > 180) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (message.length < 10) {
    fieldErrors.message = "Please include a short message (at least 10 characters).";
  } else if (message.length > 3000) {
    fieldErrors.message = "Message must be 3,000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please check the form fields below.",
      fieldErrors,
    };
  }

  const product = getProductById(productId);
  if (!product) {
    return {
      status: "error",
      message: "This product is no longer listed in the catalog.",
    };
  }

  try {
    await sendProductInquiryEmail({
      product,
      customerName,
      customerEmail,
      message,
    });

    return {
      status: "success",
      message: `Inquiry sent for "${product.title}". Replies will go directly to ${customerEmail}.`,
    };
  } catch (error) {
    console.error("Failed to send product inquiry email:", error);
    return {
      status: "error",
      message:
        "Unable to deliver inquiry email right now. Please verify SMTP settings or try again shortly.",
    };
  }
}
