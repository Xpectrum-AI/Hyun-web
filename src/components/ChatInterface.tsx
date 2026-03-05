import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, X, Loader2, AlertCircle, Clock, CalendarDays, ChevronRight, Mic,
  Monitor, Bot, Cog, BarChart3, Search, PenLine, Rocket, Target,
  Lightbulb, Shield, Users, Globe, Zap, Database, Code, Layers,
  Settings, BrainCircuit, Workflow, Network, Phone, PhoneOff, type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { XpectrumVoice, type TranscriptionSegment } from "@xpectrum/sdk";
import haLogo from "@/assets/HA.png";

// ─── Dify API Config ────────────────────────────────────────────────────────
const DIFY_API_URL = "https://xpectrum-main-app-prod-cocfr.ondigitalocean.app/api/v1/chat-messages";
const DIFY_API_KEY = "app-inV7BpUmj47RIiD0nnFvQNyH";

// ─── Card Widget Types ──────────────────────────────────────────────────────
type CardWidget = {
  template: string;
  type: string;
  payload: Record<string, any>;
  labels?: Record<string, string>;
  actions?: CardAction[];
};
type CardAction = { type: 'button' | 'link'; label: string; message?: string; url?: string };
type ServiceItem = { id: string; title: string; description: string; icon?: string };
type ProcessItem = { step: number | string; title: string; description: string; icon?: string };
type TimeSlot = { start: string; end_time?: string; end?: string };
type AboutCompanyItem = {
  image?: string; title?: string; description?: string; text?: string;
  name?: string; role?: string; company?: string; tagline?: string;
  bio?: string[]; highlights?: Record<string, any>;
  sectionTitle?: string; website?: string;
};

type AgentThought = {
  id: string;
  thought: string;
  observation: string;
  tool: string;
  tool_input: string;
};

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
  cardWidget?: CardWidget | null;
};

// ─── Helper: Clean JSON from Text Streams ───────────────────────────────────
// Prevents raw JSON data (like calendar slots) from being typed out on screen
const stripJson = (str: string) => {
  if (!str) return str;
  return str
    .replace(/```json[\s\S]*?(```|$)/g, '')
    .replace(/\{[\s\S]*"slots"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"services"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"about_company"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"company_info"[\s\S]*\}/g, '')
    // Strip complete JSON arrays with company profile data
    .replace(/\[\s*\{[\s\S]*?"(?:\$oid|image_url|bio)"[\s\S]*?\}\s*\]/g, '')
    // Strip partial JSON arrays still streaming (company profile data)
    .replace(/\[\s*\{[\s\S]*?"(?:\$oid|image_url|bio|field)"[\s\S]*$/g, '')
    .trim();
};

// ─── Card Widget Extraction ─────────────────────────────────────────────────

function safeParse<T = any>(s: string): { ok: true; data: T } | { ok: false } {
  try { return { ok: true, data: JSON.parse(s) }; }
  catch { return { ok: false }; }
}

function deepUnwrap(v: any): any {
  let cur = v;
  while (typeof cur === 'string') {
    const r = safeParse(cur);
    if (!r.ok) break;
    cur = r.data;
  }
  return cur;
}

function isServiceArray(arr: any[]): arr is ServiceItem[] {
  return Array.isArray(arr) && arr.length > 0 &&
    arr.every(i => i && typeof i.id === 'string' && typeof i.title === 'string' && typeof i.description === 'string');
}

function isTimeSlotArray(arr: any[]): arr is TimeSlot[] {
  return Array.isArray(arr) && arr.length > 0 &&
    arr.every(i => i && typeof i === 'object' && typeof i.start === 'string' && i.start.length > 0);
}

function isAboutCompanyObject(data: any): data is AboutCompanyItem {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const hasImage = typeof data.image === 'string' && data.image.length > 0;
  const hasText = typeof data.description === 'string' || typeof data.text === 'string';
  return hasImage || (hasText && (data.title || data.company_name));
}

function findAboutCompanyInData(data: any): AboutCompanyItem | null {
  if (!data || typeof data !== 'object') return null;

  // Direct match: { image, title, description }
  if (isAboutCompanyObject(data)) return data;

  // Nested under common keys
  for (const key of ['about', 'company', 'about_company', 'company_info']) {
    if (data[key] && isAboutCompanyObject(data[key])) return data[key];
  }

  // Unwrap .result
  if ('result' in data) {
    const r = deepUnwrap(data.result);
    const found = findAboutCompanyInData(r);
    if (found) return found;
  }

  return null;
}

// ─── Company Profile Array Detection (MongoDB-style responses) ───────────

function isCompanyProfileEntry(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // Score-based detection – any 2 signals means it's company profile data
  let signals = 0;
  if (item.field === 'about') signals++;
  if (item.bio) signals++;
  if (item.image_url) signals++;
  if (item.company) signals++;
  if (item.about && typeof item.about === 'object') signals++;
  if (item.highlights && typeof item.highlights === 'object') signals++;
  if (item.name && item.title) signals++;
  if (item.section_title) signals++;
  if (item.website) signals++;
  return signals >= 2;
}

function transformCompanyProfileToAbout(data: any): AboutCompanyItem | null {
  // Handle arrays – find the first matching entry
  const items = Array.isArray(data) ? data : [data];
  const item = items.find(isCompanyProfileEntry);
  if (!item) return null;

  return {
    image: item.image_url || item.image,
    title: item.about?.heading || 'About Us',
    name: item.name,
    role: item.title,
    company: item.company,
    tagline: item.about?.tagline,
    description: item.about?.description,
    bio: Array.isArray(item.bio) ? item.bio : undefined,
    highlights: item.highlights,
    sectionTitle: item.section_title,
    website: item.website,
  };
}

function isProcessArray(arr: any[]): arr is ProcessItem[] {
  return Array.isArray(arr) && arr.length > 0 &&
    arr.every(i => i && (typeof i.step === 'number' || typeof i.step === 'string') && typeof i.title === 'string' && typeof i.description === 'string');
}

function findInData<T>(data: any, check: (a: any[]) => a is T[], keys: string[]): { items: T[]; extra?: Record<string, any> } | null {
  if (check(data)) return { items: data };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') {
        for (const k of keys) {
          if (Array.isArray(item[k])) {
            const u = deepUnwrap(item[k]);
            if (check(u)) return { items: u, extra: item };
          }
        }
      }
    }
    return null;
  }

  if (data && typeof data === 'object') {
    for (const k of keys) {
      if (Array.isArray(data[k])) {
        const u = deepUnwrap(data[k]);
        if (check(u)) return { items: u, extra: data };
      }
    }
    if ('result' in data) {
      const r = deepUnwrap(data.result);
      const f = findInData(r, check, keys);
      if (f) return f;
    }
    if (data.message?.text) {
      const inner = deepUnwrap(data.message.text);
      const f = findInData(inner, check, keys);
      if (f) return f;
    }
    for (const key of Object.keys(data)) {
      const val = deepUnwrap(data[key]);
      if (val !== data[key]) {
        const f = findInData(val, check, keys);
        if (f) return f;
      }
    }
  }
  return null;
}

