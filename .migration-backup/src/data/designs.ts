export interface Design {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  teepublicUrl: string;
  redbubbleUrl: string;
  featured: boolean;
}

export const designs: Design[] = [
  {
    id: "1",
    name: "Geometric Wolf",
    description: "A stunning geometric wolf design perfect for nature lovers and those who appreciate minimalist art. This design combines the majesty of wolves with modern geometric patterns.",
    imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2uj89?w=600&h=600&fit=crop",
    category: "T-Shirts",
    tags: ["geometric", "wolf", "nature", "minimalist"],
    teepublicUrl: "https://www.teepublic.com/t-shirt/geometric-wolf?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/geometric-wolf?ref=YOUR_ID",
    featured: true,
  },
  {
    id: "2",
    name: "Retro Sunset Vibes",
    description: "Capture the essence of vintage aesthetics with this retro sunset design. Perfect for those who love 80s and 90s nostalgic artwork.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
    category: "T-Shirts",
    tags: ["retro", "sunset", "vintage", "80s"],
    teepublicUrl: "https://www.teepublic.com/t-shirt/retro-sunset?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/retro-sunset?ref=YOUR_ID",
    featured: true,
  },
  {
    id: "3",
    name: "Space Explorer",
    description: "For the dreamers and space enthusiasts. This astronaut design captures the wonder of space exploration with artistic flair.",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=600&fit=crop",
    category: "Hoodies",
    tags: ["space", "astronaut", "galaxy", "adventure"],
    teepublicUrl: "https://www.teepublic.com/hoodie/space-explorer?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/space-explorer?ref=YOUR_ID",
    featured: true,
  },
  {
    id: "4",
    name: "Coffee Lover",
    description: "The perfect design for coffee addicts. Express your love for that morning brew with this stylish coffee-themed artwork.",
    imageUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&h=600&fit=crop",
    category: "Mugs",
    tags: ["coffee", "caffeine", "morning", "funny"],
    teepublicUrl: "https://www.teepublic.com/mug/coffee-lover?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/coffee-lover?ref=YOUR_ID",
    featured: false,
  },
  {
    id: "5",
    name: "Mountain Adventure",
    description: "For the outdoor enthusiasts and hiking lovers. This mountain landscape design captures the spirit of adventure and exploration.",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=600&fit=crop",
    category: "T-Shirts",
    tags: ["mountain", "hiking", "adventure", "nature"],
    teepublicUrl: "https://www.teepublic.com/t-shirt/mountain-adventure?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/mountain-adventure?ref=YOUR_ID",
    featured: false,
  },
  {
    id: "6",
    name: "Cute Cat Illustration",
    description: "An adorable cat illustration for all the cat lovers out there. Minimalist yet expressive, perfect for stickers and accessories.",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop",
    category: "Stickers",
    tags: ["cat", "cute", "illustration", "pet"],
    teepublicUrl: "https://www.teepublic.com/sticker/cute-cat?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/cute-cat?ref=YOUR_ID",
    featured: true,
  },
  {
    id: "7",
    name: "Vintage Motorcycle",
    description: "Classic motorcycle design for the riders and vintage enthusiasts. Captures the spirit of freedom on the open road.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    category: "T-Shirts",
    tags: ["motorcycle", "vintage", "biker", "freedom"],
    teepublicUrl: "https://www.teepublic.com/t-shirt/vintage-motorcycle?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/vintage-motorcycle?ref=YOUR_ID",
    featured: false,
  },
  {
    id: "8",
    name: "Abstract Waves",
    description: "Modern abstract wave pattern perfect for those who appreciate contemporary art and design aesthetics.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=600&fit=crop",
    category: "Phone Cases",
    tags: ["abstract", "waves", "modern", "artistic"],
    teepublicUrl: "https://www.teepublic.com/phone-case/abstract-waves?ref=YOUR_ID",
    redbubbleUrl: "https://www.redbubble.com/shop/abstract-waves?ref=YOUR_ID",
    featured: false,
  },
];

export const categories = [
  "All",
  "T-Shirts",
  "Hoodies",
  "Mugs",
  "Stickers",
  "Phone Cases",
];
