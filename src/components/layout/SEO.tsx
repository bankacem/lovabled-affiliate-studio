import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  noindex = false,
}: SEOProps) {
  const siteTitle = "AIPrintVerse";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = "Discover AI-curated print-on-demand designs for t-shirts, mugs, stickers and more.";
  const baseUrl = "https://aiprintverse.com";

  useEffect(() => {
    // Update Title
    document.title = fullTitle;

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description || defaultDescription);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content = description || defaultDescription;
      document.head.appendChild(newMeta);
    }

    // Update Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (linkCanonical) {
        linkCanonical.setAttribute("href", canonical.startsWith("http") ? canonical : `${baseUrl}${canonical}`);
      } else {
        linkCanonical = document.createElement("link");
        linkCanonical.setAttribute("rel", "canonical");
        linkCanonical.setAttribute("href", canonical.startsWith("http") ? canonical : `${baseUrl}${canonical}`);
        document.head.appendChild(linkCanonical);
      }
    } else if (linkCanonical) {
      // Set current URL as default canonical if not provided
      linkCanonical.setAttribute("href", window.location.href);
    } else {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      linkCanonical.setAttribute("href", window.location.href);
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
    updateOgTag("og:description", description || defaultDescription);
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
    updateTwitterTag("twitter:description", description || defaultDescription);
    updateTwitterTag("twitter:card", twitterCard);
    if (ogImage) {
      updateTwitterTag("twitter:image", ogImage);
    }

    // Update Robots
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (robotsMeta) {
        robotsMeta.setAttribute("content", "noindex, nofollow");
      } else {
        robotsMeta = document.createElement("meta");
        robotsMeta.setAttribute("name", "robots");
        robotsMeta.setAttribute("content", "noindex, nofollow");
        document.head.appendChild(robotsMeta);
      }
    } else if (robotsMeta) {
      robotsMeta.setAttribute("content", "index, follow");
    }

  }, [fullTitle, description, canonical, ogImage, ogType, twitterCard, noindex]);

  return null;
}
