import "dotenv/config"
import { db } from "../lib"
import { categories, brands } from "../db/schema"
import { eq } from "drizzle-orm"
import { v5 as uuidv5 } from "uuid"

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

const storeCategories = [
  { name: "Electronics", slug: "electronics", description: "Tech, gadgets, and accessories" },
  { name: "Apparel", slug: "apparel", description: "Clothing and garments" },
  { name: "Fashion", slug: "fashion", description: "Trending apparel and fashion accessories" },
  { name: "Kitchen", slug: "kitchen", description: "Cookware, tableware, and kitchen utensils" },
  { name: "Home and Furniture", slug: "home-and-furniture", description: "Furniture and home decor" },
  { name: "Beauty and Personal Care", slug: "beauty-and-personal-care", description: "Cosmetics, skincare, and grooming" },
  { name: "Sports and Outdoors", slug: "sports-and-outdoors", description: "Sports gear, outdoor equipment, and shoes" },
  { name: "Gym and Fitness", slug: "gym-and-fitness", description: "Exercise machines, weights, and accessories" },
  { name: "Books and Stationery", slug: "books-and-stationery", description: "Novels, textbooks, and office supplies" },
  { name: "Video Games", slug: "video-games", description: "Consoles, video games, and gaming gear" },
]

const storeBrands = [
  // Electronics & Tech
  { name: "Sony", slug: "sony" },
  { name: "Samsung", slug: "samsung" },
  { name: "Apple", slug: "apple" },
  { name: "Bose", slug: "bose" },
  { name: "Logitech", slug: "logitech" },
  { name: "Dell", slug: "dell" },
  { name: "HP", slug: "hp" },

  // Apparel & Fashion
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Puma", slug: "puma" },
  { name: "Levi's", slug: "levis" },
  { name: "Zara", slug: "zara" },
  { name: "H&M", slug: "hm" },
  { name: "Under Armour", slug: "under-armour" },

  // Kitchen & Home Appliances
  { name: "KitchenCraft", slug: "kitchencraft" },
  { name: "Philips", slug: "philips" },
  { name: "Prestige", slug: "prestige" },
  { name: "Wonderchef", slug: "wonderchef" },
  { name: "Hawkins", slug: "hawkins" },

  // Home & Furniture
  { name: "IKEA", slug: "ikea" },
  { name: "Godrej Interio", slug: "godrej-interio" },
  { name: "Urban Ladder", slug: "urban-ladder" },

  // Beauty & Personal Care
  { name: "L'Oréal", slug: "loreal" },
  { name: "Nivea", slug: "nivea" },
  { name: "Maybelline", slug: "maybelline" },
  { name: "Dove", slug: "dove" },

  // Sports & Outdoors
  { name: "Decathlon", slug: "decathlon" },
  { name: "Yonex", slug: "yonex" },
  { name: "Wildcraft", slug: "wildcraft" },

  // Gym & Fitness
  { name: "FitPro", slug: "fitpro" },
  { name: "Bowflex", slug: "bowflex" },
  { name: "Cultsport", slug: "cultsport" },

  // Books & Stationery
  { name: "Moleskine", slug: "moleskine" },
  { name: "Classmate", slug: "classmate" },
  { name: "Parker", slug: "parker" },
  { name: "Faber-Castell", slug: "faber-castell" },

  // Video Games & Consoles
  { name: "PlayStation", slug: "playstation" },
  { name: "Microsoft", slug: "microsoft" },
  { name: "Nintendo", slug: "nintendo" },
  { name: "Razer", slug: "razer" },

  // General / Unbranded
  { name: "Generic", slug: "generic" },
]

async function main() {
  console.log("Seeding Categories and Brands to Neon PostgreSQL...")

  try {
    // 1. Seed Categories safely
    console.log("Syncing categories...")
    for (const cat of storeCategories) {
      const id = uuidv5(`cat-${cat.slug}`, UUID_NAMESPACE)
      const [existing] = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1)
      if (!existing) {
        await db.insert(categories).values({
          id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          isActive: true,
        })
        console.log(`+ Added Category: ${cat.name}`)
      }
    }

    // 2. Seed Brands safely
    console.log("Syncing brands...")
    for (const brd of storeBrands) {
      const id = uuidv5(`brand-${brd.slug}`, UUID_NAMESPACE)
      const [existing] = await db.select().from(brands).where(eq(brands.slug, brd.slug)).limit(1)
      if (!existing) {
        await db.insert(brands).values({
          id,
          name: brd.name,
          slug: brd.slug,
          isActive: true,
        })
        console.log(`+ Added Brand: ${brd.name}`)
      }
    }

    console.log("Categories and Brands seeded successfully without touching real products!")
    process.exit(0)
  } catch (err) {
    console.error("Seeding failed:", err)
    process.exit(1)
  }
}

main()
