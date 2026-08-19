# WheelFood — Meal Roulette

PWA שמחליטה בשבילך מה אוכלים: גלגל מנות עם סינון, היסטוריה, ומאגר מנות אישי.
עובדת אופליין, ניתנת להתקנה למסך הבית, וכל שכבת הנתונים מופשטת כדי שחיבור
Firebase יהיה שינוי של קובץ אחד.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4 + design tokens ב-`src/app/globals.css` |
| State | React Context (`src/lib/store.tsx`) |
| Storage | `LocalRepository` (localStorage) — Firebase נכנס במקומו |
| PWA | `src/app/manifest.ts` + `public/sw.js` (offline-first app shell) |
| Deps נוספות | אין. הגלגל, הקונפטי, הצלילים והאייקונים נבנים מאפס |

## הרצה

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
npm run typecheck  # tsc --noEmit
npm run lint
npm run icons      # מייצר מחדש את אייקוני ה-PWA
```

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
    repo/               שכבת האחסון (interface + local + firebase stub)
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

## חיבור Firebase

כל הקריאות והכתיבות עוברות דרך `DataRepository` (`src/lib/repo/types.ts`).
כדי לעבור ל-Firestore:

1. `npm i firebase`
2. להעתיק `.env.example` ל-`.env.local` ולמלא את משתני `NEXT_PUBLIC_FIREBASE_*`
   (מתוך Firebase Console → Project settings → Your apps → Web app).
3. לממש `FirebaseRepository` ב-`src/lib/repo/firebase.ts` מול אותו interface —
   `users/{uid}/meals`, `users/{uid}/history`, ומסמך `users/{uid}` לסינון
   ולהגדרות. `subscribe()` מתחבר ל-`onSnapshot` ונותן סנכרון בזמן אמת.
4. להחזיר אותו מ-`getRepository()` ב-`src/lib/repo/index.ts` כאשר
   `isFirebaseConfigured()` מחזיר true.

שום קומפוננטה לא משתנה — המסכים לא יודעים איפה הנתונים יושבים.

## עיצוב

הצבעים, הרדיוסים והצללים מוגדרים כמשתני CSS בראש `src/app/globals.css`
(`--wf-*`), ומופו ל-Tailwind דרך `@theme inline`. החלפת ערכת העיצוב = החלפת
הערכים בבלוק אחד, בלי לגעת בקומפוננטות.
