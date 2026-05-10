import { useState, useCallback } from "react";
import { getLanguage, setLanguage } from "@/lib/i18n";

export const useLanguage = () => {
  const [lang, setLang] = useState(getLanguage());

  const changeLang = useCallback((newLang: string) => {
    setLanguage(newLang);
    setLang(newLang);
  }, []);

  return { lang, changeLang };
};