function findCardWidgetInObject(obj: any): CardWidget | null {
  if (!obj || typeof obj !== 'object') return null;
  if ('card_widget' in obj) {
    if (typeof obj.card_widget === 'string') { const r = safeParse<CardWidget>(obj.card_widget); return r.ok ? r.data : null; }
    return obj.card_widget as CardWidget;
  }
  if ('template' in obj && obj.template === 'card_widget') return obj as CardWidget;
  for (const key in obj) {
    let value = obj[key];
    if (typeof value === 'string') {
      if (value.includes('card_widget') || value.includes('"template"')) {
        const pr = safeParse(value);
        if (pr.ok) value = pr.data; else continue;
      } else {
        const pr = safeParse(value);
        if (pr.ok) value = pr.data; else continue;
      }
    }
    if (typeof value === 'object' && value !== null) {
      const found = findCardWidgetInObject(value);
      if (found) return found;
    }
  }
  return null;
}

function extractCardFromObservation(observation: string): CardWidget | null {
  if (!observation || typeof observation !== 'string') return null;

  if (observation.includes('card_widget') || observation.includes('"template"')) {
    const r = safeParse(observation);
    if (r.ok) {
      const d = deepUnwrap(r.data);
      const cw = findCardWidgetInObject(d);
      if (cw) return cw;
    }
  }

  // Try company profile extraction first (handles arrays, objects, surrounding text)
  const profileCard = tryParseCompanyProfile(observation);
  if (profileCard) return profileCard;

  const parsed = safeParse(observation);
  if (!parsed.ok) return null;
  const data = deepUnwrap(parsed.data);

  const aboutCompany = findAboutCompanyInData(data);
  if (aboutCompany) {
    return { template: 'card_widget', type: 'about_company', payload: aboutCompany };
  }

  const slotResult = findInData<TimeSlot>(data, isTimeSlotArray, ['available_slots', 'slots']);
  if (slotResult && slotResult.items.length > 0) {
    const dateVal = slotResult.extra?.date || (data?.date);
    return { template: 'card_widget', type: 'time_slot_grid', payload: { slots: slotResult.items, date: dateVal } };
  }

  const processResult = findInData<ProcessItem>(data, isProcessArray, ['steps', 'company']);
  if (processResult && processResult.items.length > 0) {
    return { template: 'card_widget', type: 'process_grid', payload: { steps: processResult.items } };
  }

  const serviceResult = findInData<ServiceItem>(data, isServiceArray, ['services']);
  if (serviceResult && serviceResult.items.length > 0) {
    return { template: 'card_widget', type: 'service_grid', payload: { services: serviceResult.items } };
  }

  return null;
}

function extractCardFromThoughts(thoughts: AgentThought[]): CardWidget | null {
  for (const t of thoughts) {
    if (t.observation && (t.observation.includes('card_widget') || t.observation.includes('"template"'))) {
      const cw = extractCardFromObservation(t.observation);
      if (cw) return cw;
    }
  }
  for (const t of thoughts) {
    if (t.observation) {
      const parsed = safeParse(t.observation);
      if (parsed.ok) {
        const data = deepUnwrap(parsed.data);
        const slotResult = findInData<TimeSlot>(data, isTimeSlotArray, ['available_slots', 'slots']);
        if (slotResult && slotResult.items.length > 0) {
          return { template: 'card_widget', type: 'time_slot_grid', payload: { slots: slotResult.items, date: slotResult.extra?.date || data?.date } };
        }
      }
    }
  }
  for (const t of thoughts) {
    if (t.observation) {
      const cw = extractCardFromObservation(t.observation);
      if (cw) return cw;
    }
  }
  return null;
}

// ─── About Company Text Detection (non-JSON plain-text responses) ────────

function looksLikeAboutCompany(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ['company', 'founded', 'ceo', 'founder', 'headquarters', 'about us',
    'our mission', 'established', 'associates', 'consulting', 'framework', 'advisory',
    'chief executive', 'managing director', 'our team', 'our approach', 'president', 'specialize'];
  let matches = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matches++;
  }
  return matches >= 3;
}

