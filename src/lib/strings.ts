import type { Category, Kind } from "@/lib/types";

/**
 * All user-facing copy lives here so the UI can be re-languaged (or flipped
 * to LTR English) without touching components.
 */
export const t = {
  appName: "WheelFood",
  tagline: "מה אוכלים היום?",

  nav: {
    wheel: "גלגל",
    meals: "מנות",
    history: "היסטוריה",
    settings: "הגדרות",
  },

  wheel: {
    spin: "סובב!",
    spinning: "מסתובב…",
    againShort: "עוד סיבוב",
    poolCount: (n: number) => `${n} מנות במאגר`,
    emptyTitle: "אין מנות שמתאימות",
    emptyBody: "נסה לשחרר קצת את הסינון, או להוסיף מנות חדשות.",
    emptyAction: "להוסיף מנה",
    noMealsTitle: "המאגר ריק",
    noMealsBody: "הוסף כמה מנות שאתה אוהב ונתחיל לסובב.",
  },

  result: {
    title: "היום אוכלים",
    accept: "יאללה, זה מה שאוכלים",
    reroll: "לא בא לי, עוד סיבוב",
    saved: "נשמר בהיסטוריה",
  },

  filters: {
    title: "סינון",
    open: "סינון",
    clear: "נקה הכל",
    apply: "החל סינון",
    categories: "ארוחה",
    kinds: "סוג",
    tags: "תגיות",
    maxPrep: "זמן הכנה מקסימלי",
    anyTime: "ללא הגבלה",
    maxCost: "תקציב",
    anyCost: "ללא הגבלה",
    favoritesOnly: "מועדפים בלבד",
    excludeRecent: "לדלג על מנות מהימים האחרונים",
    excludeRecentOff: "כבוי",
    days: (n: number) => `${n} ימים`,
    activeCount: (n: number) => (n === 1 ? "מסנן אחד פעיל" : `${n} מסננים פעילים`),
  },

  meals: {
    title: "המנות שלי",
    add: "מנה חדשה",
    edit: "עריכת מנה",
    search: "חיפוש מנה…",
    empty: "עדיין אין מנות",
    emptyBody: "הוסף את המנות שאתה אוהב והגלגל יעשה את השאר.",
    disabled: "מושבת",
    enable: "הפעל",
    disable: "השבת",
    delete: "מחק",
    deleteConfirm: "למחוק את המנה?",
    count: (n: number) => `${n} מנות`,
  },

  form: {
    name: "שם המנה",
    namePlaceholder: "לדוגמה: פסטה ברוטב עגבניות",
    emoji: "אימוג׳י",
    categories: "מתאים ל…",
    kind: "סוג",
    tags: "תגיות",
    tagsPlaceholder: "הוסף תגית ולחץ Enter",
    prep: "זמן הכנה (דקות)",
    cost: "עלות",
    weight: "כמה בא לי את זה?",
    weightHint: "משפיע על הסיכוי שהמנה תעלה בגלגל",
    notes: "הערות",
    notesPlaceholder: "מתכון, מסעדה, כל דבר…",
    enabled: "פעילה בגלגל",
    favorite: "מועדפת",
    save: "שמור",
    cancel: "ביטול",
    required: "צריך שם למנה",
  },

  history: {
    title: "היסטוריה",
    empty: "עוד לא סובבת כלום",
    emptyBody: "כל סיבוב שתאשר יופיע כאן.",
    clear: "נקה היסטוריה",
    clearConfirm: "למחוק את כל ההיסטוריה?",
    accepted: "אושר",
    skipped: "דילגת",
    today: "היום",
    yesterday: "אתמול",
  },

  settings: {
    title: "הגדרות",
    appearance: "מראה",
    theme: "ערכת נושא",
    themeSystem: "לפי המערכת",
    themeLight: "בהיר",
    themeDark: "כהה",
    feedback: "משוב",
    haptics: "רטט",
    sound: "צלילים",
    reduceMotion: "הפחתת אנימציות",
    wheel: "גלגל",
    wheelSize: "מספר משבצות",
    data: "נתונים",
    exportData: "ייצוא נתונים",
    importData: "ייבוא נתונים",
    resetData: "איפוס לברירת מחדל",
    resetConfirm: "לאפס את כל הנתונים? זה ימחק את המנות גם אצל המשתמשים האחרים.",
    storage: "אחסון",
    storageConnecting: "מתחבר…",
    storageCloud: "מרחב משותף",
    storageCloudBody:
      "המנות וההיסטוריה משותפות לכל מי שפותח את האפליקציה ומתעדכנות אצל כולם בזמן אמת. ההגדרות והסינון נשארים אישיים לכל מכשיר.",
    storageLocal: "מקומי במכשיר",
    storageLocalBody: "הנתונים נשמרים בדפדפן הזה בלבד.",
    storageFallback: "מקומי במכשיר (החיבור לענן נכשל)",
    storageFallbackBody:
      "לא הצלחנו להתחבר ל-Firebase, אז האפליקציה עובדת מקומית. הנתונים לא ילכו לאיבוד — הם יסונכרנו בפעם הבאה שהחיבור יעבוד.",
    install: "התקנת האפליקציה",
    installBody: "הוסף את WheelFood למסך הבית לחוויה מלאה.",
    installAction: "התקן",
    installed: "האפליקציה מותקנת",
    about: "אודות",
    version: "גרסה",
  },

  common: {
    back: "חזרה",
    close: "סגירה",
    loading: "טוען…",
    offline: "אין חיבור לרשת — עובדים על מה שנשמר במכשיר.",
    minutes: (n: number) => `${n} דק׳`,
  },
} as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: "בוקר",
  lunch: "צהריים",
  dinner: "ערב",
  snack: "נשנוש",
  dessert: "קינוח",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍿",
  dessert: "🍰",
};

export const KIND_LABELS: Record<Kind, string> = {
  home: "בית",
  takeout: "טייק אווי",
  restaurant: "מסעדה",
};

export const KIND_EMOJI: Record<Kind, string> = {
  home: "🏠",
  takeout: "🛵",
  restaurant: "🍽️",
};

export const COST_LABELS: Record<number, string> = {
  1: "₪",
  2: "₪₪",
  3: "₪₪₪",
};
