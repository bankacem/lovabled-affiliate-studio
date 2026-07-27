import { motion } from "framer-motion";
import { Heart, Target, Users, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { language, t } = useLanguage();

  const values = [
    {
      icon: Heart,
      title: t("about.value1Title"),
      description: t("about.value1Desc"),
    },
    {
      icon: Target,
      title: t("about.value2Title"),
      description: t("about.value2Desc"),
    },
    {
      icon: Users,
      title: t("about.value3Title"),
      description: t("about.value3Desc"),
    },
    {
      icon: Sparkles,
      title: t("about.value4Title"),
      description: t("about.value4Desc"),
    },
  ];

  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/about"
    : `https://aiprintverse.com/${language}/about`;

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.aboutTitle")}</title>
        <meta name="description" content={t("meta.aboutDesc")} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              {t("about.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {t("about.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-medium text-primary">{t("about.mission")}</span>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("about.missionTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("about.missionDesc1")}
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t("about.missionDesc2")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
                  alt="Design workspace"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
                <p className="text-2xl font-bold">{t("about.curatedCount")}</p>
                <p className="text-sm">{t("about.curatedLabel")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("about.valuesSubtitle")}
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl bg-card p-6 shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-card-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-secondary/50 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t("about.disclosureTitle")}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {t("about.disclosureDesc")}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
