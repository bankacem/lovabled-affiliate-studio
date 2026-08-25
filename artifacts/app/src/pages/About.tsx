import { motion } from "framer-motion";
import { Heart, Target, Users, Sparkles, ArrowUpRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { language, t } = useLanguage();

  const values = [
    { icon: Heart, title: t("about.value1Title"), description: t("about.value1Desc") },
    { icon: Target, title: t("about.value2Title"), description: t("about.value2Desc") },
    { icon: Users, title: t("about.value3Title"), description: t("about.value3Desc") },
    { icon: Sparkles, title: t("about.value4Title"), description: t("about.value4Desc") },
  ];

  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/about"
    : `https://aiprintverse.com/${language}/about`;
  const copy = language === "ar"
    ? { eyebrow: "الاستوديو خلف كل طبعة", explore: "استكشف المجموعة", principles: "مبادئنا", studio: "استوديو AIPrintVerse", vision: "الرؤية", craft: "الحرفة", community: "المجتمع" }
    : language === "es"
      ? { eyebrow: "El estudio detrás de cada impresión", explore: "Explora la colección", principles: "Nuestros principios", studio: "Estudio AIPrintVerse", vision: "Visión", craft: "Oficio", community: "Comunidad" }
      : language === "fr"
        ? { eyebrow: "Le studio derrière chaque impression", explore: "Explorer la collection", principles: "Nos principes", studio: "Studio AIPrintVerse", vision: "Vision", craft: "Savoir-faire", community: "Communauté" }
        : { eyebrow: "The studio behind the print", explore: "Explore the collection", principles: "Our principles", studio: "AIPrintVerse studio", vision: "Vision", craft: "Craft", community: "Community" };

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.aboutTitle")}</title>
        <meta name="description" content={t("meta.aboutDesc")} />
        {language !== "en" && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#111318] text-white">
        <motion.div animate={{ x: [0, 16, 0], y: [0, -10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#F07167]/20 blur-3xl" />
        <motion.div animate={{ x: [0, -12, 0], y: [0, 12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#dbe3f3]/10 blur-3xl" />
        <div className="container relative mx-auto px-4 pb-20 pt-12 md:px-6 md:pb-28 md:pt-20">
          <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_.85fr]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
              <BrandLogo light />
              <p className="mt-16 text-xs font-bold uppercase tracking-[.24em] text-[#F07167]">{copy.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[.92] tracking-[-.07em] md:text-7xl lg:text-8xl">{t("about.title")}</h1>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .12 }} className="border-l border-white/15 pl-6 lg:mb-2">
              <p className="max-w-md text-base leading-7 text-white/65 md:text-lg">{t("about.description")}</p>
              <Link to={language === "en" ? "/designs" : `/${language}/designs`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-[#F07167]">
                {copy.explore} <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
          <div className="mt-16 grid grid-cols-3 border-t border-white/15 pt-5 text-xs uppercase tracking-[.16em] text-white/45 md:mt-24">
            <span>01 / {copy.vision}</span><span className="text-center">02 / {copy.craft}</span><span className="text-right">03 / {copy.community}</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f6f1] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-20">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#F07167]">{t("about.mission")}</p>
              <h2 className="mt-4 max-w-lg font-display text-4xl leading-[.98] tracking-[-.06em] text-[#111318] md:text-6xl">{t("about.missionTitle")}</h2>
              <div className="mt-8 space-y-5 text-base leading-7 text-[#6c6b70]">
                <p>{t("about.missionDesc1")}</p><p>{t("about.missionDesc2")}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-4 rounded-[2rem] border border-[#111318]/10" />
              <div className="relative aspect-[1.08/1] overflow-hidden rounded-[1.5rem] bg-[#172033]">
                <img src="/about-studio.jpg" alt="Design workspace" className="h-full w-full object-cover opacity-85 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#111318]/85 via-transparent to-[#F07167]/25" />
                <div className="absolute left-6 top-6 flex items-center gap-3 text-xs uppercase tracking-[.18em] text-white/60"><span className="h-2 w-2 rounded-full bg-[#F07167]" /> {copy.studio}</div>
              </div>
              <div className="absolute -bottom-6 -left-4 rounded-2xl bg-[#F07167] px-5 py-4 text-white shadow-xl md:-left-8"><p className="font-display text-3xl font-semibold">{t("about.curatedCount")}</p><p className="mt-1 text-xs uppercase tracking-[.14em] text-white/75">{t("about.curatedLabel")}</p></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-[#ece9e2] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#F07167]">{copy.principles}</p><h2 className="mt-3 font-display text-4xl tracking-[-.05em] text-[#111318] md:text-6xl">{t("about.valuesTitle")}</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[#6c6b70]">{t("about.valuesSubtitle")}</p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div key={value.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -8 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="group rounded-[1.25rem] border border-[#111318]/10 bg-[#f8f6f1] p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-[#9a9790]">0{index + 1}</span><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111318] text-[#F07167] transition-transform duration-300 group-hover:rotate-12"><value.icon className="h-5 w-5" /></div></div>
                <h3 className="mt-14 font-display text-xl tracking-[-.03em] text-[#111318]">{value.title}</h3><p className="mt-3 text-sm leading-6 text-[#6c6b70]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f6f1] px-4 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-3xl rounded-[1.5rem] bg-[#111318] p-8 text-center text-white md:p-14">
          <BrandLogo light showWordmark={false} markClassName="mx-auto h-12 w-12" />
          <h2 className="mt-6 font-display text-2xl tracking-[-.04em] md:text-3xl">{t("about.disclosureTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/60">{t("about.disclosureDesc")}</p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default About;
