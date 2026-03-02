
import { AppLayout } from '@/components/ui/Layout';
import { CalendarView } from '@/components/calendar/CalendarView';

export default function Home() {
  return (
    <AppLayout>
      <CalendarView />
    </AppLayout>
  );
}
