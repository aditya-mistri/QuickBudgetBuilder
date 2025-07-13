/**
 * Product Database Seeder
 * Generates a large, diverse catalog of Walmart-style clothing products
 */

import { Product, InsertProduct } from "@shared/schema";

// Product generation data
const categories = [
  { name: "top", weight: 25 },
  { name: "bottom", weight: 20 },
  { name: "dress", weight: 15 },
  { name: "shoes", weight: 20 },
  { name: "accessories", weight: 20 },
];

const brands = [
  "Walmart Private Label",
  "George",
  "Faded Glory",
  "No Boundaries",
  "Terra & Sky",
  "Time and Tru",
  "Wonder Nation",
  "Athletic Works",
  "Hanes",
  "Fruit of the Loom",
  "Levi's",
  "Dickies",
  "BELLA+CANVAS",
];

const colors = [
  { name: "black", variants: ["black", "charcoal", "ebony"] },
  { name: "white", variants: ["white", "cream", "off-white", "ivory"] },
  {
    name: "blue",
    variants: ["navy", "royal blue", "sky blue", "denim blue", "teal"],
  },
  { name: "red", variants: ["crimson", "burgundy", "cherry", "coral"] },
  { name: "green", variants: ["forest green", "olive", "mint", "sage"] },
  { name: "gray", variants: ["light gray", "charcoal gray", "heather gray"] },
  { name: "brown", variants: ["tan", "chocolate", "khaki", "camel"] },
  { name: "pink", variants: ["blush", "rose", "magenta", "dusty pink"] },
  { name: "purple", variants: ["lavender", "plum", "violet"] },
  { name: "yellow", variants: ["mustard", "golden", "lemon"] },
  { name: "orange", variants: ["burnt orange", "peach", "rust"] },
];

const sizes = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL"],
  shoes: ["5", "6", "7", "8", "9", "10", "11", "12"],
  accessories: ["OS"], // One Size
};

const occasions = [
  { name: "casual", tags: ["casual", "everyday", "comfortable", "relaxed"] },
  { name: "formal", tags: ["formal", "elegant", "dressy", "professional"] },
  { name: "business", tags: ["professional", "business", "work", "office"] },
  { name: "date", tags: ["romantic", "date", "evening", "stylish"] },
  { name: "party", tags: ["party", "festive", "celebration", "fun"] },
  { name: "workout", tags: ["athletic", "sport", "gym", "active"] },
  { name: "beach", tags: ["beach", "summer", "vacation", "resort"] },
  { name: "winter", tags: ["warm", "cozy", "winter", "cold-weather"] },
];

const ageGroups = [
  { name: "teen", tags: ["trendy", "youthful", "modern"] },
  { name: "young-adult", tags: ["trendy", "stylish", "contemporary"] },
  { name: "adult", tags: ["classic", "timeless", "sophisticated"] },
  { name: "mature", tags: ["classic", "elegant", "refined"] },
];

