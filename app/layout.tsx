import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meu Vício | Catálogo de calçados',
  description: 'Escolha seu modelo e tamanho. Envie seu pedido diretamente pelo WhatsApp.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
