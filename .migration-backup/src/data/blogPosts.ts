export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  relatedDesigns: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Top 10 Geometric Animal Designs for 2025",
    excerpt: "Discover the hottest geometric animal designs that are taking the print-on-demand world by storm this year.",
    content: `Geometric animal designs have become one of the most popular trends in the print-on-demand industry. These designs combine the natural beauty of animals with modern geometric patterns, creating stunning artwork that appeals to a wide audience.

In this article, we'll explore the top 10 geometric animal designs that are dominating 2025...`,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    author: "Design Team",
    date: "2025-01-15",
    category: "Design Trends",
    readTime: "5 min read",
    relatedDesigns: ["1", "6"],
  },
  {
    id: "2",
    title: "How to Style Vintage T-Shirts: A Complete Guide",
    excerpt: "Learn the art of styling vintage and retro t-shirts for any occasion with our comprehensive style guide.",
    content: `Vintage t-shirts have made a massive comeback in recent years. Whether you're into 80s nostalgia or classic rock aesthetics, knowing how to style these pieces can elevate your entire wardrobe.

Let's dive into the different ways you can incorporate vintage tees into your daily outfits...`,
    imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=400&fit=crop",
    author: "Style Editor",
    date: "2025-01-10",
    category: "Fashion Tips",
    readTime: "7 min read",
    relatedDesigns: ["2", "7"],
  },
  {
    id: "3",
    title: "The Rise of Space-Themed Merchandise",
    excerpt: "Space exploration has captured our imagination, and it's reflected in the merchandise we love. Here's why.",
    content: `From NASA collaborations to indie artists creating cosmic designs, space-themed merchandise has seen an astronomical rise in popularity.

The fascination with space isn't new, but recent developments in space exploration have reignited public interest...`,
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop",
    author: "Content Team",
    date: "2025-01-05",
    category: "Industry News",
    readTime: "4 min read",
    relatedDesigns: ["3"],
  },
  {
    id: "4",
    title: "Best Coffee Mugs for Your Home Office",
    excerpt: "Working from home? Here are the most stylish and functional coffee mugs to brighten your workspace.",
    content: `Your home office deserves a mug that's not just functional but also reflects your personality. We've curated a collection of the best coffee mug designs that combine style with practicality.

From minimalist designs to bold statements, find your perfect match...`,
    imageUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800&h=400&fit=crop",
    author: "Lifestyle Editor",
    date: "2024-12-28",
    category: "Product Guide",
    readTime: "6 min read",
    relatedDesigns: ["4"],
  },
];

export const blogCategories = [
  "All",
  "Design Trends",
  "Fashion Tips",
  "Industry News",
  "Product Guide",
];
