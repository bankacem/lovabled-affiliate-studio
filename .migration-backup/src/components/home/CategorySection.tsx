import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shirt, Coffee, StickyNote, Smartphone } from "lucide-react";

const categories = [
  {
    name: "T-Shirts",
    icon: Shirt,
    count: 4,
    color: "bg-coral/10 text-coral-dark",
  },
  {
    name: "Mugs",
    icon: Coffee,
    count: 1,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    name: "Stickers",
    icon: StickyNote,
    count: 1,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    name: "Phone Cases",
    icon: Smartphone,
    count: 1,
    color: "bg-blue-500/10 text-blue-600",
  },
];

export function CategorySection() {
  return (
    <section className="bg-secondary/30 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find the perfect product type for your style
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/designs?category=${category.name}`}
                className="group flex items-center gap-4 rounded-xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}
                >
                  <category.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count} designs
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
