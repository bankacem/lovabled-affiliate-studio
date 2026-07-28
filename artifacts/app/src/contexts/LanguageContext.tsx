import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { translations, TranslationDictionary } from "@/lib/translations";

export type Language = "en" | "ar" | "es" | "fr";

interface LanguageContextProps {
  language: Language;
  dir: "ltr" | "rtl";
  t: (key: string, variables?: Record<string, string | number>) => string;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Helper to determine language from pathname
export function getLanguageFromPathname(pathname: string): Language {
  const parts = pathname.split("/").filter(Boolean);
  const firstPart = parts[0];
  if (firstPart === "ar") return "ar";
  if (firstPart === "es") return "es";
  if (firstPart === "fr") return "fr";
  if (firstPart === "en") return "en";
  return "en"; // default language
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(() =>
    getLanguageFromPathname(window.location.pathname)
  );

  // Keep language state in sync with URL
  useEffect(() => {
    const currentLang = getLanguageFromPathname(location.pathname);
    if (currentLang !== language) {
      setLanguage(currentLang);
    }
  }, [location.pathname, language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  // Update HTML elements for SEO & Accessibility
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  // Translate helper supporting dot notation and dynamic variables replacement
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const dict = translations[language] as any;
    const parts = key.split(".");
    let value = dict;

    for (const part of parts) {
      if (value === undefined || value === null) break;
      value = value[part];
    }

    if (typeof value !== "string") {
      // Fallback to English dictionary if not found in current locale
      let fallbackValue = translations["en"] as any;
      for (const part of parts) {
        if (fallbackValue === undefined || fallbackValue === null) break;
        fallbackValue = fallbackValue[part];
      }
      if (typeof fallbackValue === "string") {
        value = fallbackValue;
      } else {
        return key; // return the key as fallback
      }
    }

    if (variables) {
      Object.entries(variables).forEach(([varKey, varVal]) => {
        value = (value as string).replace(new RegExp(`{${varKey}}`, "g"), String(varVal));
      });
    }

    return value as string;
  };

  const changeLanguage = (newLang: Language) => {
    if (newLang === language) return;

    const currentPath = location.pathname;
    const parts = currentPath.split("/").filter(Boolean);
    const firstPart = parts[0];

    // Determine current path without lang prefix
    let cleanPathParts = [...parts];
    if (firstPart === "ar" || firstPart === "es" || firstPart === "en" || firstPart === "fr") {
      cleanPathParts.shift();
    }

    const cleanPath = "/" + cleanPathParts.join("/");

    // Build new path with correct language prefix
    let newPath = "";
    if (newLang === "en") {
      // default language doesn't strictly need a prefix, but we can do "/about" directly
      newPath = cleanPath;
    } else {
      newPath = `/${newLang}${cleanPath === "/" ? "" : cleanPath}`;
    }

    // Retain query parameters
    const search = location.search;

    setLanguage(newLang);
    navigate(`${newPath}${search}`);
  };

  return (
    <LanguageContext.Provider value={{ language, dir, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