function extractImageUrlFromText(text: string): string | undefined {
  // Markdown image: ![alt](url)
  const mdMatch = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/i.exec(text);
  if (mdMatch) return mdMatch[1];
  // Bare image URL (jpg/jpeg/png/gif/webp/svg)
  const bareMatch = /(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s<>"]*)?)/i.exec(text);
  if (bareMatch) return bareMatch[1];
  return undefined;
}

function cleanTextForCard(text: string): string {
  return text
    .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, '')                              // remove markdown images
    .replace(/(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s<>"]*)?)/gi, '') // remove bare image URLs
    .replace(/\n{3,}/g, '\n\n')                                                    // collapse excess newlines
    .trim();
}

function extractStructuredAboutFromText(text: string): AboutCompanyItem {
  const payload: AboutCompanyItem = { title: 'About Us' };

  // ── Image URL ──
  payload.image = extractImageUrlFromText(text);

  // ── Company name ── e.g. "called "Hyun & Associates""
  const companyPatterns = [
    /(?:called|named)\s+["\u201c]([^"\u201d]+)["\u201d]/i,
    /(?:called|named)\s+"([^"]+)"/i,
    /(?:company|firm)\s+(?:is\s+)?(?:called\s+)?["\u201c]([^"\u201d]+)["\u201d]/i,
    /([A-Z][A-Za-z]+(?:\s+&\s+|\s+and\s+)[A-Za-z]+(?:\s+(?:LLC|Inc|Associates|Consulting|Group|Corp))?)/,
  ];
  for (const p of companyPatterns) {
    const m = text.match(p);
    if (m) { payload.company = (m[1] || m[2] || m[3] || '').trim().replace(/["\u201c\u201d]/g, ''); break; }
  }

  // ── Person name + role ── e.g. "its CEO and President is Hyun Suh"
  const nameRolePatterns = [
    // "CEO and President is Hyun Suh"
    /(?:its|the)\s+((?:CEO|President|Founder|CTO|COO|Managing Director)(?:\s+(?:and|&)\s+(?:CEO|President|Founder|CTO|COO|Managing Director))*)\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    // "Hyun Suh is the CEO"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:is|serves as|as)\s+(?:the\s+)?((?:CEO|President|Founder|CTO|COO)(?:\s+(?:and|&)\s+(?:CEO|President|Founder|CTO|COO))*)/i,
    // "Hyun Suh brings ... to his role as founder and CEO"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+brings\s+.+?(?:role\s+as|position\s+as|position\s+of)\s+(founder(?:\s+(?:and|&)\s+(?:CEO|President))?|CEO(?:\s+(?:and|&)\s+(?:President|Founder))?)/i,
    // "founded by Hyun Suh"
    /(?:founded|led|started|created)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];
  for (const p of nameRolePatterns) {
    const m = text.match(p);
    if (m) {
      if (/^(?:CEO|President|Founder|CTO|COO|Managing)/i.test(m[1])) {
        payload.role = m[1].trim();
        payload.name = m[2]?.trim();
      } else {
        payload.name = m[1].trim();
        payload.role = m[2]?.trim();
      }
      break;
    }
  }

  // ── Tagline ── e.g. "specialize in changing the way people work..."
  const taglineMatch = text.match(/(?:[Tt]hey\s+)?[Ss]peciali[zs]e\s+in\s+(.+?)(?:\.\s|\.?\s*Instead|\.?\s*They\s|\.?\s*By\s)/);
  if (taglineMatch) payload.tagline = taglineMatch[1]?.trim().replace(/\.$/, '');

  // ── Highlights ──
  const highlights: Record<string, any> = {};

  const expMatch = text.match(/((?:over\s+)?(?:\w+)\s+years?\s+of\s+(?:\w+\s+)?expertise)/i);
  if (expMatch) highlights.experience = expMatch[1].trim();

  const fwMatch = text.match(/(\d+D\s+framework[^.]*?)(?:\.\s|$)/im) || text.match(/(framework\s*[-\u2014]\s*(?:Diagnose|Design|Deliver|Direct)[^.]*)/i);
  if (fwMatch) highlights.framework = fwMatch[1].trim();

  const missionMatch = text.match(/(?:[Hh]is|[Hh]er|[Tt]heir)\s+mission\s+is\s+to\s+([^.]+)/);
  if (missionMatch) highlights.mission = missionMatch[1].trim();

  const indMatch = text.match(/spanning\s+(.+?)(?:\s*[-\u2014]\s*to|\s*\.\s)/i);
  if (indMatch) {
    highlights.industries = indMatch[1].trim()
      .split(/,\s*(?:and\s+)?|\s+and\s+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  if (Object.keys(highlights).length > 0) payload.highlights = highlights;

  // ── Description & Bio ──
  const cleanedText = cleanTextForCard(text);
  const paragraphs = cleanedText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);

  if (paragraphs.length > 1) {
    // First paragraph → short description, rest → bio
    payload.description = paragraphs[0];
    payload.bio = paragraphs.slice(1);
  } else {
    payload.description = cleanedText;
  }

  return payload;
}

function extractAboutCompanyFromText(text: string): CardWidget | null {
  if (!text || typeof text !== 'string') return null;
  if (!looksLikeAboutCompany(text)) return null;

  const payload = extractStructuredAboutFromText(text);
  console.log('[ChatCard] Structured about-company payload extracted:', {
    name: payload.name, role: payload.role, company: payload.company,
    tagline: !!payload.tagline, highlights: payload.highlights, bioCount: payload.bio?.length,
  });

  return {
    template: 'card_widget',
    type: 'about_company',
    payload,
  };
}

function tryParseCompanyProfile(text: string): CardWidget | null {
  // Try 1: Parse the entire text as JSON
  const directParse = safeParse(text.trim());
  if (directParse.ok) {
    const d = deepUnwrap(directParse.data);
    const profile = transformCompanyProfileToAbout(Array.isArray(d) ? d : d);
    if (profile) {
      console.log('[ChatCard] Company profile extracted via direct parse');
      return { template: 'card_widget', type: 'about_company', payload: profile };
    }
  }

  // Try 2: Find [{ ... }] substring (handles surrounding text)
  const arrStart = text.indexOf('[{');
  if (arrStart >= 0) {
    // Look for }] specifically (not just any ])
    const closingPattern = /\}\s*\]/g;
    let lastMatch: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = closingPattern.exec(text)) !== null) {
      if (m.index >= arrStart) lastMatch = m;
    }
    if (lastMatch) {
      const arrJson = text.slice(arrStart, lastMatch.index + lastMatch[0].length);
      const parsed = safeParse(arrJson);
      if (parsed.ok && Array.isArray(parsed.data)) {
        const profile = transformCompanyProfileToAbout(parsed.data);
        if (profile) {
          console.log('[ChatCard] Company profile extracted via [{ }] pattern');
          return { template: 'card_widget', type: 'about_company', payload: profile };
        }
      }
    }
  }

  // Try 3: Find single { ... } object with company profile fields
  if (text.includes('{')) {
    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart >= 0 && braceEnd > braceStart) {
      const objJson = text.slice(braceStart, braceEnd + 1);
      const parsed = safeParse(objJson);
      if (parsed.ok) {
        const d = deepUnwrap(parsed.data);
        const profile = transformCompanyProfileToAbout(d);
        if (profile) {
          console.log('[ChatCard] Company profile extracted via single object');
          return { template: 'card_widget', type: 'about_company', payload: profile };
        }
      }
    }
  }

  return null;
}

function extractCardFromContent(content: string): CardWidget | null {
  if (!content || typeof content !== 'string') return null;

  console.log('[ChatCard] extractCardFromContent called, length:', content.length, 'preview:', content.substring(0, 120));

  // Try company profile extraction first (handles arrays, objects, surrounding text)
  const profileCard = tryParseCompanyProfile(content);
  if (profileCard) return profileCard;

  // Try JSON-based extraction (card_widget, slots, services, etc.)
  if (content.includes('{')) {
    const jsonBlocks = content.match(/```json\s*([\s\S]*?)```/g);
    if (jsonBlocks) {
      for (const block of jsonBlocks) {
        const json = block.replace(/```json\s*/, '').replace(/```$/, '').trim();
        const cw = extractCardFromObservation(json);
        if (cw) return cw;
      }
    }

    const braceStart = content.indexOf('{');
    const braceEnd = content.lastIndexOf('}');
    if (braceStart >= 0 && braceEnd > braceStart) {
      const json = content.slice(braceStart, braceEnd + 1);
      const cw = extractCardFromObservation(json);
      if (cw) return cw;
    }
  }

  // Fallback: detect about_company from plain text (image + company keywords)
  console.log('[ChatCard] Falling back to text-based about company detection');
  return extractAboutCompanyFromText(content);
}

