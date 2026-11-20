"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitInquiryAction } from "@/app/actions/inquiry";
import type { ActionState } from "@/lib/types";

interface InquiryFormProps {
  productId: number;
  productTitle: string;
  available: boolean;
}

const INITIAL_STATE: ActionState = { status: "idle" };

export function InquiryForm({
  productId,
  productTitle,
  available,
}: InquiryFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitInquiryAction,
    INITIAL_STATE
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section
      aria-labelledby={`inquiry-heading-${productId}`}
      className="border border-line bg-canvas p-5 sm:p-6"
    >
      <div className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Direct Studio Inquiry
        </p>
        <h3
          id={`inquiry-heading-${productId}`}
          className="mt-1 text-base font-semibold tracking-tight text-ink"
        >
          Inquire About Product
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {available
            ? `Ask about lead times, specifications, or custom quotes for ${productTitle}.`
            : `${productTitle} is currently marked unavailable. Send an inquiry for restock timelines or custom fabrication.`}
        </p>
      </div>

      {state.status === "success" && (
        <div
          role="status"
          className="mb-4 border border-moss/35 bg-moss/10 px-4 py-3 text-sm text-moss"
        >
          <p className="font-medium">Inquiry sent</p>
          <p className="mt-0.5 text-xs opacity-90">{state.message}</p>
        </div>
      )}

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="mb-4 border border-danger/35 bg-danger/8 px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="productId" value={productId} />

        {/* Honeypot anti-spam field */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor={`company-website-${productId}`}>Website</label>
          <input
            id={`company-website-${productId}`}
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`inquiry-name-${productId}`}
              className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
            >
              Your Name <span className="text-accent">*</span>
            </label>
            <input
              id={`inquiry-name-${productId}`}
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Alex Rivera"
              className="mt-1.5 w-full border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
            />
            {state.fieldErrors?.name && (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor={`inquiry-email-${productId}`}
              className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
            >
              Customer Email <span className="text-accent">*</span>
            </label>
            <input
              id={`inquiry-email-${productId}`}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="alex@studio.com"
              className="mt-1.5 w-full border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
            />
            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor={`inquiry-message-${productId}`}
            className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
          >
            Message <span className="text-accent">*</span>
          </label>
          <textarea
            id={`inquiry-message-${productId}`}
            name="message"
            rows={4}
            required
            placeholder={`Hello — I would like details on quantity pricing and delivery timeline for ${productTitle}.`}
            className="mt-1.5 w-full resize-y border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
          />
          {state.fieldErrors?.message && (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.message}</p>
          )}
        </div>

        <button
          id={`inquiry-submit-${productId}`}
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 bg-ink px-5 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending Inquiry..." : "Send Product Inquiry"}
        </button>
      </form>
    </section>
  );
}
