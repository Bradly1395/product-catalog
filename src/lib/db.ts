import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Product, ProductSpec } from "./types";

interface ProductRow {
  id: number;
  slug: string;
  title: string;
  category: string;
  price_text: string;
  description: string;
  specifications: string;
  image_path: string | null;
  available: number;
  created_at: string;
  updated_at: string;
}

export interface ProductUpsertInput {
  title: string;
  category: string;
  priceText: string;
  description: string;
  specifications: ProductSpec[];
  imagePath: string | null;
  available: boolean;
}

const SEED_PRODUCTS: Array<Omit<ProductUpsertInput, "imagePath">> = [
  {
    title: "Arc-04 Linear Desk Lamp",
    category: "Lighting",
    priceText: "$420",
    description:
      "Precision-milled anodized aluminum cantilever task lamp featuring a recessed warm-white optical diffuser and stepless brass rotary dimmer. Designed for glare-free illumination across drafting tables and studio workstations.",
    specifications: [
      { label: "Dimensions", value: "580 × 160 × 410 mm" },
      { label: "Light Source", value: "2700K CRI 97+ LED, 950 lm" },
      { label: "Materials", value: "Bead-blasted 6061 aluminum, solid brass dial" },
      { label: "Power", value: "12W universal 100–240V woven cord" },
      { label: "Lead Time", value: "Ships in 3–5 business days" },
    ],
    available: true,
  },
  {
    title: "Monolith Draft Workbench",
    category: "Furniture",
    priceText: "Request Quote",
    description:
      "Heavy-gauge folded steel trestle table paired with a 42 mm solid quarter-sawn white oak top. Integrated concealed cable trough and adjustable leveling feet support architectural models, studio equipment, and daily collaborative work.",
    specifications: [
      { label: "Standard Footprint", value: "2100 × 900 × 740 mm (custom sizing available)" },
      { label: "Worktop", value: "FSC quarter-sawn white oak, matte oil finish" },
      { label: "Chassis", value: "4 mm powder-coated carbon steel" },
      { label: "Static Load Rating", value: "240 kg evenly distributed" },
      { label: "Lead Time", value: "Built to order, 3–4 weeks" },
    ],
    available: true,
  },
  {
    title: "Resonance Timber Acoustic Baffle",
    category: "Acoustics",
    priceText: "$680 / set of 4",
    description:
      "Architectural slatted wall absorption panels engineered to tame mid-to-high frequency reverberation in studio and boardroom interiors. Each module combines kiln-dried ash ribs with high-density recycled mineral felt.",
    specifications: [
      { label: "Acoustic Rating", value: "NRC 0.85 (Class A absorption)" },
      { label: "Module Size", value: "600 × 1200 × 44 mm per panel" },
      { label: "Surface & Core", value: "Kiln-dried ash veneer over recycled mineral wool" },
      { label: "Mounting", value: "Concealed French cleat hardware included" },
      { label: "Coverage", value: "2.88 m² per 4-panel set" },
    ],
    available: true,
  },
  {
    title: "Kanso Modular Wall Rail System",
    category: "Hardware",
    priceText: "$295",
    description:
      "Extruded architectural aluminum rail system with precision-machined sliding shelves, magnetic specimen strips, and turned brass utility pegs. Keeps reference materials, calipers, and studio tools organized off the desk surface.",
    specifications: [
      { label: "Rail Span", value: "1200 mm modular extrusion (joinable)" },
      { label: "Finish", value: "Natural clear-anodized matte aluminum" },
      { label: "Included Modules", value: "2 shallow ledges, 4 brass pegs, 1 magnetic bar" },
      { label: "Capacity", value: "22 kg when anchored to wall studs" },
      { label: "Lead Time", value: "In stock — ships within 48 hours" },
    ],
    available: true,
  },
];

const globalForDb = globalThis as unknown as {
  __catalogDb?: Database.Database;
};

function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (!configured) {
    return path.join(process.cwd(), "data", "catalog.db");
  }
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "product";
}

function generateUniqueSlug(
  db: Database.Database,
  title: string,
  excludeId?: number
): string {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  const checkStmt = excludeId
    ? db.prepare("SELECT id FROM products WHERE slug = ? AND id != ?")
    : db.prepare("SELECT id FROM products WHERE slug = ?");

  while (true) {
    const existing = excludeId
      ? checkStmt.get(candidate, excludeId)
      : checkStmt.get(candidate);
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function parseSpecifications(raw: string): ProductSpec[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ProductSpec =>
          Boolean(item) &&
          typeof item.label === "string" &&
          typeof item.value === "string" &&
          item.label.trim().length > 0 &&
          item.value.trim().length > 0
      )
      .map((item) => ({
        label: item.label.trim(),
        value: item.value.trim(),
      }));
  } catch {
    return [];
  }
}

