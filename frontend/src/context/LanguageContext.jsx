import React, { createContext, useContext, useState } from "react";
import en from "../locales/en";
import ja from "../locales/ja";

const translations = { en, ja };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ja"); // Default: Japanese

  const t = (key) => translations[lang][key] || translations["en"][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

// Convenience hook — returns just the translate function
export function useT() {
  return useLanguage().t;
}
