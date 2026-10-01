import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "District map embed",
  robots: { index: false, follow: false },
};

export default function EmbedMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-stone-100">{children}</div>
  );
}