// Product templates for each category
const productTemplates = {
  top: [
    {
      base: "T-Shirt",
      variations: ["Basic", "Graphic", "V-Neck", "Crew Neck", "Striped"],
    },
    {
      base: "Blouse",
      variations: ["Silk", "Chiffon", "Cotton", "Printed", "Solid"],
    },
    {
      base: "Sweater",
      variations: ["Cardigan", "Pullover", "Turtleneck", "Cable Knit"],
    },
    {
      base: "Tank Top",
      variations: ["Basic", "Ribbed", "Lace Trim", "Athletic"],
    },
    {
      base: "Shirt",
      variations: ["Button-Down", "Flannel", "Denim", "Oxford"],
    },
    {
      base: "Hoodie",
      variations: ["Pullover", "Zip-Up", "Cropped", "Oversized"],
    },
    {
      base: "Polo",
      variations: ["Classic", "Slim Fit", "Performance", "Pique"],
    },
    {
      base: "Tunic",
      variations: ["Bohemian", "Peasant", "Embroidered", "Flowing"],
    },
  ],
  bottom: [
    {
      base: "Jeans",
      variations: ["Skinny", "Straight", "Bootcut", "Wide Leg", "High Waist"],
    },
    {
      base: "Pants",
      variations: ["Chinos", "Dress Pants", "Cargo", "Joggers"],
    },
    {
      base: "Shorts",
      variations: ["Denim", "Cargo", "Athletic", "Bermuda", "High Waist"],
    },
    {
      base: "Skirt",
      variations: ["A-Line", "Pencil", "Maxi", "Mini", "Pleated"],
    },
    {
      base: "Leggings",
      variations: ["Athletic", "High Waist", "Cropped", "Printed"],
    },
    { base: "Capris", variations: ["Denim", "Cotton", "Cropped", "Stretch"] },
  ],
  dress: [
    {
      base: "Sundress",
      variations: ["Floral", "Solid", "Striped", "Midi", "Maxi"],
    },
    { base: "Cocktail Dress", variations: ["LBD", "A-Line", "Sheath", "Wrap"] },
    {
      base: "Casual Dress",
      variations: ["T-Shirt", "Shirt", "Sweater", "Midi"],
    },
    {
      base: "Evening Dress",
      variations: ["Formal", "Gown", "Cocktail", "Party"],
    },
    {
      base: "Work Dress",
      variations: ["Sheath", "A-Line", "Shift", "Professional"],
    },
    {
      base: "Maxi Dress",
      variations: ["Bohemian", "Floral", "Solid", "Beach"],
    },
  ],
  shoes: [
    {
      base: "Sneakers",
      variations: ["Athletic", "Canvas", "Leather", "High-Top", "Slip-On"],
    },
    {
      base: "Sandals",
      variations: ["Flat", "Wedge", "Sport", "Dress", "Gladiator"],
    },
    {
      base: "Boots",
      variations: ["Ankle", "Knee-High", "Combat", "Chelsea", "Cowboy"],
    },
    { base: "Flats", variations: ["Ballet", "Pointed", "Loafer", "Oxford"] },
    {
      base: "Heels",
      variations: ["Pump", "Stiletto", "Block", "Wedge", "Kitten"],
    },
    {
      base: "Athletic Shoes",
      variations: ["Running", "Training", "Walking", "Basketball"],
    },
  ],
  accessories: [
    {
      base: "Bag",
      variations: ["Tote", "Crossbody", "Backpack", "Clutch", "Shoulder"],
    },
    {
      base: "Hat",
      variations: ["Baseball Cap", "Beanie", "Sun Hat", "Fedora"],
    },
    {
      base: "Scarf",
      variations: ["Silk", "Cotton", "Wool", "Infinity", "Blanket"],
    },
    {
      base: "Belt",
      variations: ["Leather", "Canvas", "Chain", "Wide", "Skinny"],
    },
    {
      base: "Jewelry",
      variations: ["Necklace", "Earrings", "Bracelet", "Ring"],
    },
    { base: "Watch", variations: ["Digital", "Analog", "Smart", "Sports"] },
  ],
};

// Price ranges by category and occasion
const priceRanges = {
  top: { min: 8.99, max: 89.99 },
  bottom: { min: 12.99, max: 79.99 },
  dress: { min: 19.99, max: 149.99 },
  shoes: { min: 14.99, max: 129.99 },
  accessories: { min: 5.99, max: 69.99 },
};

