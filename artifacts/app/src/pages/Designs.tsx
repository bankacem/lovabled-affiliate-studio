import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Grid3X3,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
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

const copy = {
  en: {
    eyebrow: "THE AIPrintVerse COLLECTION",
    result: "designs ready to explore",
    formats: "formats",
    storefronts: "storefronts",
    collection: "Curated collection",
    filter: "Filter the collection",
    clear: "Clear filters",
    retry: "Try again",
    errorTitle: "The collection is taking a short pause",
    errorDescription: "We could not load the designs right now. Please try again in a moment.",
    emptyTitle: "Nothing matches this search yet",
    emptyDescription: "Try another keyword or clear the filters to browse the full collection.",
    emptyCollectionTitle: "The collection is being curated",
    emptyCollectionDescription: "New print-ready ideas are on their way. Check back soon for the next drop.",
    loading: "Loading the collection...",
  },
  es: {
    eyebrow: "LA COLECCIÓN AIPrintVerse",
    result: "diseños para explorar",
    formats: "formatos",
    storefronts: "tiendas",
    collection: "Colección seleccionada",
    filter: "Filtrar la colección",
    clear: "Limpiar filtros",
    retry: "Intentar de nuevo",
    errorTitle: "La colección está en pausa",
    errorDescription: "No pudimos cargar los diseños. Inténtalo de nuevo en un momento.",
    emptyTitle: "Nada coincide con esta búsqueda",
    emptyDescription: "Prueba otra palabra o limpia los filtros para ver toda la colección.",
    emptyCollectionTitle: "La colección está en preparación",
    emptyCollectionDescription: "Nuevas ideas listas para imprimir llegarán pronto.",
    loading: "Cargando la colección...",
  },
  ar: {
    eyebrow: "مجموعة AIPrintVerse",
    result: "تصميمًا جاهزًا للاستكشاف",
    formats: "فئات",
    storefronts: "متجرين",
    collection: "مجموعة مختارة",
    filter: "تصفية المجموعة",
    clear: "مسح الفلاتر",
    retry: "حاول مجددًا",
    errorTitle: "المجموعة متوقفة مؤقتًا",
    errorDescription: "تعذر تحميل التصاميم الآن. حاول مرة أخرى بعد لحظات.",
    emptyTitle: "لا توجد نتائج لهذا البحث",
    emptyDescription: "جرّب كلمة أخرى أو امسح الفلاتر لعرض المجموعة كاملة.",
    emptyCollectionTitle: "المجموعة قيد الإعداد",
    emptyCollectionDescription: "أفكار جديدة جاهزة للطباعة ستصل قريبًا.",
    loading: "جارٍ تحميل المجموعة...",
  },
  fr: {
    eyebrow: "LA COLLECTION AIPrintVerse",
    result: "designs à explorer",
    formats: "formats",
    storefronts: "boutiques",
    collection: "Collection sélectionnée",
    filter: "Filtrer la collection",
    clear: "Effacer les filtres",
    retry: "Réessayer",
    errorTitle: "La collection fait une courte pause",
    errorDescription: "Les designs ne peuvent pas être chargés pour le moment. Réessayez dans un instant.",
    emptyTitle: "Aucun résultat pour cette recherche",
    emptyDescription: "Essayez un autre mot ou effacez les filtres pour parcourir toute la collection.",
    emptyCollectionTitle: "La collection est en préparation",
    emptyCollectionDescription: "De nouvelles idées prêtes à imprimer arrivent bientôt.",
    loading: "Chargement de la collection...",
  },
} as const;

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading designs">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="aspect-square animate-pulse bg-[#e9e5dc] dark:bg-white/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#e9e5dc] dark:bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#e9e5dc] dark:bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#e9e5dc] dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

const Designs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();
  const pageCopy = copy[language as keyof typeof copy] || copy.en;

  const { data: designs = [], isLoading, error, refetch } = useDesigns();

  const filteredDesigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return designs.filter((design) => {
      const matchesCategory = selectedCategory === "All" || design.category === selectedCategory;
      const matchesSearch = !query || design.name.toLowerCase().includes(query) ||
        (design.tags || []).some((tag: string) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [designs, selectedCategory, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const nextParams = new URLSearchParams(searchParams);
    if (category === "All") nextParams.delete("category");
    else nextParams.set("category", category);
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchQuery("");
    handleCategoryChange("All");
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "All") {
      if (language === "ar") return "الكل";
      if (language === "es") return "Todos";
      if (language === "fr") return "Tous";
      return "All";
    }
    const keyMap: Record<string, string> = {
      "T-Shirts": t("categories.tshirts"),
      Hoodies: t("categories.hoodies"),
      Mugs: t("categories.mugs"),
      Stickers: t("categories.stickers"),
      "Phone Cases": t("categories.phoneCases"),
      Posters: t("categories.posters"),
    };
    return keyMap[cat] || cat;
  };

  const canonicalUrl = language === "en" ? "https://aiprintverse.com/designs" : `https://aiprintverse.com/${language}/designs`;
  const hasFilters = Boolean(searchQuery.trim()) || selectedCategory !== "All";
  const shouldNoIndex = language !== "en" || hasFilters;

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.designsTitle")}</title>
        <meta name="description" content={t("meta.designsDesc")} />
        {shouldNoIndex && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#f4f1eb] pb-20 pt-12 dark:bg-[#111318] md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#f07167]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#263957]/10 blur-3xl" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f07167]/20 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c95b54] shadow-sm dark:bg-white/10 dark:text-[#ff9a91]">
              <Sparkles className="h-3.5 w-3.5" />
              {pageCopy.eyebrow}
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#20232b] dark:text-white md:text-6xl">
              {t("designs.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#66646a] dark:text-white/60 md:text-lg">
              {t("designs.subtitle")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mx-auto mt-10 grid max-w-3xl grid-cols-3 divide-x divide-black/10 rounded-[1.4rem] border border-black/5 bg-white/75 p-1 shadow-lg shadow-black/5 backdrop-blur dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.06]">
            <div className="px-3 py-4 text-center md:px-6"><p className="font-display text-2xl font-semibold text-[#20232b] dark:text-white">{designs.length || "—"}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77747a] dark:text-white/50">{pageCopy.result}</p></div>
            <div className="px-3 py-4 text-center md:px-6"><p className="font-display text-2xl font-semibold text-[#20232b] dark:text-white">{categories.length - 1}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77747a] dark:text-white/50">{pageCopy.formats}</p></div>
            <div className="px-3 py-4 text-center md:px-6"><p className="font-display text-2xl font-semibold text-[#20232b] dark:text-white">2</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77747a] dark:text-white/50">{pageCopy.storefronts}</p></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mt-12 rounded-[1.6rem] border border-black/5 bg-white p-4 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-[#191b21] md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#282a31] dark:text-white"><SlidersHorizontal className="h-4 w-4 text-[#f07167]" />{pageCopy.filter}</div>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96939a]" />
                <Input type="search" placeholder={t("designs.searchPlaceholder")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11 rounded-full border-black/10 bg-[#f8f6f1] pe-10 ps-11 text-sm dark:border-white/10 dark:bg-white/[0.06]" aria-label={t("designs.searchPlaceholder")} />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#77747a] transition-colors hover:bg-black/5 hover:text-[#20232b] dark:hover:bg-white/10 dark:hover:text-white" aria-label="Clear search"><X className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={pageCopy.filter}>
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => handleCategoryChange(category)} aria-pressed={selectedCategory === category} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97]", selectedCategory === category ? "border-[#f07167] bg-[#f07167] text-white shadow-md shadow-[#f07167]/20" : "border-black/10 bg-transparent text-[#6d6a70] hover:border-[#f07167]/40 hover:text-[#c95b54] dark:border-white/10 dark:text-white/60 dark:hover:text-white")}>{getCategoryLabel(category)}</button>
              ))}
            </div>
          </motion.div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#77747a] dark:text-white/50"><Grid3X3 className="h-4 w-4" /><span>{pageCopy.collection}</span>{!isLoading && !error && <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">{filteredDesigns.length}</span>}</div>
            {hasFilters && !isLoading && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#c95b54] transition-colors hover:text-[#20232b] dark:hover:text-white">{pageCopy.clear}<ArrowUpRight className="h-3.5 w-3.5" /></button>}
          </div>

          <div className="mt-5">
            {isLoading ? <LoadingGrid /> : error ? (
              <div className="rounded-[1.6rem] border border-[#f07167]/20 bg-white p-10 text-center shadow-lg shadow-black/5 dark:border-[#f07167]/20 dark:bg-white/[0.04] md:p-16">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f07167]/10 text-[#f07167]"><RotateCcw className="h-6 w-6" /></div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-[#20232b] dark:text-white">{pageCopy.errorTitle}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77747a] dark:text-white/55">{pageCopy.errorDescription}</p>
                <button type="button" onClick={() => refetch()} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#20232b] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.97] dark:bg-white dark:text-[#20232b]"><RotateCcw className="h-4 w-4" />{pageCopy.retry}</button>
              </div>
            ) : filteredDesigns.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredDesigns.map((design, index) => <DesignCard key={design.id} design={design} index={index} />)}</div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-white/[0.03] md:p-16">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#263957]/10 text-[#263957] dark:bg-white/10 dark:text-white"><Search className="h-6 w-6" /></div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-[#20232b] dark:text-white">{hasFilters ? pageCopy.emptyTitle : pageCopy.emptyCollectionTitle}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77747a] dark:text-white/55">{hasFilters ? pageCopy.emptyDescription : pageCopy.emptyCollectionDescription}</p>
                {hasFilters && <button type="button" onClick={clearFilters} className="mt-7 inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-[#20232b] transition-colors hover:border-[#f07167] hover:text-[#c95b54] dark:border-white/10 dark:text-white">{pageCopy.clear}<ArrowUpRight className="h-4 w-4" /></button>}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Designs;
