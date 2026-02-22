import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
}: SEOProps) {
  const siteTitle = "AIPrintVerse";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = "Discover AI-curated print-on-demand designs for t-shirts, mugs, stickers and more.";
  const baseUrl = "https://aiprintverse.com";

  useEffect(() => {
    // Update Title
    document.title = fullTitle;

    // Smart Fallback Description
    const smartDescription = description || (title && title !== "Home"
      ? `${title} - Explore the latest AI-curated designs and insights on AIPrintVerse. ${defaultDescription}`
      : defaultDescription);

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", smartDescription);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content = smartDescription;
      document.head.appendChild(newMeta);
    }

    // Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    // Ensure absolute URL and strip query params/hashes for self-referencing canonicals
    const cleanCurrentUrl = window.location.origin + window.location.pathname;
    const fullCanonical = canonical
      ? (canonical.startsWith("http") ? canonical : `${baseUrl}${canonical.startsWith("/") ? canonical : `/${canonical}`}`)
      : cleanCurrentUrl;

    if (linkCanonical) {
      linkCanonical.setAttribute("href", fullCanonical);
    } else {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      linkCanonical.setAttribute("href", fullCanonical);
      document.head.appendChild(linkCanonical);
    }

    // Update Open Graph tags
    const updateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
      }
    };

    updateOgTag("og:title", fullTitle);
    updateOgTag("og:description", smartDescription);
    updateOgTag("og:type", ogType);
    if (ogImage) {
      updateOgTag("og:image", ogImage);
    }

    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute("content", content);
      } else {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        tag.setAttribute("content", content);
        document.head.appendChild(tag);
      }
    };

    updateTwitterTag("twitter:title", fullTitle);
    updateTwitterTag("twitter:description", smartDescription);
    updateTwitterTag("twitter:card", twitterCard);
    if (ogImage) {
      updateTwitterTag("twitter:image", ogImage);
    }

  }, [fullTitle, title, description, canonical, ogImage, ogType, twitterCard]);

  return null;
}
