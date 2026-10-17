import "@ui/styles/globals.css";
import Link from "next/link";
import AiHealthcareNavigator from "./ai-navigator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
        <AiHealthcareNavigator />
      </body>
    </html>
  );
}
