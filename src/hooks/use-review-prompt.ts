import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';

// ── Review prompt gating ────────────────────────────────────────────────────
//
// Apple allows at most 3 review prompts per user per 365 days, and silently
// drops any beyond that — so the prompt is scarce currency. We spend it only
// at a genuine moment of calm completion, and only once the app has clearly
// proven its worth. For a mental-health app this restraint is also an ethical
// line: never ask for a rating during distress or on a first impression.

const K_FIRST_SEEN  = 'tether:review:firstSeen';
const K_COMPLETIONS = 'tether:review:completions';
const K_LAST_PROMPT = 'tether:review:lastPrompt';

const MIN_COMPLETIONS   = 3;   // proven, repeated value
const MIN_DAYS_INSTALLED = 4;  // not a first impression
const MIN_DAYS_BETWEEN   = 120; // ≈3/yr — well inside Apple's cap, by design

const DAY = 24 * 60 * 60 * 1000;

function toInt(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function useReviewPrompt() {
  /**
   * Call once when a user reaches a calm completion (e.g. finishing a full
   * breath or grounding session — never on "end early"). Records the event,
   * then asks for a review only if every gate passes. Safe to call freely;
   * it self-limits and never throws.
   */
  const recordCalmCompletion = useCallback(async () => {
    try {
      const now = Date.now();

      // First-seen timestamp (set once).
      let firstSeen = toInt(await AsyncStorage.getItem(K_FIRST_SEEN));
      if (!firstSeen) {
        firstSeen = now;
        await AsyncStorage.setItem(K_FIRST_SEEN, String(now));
      }

      // Count this completion.
      const completions = toInt(await AsyncStorage.getItem(K_COMPLETIONS)) + 1;
      await AsyncStorage.setItem(K_COMPLETIONS, String(completions));

      // ── Gates ──
      if (completions < MIN_COMPLETIONS) return;
      if (now - firstSeen < MIN_DAYS_INSTALLED * DAY) return;

      const lastPrompt = toInt(await AsyncStorage.getItem(K_LAST_PROMPT));
      if (lastPrompt && now - lastPrompt < MIN_DAYS_BETWEEN * DAY) return;

      // Platform support (false in TestFlight, on web, and older Android).
      if (!(await StoreReview.hasAction())) return;
      if (!(await StoreReview.isAvailableAsync())) return;

      await StoreReview.requestReview();
      await AsyncStorage.setItem(K_LAST_PROMPT, String(now));
    } catch {
      // A review prompt must never disturb a moment of calm — swallow errors.
    }
  }, []);

  return { recordCalmCompletion };
}
