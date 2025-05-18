export const Currency = Object.freeze({
  USD: { en: "USD", ar: "دولار أمريكي" },
  EUR: { en: "EGP", ar: "جنيه مصري" },
});

export const Languages = Object.freeze({
  arabic: { en: "arabic", ar: "عربي" },
  english: { en: "english", ar: "إنجليزي" },
});

export const AccentsAndDialects = Object.freeze({
  american: { en: "american", ar: "الامريكية" },
  british: { en: "british", ar: "البريطانية" },
  egyptian: { en: "egyptian", ar: "المصرية" },
  syrian: { en: "syrian", ar: "السورية" },
});

export const Genders = Object.freeze({
  female: { en: "female", ar: "أنثي" },
  male: { en: "male", ar: "ذكر" },
});

export const UserRole = Object.freeze({
  ADMIN: "Admin",
  USER: "User",
});

export const TokenType = Object.freeze({
  ACCESS: "Access",
  REFRESH: "Refresh",
});