// Unsplash image collections for realistic product photos
const imageCollections = {
  top: [
    "photo-1571781926291-c477ebfd024b", // white top
    "photo-1618932260643-eee4a2f652a6", // striped shirt
    "photo-1571455786673-9d9d6c194f90", // sweater
    "photo-1596755094514-f87e34085b2c", // hoodie
    "photo-1618354691373-d851c5c3a990", // t-shirt
    "photo-1602810318383-e386cc2a3ccf", // blouse
    "photo-1562157873-818bc0726f68", // tank top
    "photo-1564364516849-b2e8b44a75b1", // cardigan
  ],
  bottom: [
    "photo-1594633312681-425c7b97ccd1", // denim shorts
    "photo-1551698618-1dfe5d97d256", // jeans
    "photo-1594633313885-c4dcd5e6517c", // pants
    "photo-1583496661160-fb5886a13d77", // skirt
    "photo-1506629905851-b27d119c3d12", // leggings
    "photo-1554568218-0f1715e72254", // dress pants
  ],
  dress: [
    "photo-1572804013309-59a88b7e92f1", // floral dress
    "photo-1585487000143-66b1526316a1", // black dress
    "photo-1594221708779-94832f4320d1", // casual dress
    "photo-1539008835657-9e8e9680c956", // evening dress
    "photo-1505022610485-0249ba5b3675", // maxi dress
    "photo-1515372039744-b8f02a3ae446", // midi dress
  ],
  shoes: [
    "photo-1549298916-b41d501d3772", // white sneakers
    "photo-1603487742131-4160ec999306", // sandals
    "photo-1608256246200-53e635b5b65f", // boots
    "photo-1543163521-1bf539c55dd2", // heels
    "photo-1552346154-21d32810aba3", // athletic shoes
    "photo-1575537302964-96cd47c06b1b", // flats
  ],
  accessories: [
    "photo-1553062407-98eeb64c6a62", // bag
    "photo-1521369909029-2afed882baee", // hat
    "photo-1601924994987-69e26d50dc26", // scarf
    "photo-1618932260643-eee4a2f652a6", // belt
    "photo-1515562141207-7a88fb7ce338", // jewelry
    "photo-1523275335684-37898b6baf30", // watch
  ],
};

export function generateLargeProductCatalog(
  count: number = 1000
): Omit<InsertProduct, "id">[] {
  const products: Omit<InsertProduct, "id">[] = [];
  let productId = 1;

  for (let i = 0; i < count; i++) {
    const category = getWeightedRandomCategory();
    const product = generateProduct(
      `WM${productId.toString().padStart(4, "0")}`,
      category
    );
    products.push(product);
    productId++;
  }

  return products;
}

function getWeightedRandomCategory(): string {
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  let random = Math.random() * totalWeight;

  for (const category of categories) {
    random -= category.weight;
    if (random <= 0) {
      return category.name;
    }
  }

  return categories[0].name;
}

function generateProduct(
  id: string,
  category: string
): Omit<InsertProduct, "id"> {
  const template = getRandomItem(
    productTemplates[category as keyof typeof productTemplates]
  );
  const variation = getRandomItem(template.variations);
  const occasion = getRandomItem(occasions);
  const ageGroup = getRandomItem(ageGroups);
  const colorGroup = getRandomItem(colors);
  const brand = getRandomItem(brands);

  // Generate name
  const name = `${variation} ${template.base}`;

  // Generate price within category range
  const priceRange = priceRanges[category as keyof typeof priceRanges];
  const price =
    Math.round(
      (Math.random() * (priceRange.max - priceRange.min) + priceRange.min) * 100
    ) / 100;

  // Generate tags
  const tags = [
    ...occasion.tags.slice(0, 2),
    ...ageGroup.tags.slice(0, 1),
    template.base.toLowerCase(),
    variation.toLowerCase(),
  ];

  // Add seasonal tags
  if (Math.random() < 0.3) {
    const seasons = ["spring", "summer", "fall", "winter"];
    tags.push(getRandomItem(seasons));
  }

  // Generate sizes
  let productSizes: string[];
  if (category === "shoes") {
    productSizes = sizes.shoes.slice(0, Math.floor(Math.random() * 4) + 4);
  } else if (category === "accessories") {
    productSizes = sizes.accessories;
  } else {
    productSizes = sizes.clothing.slice(0, Math.floor(Math.random() * 3) + 4);
  }

  // Generate available colors (1-3 colors per product)
  const numColors = Math.floor(Math.random() * 3) + 1;
  const productColors = [];
  for (let i = 0; i < numColors; i++) {
    const randomColorGroup = getRandomItem(colors);
    const randomVariant = getRandomItem(randomColorGroup.variants);
    if (!productColors.includes(randomVariant)) {
      productColors.push(randomVariant);
    }
  }

  // Generate image URL
  const imageCollection =
    imageCollections[category as keyof typeof imageCollections];
  const randomImageId = getRandomItem(imageCollection);
  const imageUrl = `https://images.unsplash.com/${randomImageId}?w=400&h=500&fit=crop&auto=format`;

  return {
    name,
    price,
    category,
    tags,
    image_url: imageUrl,
    color: productColors[0], // Primary color
    colors: productColors, // All available colors
    sizes: productSizes,
    brand,
  };
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
