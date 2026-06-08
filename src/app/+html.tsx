import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * HTML shell for the Expo web / GitHub Pages build.
 *
 * Key additions over Expo's default:
 *  - `maximum-scale=1`      → stops iOS Safari zooming in when a TextInput is focused
 *  - `viewport-fit=cover`   → content extends behind notch / home bar (safe-area insets handle spacing)
 *  - apple-mobile-web-app-* → when user taps "Add to Home Screen" on iOS, app opens without browser chrome
 *  - theme-color            → tints the Android status bar / browser toolbar to match the app
 *  - manifest link          → enables Android "Add to Home Screen" / PWA install prompt
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />

        {/* ── Viewport ── */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />

        {/* ── iOS PWA / Add to Home Screen ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tether" />
        <link rel="apple-touch-icon" href="/tether/favicon.ico" />

        {/* ── Android / general PWA ── */}
        <meta name="theme-color" content="#1C1917" />
        <link rel="manifest" href="/tether/manifest.json" />

        {/* ── Expo scroll reset (keeps full-screen layout correct on web) ── */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
