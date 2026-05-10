const translations: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    matches: "Matches",
    profile: "Profile",
    admin: "Admin",
    search: "Search channels...",
    todayMatches: "Today's Matches",
    sports: "Sports",
    movies: "Movies",
    news: "News",
    kids: "Kids",
    music: "Music",
    allChannels: "All Channels",
    live: "LIVE",
    free: "FREE",
    pro: "PRO",
    login: "Login",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    subscriptionStatus: "Subscription Status",
    subscriptionExpiry: "Subscription Expiry",
    active: "Active",
    pending: "Pending",
    blocked: "Blocked",
    trialExpired: "Trial Expired",
    trialMessage: "Your 2-minute free trial has ended.",
    paymentMessage: "To activate your subscription, send payment proof screenshot to WhatsApp: +255678180123",
    suggestedChannels: "Suggested Channels",
    noResults: "No channels found",
    notifications: "Notifications",
    language: "Language",
    logout: "Logout",
    watchNow: "Watch Now",
    freeTrialEnded: "Free Trial Ended",
    subscribeMessage: "Your 2-minute free trial has ended. To activate your subscription, send payment proof to WhatsApp.",
    contactWhatsApp: "Contact WhatsApp",
    freeTrial: "Free Trial",
    searchResults: "Search Results",
  },
  sw: {
    home: "Nyumbani",
    matches: "Mechi",
    profile: "Wasifu",
    admin: "Msimamizi",
    search: "Tafuta chaneli...",
    todayMatches: "Mechi za Leo",
    sports: "Michezo",
    movies: "Filamu",
    news: "Habari",
    kids: "Watoto",
    music: "Muziki",
    allChannels: "Chaneli Zote",
    live: "MOJA KWA MOJA",
    free: "BURE",
    pro: "PRO",
    login: "Ingia",
    signup: "Jisajili",
    email: "Barua pepe",
    password: "Nenosiri",
    firstName: "Jina la Kwanza",
    lastName: "Jina la Mwisho",
    phone: "Nambari ya Simu",
    subscriptionStatus: "Hali ya Usajili",
    subscriptionExpiry: "Muda wa Usajili",
    active: "Hai",
    pending: "Inasubiri",
    blocked: "Imezuiwa",
    trialExpired: "Jaribio Limeisha",
    trialMessage: "Jaribio lako la bure la dakika 2 limeisha.",
    paymentMessage: "Kuamilisha usajili wako, tuma picha ya uthibitisho wa malipo kwenye WhatsApp: +255678180123",
    suggestedChannels: "Chaneli Zinazopendekezwa",
    noResults: "Hakuna chaneli zilizopatikana",
    notifications: "Arifa",
    language: "Lugha",
    logout: "Toka",
    watchNow: "Tazama Sasa",
    freeTrialEnded: "Jaribio Bure Limeisha",
    subscribeMessage: "Jaribio lako la bure la dakika 2 limeisha. Kuamilisha usajili wako, tuma uthibitisho wa malipo kwenye WhatsApp.",
    contactWhatsApp: "Wasiliana WhatsApp",
    freeTrial: "Jaribio Bure",
    searchResults: "Matokeo ya Utafutaji",
  },
};

let currentLang = "en";

export const setLanguage = (lang: string) => {
  currentLang = lang;
  localStorage.setItem("uhuru-stream-lang", lang);
};

export const getLanguage = () => {
  return localStorage.getItem("uhuru-stream-lang") || "en";
};

export const t = (key: string): string => {
  const lang = getLanguage();
  return translations[lang]?.[key] || translations.en[key] || key;
};
