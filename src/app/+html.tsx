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

        {/* ── Full-height + background fix ───────────────────────────────────
            100dvh  = "dynamic viewport height" — shrinks/grows as the Safari
                      toolbar shows/hides, so the app always fills the VISIBLE
                      area. Older browsers fall back to the 100% set by
                      ScrollViewStyleReset above.
            #root height:100% is needed so React Native's flex:1 root view
            has a concrete parent height to fill.
            background-color on all ancestors stops any dark-or-white flash
            at the edges with viewport-fit:cover. ─────────────────────────── */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            background-color: #1C1917;
            margin: 0;
            padding: 0;
          }
          html {
            height: 100%;
            /* dvh = dynamic viewport height — shrinks as Safari toolbar
               appears, so the app never ends above the screen bottom.
               Fallback chain for older iOS: 100% → -webkit-fill-available */
            height: -webkit-fill-available;
            height: 100dvh;
          }
          body {
            height: 100%;
            min-height: -webkit-fill-available;
            min-height: 100dvh;
          }
          #root {
            height: 100%;
          }
        ` }} />
      </head>
      <body style={{ backgroundColor: '#1C1917' }}>{children}</body>
    </html>
  );
}
