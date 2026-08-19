# WheelFood — Meal Roulette

PWA שמחליטה בשבילך מה אוכלים: גלגל מנות עם סינון, היסטוריה, ומאגר מנות אישי.
עובדת אופליין, ניתנת להתקנה למסך הבית, ומסנכרנת את הנתונים ל-Firestore.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4 + design tokens ב-`src/app/globals.css` |
| State | React Context (`src/lib/store.tsx`) |
| Storage | Firestore (anonymous auth) עם נפילה חזרה ל-localStorage |
| PWA | `src/app/manifest.ts` + `public/sw.js` (offline-first app shell) |
| Deps נוספות | `firebase` בלבד. הגלגל, הקונפטי, הצלילים והאייקונים נבנים מאפס |

## הרצה

```bash
npm install
cp .env.example .env.local   # ומלא את ערכי Firebase
npm run dev                  # http://localhost:3000
npm run build                # פלט סטטי לתיקיית out/
npm run start                # מגיש את out/ (השרת ה-dev לא נדרש)
npm run typecheck
npm run lint
npm run icons                # מייצר מחדש את אייקוני ה-PWA
```

הבנייה היא `output: "export"` — כל המסלולים סטטיים, אין קוד שרת, והאפליקציה
מתארחת על כל CDN.

## מבנה

```
src/
  app/
    layout.tsx          RTL shell, פונט, מטא-דאטה של PWA, ניווט תחתון
    page.tsx            מסך הגלגל
    meals/              ניהול מאגר המנות
    history/            היסטוריית סיבובים
    settings/           ערכת נושא, משוב, ייצוא/ייבוא, איפוס
    manifest.ts         web app manifest
    offline/            fallback כשאין רשת ואין cache
  components/
    Wheel.tsx           הגלגל (SVG + CSS transform, טיקים לפי הסיבוב האמיתי)
    WheelScreen.tsx     לוגיקת הסיבוב, ההגרלה והתוצאה
    FilterSheet.tsx     סינון
    MealForm.tsx        יצירה/עריכה של מנה
    ui/                 Button, Chip, Card, Sheet, Field, EmptyState
  lib/
    types.ts            מודל הנתונים
    repo/               שכבת האחסון (interface + local + firestore)
    firebase/client.ts  אתחול ה-SDK והתחברות אנונימית
    selection.ts        סינון, הגרלה משוקללת, בחירת מנצח
    store.tsx           Context שמחבר בין ה-UI ל-repository
    strings.ts          כל הטקסטים במקום אחד
    random.ts           PRNG דטרמיניסטי (שומר על render טהור)
    feedback.ts         רטט + צלילים (Web Audio)
public/
  sw.js                 service worker
  icons/                אייקוני PWA (נוצרים ע"י scripts/generate-icons.mjs)
```

## איך הגלגל עובד

1. `filterMeals` מצמצם את המאגר לפי הסינון הפעיל (ארוחה, סוג, תגיות, זמן
   הכנה, תקציב, מועדפים, ודילוג על מה שיצא לאחרונה).
2. `drawCandidates` מגריל מתוך המאגר עד `settings.wheelSize` מנות — משוקלל לפי
   `weight` של כל מנה. ההגרלה דטרמיניסטית (seed לפי המאגר + nonce של כפתור
   הערבוב) כדי ש-render יישאר טהור וה-SSR וה-client יסכימו.
3. `pickWinner` בוחר משבצת מבין מה שמוצג על המסך — אין תוצאות נסתרות.
4. הגלגל מסתובב ל-`-(index * slice + slice/2)` פלוס כמה סיבובים שלמים, עם
   ג'יטר קטן בתוך המשבצת. הטיקים נקראים מה-transform האמיתי כל frame.

## Firebase

הפרויקט מחובר ל-`foodwheel-3aebd`. הקונפיג נקרא ממשתני `NEXT_PUBLIC_FIREBASE_*`
(ראה `.env.example`); בלעדיהם האפליקציה נופלת חזרה ל-localStorage בלי לשבור כלום.

**מבנה הנתונים ב-Firestore**

```
users/{uid}                -> (ריק, מחזיק את תתי-האוספים)
users/{uid}/profile/main   -> { filters, settings }
users/{uid}/meals/{id}     -> Meal
users/{uid}/history/{id}   -> SpinRecord
```

כל מכשיר מתחבר ב-**anonymous auth**, וה-uid הוא הגבול היחיד בין משתמשים —
`firestore.rules` מאפשר קריאה/כתיבה רק כשה-uid בטוקן שווה ל-uid בנתיב.
המידע נקרא דרך `onSnapshot`, כך שכל שינוי מתעדכן בזמן אמת בכל הלשוניות
והמכשירים, ו-`persistentLocalCache` נותן קריאה וכתיבה גם בלי רשת (הכתיבות
מתנקזות כשהחיבור חוזר).

**מה צריך להיות מופעל בקונסולה**

| | |
|---|---|
| Firestore Database | ✅ קיים |
| Authentication → Anonymous | ⚠️ צריך הפעלה — בלעדיו האפליקציה עובדת מקומית בלבד |

**דיפלוי**

```bash
npx firebase-tools login
npm run deploy      # build + deploy של hosting ושל firestore.rules
```

## עיצוב

הצבעים, הרדיוסים והצללים מוגדרים כמשתני CSS בראש `src/app/globals.css`
(`--wf-*`), ומופו ל-Tailwind דרך `@theme inline`. החלפת ערכת העיצוב = החלפת
הערכים בבלוק אחד, בלי לגעת בקומפוננטות.
