// app/layout.tsx
import './globals.css';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className="bg-white min-h-screen flex flex-col font-sans antialiased text-slate-900"
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex-1 bg-white">{children}</div>
      </body>
    </html>
  );
}