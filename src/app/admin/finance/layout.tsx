import FinanceShell from "@/components/finance/FinanceShell";

export const metadata = { title: "Finance · Team Mahathi Admin" };

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="wrap mt-8 max-w-5xl"><FinanceShell>{children}</FinanceShell></div>
}
