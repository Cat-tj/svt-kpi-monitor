import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ErrorBoundary>
              <div className="flex h-screen overflow-hidden bg-surface-secondary dark:bg-gray-900">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
                </div>
              </div>
            </ErrorBoundary>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