// ─── Animated Logo ──────────────────────────────────────────────────────────
const AnimatedLogo = ({ isWelcome, className = "" }: { isWelcome: boolean; className?: string }) => (
  <motion.img
    src={haLogo}
    alt="Hyun and Associates Logo"
    className={`object-contain ${className}`}
    layoutId="ha-logo"
    initial={false}
    animate={{ scale: isWelcome ? 1 : 0.75, opacity: 1, rotate: isWelcome ? 0 : -2, y: isWelcome ? 0 : -10 }}
    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], layout: { duration: 0.8, type: "spring", stiffness: 100, damping: 20 } }}
    style={{
      width: isWelcome ? 128 : 96, height: isWelcome ? 128 : 96,
      filter: isWelcome ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
    }}
  />
);

// ─── Card Renderers ─────────────────────────────────────────────────────────
const CARD_FONT = "'Inter', 'Work Sans', sans-serif";

const ICON_KEYWORD_MAP: Record<string, LucideIcon> = {
  monitor: Monitor, computer: Monitor, it: Monitor, desktop: Monitor,
  bot: Bot, ai: BrainCircuit, agent: Bot, brain: BrainCircuit, intelligence: BrainCircuit,
  cog: Cog, gear: Cog, automation: Workflow, automate: Workflow, workflow: Workflow,
  chart: BarChart3, data: Database, analytics: BarChart3, transform: BarChart3, database: Database,
  search: Search, find: Search, discover: Search, explore: Search,
  pen: PenLine, write: PenLine, design: PenLine, edit: PenLine, plan: PenLine,
  rocket: Rocket, launch: Rocket, deploy: Rocket, start: Rocket, build: Rocket,
  target: Target, goal: Target, result: Target, achieve: Target, implement: Target,
  light: Lightbulb, idea: Lightbulb, consult: Lightbulb, strategy: Lightbulb, insight: Lightbulb,
  shield: Shield, security: Shield, protect: Shield, safe: Shield,
  users: Users, team: Users, people: Users, collaborate: Users, group: Users,
  globe: Globe, web: Globe, network: Network, global: Globe, connect: Network,
  zap: Zap, fast: Zap, power: Zap, energy: Zap, electric: Zap,
  code: Code, develop: Code, program: Code, software: Code,
  layers: Layers, stack: Layers, integrate: Layers, platform: Layers,
  settings: Settings, config: Settings, setup: Settings,
};

const FALLBACK_ICONS: LucideIcon[] = [Lightbulb, BrainCircuit, Workflow, BarChart3, Globe, Shield, Layers, Zap];

