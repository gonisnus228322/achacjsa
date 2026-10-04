import './globals.css';

export const metadata = {
  title: 'Discord Server',
  description: 'Private server chatroom',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
