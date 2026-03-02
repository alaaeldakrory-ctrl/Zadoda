import type {Metadata} from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Zadoda Scheduler - Effortless Family Scheduling',
  description: 'Organize your family life with Zadoda Scheduler. A shared calendar for Lyla, Malika, Mohamed, and Wesam.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