function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    priceText: row.price_text,
    description: row.description,
    specifications: parseSpecifications(row.specifications),
    imagePath: row.image_path,
    available: row.available === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function initializeDatabase(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price_text TEXT NOT NULL,
      description TEXT NOT NULL,
      specifications TEXT NOT NULL DEFAULT '[]',
      image_path TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
  `);

  const seededRow = db
    .prepare("SELECT value FROM catalog_meta WHERE key = 'initial_seed_v1'")
    .get() as { value: string } | undefined;

  if (!seededRow) {
    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get() as { count: number };

    const seedTransaction = db.transaction(() => {
      if (countRow.count === 0) {
        const insertStmt = db.prepare(`
          INSERT INTO products (
            slug, title, category, price_text, description, specifications, image_path, available
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
        `);

        for (const item of SEED_PRODUCTS) {
          const slug = generateUniqueSlug(db, item.title);
          insertStmt.run(
            slug,
            item.title,
            item.category,
            item.priceText,
            item.description,
            JSON.stringify(item.specifications),
            item.available ? 1 : 0
          );
        }
      }

      db.prepare(
        "INSERT OR REPLACE INTO catalog_meta (key, value) VALUES ('initial_seed_v1', '1')"
      ).run();
    });

    seedTransaction();
  }
}

export function getDb(): Database.Database {
  if (!globalForDb.__catalogDb) {
    const dbPath = resolveDatabasePath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    initializeDatabase(db);
    globalForDb.__catalogDb = db;
  }
  return globalForDb.__catalogDb;
}

export function listProducts(options?: { onlyAvailable?: boolean }): Product[] {
  const db = getDb();
  const query = options?.onlyAvailable
    ? "SELECT * FROM products WHERE available = 1 ORDER BY id DESC"
    : "SELECT * FROM products ORDER BY id DESC";
  const rows = db.prepare(query).all() as ProductRow[];
  return rows.map(mapRowToProduct);
}

export function getProductById(id: number): Product | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(id) as ProductRow | undefined;
  return row ? mapRowToProduct(row) : null;
}

export function getProductBySlug(slug: string): Product | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM products WHERE slug = ?")
    .get(slug) as ProductRow | undefined;
  return row ? mapRowToProduct(row) : null;
}

export function listCategories(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT category FROM products ORDER BY category COLLATE NOCASE ASC")
    .all() as Array<{ category: string }>;
  return rows.map((row) => row.category);
}

export function createProduct(input: ProductUpsertInput): Product {
  const db = getDb();
  const slug = generateUniqueSlug(db, input.title);
  const result = db
    .prepare(
      `
      INSERT INTO products (
        slug, title, category, price_text, description, specifications, image_path, available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      slug,
      input.title.trim(),
      input.category.trim(),
      input.priceText.trim(),
      input.description.trim(),
      JSON.stringify(input.specifications),
      input.imagePath,
      input.available ? 1 : 0
    );

  const created = getProductById(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error("Failed to load newly created product.");
  }
  return created;
}

export function updateProduct(id: number, input: ProductUpsertInput): Product | null {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing) return null;

  const slug =
    existing.title.trim().toLowerCase() === input.title.trim().toLowerCase()
      ? existing.slug
      : generateUniqueSlug(db, input.title, id);

  db.prepare(
    `
    UPDATE products
    SET slug = ?,
        title = ?,
        category = ?,
        price_text = ?,
        description = ?,
        specifications = ?,
        image_path = ?,
        available = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    slug,
    input.title.trim(),
    input.category.trim(),
    input.priceText.trim(),
    input.description.trim(),
    JSON.stringify(input.specifications),
    input.imagePath,
    input.available ? 1 : 0,
    id
  );

  return getProductById(id);
}

export function toggleProductAvailability(id: number): Product | null {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing) return null;

  const nextValue = existing.available ? 0 : 1;
  db.prepare(
    `
    UPDATE products
    SET available = ?, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(nextValue, id);

  return getProductById(id);
}

export function deleteProduct(id: number): Product | null {
  const db = getDb();
  const existing = getProductById(id);
  if (!existing) return null;

  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return existing;
}
