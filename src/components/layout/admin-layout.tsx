import { Sidebar } from "./sidebar";
import { PageHeader } from "./page-header";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 