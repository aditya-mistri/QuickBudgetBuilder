/**
 * Test product generation without database insertion
 */

import { generateLargeProductCatalog } from "./productSeeder";

console.log("🏭 Testing product generation...");

try {
  const products = generateLargeProductCatalog(10); // Generate just 10 products for testing
  console.log(`✅ Generated ${products.length} products`);
  console.log("📝 Sample product:", JSON.stringify(products[0], null, 2));
  console.log("🎉 Product generation test completed!");
} catch (error) {
  console.error("❌ Product generation failed:", error);
}
