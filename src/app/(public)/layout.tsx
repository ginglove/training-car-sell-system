import { Header } from "@/components/layout/header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          Auto Dealership Platform - Hotline: 1900-xxxx
        </div>
      </footer>
    </div>
  );
}
