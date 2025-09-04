import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
