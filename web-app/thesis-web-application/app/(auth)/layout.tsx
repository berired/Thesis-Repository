export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen overflow-x-clip bg-forest">{children}</main>;
}
