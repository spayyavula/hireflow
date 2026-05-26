import { Analytics } from '@vercel/analytics/react';

export default function Wrapper({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