function resolveIcon(hint: string | undefined, index: number): LucideIcon {
  if (hint) {
    const lower = hint.toLowerCase();
    for (const [keyword, Icon] of Object.entries(ICON_KEYWORD_MAP)) {
      if (lower.includes(keyword)) return Icon;
    }
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const FlipCard = ({ icon, title, description, index, onLearnMore }: {
  icon?: string; title: string; description: string; index: number; onLearnMore: () => void;
}) => {
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(false);
  const IconComponent = resolveIcon(icon || title, index);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      style={{
        perspective: '1200px',
        fontFamily: CARD_FONT,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        minWidth: 0,
      }}
    >
      <div
        className="relative w-full cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          height: '380px',
        }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="absolute inset-0 flex flex-col items-start justify-start rounded-2xl border border-white"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', padding: '36px' }}
        >
          <div className="flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm shadow-sm" style={{ width: '64px', height: '64px', marginBottom: '32px' }}>
            <IconComponent size={30} className="text-[#af71f1]" strokeWidth={1.6} />
          </div>
          <h4 className="font-semibold text-[#1a1a2e]" style={{ fontSize: '1.2rem', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
            {title}
          </h4>
        </div>

        <div
          className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-white/50 backdrop-blur-md border border-white"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: '36px' }}
        >
          <p className="text-[#3a3a4a]" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
            {description}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onLearnMore(); }}
            className="self-start inline-flex items-center gap-1.5 font-medium text-[#af71f1] border border-[#af71f1]/40 rounded-full hover:bg-[#af71f1] hover:text-white transition-colors duration-200"
            style={{ marginTop: '24px', padding: '10px 26px', fontSize: '0.9rem', flexShrink: 0 }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

const ServiceCardGrid = ({ services, onSend }: { services: ServiceItem[]; onSend: (msg: string) => void }) => (
  <div className="my-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
      {services.map((s, i) => <FlipCard key={s.id || i} icon={s.icon || undefined} title={s.title} description={s.description} index={i} onLearnMore={() => onSend(`Tell me more about ${s.title}`)} />)}
    </div>
  </div>
);

const ProcessCardGrid = ({ steps, onSend }: { steps: ProcessItem[]; onSend: (msg: string) => void }) => (
  <div className="my-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
      {steps.map((p, i) => <FlipCard key={String(p.step) || String(i)} icon={p.icon || undefined} title={p.title} description={p.description} index={i} onLearnMore={() => onSend(`Tell me more about the ${p.title} step`)} />)}
    </div>
  </div>
);

const TimeSlotCardView = ({ payload, onSend }: { payload: { slots: TimeSlot[]; date?: string }; onSend: (msg: string) => void }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const fmtISOTime = (iso: string) => {
    try { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return iso; }
  };
  const fmtSlot = (s: TimeSlot) => {
    if (s.end_time) return `${fmtISOTime(s.start)} - ${s.end_time}`;
    if (s.end) return `${fmtISOTime(s.start)} - ${fmtISOTime(s.end)}`;
    return fmtISOTime(s.start);
  };
  const dateLabel = (() => {
    const src = payload.date || payload.slots[0]?.start;
    if (!src) return 'Available Slots';
    try { const d = new Date(src); return isNaN(d.getTime()) ? 'Available Slots' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
    catch { return 'Available Slots'; }
  })();

  if (!payload.slots || payload.slots.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm">
      <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-gray-900">
        Available Slots for <span className="text-[#af71f1]">{dateLabel}</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {payload.slots.map((slot, idx) => {
          const label = fmtSlot(slot);
          const isSelected = selected === idx;
          return (
            <button
              key={idx} onClick={() => setSelected(idx)}
              className={['flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all', isSelected ? 'border-[#af71f1] bg-[#af71f1] text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-[#af71f1] hover:text-[#af71f1]'].join(' ')}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <button
          onClick={() => { if (selected !== null) onSend(`I'd like to book the ${fmtSlot(payload.slots[selected])} slot`); }}
          disabled={selected === null}
          className={['rounded-full px-5 sm:px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-all', selected !== null ? 'bg-[#af71f1] text-white hover:bg-[#9c5ee0]' : 'cursor-not-allowed bg-gray-100 text-gray-400'].join(' ')}
        >
          Confirm
        </button>
        <button onClick={() => onSend('I would like to select a different date')} className="text-sm text-gray-500 underline hover:text-[#af71f1]">
          Select Different Date
        </button>
      </div>
    </motion.div>
  );
};

const AboutCompanyCard = ({ payload, onSend }: { payload: AboutCompanyItem; onSend: (msg: string) => void }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  const descText = payload.description || payload.text || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16, scale: visible ? 1 : 0.97 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ fontFamily: CARD_FONT }}
    >
      <div className="rounded-2xl border border-white/30 shadow-xl overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >

        {/* ── Header: Circular image + name/role ── */}
        <div className="flex items-center gap-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          {payload.image && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/50 ring-offset-2 ring-offset-transparent shadow-lg">
              <img
                src={payload.image}
                alt={payload.name || 'Company'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            {payload.name && (
              <h3 className="font-bold text-[#1a1a2e] truncate" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                {payload.name}
              </h3>
            )}
            {(payload.role || payload.company) && (
              <p className="text-[#5a5a6e] text-sm mt-0.5">
                {payload.role}{payload.role && payload.company && ' \u00B7 '}{payload.company}
              </p>
            )}
            {payload.sectionTitle && (
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide border border-[#af71f1]/20 text-[#af71f1]"
                style={{ background: 'rgba(175, 113, 241, 0.08)' }}
              >
                {payload.sectionTitle}
              </span>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-5 sm:mx-6 border-t border-white/40" />

        {/* ── Body ── */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* Tagline */}
          {payload.tagline && (
            <div className="rounded-xl px-4 py-3 border border-white/40"
              style={{ background: 'rgba(175, 113, 241, 0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <p className="text-[#7c4daf] text-sm sm:text-[0.9rem] leading-relaxed italic">
                &ldquo;{payload.tagline}&rdquo;
              </p>
            </div>
          )}

          {/* Title heading */}
          {payload.title && (
            <h4 className="font-semibold text-[#1a1a2e]" style={{ fontSize: '1.05rem' }}>
              {payload.title}
            </h4>
          )}

          {/* Description */}
          {descText && (
            <p className="text-[#3a3a4a] text-sm sm:text-[0.9rem] leading-relaxed">
              {descText}
            </p>
          )}

          {/* Bio paragraphs */}
          {payload.bio && payload.bio.length > 0 && (
            <div className="space-y-2.5">
              {payload.bio.map((paragraph, i) => (
                <p key={i} className="text-[#3a3a4a] text-sm sm:text-[0.9rem] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* ── Highlights / Badges ── */}
          {payload.highlights && (
            <div className="pt-1 space-y-3">
              <p className="text-xs font-semibold text-[#9b9bac] uppercase tracking-wider">Highlights</p>
              <div className="flex flex-wrap gap-2">
                {payload.highlights.experience && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#7c4daf] border border-[#af71f1]/15"
                    style={{ background: 'rgba(175, 113, 241, 0.08)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    {payload.highlights.experience}
                  </span>
                )}
                {payload.highlights.framework && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 border border-blue-200/40"
                    style={{ background: 'rgba(219, 234, 254, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    {payload.highlights.framework}
                  </span>
                )}
                {payload.highlights.mission && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 border border-amber-200/40"
                    style={{ background: 'rgba(254, 243, 199, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                  >
                    <Target className="w-3.5 h-3.5" />
                    {payload.highlights.mission}
                  </span>
                )}
                {Array.isArray(payload.highlights.industries) && payload.highlights.industries.map((ind: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#3a3a4a] border border-white/40"
                    style={{ background: 'rgba(243, 244, 246, 0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer with CTA ── */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onSend('What services do you offer?')}
            className="inline-flex items-center gap-1.5 font-semibold text-white bg-[#af71f1] rounded-full hover:bg-[#9c5ee0] transition-colors duration-200 shadow-md"
            style={{ padding: '10px 24px', fontSize: '0.85rem' }}
          >
            Explore Services
            <ChevronRight className="w-4 h-4" />
          </button>
          {payload.website && (
            <a
              href={payload.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#af71f1] rounded-full hover:text-white hover:bg-[#af71f1] transition-colors duration-200 border border-white/40"
              style={{ padding: '10px 24px', fontSize: '0.85rem', background: 'rgba(175, 113, 241, 0.06)' }}
            >
              <Globe className="w-3.5 h-3.5" />
              Visit Website
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const RenderCardWidget = ({ widget, onSend }: { widget: CardWidget; onSend: (msg: string) => void }) => {
  const { type, payload, labels } = widget;
  switch (type) {
    case 'service_grid': {
      const services = payload.services || [];
      if (services.length === 0) return null;
      return (
        <div>
          {labels?.title && <h3 className="font-semibold text-base mb-3 text-gray-900">{labels.title}</h3>}
          <ServiceCardGrid services={services} onSend={onSend} />
        </div>
      );
    }
    case 'process_grid': {
      const steps = payload.steps || [];
      if (steps.length === 0) return null;
      return (
        <div>
          {labels?.title && <h3 className="font-semibold text-base mb-3 text-gray-900">{labels.title}</h3>}
          <ProcessCardGrid steps={steps} onSend={onSend} />
        </div>
      );
    }
    case 'time_slot_grid':
      return <TimeSlotCardView payload={payload as { slots: TimeSlot[]; date?: string }} onSend={onSend} />;
    case 'about_company':
      return <AboutCompanyCard payload={payload as AboutCompanyItem} onSend={onSend} />;
    default:
      return null;
  }
};

// ─── Main Component ─────────────────────────────────────────────────────────

interface ChatInterfaceProps { isOpen: boolean; onClose: () => void }

const ChatInterface = ({ isOpen, onClose }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('hyun-chat-history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [conversationId, setConversationId] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('hyun-conversation-id') || "";
    return "";
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('hyun-chat-history');
      return !saved || JSON.parse(saved).length === 0;
    }
    return true;
  });
  const [error, setError] = useState("");
  const [pendingCardWidget, setPendingCardWidget] = useState<CardWidget | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Expanded Scroll Tolerance (150px)
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 150;
    userScrolledUpRef.current = !atBottom;
  }, []);

  const getUserIdentifier = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fp', 10, 10);
    return btoa(navigator.userAgent + screen.width + Intl.DateTimeFormat().resolvedOptions().timeZone + canvas.toDataURL().slice(-20)).slice(0, 32);
  };

  const suggestedQuestions = [
    "What services do you offer?",
    "Tell me about the company",
    "How do I schedule a consultation?",
    "What makes you different?"
  ];

  // ── Voice Input (Web Speech API) ──────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVoiceTextRef = useRef<string>('');

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) { stopListening(); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setMessage(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        pendingVoiceTextRef.current = finalTranscript.trim();
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.start();
  }, [stopListening]);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  // ── Xpectrum Voice Call ──────────────────────────────────────
  const xpectrumVoiceRef = useRef<XpectrumVoice | null>(null);
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [voiceCallConnecting, setVoiceCallConnecting] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<TranscriptionSegment[]>([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const voiceTranscriptsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_VOICE_BASE_URL;
    const apiKey = import.meta.env.VITE_VOICE_API_KEY;
    const agentName = import.meta.env.VITE_VOICE_AGENT_NAME;
    if (baseUrl && apiKey && agentName) {
      xpectrumVoiceRef.current = new XpectrumVoice({ baseUrl, apiKey, agentName });
    }
    return () => { xpectrumVoiceRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    voiceTranscriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceTranscripts]);

  const startVoiceCall = useCallback(async () => {
    if (!xpectrumVoiceRef.current) {
      setError('Voice call is not configured.');
      return;
    }
    setVoiceCallConnecting(true);
    setVoiceTranscripts([]);
    setError('');
    try {
      await xpectrumVoiceRef.current.connect({
        onConnected: () => {
          setVoiceCallActive(true);
          setVoiceCallConnecting(false);
        },
        onTranscription: (seg: TranscriptionSegment) => {
          setVoiceTranscripts(prev => {
            const idx = prev.findIndex(t => t.id === seg.id);
            if (idx >= 0) { const u = [...prev]; u[idx] = seg; return u; }
            return [...prev, seg];
          });
        },
        onAgentSpeaking: (isSpeaking: boolean) => setAgentSpeaking(isSpeaking),
        onDisconnected: () => {
          setVoiceCallActive(false);
          setVoiceCallConnecting(false);
        },
        onError: (err: { message: string }) => {
          setError(err.message || 'Voice call error');
          setVoiceCallActive(false);
          setVoiceCallConnecting(false);
        },
      });
    } catch {
      setError('Failed to start voice call.');
      setVoiceCallConnecting(false);
    }
  }, []);

  const endVoiceCall = useCallback(() => {
    xpectrumVoiceRef.current?.disconnect();
    setVoiceCallActive(false);
    setVoiceCallConnecting(false);
  }, []);

  // Cleanup voice call on chat close
  useEffect(() => {
    if (!isOpen && voiceCallActive) endVoiceCall();
  }, [isOpen, voiceCallActive, endVoiceCall]);

  useEffect(() => {
    if (typeof window !== 'undefined' && chat.length > 0)
      sessionStorage.setItem('hyun-chat-history', JSON.stringify(chat));
  }, [chat]);

  useEffect(() => {
    if (typeof window !== 'undefined' && conversationId)
      sessionStorage.setItem('hyun-conversation-id', conversationId);
  }, [conversationId]);

  // Updated Scroll Behavior ('auto' stops browser from fighting manual scrolls)
  const scrollToBottom = useCallback(() => {
    if (userScrolledUpRef.current) return;
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      userScrolledUpRef.current = false;
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [chat.length]);

  useEffect(() => {
    if (streamedText) setTimeout(scrollToBottom, 60);
  }, [streamedText, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setShowWelcome(true); setMessage(""); setChat([]); setStreamedText(""); setIsLoading(false); setError("");
      setPendingCardWidget(null); setConversationId("");
      if (typeof window !== 'undefined') { sessionStorage.removeItem('hyun-chat-history'); sessionStorage.removeItem('hyun-conversation-id'); }
    }
    return () => { document.body.classList.remove('overflow-hidden'); };
  }, [isOpen]);

  const handleSend = async (eOrMsg?: string | React.MouseEvent | React.FormEvent) => {
    if (eOrMsg && typeof eOrMsg === 'object' && 'preventDefault' in eOrMsg) eOrMsg.preventDefault();
    const textToSend = typeof eOrMsg === 'string' ? eOrMsg : message;
    if (!textToSend.trim() || textToSend.length > 2000) return;

    setChat(prev => [...prev, { role: 'user', text: textToSend }]);
    setMessage(""); setIsLoading(true); setStreamedText(""); setError(""); setShowWelcome(false);
    setPendingCardWidget(null);
    userScrolledUpRef.current = false;

    const agentThoughts: AgentThought[] = [];
    let fullText = '';
    let messageAdded = false;
    let extractedCard: CardWidget | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let response = await fetch(DIFY_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DIFY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: {},
          query: textToSend,
          response_mode: 'streaming',
          conversation_id: conversationId || "",
          user: getUserIdentifier(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404 && conversationId) {
        setConversationId("");
        if (typeof window !== 'undefined') sessionStorage.removeItem('hyun-conversation-id');
        const retryResp = await fetch(DIFY_API_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${DIFY_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: {}, query: textToSend, response_mode: 'streaming', conversation_id: "", user: getUserIdentifier() }),
        });
        if (!retryResp.ok) throw new Error(`API error ${retryResp.status}`);
        response = retryResp;
      } else if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.conversation_id) setConversationId(data.conversation_id);

            if ((data.event === 'agent_message' || data.event === 'message') && data.answer) {
              fullText += data.answer;
              setStreamedText(fullText);

              // Try to extract card from accumulated text as soon as JSON is parseable
              if (!extractedCard && fullText.includes('}]')) {
                const card = tryParseCompanyProfile(fullText);
                if (card) {
                  console.log('[ChatDebug] Card extracted from streamed text');
                  extractedCard = card;
                  setPendingCardWidget(card);
                }
              }
            }

            if (data.event === 'agent_thought') {
              const thought: AgentThought = {
                id: data.id || '', thought: data.thought || '', observation: data.observation || '',
                tool: data.tool || '', tool_input: data.tool_input || '',
              };
              console.log('[ChatDebug] agent_thought:', { tool: thought.tool, hasObservation: !!thought.observation, observationPreview: thought.observation?.substring(0, 150) });
              const existingIdx = agentThoughts.findIndex(t => t.id === thought.id);
              if (existingIdx >= 0) {
                agentThoughts[existingIdx] = {
                  ...agentThoughts[existingIdx], ...thought,
                  observation: thought.observation || agentThoughts[existingIdx].observation,
                  thought: thought.thought || agentThoughts[existingIdx].thought,
                };
              } else {
                agentThoughts.push(thought);
              }
              const card = extractCardFromThoughts(agentThoughts);
              if (card) {
                console.log('[ChatDebug] Card extracted from thoughts:', card.type, card.payload);
                extractedCard = card;
                setPendingCardWidget(card);
              }
            }

            if (data.event === 'message_end') {
              console.log('[ChatDebug] message_end. fullText preview:', fullText.substring(0, 200), 'extractedCard:', extractedCard?.type);
              if (!extractedCard && fullText) extractedCard = extractCardFromContent(fullText);

              if (!messageAdded) {
                setChat(prev => [...prev, {
                  role: 'bot',
                  // Ensure JSON is completely stripped when saving the final message text
                  text: extractedCard ? '' : stripJson(fullText),
                  cardWidget: extractedCard,
                }]);
                messageAdded = true;
              }
              setStreamedText('');
              setPendingCardWidget(null);
            }

            if (data.event === 'error') setError(data.message || 'An error occurred');
          } catch {}
        }
      }

      if (fullText.trim() && !messageAdded) {
        if (!extractedCard && fullText) extractedCard = extractCardFromContent(fullText);
        setChat(prev => [...prev, {
          role: 'bot',
          text: extractedCard ? '' : stripJson(fullText),
          cardWidget: extractedCard,
        }]);
        setStreamedText('');
        setPendingCardWidget(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setError(err.message || 'Failed to get response.');
      }
      setStreamedText("");
    }
    setIsLoading(false);
  };

  const sendMessage = useCallback((msg: string) => { handleSend(msg); }, [conversationId]);
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleSuggestionClick = (q: string) => { setMessage(q); setShowWelcome(false); setTimeout(() => handleSend(q), 100); };

  // Auto-send after voice recognition finishes
  useEffect(() => {
    if (!isListening && pendingVoiceTextRef.current) {
      const text = pendingVoiceTextRef.current;
      pendingVoiceTextRef.current = '';
      const timer = setTimeout(() => handleSend(text), 200);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const renderSafeHTML = (text: string, showCursor = false) => {
    const parsed = marked.parse(text, { breaks: true, gfm: true });
    const cursor = showCursor ? '<span class="animate-pulse text-black/60 ml-1">|</span>' : '';
    return DOMPurify.sanitize(parsed + cursor);
  };

  // Safe stream rendering – suppress display for responses that will become cards
  const cleanStreamedText = (() => {
    if (!streamedText) return '';
    const trimmed = streamedText.trim();
    // JSON array/object → will become a card, show shimmer
    if (trimmed.startsWith('[{') || trimmed.startsWith('```json')) return '';
    // About-company natural language → will become a card, show shimmer
    if (looksLikeAboutCompany(trimmed)) return '';
    return stripJson(streamedText);
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white"
        >
          {/* Injecting CSS for the smooth fade-in streaming chunks */}
          <style>{`
            @keyframes fadeInChunk {
              from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
              to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            .streaming-text > * {
              animation: fadeInChunk 0.4s ease-out forwards;
            }
          `}</style>

          <LayoutGroup>
            {/* Background blobs - Desktop (matches landing page hero) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
              <div className="absolute w-[516px] h-[518px] top-[25%] right-0 bg-[#efe9c0] rounded-[258px/259px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[15%] left-1/4 bg-[#d0a4ff] rounded-[307px/308px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[20%] left-0 bg-[#c0e9ef] rounded-[307px/308px] blur-[138px]" />
            </div>
            {/* Background blobs - Mobile/Tablet (matches landing page hero) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
              <div className="absolute -top-10 -right-16 w-[55vw] h-[55vw] max-w-[350px] max-h-[350px] bg-[#efe9c0] rounded-full blur-[80px] opacity-50" />
              <div className="absolute top-[30%] left-[15%] w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#d0a4ff] rounded-full blur-[80px] opacity-50" />
              <div className="absolute top-[40%] -left-10 w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#c0e9ef] rounded-full blur-[80px] opacity-50" />
            </div>

            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 text-black hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {showWelcome ? (
              <div className="flex flex-col items-center justify-center h-full relative z-10 px-4 sm:px-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-6xl w-full">
                  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <AnimatedLogo isWelcome={true} />
                  </div>
                  <h1 className="font-normal text-black text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-center leading-tight mb-4 sm:mb-6">
                    Welcome to<br />Hyun & Associates
                  </h1>
                  <p className="font-normal text-black text-base sm:text-lg md:text-2xl text-center leading-relaxed mb-6 sm:mb-8 md:mb-12 px-2">
                    <span className="font-semibold">where we let innovative technologies work for you. </span>
                    <span className="font-bold italic">How can I help you today?</span>
                  </p>
                  <div className="flex flex-col w-full items-center gap-4 sm:gap-6">
                    <form onSubmit={handleSend} className="relative w-full max-w-3xl">
                      <div className="relative flex items-center bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 shadow-lg">
                        <input
                          type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                          placeholder={isListening ? "Listening..." : "Type your message here..."}
                          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 pr-24 sm:pr-28 bg-transparent text-black text-base sm:text-lg placeholder-gray-400 focus:outline-none rounded-full"
                        />
                        <div className="absolute right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={startListening}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                              isListening
                                ? 'bg-red-500 hover:bg-red-600 voice-pulse'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#af71f1]'
                            }`}
                          >
                            <Mic className={`w-4 h-4 sm:w-5 sm:h-5 ${isListening ? 'text-white' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={voiceCallActive ? endVoiceCall : startVoiceCall}
                            disabled={voiceCallConnecting}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                              voiceCallActive
                                ? 'bg-red-500 hover:bg-red-600 voice-pulse'
                                : voiceCallConnecting
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#af71f1]'
                            } disabled:opacity-50`}
                          >
                            {voiceCallActive ? <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Phone className={`w-4 h-4 sm:w-5 sm:h-5 ${voiceCallConnecting ? 'text-white' : ''}`} />}
                          </button>
                          <button type="submit" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#af71f1] rounded-full flex items-center justify-center hover:bg-[#9c5ee0] transition-colors">
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    </form>
                    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full max-w-4xl px-2">
                      {suggestedQuestions.map((q, i) => (
                        <button key={i} onClick={() => handleSuggestionClick(q)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#af71f1] hover:bg-[#af71f1] hover:text-white transition-colors text-xs sm:text-sm font-normal text-[#af71f1]">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col h-full relative z-10">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                  <AnimatedLogo isWelcome={false} />
                </div>

                <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
                  <div className="max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
                    {chat.map((msg, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'user' ? (
                          <div className="max-w-[85%] sm:max-w-[70%] bg-white text-black rounded-2xl rounded-br-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg border border-gray-200">
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">{msg.text}</p>
                          </div>
                        ) : msg.cardWidget ? (
                          <div className="w-full flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <RenderCardWidget widget={msg.cardWidget} onSend={sendMessage} />
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-[85%] flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="rounded-2xl rounded-bl-md px-1 py-1 w-full">
                              {msg.text ? (
                                <div className="text-black text-base leading-relaxed break-words px-3 py-2">
                                  <span dangerouslySetInnerHTML={{ __html: renderSafeHTML(msg.text) }} />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {(isLoading || error) && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex justify-start">
                        {error ? (
                          <div className="max-w-[85%] flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-red-500" />
                            <div className="flex items-start gap-2 text-red-600 text-base leading-relaxed px-3 py-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{error}</span>
                            </div>
                          </div>
                        ) : pendingCardWidget ? (
                          <div className="w-full flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <RenderCardWidget widget={pendingCardWidget} onSend={sendMessage} />
                            </div>
                          </div>
                        ) : cleanStreamedText ? (
                          <div className="max-w-[85%] flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="text-black text-base leading-relaxed break-words px-3 py-2 streaming-text">
                              <span dangerouslySetInnerHTML={{ __html: renderSafeHTML(cleanStreamedText, true) }} />
                            </div>
                          </div>
                        ) : (
                          // New Shimmer alignment and native Tailwind animation
                          <div className="max-w-[60%] flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2.5 flex-shrink-0" />
                            <div className="flex flex-col gap-3 py-1 flex-1 w-64">
                              <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-[85%]" />
                              <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-[60%]" />
                              <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-[40%]" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {voiceCallActive || voiceCallConnecting ? (
                    /* ── Voice Call Overlay ── */
                    <motion.div
                      key="voice-call"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/30 px-3 sm:px-6 py-4 sm:py-5"
                      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                    >
                      <div className="max-w-7xl w-full mx-auto">
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${voiceCallActive ? 'bg-green-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                            <span className="text-sm font-semibold text-[#1a1a2e]">
                              {voiceCallConnecting ? 'Connecting...' : 'Voice Call Active'}
                            </span>
                            {agentSpeaking && (
                              <span className="flex items-center gap-1 text-xs text-[#af71f1] font-medium">
                                <span className="flex gap-0.5">
                                  <span className="w-1 h-3 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1 h-4 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1 h-2.5 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                                Agent speaking
                              </span>
                            )}
                          </div>
                          <button
                            onClick={endVoiceCall}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
                          >
                            <PhoneOff className="w-4 h-4" />
                            End Call
                          </button>
                        </div>

                        {/* Live transcripts */}
                        {voiceTranscripts.length > 0 && (
                          <div className="max-h-32 overflow-y-auto rounded-xl px-3 py-2 space-y-1.5 border border-white/40"
                            style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                          >
                            {voiceTranscripts.map((t) => (
                              <p key={t.id} className="text-sm leading-relaxed">
                                <span className={`font-semibold ${t.speaker === 'agent' ? 'text-[#af71f1]' : 'text-[#1a1a2e]'}`}>
                                  {t.speaker === 'agent' ? 'Agent' : 'You'}:
                                </span>{' '}
                                <span className={`text-[#3a3a4a] ${!t.isFinal ? 'opacity-60' : ''}`}>{t.text}</span>
                              </p>
                            ))}
                            <div ref={voiceTranscriptsEndRef} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    /* ── Normal Chat Input ── */
                    <motion.div
                      key="chat-input"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100 px-3 sm:px-6 py-3 sm:py-4 bg-white/95 backdrop-blur-sm"
                    >
                      <div className="max-w-7xl w-full mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex-1 relative">
                            <input
                              type="text" placeholder={isListening ? "Listening..." : "Type your message here..."}
                              value={message}
                              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                              onKeyDown={handleKeyPress}
                              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pr-12 sm:pr-14 bg-gray-50 border border-gray-200 rounded-full text-sm sm:text-base placeholder:text-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#af71f1] focus:border-transparent"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={startListening}
                              disabled={isLoading}
                              className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                                isListening
                                  ? 'bg-red-500 hover:bg-red-600 voice-pulse'
                                  : 'bg-transparent hover:bg-gray-200 text-gray-400 hover:text-[#af71f1]'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              <Mic className={`w-4 h-4 ${isListening ? 'text-white' : ''}`} />
                            </button>
                          </div>
                          {/* Voice Call button */}
                          <button
                            onClick={voiceCallActive ? endVoiceCall : startVoiceCall}
                            disabled={voiceCallConnecting}
                            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                              voiceCallConnecting
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#af71f1]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Phone className={`w-4 h-4 sm:w-5 sm:h-5 ${voiceCallConnecting ? 'text-white' : ''}`} />
                          </button>
                          {/* Send button */}
                          <button
                            className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center bg-[#af71f1] rounded-full hover:bg-[#9c5ee0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSend} disabled={isLoading || !message.trim()}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {suggestedQuestions.slice(0, 2).map((q, i) => (
                            <button key={i} onClick={() => handleSuggestionClick(q)}
                              className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full border border-[#af71f1] text-[#af71f1] hover:bg-[#af71f1] hover:text-white transition-colors">
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;