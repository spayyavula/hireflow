// CSS is injected via dangerouslySetInnerHTML so the server and client emit
// byte-identical raw text — passing it as children makes React entity-escape
// the `&` in the font @import on the server, breaking hydration.
const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --ink: #0d0d0f;
      --ink-light: #1a1a1f;
      --ink-lighter: #2a2a32;
      --cream: #faf8f5;
      --cream-dark: #ede9e3;
      --coral: #ff6b5b;
      --coral-light: #ff8a7a;
      --coral-dark: #e85a4a;
      --sage: #7eb89e;
      --sage-light: #a8d4be;
      --lavender: #9b8fd4;
      --gold: #d4a853;
      --text-primary: #0d0d0f;
      --text-secondary: #5a5a66;
      --text-muted: #8a8a96;
      --border: rgba(13, 13, 15, 0.08);
      --border-strong: rgba(13, 13, 15, 0.15);
    }

    body {
      font-family: 'Source Sans 3', 'Inter', -apple-system, sans-serif;
      background: var(--cream);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    ::selection {
      background: var(--coral);
      color: white;
    }

    input, textarea, button { font-family: inherit; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .animate-in { animation: slideUp 0.6s ease-out forwards; }
    .animate-in-delay-1 { animation: slideUp 0.6s ease-out 0.1s forwards; opacity: 0; }
    .animate-in-delay-2 { animation: slideUp 0.6s ease-out 0.2s forwards; opacity: 0; }
    .animate-in-delay-3 { animation: slideUp 0.6s ease-out 0.3s forwards; opacity: 0; }

    :focus-visible {
      outline: 2px solid var(--coral);
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .animate-in, .animate-in-delay-1, .animate-in-delay-2, .animate-in-delay-3 {
        opacity: 1 !important;
      }
    }
  `;

const GlobalStyles = () => <style dangerouslySetInnerHTML={{ __html: CSS }} />;

export default GlobalStyles;
