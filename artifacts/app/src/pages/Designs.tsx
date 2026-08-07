import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { DesignCard } from "@/components/designs/DesignCard";
import { useDesigns } from "@/hooks/useDesigns";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = [
  "All",
  "T-Shirts",
  "Hoodies",
  "Mugs",
  "Stickers",
  "Phone Cases",
  "Posters",
];

const Designs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();

  const { data: designs = [], isLoading } = useDesigns();

  const filteredDesigns = useMemo(() => {
    return designs.filter((design) => {
      const matchesCategory =
        selectedCategory === "All" || design.category === selectedCategory;
      const matchesSearch =
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (design.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [designs, selectedCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "All") {
      if (language === "ar") return "الكل";
      if (language === "es") return "Todos";
      return "All";
    }
    const keyMap: Record<string, string> = {
      "T-Shirts": t("categories.tshirts"),
      "Hoodies": t("categories.hoodies"),
      "Mugs": t("categories.mugs"),
      "Stickers": t("categories.stickers"),
      "Phone Cases": t("categories.phoneCases"),
      "Posters": t("categories.posters"),
    };
    return keyMap[cat] || cat;
  };

  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/designs"
    : `https://aiprintverse.com/${language}/designs`;

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.designsTitle")}</title>
        <meta name="description" content={t("meta.designsDesc")} />
        {language !== "en" && (
          // Content on this locale route is UI-translated only; the underlying
          // copy is still English. Keep it out of the index until real
          // per-language content exists, to avoid thin/duplicate-content pages.
          <meta name="robots" content="noindex, follow" />
        )}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              {t("designs.title")}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {t("designs.subtitle")}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("designs.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results */}
          <div className="mt-10">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading designs...</p>
              </div>
            ) : filteredDesigns.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDesigns.map((design, index) => (
                  <DesignCard key={design.id} design={design} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">
                  {t("designs.noDesigns")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Designs;
