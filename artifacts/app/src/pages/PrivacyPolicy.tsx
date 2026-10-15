import { ShieldCheck, Cookie, Link2, Mail } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

const sections = [
  {
    icon: ShieldCheck,
    title: "Information We Collect",
    body: [
      "AIPrintVerse does not require you to create an account to browse articles or designs. We collect a limited amount of information to operate and improve the site:",
      "• Usage data: pages visited, time spent, and referring pages, collected through privacy-respecting analytics.",
      "• Device data: browser type, operating system, and approximate location derived from your IP address, used only for aggregate statistics.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies & Advertising",
    body: [
      "We use cookies to keep the site working (for example, remembering your language preference) and to measure traffic.",
      "We plan to display ads served by Google AdSense. Google uses cookies — including the DoubleClick cookie — to serve ads based on your visits to this and other sites. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.",
      "You may opt out of personalized advertising by visiting Google's Ads Settings (https://www.google.com/settings/ads). Alternatively, you can opt out of third-party vendors' use of cookies for personalized advertising by visiting https://www.aboutads.info/choices/.",
    ],
  },
  {
    icon: Link2,
    title: "Affiliate Links",
    body: [
      "AIPrintVerse is a reader-supported site. Some links on this website — including links to Redbubble, TeePublic, Amazon, and Etsy — are affiliate links. If you click one and make a purchase, we may earn a commission at no extra cost to you.",
      "Affiliate partners operate their own websites with their own privacy policies; we encourage you to review them before providing personal information on those sites.",
    ],
  },
  {
    icon: Mail,
    title: "Your Rights & Contact",
    body: [
      "You may request access to, correction of, or deletion of any personal information we hold about you by emailing hello@aiprintverse.com. We will respond within a reasonable timeframe.",
      "This policy may be updated from time to time; the current version is always available at aiprintverse.com/privacy-policy. Continued use of the site after changes constitutes acceptance of the updated policy.",
    ],
  },
];

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/privacy-policy"
    : `https://aiprintverse.com/${language}/privacy-policy`;

  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy | AIPrintVerse</title>
        <meta name="description" content="How AIPrintVerse collects, uses, and protects your information — including cookies, advertising, and affiliate links." />
        {language !== "en" && <meta name="robots" content="noindex, follow" />}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#111318] text-white">
        <div className="container relative mx-auto px-4 pb-16 pt-12 md:px-6 md:pb-20 md:pt-16">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-[#F07167]">Legal</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[.95] tracking-[-.05em] md:text-6xl">Privacy Policy</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">Last updated: October 15, 2026. Plain-language summary of how we handle your information.</p>
        </div>
      </section>

      <section className="bg-[#f8f6f1] py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="rounded-[1.25rem] border border-[#111318]/10 bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111318] text-[#F07167]">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl tracking-[-.03em] text-[#111318] md:text-2xl">{section.title}</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#6c6b70] md:text-base">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicy;
