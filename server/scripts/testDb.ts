/**
 * Simple test to verify database connection and product creation
 */

import { storage } from "../storage";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");

  try {
    // Test basic database connection
    const existingProducts = await storage.getAllProducts();
    console.log(
      `✅ Database connected! Found ${existingProducts.length} existing products`
    );

    // Test creating a single product
    const testProduct = {
      id: "TEST001",
      name: "Test Product",
      price: 19.99,
      category: "clothing",
      tags: ["test", "sample"],
      image_url: "https://via.placeholder.com/400x400",
      color: "blue",
      colors: ["blue", "red"],
      sizes: ["M", "L"],
      brand: "TestBrand",
    };

    console.log("📝 Creating test product...");
    const created = await storage.createProduct(testProduct);
    console.log("✅ Test product created:", created.name);

    // Clean up test product
    // Note: We would need a delete function for this, but for now just log success
    console.log("🎉 Database test completed successfully!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  }
}

testDatabaseConnection()
  .then(() => {
    console.log("✅ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
