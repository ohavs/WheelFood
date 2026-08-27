# WheelFood — Meal Roulette

PWA שמחליטה בשבילך מה אוכלים: גלגל מנות עם סינון, היסטוריה, ומאגר מנות אישי.
עובדת אופליין, ניתנת להתקנה למסך הבית, ומסנכרנת את הנתונים ל-Firestore.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4 + design tokens ב-`src/app/globals.css` |
| State | React Context (`src/lib/store.tsx`) |
| Storage | Firestore — מרחב משותף לכל המשתמשים, עם נפילה חזרה ל-localStorage |
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

## שני צדדים

האפליקציה חצויה לכל אורכה: **מבשלים בבית** מול **אוכלים בחוץ** (טייק אווי
ומסעדות). לכל צד רשימת מנות משלו ב"המנות שלי" וגלגל משלו — כולל זווית עצירה
נפרדת, כך שמעבר בין הטאבים לא מאפס את הגלגל השני. הצד הפעיל נשמר ב-`filters.mode`
(מקומי לכל מכשיר), והמיפוי בין הצדדים ל-`kind` יושב ב-`MODE_KINDS`.

## איך הגלגל עובד

1. `filterMeals` מצמצם את המאגר לצד הפעיל ואז לפי הסינון (ארוחה, סוג, תגיות,
   זמן הכנה, תקציב, מועדפים, ודילוג על מה שיצא לאחרונה).
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
spaces/shared/meals/{id}     -> Meal
spaces/shared/history/{id}   -> SpinRecord
```

האפליקציה עובדת על **מרחב משותף אחד**: כל מי שפותח אותה רואה ועורך את אותן
מנות ואת אותה היסטוריה, בלי הרשמה ובלי התחברות. כל מכשיר מתחבר ב-anonymous
auth ברקע — זה בלתי נראה למשתמש, ומשמש רק כדי ש-`firestore.rules` יוכל לדרוש
טוקן תקין במקום לפתוח את מסד הנתונים לאינטרנט הפתוח.

**מה כן נשאר אישי:** ערכת הנושא, הצלילים, הרטט, מספר המשבצות והסינון הפעיל —
אלה נשמרים ב-localStorage של כל מכשיר. אין סיבה שהעדפת מצב כהה של אחד תשנה
את המסך של השני.

הקריאה דרך `onSnapshot`, כך שמנה שאחד מוסיף מופיעה אצל השני מיד, ו-
`persistentLocalCache` נותן קריאה וכתיבה גם בלי רשת (הכתיבות מתנקזות כשהחיבור
חוזר).

**מיגרציה:** בפתיחה הראשונה אחרי המעבר, כל מכשיר מקפל את המנות שצבר קודם —
גם מ-localStorage וגם מהמבנה הישן `users/{uid}` — לתוך המרחב המשותף, ומדלג על
שמות שכבר קיימים שם כדי לא לשכפל את רשימת ההתחלה.

**להפריד מרחבים** (למשל בית ועבודה): `NEXT_PUBLIC_WHEELFOOD_SPACE=<name>`.
ברירת המחדל היא `shared`.

**דיפלוי**

```bash
npx firebase-tools login
npm run deploy      # build + deploy של hosting ושל firestore.rules
```

## עיצוב

הצבעים, הרדיוסים והצללים מוגדרים כמשתני CSS בראש `src/app/globals.css`
(`--wf-*`), ומופו ל-Tailwind דרך `@theme inline`. החלפת ערכת העיצוב = החלפת
הערכים בבלוק אחד, בלי לגעת בקומפוננטות.
