import { motion } from "framer-motion";
import { Mail, MessageCircle, Newspaper } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

const cards = [
  {
    icon: Mail,
    title: "General Inquiries",
    description: "Questions about the site, our guides, or anything else — we read every message.",
    action: "hello@aiprintverse.com",
    href: "mailto:hello@aiprintverse.com",
  },
  {
    icon: MessageCircle,
    title: "Design Requests",
    description: "Looking for a specific print-on-demand design or want us to cover a topic?",
    action: "hello@aiprintverse.com",
    href: "mailto:hello@aiprintverse.com?subject=Design%20request",
  },
  {
    icon: Newspaper,
    title: "Corrections",
    description: "Spotted an error in one of our guides? Tell us and we'll fix it promptly.",
    action: "hello@aiprintverse.com",
    href: "mailto:hello@aiprintverse.com?subject=Correction",
  },
];

const Contact = () => {
  const { language } = useLanguage();
  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/contact"
    : `https://aiprintverse.com/${language}/contact`;

  return (
    <Layout>
      <Helmet>
        <title>Contact Us | AIPrintVerse</title>
        <meta name="description" content="Get in touch with the AIPrintVerse team — questions, design requests, and corrections." />
        {language !== "en" && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#111318] text-white">
        <div className="container relative mx-auto px-4 pb-16 pt-12 md:px-6 md:pb-20 md:pt-16">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-[#F07167]">Get in touch</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[.95] tracking-[-.05em] md:text-6xl">Contact Us</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">We read every message and usually reply within a couple of days.</p>
        </div>
      </section>

      <section className="bg-[#f8f6f1] py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card, index) => (
              <motion.a
                key={card.title}
                href={card.href}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * .08 }}
                className="group rounded-[1.25rem] border border-[#111318]/10 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111318] text-[#F07167] transition-transform duration-300 group-hover:rotate-12">
                  <card.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-6 font-display text-xl tracking-[-.03em] text-[#111318]">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#6c6b70]">{card.description}</p>
                <p className="mt-4 text-sm font-semibold text-[#F07167]">{card.action}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
