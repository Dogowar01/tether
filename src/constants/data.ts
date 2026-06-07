// ── Tether app data ───────────────────────────────────────────────────────

import { AccentKey } from './theme';

// ── Nervous system states ─────────────────────────────────────────────────

export type NSGuidePhase = { name: string; dur: number; scale: number };
export type NSGuideStep = { prompt: string; dur: number };

export type NSGuide =
  | { type: 'breath'; title: string; subtitle: string; phases: NSGuidePhase[]; cycles: number }
  | { type: 'scan' | 'activation'; title: string; subtitle: string; steps: NSGuideStep[] };

export type NSTool = { name: string; detail: string };

export type NSState = {
  id: string;
  label: string;
  sub: string;
  desc: string;
  accent: AccentKey;
  guide: NSGuide;
  tools: NSTool[];
};

export const NS_STATES: NSState[] = [
  {
    id: 'activated',
    label: 'Activated',
    sub: 'Flooded & overwhelmed',
    desc: 'Racing thoughts, anxiety, hypervigilance. Your nervous system is sounding an alarm. This will pass.',
    accent: 'terra',
    guide: {
      type: 'breath',
      title: 'Extended exhale',
      subtitle: 'Slow your system down',
      phases: [
        { name: 'breathe in', dur: 4, scale: 1 },
        { name: 'hold', dur: 1, scale: 1 },
        { name: 'breathe out', dur: 6, scale: 0.38 },
      ],
      cycles: 5,
    },
    tools: [
      { name: 'Extended exhale', detail: 'In for 4 · hold · out for 6. Repeat 5 times. The long exhale signals safety.' },
      { name: 'Cold water', detail: 'Run cold water over your wrists. A direct physical signal that you are safe right now.' },
      { name: '5-4-3-2-1 ground', detail: '5 things you see · 4 you touch · 3 you hear · 2 you smell · 1 you taste.' },
      { name: 'Slow movement', detail: "Walk slowly. Let each foot fully land. You don't need a destination." },
    ],
  },
  {
    id: 'steady',
    label: 'Steady',
    sub: 'Present & grounded',
    desc: "You're in your window of tolerance. Able to think, respond, and be with yourself.",
    accent: 'sage',
    guide: {
      type: 'scan',
      title: 'Body scan',
      subtitle: 'Move through yourself gently',
      steps: [
        { prompt: 'Bring your attention to your feet. Their weight, any warmth. Just notice.', dur: 12 },
        { prompt: "Move up to your legs and hips. Heaviness or ease? You're only observing.", dur: 12 },
        { prompt: 'Settle into your belly. Feel it rise and fall. You are breathing without effort.', dur: 12 },
        { prompt: 'Your chest and back. Each breath makes a little more space for you.', dur: 12 },
        { prompt: "Shoulders, neck, face. Let your jaw go soft. You've arrived in yourself.", dur: 12 },
      ],
    },
    tools: [
      { name: 'Notice & savour', detail: 'Find one thing right now that is neutral or good — however small. Stay with it.' },
      { name: 'Body scan', detail: "Move your awareness slowly from feet to head. Just notice. Don't try to change anything." },
      { name: 'Connection', detail: 'Spend time with something safe — a person, a pet, a view.' },
      { name: 'Carry it forward', detail: "You're in your window. A good time to do something small that matters." },
    ],
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    sub: 'Numb & withdrawn',
    desc: 'Heavy, foggy, flat. Hard to feel much. This is also your system protecting you.',
    accent: 'slate',
    guide: {
      type: 'activation',
      title: 'Gentle activation',
      subtitle: 'Invite yourself back, slowly',
      steps: [
        { prompt: 'Press your feet into the floor. Feel the solidity beneath you.', dur: 9 },
        { prompt: 'Roll your shoulders forward, then back. Let them settle.', dur: 10 },
        { prompt: 'Shake your hands gently — fingers loose, wrists soft.', dur: 9 },
        { prompt: 'Take three slightly deeper breaths. Just a little more room inside.', dur: 14 },
        { prompt: 'Look slowly around. Find something familiar. Rest your eyes there.', dur: 10 },
      ],
    },
    tools: [
      { name: 'Gentle movement', detail: "Shake your hands, roll your shoulders. Let your body know it's safe." },
      { name: 'Warmth', detail: 'A warm drink, a blanket, a shower. Physical warmth invites you back.' },
      { name: 'Rhythm', detail: 'Music with a gentle beat. Let the rhythm pull you forward.' },
      { name: 'One small thing', detail: "One tiny thing that counts as caring for yourself. That's enough." },
    ],
  },
];

// ── Container vessels ─────────────────────────────────────────────────────

export type Vessel = { id: string; label: string; glyph: string };

export const VESSELS: Vessel[] = [
  { id: 'chest',  label: 'Chest',    glyph: '⬡' },
  { id: 'jar',    label: 'Glass Jar', glyph: '○' },
  { id: 'cave',   label: 'Cave',     glyph: '◑' },
  { id: 'ocean',  label: 'Ocean',    glyph: '≋' },
  { id: 'vault',  label: 'Vault',    glyph: '▣' },
  { id: 'flame',  label: 'Flame',    glyph: '△' },
];

// ── Anchor senses ─────────────────────────────────────────────────────────

export type Sense = { id: string; label: string; accent: AccentKey };

export const SENSES: Sense[] = [
  { id: 'sight',  label: 'Sight',  accent: 'amber' },
  { id: 'sound',  label: 'Sound',  accent: 'sage'  },
  { id: 'smell',  label: 'Smell',  accent: 'terra' },
  { id: 'touch',  label: 'Touch',  accent: 'slate' },
  { id: 'memory', label: 'Memory', accent: 'amber' },
];

// ── Tool definitions ──────────────────────────────────────────────────────

export type ToolId = 'witness' | 'state-map' | 'container' | 'anchors';

export type Tool = {
  id: ToolId;
  glyph: string;
  iconName: string;
  label: string;
  desc: string;
  accent: AccentKey;
  paid: boolean;
};

export const TOOLS: Tool[] = [
  { id: 'witness',   glyph: '◉', iconName: 'ear-outline',      label: 'The Witness', desc: 'Be heard without judgment',  accent: 'amber', paid: true  },
  { id: 'state-map', glyph: '≋', iconName: 'pulse-outline',    label: 'State Map',   desc: 'Know your nervous system',   accent: 'sage',  paid: false },
  { id: 'container', glyph: '▣', iconName: 'archive-outline',  label: 'Container',   desc: 'Set something down safely',  accent: 'slate', paid: false },
  { id: 'anchors',   glyph: '⚓', iconName: 'compass-outline',  label: 'Anchors',     desc: 'Return to what grounds you', accent: 'terra', paid: false },
];

// ── Witness system prompt ─────────────────────────────────────────────────

export const WITNESS_SYSTEM_PROMPT = `You are a compassionate witness for someone who may be experiencing trauma or emotional difficulty. Your only role is to receive what they share and reflect it back with genuine warmth and without judgment. Do NOT offer advice, suggest techniques, recommend therapy, or reframe their experience. ONLY acknowledge what they said, honour the weight of it, and make them feel genuinely heard. Write 3–5 sentences, warm and quiet. Begin with their actual experience. Never start with "I".

CRITICAL SAFETY: If the user expresses suicidal ideation, intent to harm themselves or others, or is in acute crisis, respond with warmth and immediately surface crisis resources. Say something like: "What you're carrying sounds unbearable right now. Please reach out to someone who can be with you — Lifeline Australia is available 24 hours: 13 11 14. You don't have to be alone with this." Do not continue a normal session.`;
