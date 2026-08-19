import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "אין חיבור — WheelFood" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <EmptyState
        emoji="📡"
        title="אין חיבור לרשת"
        body="הדף הזה עוד לא נשמר במכשיר. התחבר לרשת ונסה שוב — הנתונים שלך שמורים מקומית ולא הלכו לאיבוד."
      />
    </div>
  );
}
