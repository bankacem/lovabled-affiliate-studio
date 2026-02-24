export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author_name: string;
  category: string;
  tags: string[];
  status: string;
  read_time: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Top 10 Geometric Animal Designs for 2025",
    slug: "top-10-geometric-animal-designs-for-2025",
    excerpt: "Discover the hottest geometric animal designs that are taking the print-on-demand world by storm this year.",
    content: `Geometric animal designs have become one of the most popular trends in the print-on-demand industry. These designs combine the natural beauty of animals with modern geometric patterns, creating stunning artwork that appeals to a wide audience.

In this article, we'll explore the top 10 geometric animal designs that are dominating 2025...`,
    featured_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    author_name: "Design Team",
    category: "Design Trends",
    tags: ["geometric", "animals", "2025"],
    status: "published",
    read_time: "5 min read",
    meta_title: "Top 10 Geometric Animal Designs for 2025 | AIPrintVerse",
    meta_description: "Discover the hottest geometric animal designs that are taking the print-on-demand world by storm this year.",
    published_at: "2025-01-15T12:00:00Z",
    created_at: "2025-01-15T12:00:00Z",
    updated_at: "2025-01-15T12:00:00Z"
  },
  {
    id: "2",
    title: "How to Style Vintage T-Shirts: A Complete Guide",
    slug: "how-to-style-vintage-t-shirts-a-complete-guide",
    excerpt: "Learn the art of styling vintage and retro t-shirts for any occasion with our comprehensive style guide.",
    content: `Vintage t-shirts have made a massive comeback in recent years. Whether you're into 80s nostalgia or classic rock aesthetics, knowing how to style these pieces can elevate your entire wardrobe.

Let's dive into the different ways you can incorporate vintage tees into your daily outfits...`,
    featured_image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=400&fit=crop",
    author_name: "Style Editor",
    category: "Fashion Tips",
    tags: ["vintage", "styling", "t-shirts"],
    status: "published",
    read_time: "7 min read",
    meta_title: "How to Style Vintage T-Shirts: A Complete Guide | AIPrintVerse",
    meta_description: "Learn the art of styling vintage and retro t-shirts for any occasion with our comprehensive style guide.",
    published_at: "2025-01-10T10:00:00Z",
    created_at: "2025-01-10T10:00:00Z",
    updated_at: "2025-01-10T10:00:00Z"
  },
  {
    id: "3",
    title: "The Rise of Space-Themed Merchandise",
    slug: "the-rise-of-space-themed-merchandise",
    excerpt: "Space exploration has captured our imagination, and it's reflected in the merchandise we love. Here's why.",
    content: `From NASA collaborations to indie artists creating cosmic designs, space-themed merchandise has seen an astronomical rise in popularity.

The fascination with space isn't new, but recent developments in space exploration have reignited public interest...`,
    featured_image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop",
    author_name: "Content Team",
    category: "Industry News",
    tags: ["space", "nasa", "merchandise"],
    status: "published",
    read_time: "4 min read",
    meta_title: "The Rise of Space-Themed Merchandise | AIPrintVerse",
    meta_description: "Space exploration has captured our imagination, and it's reflected in the merchandise we love. Here's why.",
    published_at: "2025-01-05T09:00:00Z",
    created_at: "2025-01-05T09:00:00Z",
    updated_at: "2025-01-05T09:00:00Z"
  },
  {
    id: "4",
    title: "Best Coffee Mugs for Your Home Office",
    slug: "best-coffee-mugs-for-your-home-office",
    excerpt: "Working from home? Here are the most stylish and functional coffee mugs to brighten your workspace.",
    content: `Your home office deserves a mug that's not just functional but also reflects your personality. We've curated a collection of the best coffee mug designs that combine style with practicality.

From minimalist designs to bold statements, find your perfect match...`,
    featured_image: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800&h=400&fit=crop",
    author_name: "Lifestyle Editor",
    category: "Product Guide",
    tags: ["coffee", "mugs", "home-office"],
    status: "published",
    read_time: "6 min read",
    meta_title: "Best Coffee Mugs for Your Home Office | AIPrintVerse",
    meta_description: "Working from home? Here are the most stylish and functional coffee mugs to brighten your workspace.",
    published_at: "2024-12-28T14:00:00Z",
    created_at: "2024-12-28T14:00:00Z",
    updated_at: "2024-12-28T14:00:00Z"
  },
  {
    id: "5",
    title: "Bachelorette Party Shirt Ideas 2024",
    slug: "bachelorette-party-shirt-ideas-2024",
    excerpt: "Get the best ideas for your 2024 bachelorette party with these trendy and fun shirt designs.",
    content: `Looking for the latest trends? Check out our updated <a href="/blog/bachelorette-party-shirt-ideas-2026-master-guide">Bachelorette Party Shirt Ideas for 2026</a> guide for the upcoming season.

For 2024, we saw a lot of retro and custom typography...`,
    featured_image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=400&fit=crop",
    author_name: "Event Planner",
    category: "Event Planning",
    tags: ["bachelorette", "party", "shirts"],
    status: "published",
    read_time: "5 min read",
    meta_title: "Bachelorette Party Shirt Ideas 2024 | AIPrintVerse",
    meta_description: "Get the best ideas for your 2024 bachelorette party with these trendy and fun shirt designs.",
    published_at: "2024-03-15T11:00:00Z",
    created_at: "2024-03-15T11:00:00Z",
    updated_at: "2024-03-15T11:00:00Z"
  },
  {
    id: "6",
    title: "Bachelorette Party Shirt Ideas 2026: The Master Guide",
    slug: "bachelorette-party-shirt-ideas-2026-master-guide",
    excerpt: "The definitive guide to 2026 bachelorette party fashion. From Solarpunk to Quiet Luxury.",
    content: `Welcome to the future of bachelorette parties. In 2026, we're seeing a shift towards more sustainable and high-concept themes.

Whether you're planning a desert retreat or a city getaway, your apparel should reflect the new era of celebration. We recommend looking into eco-friendly fabrics and biomorphic patterns.`,
    featured_image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop",
    author_name: "Trend Analyst",
    category: "Event Planning",
    tags: ["bachelorette", "2026", "trends"],
    status: "published",
    read_time: "8 min read",
    meta_title: "Bachelorette Party Shirt Ideas 2026: The Master Guide | AIPrintVerse",
    meta_description: "The definitive guide to 2026 bachelorette party fashion. From Solarpunk to Quiet Luxury.",
    published_at: "2026-02-01T09:00:00Z",
    created_at: "2026-02-01T09:00:00Z",
    updated_at: "2026-02-01T09:00:00Z"
  },
  {
    id: "7",
    title: "7 Pro Secrets to Styling Throw Pillows",
    slug: "7-pro-secrets-to-styling-throw-pillows",
    excerpt: "Transform your living space with these expert tips on arranging and choosing the perfect throw pillows.",
    content: `Styling throw pillows is an art form. To stay ahead of the curve in 2026, you need to consider more than just color.

One secret is incorporating <strong>Biophilic Textile Patterns</strong> that bring the outdoors in. Pair these with <strong>Sustainable Flax Linen</strong> for durability and a touch of eco-luxury.

Don't be afraid of <strong>Dopamine Decor Color Palettes</strong>—vibrant hues that spark joy. If you're feeling bold, try <strong>Maximalist Layering Techniques</strong> by mixing textures and sizes. Finally, always look for <strong>Ethical Artisanal Cushion Covers</strong> to ensure your style is as responsible as it is beautiful.`,
    featured_image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=400&fit=crop",
    author_name: "Interior Designer",
    category: "Home Decor",
    tags: ["interior-design", "pillows", "styling"],
    status: "published",
    read_time: "6 min read",
    meta_title: "7 Pro Secrets to Styling Throw Pillows | AIPrintVerse",
    meta_description: "Transform your living space with these expert tips on arranging and choosing the perfect throw pillows.",
    published_at: "2026-02-10T15:00:00Z",
    created_at: "2026-02-10T15:00:00Z",
    updated_at: "2026-02-10T15:00:00Z"
  },
  {
    id: "8",
    title: "The Definitive Guide to Washing Vintage T-Shirts",
    slug: "the-definitive-guide-to-washing-vintage-t-shirts",
    excerpt: "Learn how to preserve your precious vintage collection with our technical washing guide.",
    content: `Washing vintage t-shirts requires a delicate touch. To avoid dry rot and preserve the print, follow these essential steps:

1. Turn the garment inside out.
2. Use cold water only.
3. Air dry flat.`,
    featured_image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&h=400&fit=crop",
    author_name: "Vintage Expert",
    category: "Care Guides",
    tags: ["vintage", "washing", "care"],
    status: "published",
    read_time: "4 min read",
    meta_title: "The Definitive Guide to Washing Vintage T-Shirts | AIPrintVerse",
    meta_description: "Learn how to preserve your precious vintage collection with our technical washing guide.",
    published_at: "2026-01-20T10:00:00Z",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z"
  },
  {
    id: "9",
    title: "Custom Mugs: The Ultimate Gifting Guide",
    slug: "custom-mugs-the-ultimate-gifting-guide",
    excerpt: "Why custom mugs make the perfect gift for any occasion.",
    content: `Custom mugs are a classic gift, but in 2026, we're taking them to the next level with personalized AR-enabled designs and thermal-reactive coatings.

<div class="product-feature-box" style="border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 32px 0; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); text-align: center;">
    <h3 style="margin: 0 0 8px 0; color: #1e293b;">Custom Print Masterpieces</h3>
    <p style="color: #64748b; margin-bottom: 24px;">Bring your vision to life with our premium printing technology.</p>
    <a href="/designs" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Shop Now →</a>
</div>`,
    featured_image: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800&h=400&fit=crop",
    author_name: "Lifestyle Editor",
    category: "Product Guide",
    tags: ["custom", "mugs", "gifting"],
    status: "published",
    read_time: "5 min read",
    meta_title: "Custom Mugs: The Ultimate Gifting Guide | AIPrintVerse",
    meta_description: "Why custom mugs make the perfect gift for any occasion.",
    published_at: "2026-02-15T12:00:00Z",
    created_at: "2026-02-15T12:00:00Z",
    updated_at: "2026-02-15T12:00:00Z"
  },
  {
    id: "10",
    title: "The Ultimate Guide to Custom Phone Cases",
    slug: "the-ultimate-guide-to-custom-phone-cases",
    excerpt: "Everything you need to know about choosing and designing the perfect custom phone case.",
    content: `Custom phone cases are the ultimate accessory for self-expression in 2026. From minimalist monograms to complex Solarpunk landscapes, your phone case is a canvas.

<div class="product-feature-box" style="border: 2px solid #6366f1; border-radius: 12px; padding: 24px; margin: 32px 0; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); text-align: center;">
    <h3 style="margin: 0 0 8px 0; color: #1e293b;">Custom Print Masterpieces</h3>
    <p style="color: #64748b; margin-bottom: 24px;">Bring your vision to life with our premium printing technology.</p>
    <a href="/designs" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Shop Now →</a>
</div>

When choosing a case, prioritize impact-resistant materials and UV-protected printing to ensure your design stays vibrant.`,
    featured_image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&h=400&fit=crop",
    author_name: "Tech Stylist",
    category: "Product Guide",
    tags: ["custom", "phone-cases", "tech"],
    status: "published",
    read_time: "6 min read",
    meta_title: "The Ultimate Guide to Custom Phone Cases | AIPrintVerse",
    meta_description: "Everything you need to know about choosing and designing the perfect custom phone case.",
    published_at: "2026-02-20T14:00:00Z",
    created_at: "2026-02-20T14:00:00Z",
    updated_at: "2026-02-20T14:00:00Z"
  },
];

export const blogCategories = [
  "All",
  "Design Trends",
  "Fashion Tips",
  "Industry News",
  "Product Guide",
  "Event Planning",
  "Home Decor",
  "Care Guides",
];
