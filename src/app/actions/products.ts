"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  createProduct,
  deleteProduct,
  getProductById,
  toggleProductAvailability,
  updateProduct,
} from "@/lib/db";
import type { ActionState, ProductSpec } from "@/lib/types";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";

function parseSpecsFromForm(raw: FormDataEntryValue | null): ProductSpec[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 20)
      .filter(
        (entry): entry is ProductSpec =>
          Boolean(entry) &&
          typeof entry.label === "string" &&
          typeof entry.value === "string" &&
          entry.label.trim().length > 0 &&
          entry.value.trim().length > 0
      )
      .map((entry) => ({
        label: entry.label.trim().slice(0, 80),
        value: entry.value.trim().slice(0, 200),
      }));
  } catch {
    return [];
  }
}

export async function saveProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return {
      status: "error",
      message: "Your admin session has expired. Please sign in again.",
    };
  }

  const rawId = formData.get("id");
  const parsedId =
    typeof rawId === "string" && rawId.trim() !== ""
      ? Number.parseInt(rawId, 10)
      : null;

  if (parsedId !== null && (Number.isNaN(parsedId) || parsedId <= 0)) {
    return { status: "error", message: "Invalid product identifier." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priceText = String(formData.get("priceText") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const available = formData.get("available") === "on" || formData.get("available") === "true";
  const removeImage = formData.get("removeImage") === "true";
  const specifications = parseSpecsFromForm(formData.get("specifications"));

  const fieldErrors: Record<string, string> = {};
  if (title.length < 2) {
    fieldErrors.title = "Enter a product title (at least 2 characters).";
  } else if (title.length > 140) {
    fieldErrors.title = "Title must be 140 characters or fewer.";
  }

  if (category.length < 2) {
    fieldErrors.category = "Enter a category (e.g., Lighting, Furniture).";
  } else if (category.length > 60) {
    fieldErrors.category = "Category must be 60 characters or fewer.";
  }

  if (!priceText) {
    fieldErrors.priceText = "Enter a price or quote label (e.g., $420 or Request Quote).";
  } else if (priceText.length > 60) {
    fieldErrors.priceText = "Price/quote text must be 60 characters or fewer.";
  }

  if (description.length < 10) {
    fieldErrors.description = "Enter a description (at least 10 characters).";
  } else if (description.length > 4000) {
    fieldErrors.description = "Description must be 4,000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please review the highlighted fields.",
      fieldErrors,
    };
  }

  const existing = parsedId !== null ? getProductById(parsedId) : null;
  if (parsedId !== null && !existing) {
    return {
      status: "error",
      message: "The product you tried to edit no longer exists.",
    };
  }

  let nextImagePath: string | null = existing ? existing.imagePath : null;
  let newlyUploadedPath: string | null = null;

  const imageEntry = formData.get("image");
  if (imageEntry instanceof File && imageEntry.size > 0) {
    try {
      newlyUploadedPath = await saveUploadedImage(imageEntry);
      nextImagePath = newlyUploadedPath;
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Could not save uploaded image.",
        fieldErrors: {
          image:
            error instanceof Error ? error.message : "Image upload failed.",
        },
      };
    }
  } else if (removeImage) {
    nextImagePath = null;
  }

  try {
    if (existing) {
      const updated = updateProduct(existing.id, {
        title,
        category,
        priceText,
        description,
        specifications,
        imagePath: nextImagePath,
        available,
      });

      if (!updated) {
        if (newlyUploadedPath) {
          await deleteUploadedImage(newlyUploadedPath);
        }
        return { status: "error", message: "Could not update product." };
      }

      // Clean up replaced or explicitly removed image file
      if (existing.imagePath && existing.imagePath !== nextImagePath) {
        await deleteUploadedImage(existing.imagePath);
      }

      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath(`/products/${existing.slug}`);
      if (updated.slug !== existing.slug) {
        revalidatePath(`/products/${updated.slug}`);
      }

      return {
        status: "success",
        message: `Updated "${updated.title}".`,
      };
    } else {
      const created = createProduct({
        title,
        category,
        priceText,
        description,
        specifications,
        imagePath: nextImagePath,
        available,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath(`/products/${created.slug}`);

      return {
        status: "success",
        message: `Added "${created.title}" to the catalog.`,
      };
    }
  } catch (error) {
    if (newlyUploadedPath) {
      await deleteUploadedImage(newlyUploadedPath);
    }
    console.error("Failed to save product:", error);
    return {
      status: "error",
      message: "Failed to save product to local database.",
    };
  }
}

export async function toggleAvailabilityAction(
  productId: number
): Promise<ActionState> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { status: "error", message: "Unauthorized. Please sign in again." };
  }

  const updated = toggleProductAvailability(productId);
  if (!updated) {
    return { status: "error", message: "Product not found." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${updated.slug}`);

  return {
    status: "success",
    message: `"${updated.title}" marked ${
      updated.available ? "available" : "unavailable"
    }.`,
  };
}

export async function deleteProductAction(
  productId: number
): Promise<ActionState> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return { status: "error", message: "Unauthorized. Please sign in again." };
  }

  const removed = deleteProduct(productId);
  if (!removed) {
    return { status: "error", message: "Product not found." };
  }

  if (removed.imagePath) {
    await deleteUploadedImage(removed.imagePath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${removed.slug}`);

  return {
    status: "success",
    message: `Deleted "${removed.title}".`,
  };
}
