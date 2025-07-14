/**
 * Environment variable validation utility
 * Ensures all required API keys and configuration are present
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  GEMINI_API_KEY: string;
  NODE_ENV: string;
  PORT: string;
}

interface OptionalEnvVars {
  REPLICATE_API_TOKEN?: string;
}

export function validateEnvironment(): void {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    "DATABASE_URL",
    "GEMINI_API_KEY",
    "NODE_ENV",
    "PORT",
  ];

  const optionalVars: (keyof OptionalEnvVars)[] = [
    "REPLICATE_API_TOKEN",
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables and warn if missing
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      warnings.push(`${varName} not found - AI image generation features will use fallback visualizations`);
    }
  }

  // Check API key formats
  if (
    process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.startsWith("AIza")
  ) {
    warnings.push('GEMINI_API_KEY may be invalid (should start with "AIza")');
  }

  if (
    process.env.REPLICATE_API_TOKEN &&
    !process.env.REPLICATE_API_TOKEN.startsWith("r8_")
  ) {
    warnings.push(
      'REPLICATE_API_TOKEN may be invalid (should start with "r8_")'
    );
  }

  // Report missing variables
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error(
      "\n💡 Please check your .env file and ensure all required variables are set."
    );
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Success message
  console.log("✅ Environment validation passed");
  console.log(
    `   - Database: ${process.env.DATABASE_URL?.includes("neon") ? "Neon PostgreSQL" : "PostgreSQL"}`
  );
  console.log(
    `   - Gemini AI: ${process.env.GEMINI_API_KEY ? "Configured" : "Missing"}`
  );
  console.log(
    `   - Replicate: ${process.env.REPLICATE_API_TOKEN ? "Configured" : "Missing"}`
  );
  console.log(`   - Environment: ${process.env.NODE_ENV}`);
  console.log(`   - Port: ${process.env.PORT}`);
}

export function checkAIServicesHealth(): void {
  console.log("\n🔍 AI Services Health Check:");

  if (process.env.GEMINI_API_KEY) {
    console.log("   ✅ Gemini API - Ready for outfit generation");
  } else {
    console.log("   ❌ Gemini API - Missing key, using fallback");
  }

  if (process.env.REPLICATE_API_TOKEN) {
    console.log("   ✅ Replicate API - Ready for try-on generation");
  } else {
    console.log("   ❌ Replicate API - Missing key, try-on disabled");
  }
}
