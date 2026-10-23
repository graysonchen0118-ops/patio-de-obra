import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Patio de Obra | Sobrantes de construcción en todo México",
  description: "Material de construcción, herramienta y maquinaria, nuevo y usado. Busque por distancia desde su código postal y hable directo con el vendedor por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#f3efe9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body className={nunito.className}>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
