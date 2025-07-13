/**
 * Database Seeding Script
 * Run this to populate your database with a large product catalog
 */

import { storage } from "../storage";
import { generateLargeProductCatalog } from "./productSeeder";

async function seedProducts() {
  console.log("🌱 Starting product database seeding...");

  try {
    // Check if products already exist
    const existingProducts = await storage.getAllProducts();
    console.log(
      `📊 Found ${existingProducts.length} existing products in database`
    );

    if (existingProducts.length >= 1000) {
      console.log("✅ Database already well-seeded! Skipping seeding process.");
      console.log("💡 To re-seed, clear the products table first.");
      return;
    }

    // Generate product catalog
    console.log("🏭 Generating comprehensive product catalog...");
    const newProducts = generateLargeProductCatalog();
    console.log(`✨ Generated ${newProducts.length} new products`);

    // Insert products with generated IDs
    let insertedCount = 0;
    let duplicateCount = 0;

    console.log(`📦 Inserting products...`);

    for (let i = 0; i < newProducts.length; i++) {
      const product = newProducts[i];
      // Generate a unique ID for each product
      const productId = `WM${(i + 1).toString().padStart(4, "0")}`;

      try {
        await storage.createProduct({
          ...product,
          id: productId,
        });
        insertedCount++;

        // Progress indicator every 50 products
        if (insertedCount % 50 === 0) {
          const progress = ((insertedCount / newProducts.length) * 100).toFixed(
            1
          );
          console.log(
            `   ✅ Progress: ${insertedCount}/${newProducts.length} (${progress}%)`
          );
        }
      } catch (error) {
        // Handle potential duplicate entries
        if (error instanceof Error && error.message.includes("unique")) {
          duplicateCount++;
        } else {
          console.warn(
            `⚠️  Failed to insert product "${product.name}":`,
            error
          );
        }
      }
    }

    // Final statistics
    console.log("\n📈 SEEDING COMPLETE!");
    console.log(`✅ Successfully inserted: ${insertedCount} products`);
    console.log(`⚠️  Duplicates skipped: ${duplicateCount} products`);
    console.log(
      `📊 Total products in database: ${insertedCount + existingProducts.length}`
    );

    // Category breakdown
    const finalProducts = await storage.getAllProducts();
    const categoryBreakdown = finalProducts.reduce(
      (acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\n📋 Category Distribution:");
    Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });

    // Price range analysis
    const prices = finalProducts.map((p) => p.price);
    const avgPrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    console.log("\n💰 Price Analysis:");
    console.log(`   Average price: $${avgPrice.toFixed(2)}`);
    console.log(
      `   Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
    );
    console.log(
      `   Budget-friendly (under $20): ${prices.filter((p) => p < 20).length} products`
    );

    console.log(
      "\n🎉 Your database is now ready for optimal outfit generation!"
    );
    console.log(
      "💡 Tip: Use the /api/products/stats endpoint to get detailed analytics"
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Self-executing script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts()
    .then(() => {
      console.log("🏁 Seeding script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script execution failed:", error);
      process.exit(1);
    });
}

export { seedProducts };
