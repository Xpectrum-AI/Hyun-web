import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  Send, X, Loader2, AlertCircle, Clock, CalendarDays, ChevronRight, Mic, RotateCcw,
  Monitor, Bot, Cog, BarChart3, Search, PenLine, Rocket, Target,
  Lightbulb, Shield, Users, Globe, Zap, Database, Code, Layers,
  Settings, BrainCircuit, Workflow, Network, Phone, PhoneOff, type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { XpectrumChat, XpectrumVoice, type TranscriptionSegment, type ThoughtEvent } from "@/lib/xpectrum";
import haLogo from "@/assets/HA.png";

// ─── Markdown Text Renderer ────────────────────────────────────────────────
// Renders markdown bold (**text**), italic (*text*), links [text](url), etc.
function MarkdownText({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        // Render paragraphs as spans wrapped in a div to avoid nesting <p> in <p>
        p: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
        // Bold
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        // Italic
        em: ({ children }) => <em className="italic">{children}</em>,
        // Links open in new tab
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#af71f1] underline hover:text-[#9c5ee0] transition-colors"
          >
            {children}
          </a>
        ),
        // Unordered lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
        // Ordered lists
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
        // List items
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        // Code inline
        code: ({ children }) => (
          <code className="bg-gray-100 text-[#af71f1] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        // Code blocks
        pre: ({ children }) => (
          <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto text-sm mb-2">{children}</pre>
        ),
        // Headings
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[#af71f1]/30 pl-3 italic text-gray-600 mb-2">{children}</blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

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
  suggestions?: string[];
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

// Normalize observation to string regardless of whether the API returned a string or object
function obsToStr(obs: unknown): string {
  if (!obs) return '';
  if (typeof obs === 'string') return obs;
  if (typeof obs === 'object') return JSON.stringify(obs);
  return String(obs);
}

function extractCardFromThoughts(thoughts: AgentThought[]): CardWidget | null {
  // Structure-based detection: any observation whose value contains an array of bare ISO date
  // strings (YYYY-MM-DD with no time component) is an availability calendar.
  // Requires 5+ unique dates to distinguish from time-slot responses (which have datetimes).
  for (const t of thoughts) {
    const obs = obsToStr(t.observation);
    if (!obs) continue;
    // Match bare dates only — \d{4}-\d{2}-\d{2} NOT followed by T or another digit
    const bareMatches = [...obs.matchAll(/(\d{4}-\d{2}-\d{2})(?![T\d])/g)];
    const uniqueDates = [...new Set(bareMatches.map(m => m[1]))];
    if (uniqueDates.length >= 5) {
      return { template: 'card_widget', type: 'availability_calendar', payload: { dates: uniqueDates } };
    }
  }
  for (const t of thoughts) {
    const obs = obsToStr(t.observation);
    if (obs && (obs.includes('card_widget') || obs.includes('"template"'))) {
      const cw = extractCardFromObservation(obs);
      if (cw) return cw;
    }
  }
  for (const t of thoughts) {
    const obs = obsToStr(t.observation);
    if (obs) {
      const parsed = safeParse(obs);
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
    const obs = obsToStr(t.observation);
    if (obs) {
      const cw = extractCardFromObservation(obs);
      if (cw) return cw;
    }
  }
  return null;
}

// ─── About Company Text Detection (non-JSON plain-text responses) ────────

function looksLikeAboutCompany(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ['company', 'founded', 'ceo', 'founder', 'headquarters', 'about us',
    'our mission', 'established', 'framework', 'advisory',
    'chief executive', 'managing director', 'our team', 'our approach', 'president', 'specialize'];
  let matches = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matches++;
  }
  return matches >= 4;
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

  // ── Website URL ── (non-image http(s) URLs)
  const urlPattern = /https?:\/\/(?!.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|bmp)(?:\?|$))[^\s<>"')\],]+/gi;
  const urls = text.match(urlPattern);
  if (urls && urls.length > 0) {
    // Pick the first non-image URL as the website
    payload.website = urls[0].replace(/[.,;:!?)]+$/, '');
  }

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

// Used when loading stored Dify messages — no text-based fallback to avoid false profile cards
function extractCardFromStoredAnswer(content: string): CardWidget | null {
  if (!content || typeof content !== 'string') return null;
  const profileCard = tryParseCompanyProfile(content);
  if (profileCard) return profileCard;
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
  return null;
}


function extractCardFromContent(content: string): CardWidget | null {
  if (!content || typeof content !== 'string') return null;

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

// Exact title matches — same icons as the home page "Our Areas of Practice" section
// and the About page 4D process steps. Checked BEFORE the loose keyword map so that
// e.g. "Agentic" doesn't accidentally hit the 'it' keyword and return Monitor.
const TITLE_ICON_MAP: [string, LucideIcon][] = [
  ['general it', Monitor], ['it consulting', Monitor],
  ['agentic', BrainCircuit], ['ai solution', BrainCircuit],
  ['automation', Workflow], ['automate', Workflow],
  ['app creation', Database], ['data transform', Database],
  ['diagnose', Lightbulb],
  ['design', PenLine],
  ['deliver', Rocket],
  ['direct', Target],
];

function resolveIcon(hint: string | undefined, index: number): LucideIcon {
  if (hint) {
    const lower = hint.toLowerCase();
    // Check exact title mapping first (home page icons)
    for (const [keyword, Icon] of TITLE_ICON_MAP) {
      if (lower.includes(keyword)) return Icon;
    }
    // Fall back to loose keyword map for unknown card types
    for (const [keyword, Icon] of Object.entries(ICON_KEYWORD_MAP)) {
      if (lower.includes(keyword)) return Icon;
    }
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const FlipCard = memo(({ icon, title, description, index, onLearnMore }: {
  icon?: string; title: string; description: string; index: number; onLearnMore: () => void;
}) => {
  const IconComponent = resolveIcon(title || icon, index);

  // CSS animation fires once when the DOM node is first inserted.
  // Unlike useState-based animation, it never replays on React re-renders,
  // so re-renders triggered by suggestions/post-stream-fetch cause no blink.
  return (
    <div
      style={{
        fontFamily: CARD_FONT,
        animation: `flipCardEnter 0.5s ease ${index * 100}ms both`,
        minWidth: 0,
      }}
    >
      <div
        className="flex flex-col justify-between rounded-2xl border border-white bg-white/30 backdrop-blur-sm"
        style={{ padding: '28px', height: '340px' }}
      >
        <div>
          <div className="flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm shadow-sm" style={{ width: '56px', height: '56px', marginBottom: '20px' }}>
            <IconComponent size={26} className="text-[#af71f1]" strokeWidth={1.6} />
          </div>
          <h4 className="font-semibold text-[#1a1a2e]" style={{ fontSize: '1.05rem', lineHeight: 1.4, letterSpacing: '-0.01em', marginBottom: '10px' }}>
            {title}
          </h4>
          <p className="text-[#3a3a4a]" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
            {description}
          </p>
        </div>
        <button
          onClick={onLearnMore}
          className="self-start inline-flex items-center gap-1.5 font-medium text-[#af71f1] border border-[#af71f1]/40 rounded-full hover:bg-[#af71f1] hover:text-white transition-colors duration-200"
          style={{ marginTop: '20px', padding: '8px 22px', fontSize: '0.85rem' }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
});

const ServiceCardGrid = ({ services, onSend }: { services: ServiceItem[]; onSend: (msg: string) => void }) => (
  <div className="my-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
      {services.map((s, i) => <FlipCard key={i} icon={s.icon || undefined} title={s.title} description={s.description} index={i} onLearnMore={() => onSend(`Tell me more about ${s.title}`)} />)}
    </div>
  </div>
);

const ProcessCardGrid = ({ steps, onSend }: { steps: ProcessItem[]; onSend: (msg: string) => void }) => (
  <div className="my-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
      {steps.map((p, i) => <FlipCard key={i} icon={p.icon || undefined} title={p.title} description={p.description} index={i} onLearnMore={() => onSend(`Tell me more about the ${p.title} step`)} />)}
    </div>
  </div>
);

const TimeSlotCardView = ({ payload, onSend }: { payload: { slots: TimeSlot[]; date?: string }; onSend: (msg: string) => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [email, setEmail] = useState(() => localStorage.getItem('hyun-user-email') || '');
  const [emailError, setEmailError] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Filter out slots that have already passed in PST
  // slot.start is "YYYY-MM-DDTHH:MM:SS" (PST); compare as string against PST now
  const futureSlots = useMemo(() => {
    const nowPST = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }); // "YYYY-MM-DD HH:MM:SS"
    return payload.slots.filter(s => !s.start || s.start.replace('T', ' ') > nowPST);
  }, [payload.slots]);

  const fmtISOTime = (iso: string) => {
    try { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }); }
    catch { return iso; }
  };
  const fmtSlot = (s: TimeSlot) => {
    if (s.end_time) return `${fmtISOTime(s.start)} - ${s.end_time}`;
    if (s.end) return `${fmtISOTime(s.start)} - ${fmtISOTime(s.end)}`;
    return fmtISOTime(s.start);
  };
  // Extract HH:MM in 24h from ISO datetime string
  const toHHMM = (iso: string) => {
    const t = (iso || '').split('T')[1];
    return t ? t.substring(0, 5) : '';
  };
  const dateLabel = (() => {
    const src = payload.date || payload.slots[0]?.start;
    if (!src) return 'Available Slots';
    try { const d = new Date(src + (src.includes('T') ? '' : 'T00:00:00')); return isNaN(d.getTime()) ? 'Available Slots' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' }); }
    catch { return 'Available Slots'; }
  })();

  const handleConfirm = async () => {
    if (selected === null) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address'); return;
    }
    setEmailError(''); setBookingError(''); setBooking(true);
    try {
      const slot = futureSlots[selected];
      const date = (slot.start || payload.date || '').split('T')[0];
      const startTime = toHHMM(slot.start || '');
      const endTime = toHHMM(slot.end || '');
      const userId = localStorage.getItem('hyun-user-id') || 'guest';
      localStorage.setItem('hyun-user-email', email);

      const res = await fetch('/workflow-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: { date, start_time: startTime, end_time: endTime, user_email_id: email },
          response_mode: 'blocking',
          user: userId,
        }),
      });
      if (!res.ok) throw new Error('Booking failed');
      setBooked(true);
      onSend(`I've booked the ${fmtSlot(slot)} slot on ${dateLabel}. Confirmation will be sent to ${email}`);
    } catch {
      setBookingError('Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!payload.slots || payload.slots.length === 0) return null;
  if (futureSlots.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center">
        <p className="text-sm text-gray-500">No upcoming slots available for <span className="font-medium text-gray-700">{dateLabel}</span>. Please select a different date.</p>
        <button onClick={() => onSend('I would like to select a different date')} className="mt-3 text-sm text-[#af71f1] underline hover:text-[#9c5ee0]">Select Different Date</button>
      </motion.div>
    );
  }

  if (booked) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center"
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Booking Confirmed!</h3>
        <p className="text-sm text-gray-500">A confirmation will be sent to <span className="font-medium text-gray-700">{email}</span></p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 shadow-sm">
      <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-gray-900">
        Available Slots for <span className="text-[#af71f1]">{dateLabel}</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {futureSlots.map((slot, idx) => {
          const label = fmtSlot(slot);
          const isSelected = selected === idx;
          return (
            <button
              key={idx} onClick={() => { setSelected(idx); setBookingError(''); }}
              className={['flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all', isSelected ? 'border-[#af71f1] bg-[#af71f1] text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-[#af71f1] hover:text-[#af71f1]'].join(' ')}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{label}
            </button>
          );
        })}
      </div>

      {/* Email input — shown once a slot is selected */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#af71f1]/40 focus:border-[#af71f1] transition-all"
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={booking || !email}
                className={['rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-all flex items-center gap-2',
                  !booking && email ? 'bg-[#af71f1] text-white hover:bg-[#9c5ee0]' : 'cursor-not-allowed bg-gray-100 text-gray-400'
                ].join(' ')}
              >
                {booking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm
              </button>
              <button onClick={() => onSend('I would like to select a different date')} className="text-sm text-gray-500 underline hover:text-[#af71f1]">
                Select Different Date
              </button>
            </div>
            {bookingError && <p className="text-xs text-red-500">{bookingError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {selected === null && (
        <div className="mt-4">
          <button onClick={() => onSend('I would like to select a different date')} className="text-sm text-gray-500 underline hover:text-[#af71f1]">
            Select Different Date
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Helper: render text with clickable URLs
const AboutCompanyCard = ({ payload, onSend }: { payload: AboutCompanyItem; onSend: (msg: string) => void }) => {
  const descText = payload.description || payload.text || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ fontFamily: CARD_FONT }}
    >
      <div className="rounded-2xl border border-white/30 shadow-xl overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >

        {/* ── Header: Circular image + name/role ── */}
        <div className="flex items-center gap-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/50 ring-offset-2 ring-offset-transparent shadow-lg">
            <img
              src="https://hyunandassociatesllc.com/assets/hyunperson-DiWXyhXY.jpg"
              alt="Hyun Suh"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#1a1a2e] truncate" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
              Hyun Suh
            </h3>
            <p className="text-[#5a5a6e] text-sm mt-0.5">
              CEO and President · Hyun & Associates
            </p>
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

          {/* Description */}
          {descText && (
            <div className="text-[#3a3a4a] text-sm sm:text-[0.9rem] leading-relaxed">
              <MarkdownText>{descText}</MarkdownText>
            </div>
          )}

          {/* Bio paragraphs */}
          {payload.bio && payload.bio.length > 0 && (
            <div className="space-y-2.5">
              {payload.bio.map((paragraph, i) => (
                <div key={i} className="text-[#3a3a4a] text-sm sm:text-[0.9rem] leading-relaxed">
                  <MarkdownText>{paragraph}</MarkdownText>
                </div>
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

const AvailabilityCalendarCard = ({
  payload, onSend, onPushCard,
}: {
  payload: { dates: string[] };
  onSend: (msg: string) => void;
  onPushCard: (card: CardWidget) => void;
}) => {
  const availableDates = useMemo(() => new Set((payload.dates || []).map(d => d.split('T')[0])), [payload.dates]);

  const firstAvailable = useMemo(() => {
    const d = payload.dates[0];
    return d ? new Date(d.split('T')[0] + 'T00:00:00') : new Date();
  }, [payload.dates]);

  const [viewYear, setViewYear] = useState(firstAvailable.getFullYear());
  const [viewMonth, setViewMonth] = useState(firstAvailable.getMonth());
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Los_Angeles' });
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDateClick = async (iso: string) => {
    if (loadingDate) return;
    setLoadingDate(iso);
    try {
      const userId = localStorage.getItem('hyun-user-id') || 'guest';
      const res = await fetch('/workflow-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: { date: iso }, response_mode: 'blocking', user: userId }),
      });
      const data = await res.json();
      const outputs = data.data?.outputs ?? data.outputs ?? {};
      // outputs values may be JSON-encoded arrays — unwrap all candidates
      let slots: TimeSlot[] = [];
      for (const v of Object.values(outputs)) {
        const candidate = Array.isArray(v) ? v : (typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return null; } })() : null);
        if (Array.isArray(candidate) && candidate.length > 0 && candidate[0]?.start) {
          slots = candidate as TimeSlot[];
          break;
        }
      }
      onPushCard({ template: 'card_widget', type: 'time_slot_grid', payload: { slots, date: iso } });
    } catch { /* silently ignore */ } finally {
      setLoadingDate(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm w-full"
      style={{ maxWidth: 580 }}
    >
      <div className="flex">
        {/* ── Left panel: profile info ── */}
        <div className="flex flex-col gap-3 px-6 py-6 border-r border-gray-100" style={{ width: 190, flexShrink: 0 }}>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#e8d5ff]">
            <img src="https://hyunandassociatesllc.com/assets/hyunperson-DiWXyhXY.jpg" alt="Hyun Suh" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Hyun Suh</p>
            <h4 className="font-bold text-gray-900 text-sm leading-snug mt-0.5">Consultation</h4>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              45 min
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              <span>Web conferencing details provided upon confirmation.</span>
            </div>
          </div>
        </div>

        {/* ── Right panel: calendar ── */}
        <div className="flex-1 min-w-0 px-5 py-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Select a Date</h3>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">{monthName}</span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isAvailable = availableDates.has(iso);
              const isLoading = loadingDate === iso;
              const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
              const isPast = iso < todayStr;
              const isClickable = isAvailable && !isPast;
              return (
                <button key={idx} disabled={!isClickable || !!loadingDate} onClick={() => handleDateClick(iso)}
                  className={['mx-auto w-8 h-8 rounded-full text-xs font-medium transition-all flex items-center justify-center',
                    isLoading ? 'bg-[#af71f1] text-white' :
                    isClickable ? 'bg-[#f0e6ff] text-[#7c3aed] hover:bg-[#af71f1] hover:text-white cursor-pointer font-semibold' :
                    isPast ? 'text-gray-200 cursor-default line-through' :
                    'text-gray-300 cursor-default'
                  ].join(' ')}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// memo: widget is the same object reference when only suggestions change (parent spreads
// the existing cardWidget), so this skips the entire card re-render and eliminates the blink.
const RenderCardWidget = memo(({
  widget, onSend, onPushCard,
}: {
  widget: CardWidget;
  onSend: (msg: string) => void;
  onPushCard: (card: CardWidget) => void;
}) => {
  const { type, payload, labels } = widget;
  switch (type) {
    case 'service_grid': {
      const services = payload.services || [];
      if (services.length === 0) return null;
      return (
        <div>
          {labels?.title && <h3 className="font-semibold text-base mb-3 text-gray-900">{labels.title}</h3>}
          {/* key prevents React remounting the grid if the conditional h3 above appears/disappears */}
          <ServiceCardGrid key="service-grid" services={services} onSend={onSend} />
        </div>
      );
    }
    case 'process_grid': {
      const steps = payload.steps || [];
      if (steps.length === 0) return null;
      return (
        <div>
          {labels?.title && <h3 className="font-semibold text-base mb-3 text-gray-900">{labels.title}</h3>}
          {/* key prevents React remounting the grid if the conditional h3 above appears/disappears */}
          <ProcessCardGrid key="process-grid" steps={steps} onSend={onSend} />
        </div>
      );
    }
    case 'time_slot_grid':
      return <TimeSlotCardView payload={payload as { slots: TimeSlot[]; date?: string }} onSend={onSend} />;
    case 'about_company':
      return <AboutCompanyCard payload={payload as AboutCompanyItem} onSend={onSend} />;
    case 'availability_calendar':
      return <AvailabilityCalendarCard payload={payload as { dates: string[] }} onSend={onSend} onPushCard={onPushCard} />;
    default:
      return null;
  }
});

// ─── Main Component ─────────────────────────────────────────────────────────

interface ChatInterfaceProps { isOpen: boolean; onClose: () => void; onChatActive?: () => void }

const ChatInterface = ({ isOpen, onClose, onChatActive }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [showWelcome, setShowWelcome] = useState(() => window.location.hash !== '#chat');
  const [error, setError] = useState("");
  const [introPhase, setIntroPhase] = useState<'big' | 'shrinking' | 'done'>(window.location.hash === '#chat' ? 'done' : 'big');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const chatClientRef = useRef<XpectrumChat | null>(null);
  const conversationIdRef = useRef(conversationId);
  // Tracks the index of the message just added from stream so we can skip its entry animation
  const lastStreamedIdxRef = useRef<number | null>(null);

  const pushCard = useCallback((card: CardWidget) => {
    setChat(prev => {
      // For time_slot_grid: replace the last existing one so clicking dates doesn't stack cards
      if (card.type === 'time_slot_grid') {
        const lastIdx = prev.map(m => m.cardWidget?.type).lastIndexOf('time_slot_grid');
        if (lastIdx !== -1) {
          const updated = [...prev];
          updated[lastIdx] = { role: 'bot', text: '', cardWidget: card };
          return updated;
        }
      }
      return [...prev, { role: 'bot', text: '', cardWidget: card }];
    });
  }, []);

  // Expanded Scroll Tolerance (150px)
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 150;
    userScrolledUpRef.current = !atBottom;
  }, []);

  const getOrCreateUserId = (): string => {
    const key = 'hyun-user-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  };

  const CONV_KEY = 'hyun-conversation-id';

  // ── XpectrumChat client initialization ──────────────────────────
  useEffect(() => {
    // When VITE_CHAT_BASE_URL is empty, use the current origin so requests
    // go through the Netlify Edge Function proxy at /chat-messages.
    const baseUrl = import.meta.env.VITE_CHAT_BASE_URL || window.location.origin;
    const apiKey = import.meta.env.VITE_CHAT_API_KEY || 'proxy';
    chatClientRef.current = new XpectrumChat({
      baseUrl,
      apiKey,
      user: getOrCreateUserId(),
    });
    return () => { chatClientRef.current?.destroy(); };
  }, []);

  // Keep conversationIdRef in sync with state and persist to localStorage
  useEffect(() => {
    conversationIdRef.current = conversationId;
    if (conversationId) {
      localStorage.setItem(CONV_KEY, conversationId);
    }
  }, [conversationId]);

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
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    pendingVoiceTextRef.current = '';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      if (finalTranscript) {
        pendingVoiceTextRef.current = finalTranscript.trim();
      }
      setMessage(finalTranscript + interim);

      // Auto-stop after 2s of silence
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
      }, 2000);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
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
    // When VITE_VOICE_BASE_URL is empty, use the current origin + /voice so requests
    // go through the Netlify function proxy at /voice/*.
    const baseUrl = import.meta.env.VITE_VOICE_BASE_URL || `${window.location.origin}/voice`;
    const apiKey = import.meta.env.VITE_VOICE_API_KEY || 'proxy';
    const agentName = import.meta.env.VITE_VOICE_AGENT_NAME;
    console.log('[Voice Init]', { baseUrl, apiKey: apiKey ? '***' : 'MISSING', agentName: agentName || 'MISSING' });
    if (agentName) {
      xpectrumVoiceRef.current = new XpectrumVoice({ baseUrl, apiKey, agentName });
      console.log('[Voice Init] XpectrumVoice created successfully');
    } else {
      console.error('[Voice Init] Missing agentName — voice will not work');
    }
    return () => { xpectrumVoiceRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    voiceTranscriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceTranscripts]);

  const startVoiceCall = useCallback(async () => {
    console.log('[Voice Call] Button clicked, ref:', !!xpectrumVoiceRef.current);
    if (!xpectrumVoiceRef.current) {
      console.error('[Voice Call] XpectrumVoice not initialized');
      setError('Voice call is not configured.');
      return;
    }
    setVoiceCallConnecting(true);
    setVoiceTranscripts([]);
    setError('');
    try {
      console.log('[Voice Call] Calling connect()...');
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
    } catch (err) {
      console.error('[Voice Call] connect() failed:', err);
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
      // Use longer delay on initial history load (cards need time to render)
      const delay = chat.length > 2 ? 400 : 100;
      setTimeout(() => chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'auto' }), delay);
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
      setMessage(""); setStreamedText(""); setIsLoading(false); setError("");
    }
    return () => { document.body.classList.remove('overflow-hidden'); };
  }, [isOpen]);

  // On open: show welcome at /, load conversation from Dify at #chat
  useEffect(() => {
    if (!isOpen) return;
    const client = chatClientRef.current;

    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const showIntro = () => {
      setChat([]);
      setShowWelcome(true);
      setIntroPhase('big');
      t1 = setTimeout(() => setIntroPhase('shrinking'), 800);
      t2 = setTimeout(() => setIntroPhase('done'), 1500);
    };

    // Welcome screen is ONLY for / (any hash other than #chat)
    if (window.location.hash !== '#chat') {
      showIntro();
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    // At #chat: always stay in chat mode, never show welcome screen
    setShowWelcome(false);

    const savedConvId = localStorage.getItem(CONV_KEY);
    if (!savedConvId || !client) {
      setChat([]);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    setConversationId(savedConvId);
    conversationIdRef.current = savedConvId;

    client.getMessages(savedConvId, { limit: 50 })
      .then((msgRes) => {
        if (msgRes.data.length === 0) { setChat([]); return; }
        const chatMessages: ChatMessage[] = [...msgRes.data].flatMap(msg => {
          const items: ChatMessage[] = [{ role: 'user', text: msg.query }];
          if (msg.answer) {
            // Reconstruct card from agent_thoughts — same data the SDK streams via onThought
            const thoughts: AgentThought[] = (msg.agent_thoughts || []).map((t: any) => ({
              id: t.id || '',
              thought: t.thought || '',
              observation: obsToStr(t.observation),
              tool: t.tool || '',
              tool_input: t.tool_input || '',
            }));
            const cardWidget = extractCardFromThoughts(thoughts) ?? extractCardFromStoredAnswer(msg.answer) ?? undefined;
            items.push({ role: 'bot', text: stripJson(msg.answer), cardWidget });
          }
          return items;
        });
        setChat(chatMessages);
      })
      .catch(() => setChat([]));

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isOpen]);

  const handleSend = async (eOrMsg?: string | React.MouseEvent | React.FormEvent) => {
    if (eOrMsg && typeof eOrMsg === 'object' && 'preventDefault' in eOrMsg) eOrMsg.preventDefault();
    const textToSend = typeof eOrMsg === 'string' ? eOrMsg : message;
    if (!textToSend.trim() || textToSend.length > 2000) return;

    if (!chatClientRef.current) {
      setError('Chat is not configured.');
      return;
    }

    setChat(prev => [...prev, { role: 'user', text: textToSend }]);
    setMessage(""); setIsLoading(true); setStreamedText(""); setError(""); setShowWelcome(false);
    userScrolledUpRef.current = false;
    onChatActive?.();

    const agentThoughts: AgentThought[] = [];
    let fullText = '';
    let messageAdded = false;
    let extractedCard: CardWidget | null = null;

    const doSend = (convId: string) => {
      return chatClientRef.current!.sendMessage(textToSend, {
        conversationId: convId || undefined,

        onMessage: (accumulatedText: string, _messageId: string, newConversationId: string) => {
          fullText = accumulatedText;
          if (newConversationId) {
            setConversationId(newConversationId);
            localStorage.setItem(CONV_KEY, newConversationId);
          }
          setStreamedText(accumulatedText);

          // Try to extract card from accumulated text as soon as JSON is parseable
          if (!extractedCard && accumulatedText.includes('}]')) {
            const card = tryParseCompanyProfile(accumulatedText);
            if (card) {
              console.log('[ChatDebug] Card extracted from streamed text');
              extractedCard = card;
            }
          }
        },

        onThought: (thought: ThoughtEvent) => {
          const mapped: AgentThought = {
            id: thought.id, thought: thought.thought, observation: thought.observation || '',
            tool: thought.tool || '', tool_input: thought.tool_input || '',
          };
          console.log('[ChatDebug] agent_thought:', { tool: mapped.tool, hasObservation: !!mapped.observation, observationPreview: mapped.observation?.substring(0, 150) });
          const existingIdx = agentThoughts.findIndex(t => t.id === mapped.id);
          if (existingIdx >= 0) {
            agentThoughts[existingIdx] = {
              ...agentThoughts[existingIdx], ...mapped,
              observation: mapped.observation || agentThoughts[existingIdx].observation,
              thought: mapped.thought || agentThoughts[existingIdx].thought,
              tool: mapped.tool || agentThoughts[existingIdx].tool,
              tool_input: mapped.tool_input || agentThoughts[existingIdx].tool_input,
            };
          } else {
            agentThoughts.push(mapped);
          }
          const card = extractCardFromThoughts(agentThoughts);
          if (card) {
            console.log('[ChatDebug] Card extracted from thoughts:', card.type, card.payload);
            extractedCard = card;
          }
        },

        onMessageEnd: (meta) => {
          if (meta.conversation_id) {
            setConversationId(meta.conversation_id);
            localStorage.setItem(CONV_KEY, meta.conversation_id);
          }
          // Retry from thoughts (in case observations arrived after onThought fired)
          if (!extractedCard) extractedCard = extractCardFromThoughts(agentThoughts);
          if (!extractedCard && fullText) extractedCard = extractCardFromContent(fullText);

          if (!messageAdded) {
            setChat(prev => {
              lastStreamedIdxRef.current = prev.length; // index of the new message
              return [...prev, {
                role: 'bot',
                text: stripJson(fullText),
                cardWidget: extractedCard,
              }];
            });
            messageAdded = true;
          }
          setStreamedText('');
          setIsLoading(false); // stop shimmer immediately; onCompleted is just a fallback

          // Post-stream fetch: get stored message with full agent_thought observations
          // (Dify streams thoughts without observations; observations only in stored messages)
          // Always run — content-based extraction may have false-positives; stored observations win.
          if (meta.message_id && chatClientRef.current) {
            const convId = meta.conversation_id || conversationIdRef.current;
            const targetMsgId = meta.message_id;
            if (convId && chatClientRef.current) {
              const tryFetch = (client: typeof chatClientRef.current) =>
                client!.getMessages(convId, { limit: 50 })
                  .then(res => {
                    if (!res.data.length) return;
                    // Find by ID first, fall back to last message
                    const storedMsg = res.data.find((m: any) => m.id === targetMsgId)
                                   ?? res.data[res.data.length - 1];
                    const thoughts: AgentThought[] = (storedMsg.agent_thoughts || []).map((t: any) => ({
                      id: t.id || '', thought: t.thought || '', observation: obsToStr(t.observation),
                      tool: t.tool || '', tool_input: t.tool_input || '',
                    }));
                    const card = extractCardFromThoughts(thoughts);
                    if (card) {
                      setChat(prev => {
                        const updated = [...prev];
                        for (let i = updated.length - 1; i >= 0; i--) {
                          if (updated[i].role === 'bot') {
                            updated[i] = { ...updated[i], cardWidget: card };
                            break;
                          }
                        }
                        return updated;
                      });
                    }
                  })
                  .catch(() => {});
              // Give Dify 800ms to commit the message before fetching
              setTimeout(() => tryFetch(chatClientRef.current), 800);
            }
          }

          if (meta?.message_id && chatClientRef.current) {
            chatClientRef.current.getSuggestedQuestions(meta.message_id)
              .then(questions => {
                if (questions && questions.length > 0) {
                  setChat(prev => {
                    const updated = [...prev];
                    for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].role === 'bot') {
                        updated[i] = { ...updated[i], suggestions: questions };
                        break;
                      }
                    }
                    return updated;
                  });
                }
              })
              .catch(() => {});
          }
        },

        onError: (err) => {
          setError(err.message || 'An error occurred');
        },

        onCompleted: () => {
          // Fallback: if stream ended without message_end event
          if (fullText.trim() && !messageAdded) {
            if (!extractedCard) extractedCard = extractCardFromThoughts(agentThoughts);
            if (!extractedCard && fullText) extractedCard = extractCardFromContent(fullText);
            setChat(prev => [...prev, {
              role: 'bot',
              text: stripJson(fullText),
              cardWidget: extractedCard,
            }]);
            setStreamedText('');
          }
          setIsLoading(false);
        },
      });
    };

    try {
      await doSend(conversationIdRef.current);
    } catch (err: any) {
      // Retry with fresh conversation if 404 (stale conversation)
      if (err?.status === 404 && conversationIdRef.current) {
        setConversationId("");
        try {
          await doSend("");
        } catch (retryErr: any) {
          console.error('Chat error:', retryErr);
          setError(retryErr.message || 'Failed to get response.');
          setIsLoading(false);
        }
      } else if (err?.name !== 'AbortError') {
        console.error('Chat error:', err);
        setError(err.message || 'Failed to get response.');
        setIsLoading(false);
      }
      setStreamedText("");
    }
  };

  const handleReset = useCallback(() => {
    setChat([]);
    setShowWelcome(true);
    setIntroPhase('done');
    setConversationId("");
    conversationIdRef.current = "";
    localStorage.removeItem(CONV_KEY);
    setStreamedText("");
    setError("");
    window.history.replaceState(null, '', '/');
  }, []);

  const sendMessage = useCallback((msg: string) => { handleSend(msg); }, [conversationId]);
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Auto-send after voice recognition finishes
  useEffect(() => {
    if (!isListening && pendingVoiceTextRef.current) {
      const text = pendingVoiceTextRef.current;
      pendingVoiceTextRef.current = '';
      const timer = setTimeout(() => handleSend(text), 200);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

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
            @keyframes flipCardEnter {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0);    }
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
              title="Go to home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>

            {showWelcome ? (
              <div className="flex flex-col items-center justify-center h-full relative z-10 px-4 sm:px-6">
                <div className="text-center max-w-6xl w-full">
                  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <motion.img
                      src={haLogo}
                      alt="Hyun and Associates Logo"
                      className="object-contain"
                      layoutId="ha-logo"
                      initial={{ scale: 2.8, y: '20vh', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.15))' }}
                      animate={
                        introPhase === 'big'
                          ? { scale: 2.8, y: '20vh', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.15))' }
                          : { scale: 1, y: 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }
                      }
                      transition={
                        introPhase === 'shrinking'
                          ? { type: 'spring', stiffness: 280, damping: 22, mass: 0.9 }
                          : { duration: 0 }
                      }
                      style={{ width: 128, height: 128 }}
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: introPhase === 'done' ? 1 : 0, y: introPhase === 'done' ? 0 : 16 }}
                    transition={{ duration: 0.5 }}
                    style={{ pointerEvents: introPhase === 'done' ? 'auto' : 'none' }}
                  >
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
                            <button type="submit" className="w-9 h-9 sm:w-10 sm:h-10 bg-[#af71f1] rounded-full flex items-center justify-center hover:bg-[#9c5ee0] transition-colors">
                              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      </form>
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
                        {[
                          "What services do you offer?",
                          "How can AI help my business?",
                          "Book a consultation",
                          "Tell me about your process",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="px-4 py-2 text-sm rounded-full border border-gray-300 bg-white/70 backdrop-blur-sm text-gray-600 hover:border-[#af71f1] hover:text-[#af71f1] hover:bg-white/90 transition-all duration-200 shadow-sm"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full relative z-10">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pr-14 sm:pr-16">
                  <AnimatedLogo isWelcome={false} />
                  {chat.length > 0 && (
                    <button
                      onClick={handleReset}
                      title="Clear chat"
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#af71f1] border border-gray-200 hover:border-[#af71f1]/40 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-[#af71f1]/5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      New chat
                    </button>
                  )}
                </div>

                <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
                  <div className="max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
                    {(() => {
                      const lastBotIdx = chat.reduce((last, m, i) => m.role === 'bot' ? i : last, -1);
                      return chat.map((msg, idx) => {
                        const isLastBot = idx === lastBotIdx;
                        // Bot messages that were just streamed appear instantly (content was already
                        // visible as streaming text). All other messages get a gentle fade-in.
                        const justStreamed = lastStreamedIdxRef.current === idx;
                        const initial = justStreamed
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 0, y: 20, scale: 0.95 };
                        return <motion.div key={idx}
                        initial={initial}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: justStreamed ? 0 : 0.3, delay: justStreamed ? 0 : Math.min(idx * 0.05, 0.3) }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'user' ? (
                          <div className="max-w-[85%] sm:max-w-[70%] bg-white text-black rounded-2xl rounded-br-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg border border-gray-200">
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">{msg.text}</p>
                          </div>
                        ) : msg.cardWidget ? (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <RenderCardWidget widget={msg.cardWidget} onSend={sendMessage} onPushCard={pushCard} />
                              </div>
                            </div>
                            {isLastBot && msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 ml-5 mt-8">
                                {msg.suggestions.map((q, i) => (
                                  <button key={i} onClick={() => sendMessage(q)}
                                    className="px-3 py-1.5 text-xs rounded-full border border-[#af71f1] text-[#af71f1] hover:bg-[#af71f1] hover:text-white transition-colors">
                                    {q}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-[85%] flex flex-col gap-2">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                              <div className="rounded-2xl rounded-bl-md px-1 py-1 w-full">
                                {msg.text ? (
                                  <div className="text-black text-base leading-relaxed break-words px-3 py-2">
                                    <MarkdownText>{msg.text}</MarkdownText>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            {isLastBot && msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 ml-5">
                                {msg.suggestions.map((q, i) => (
                                  <button key={i} onClick={() => sendMessage(q)}
                                    className="px-3 py-1.5 text-xs rounded-full border border-[#af71f1] text-[#af71f1] hover:bg-[#af71f1] hover:text-white transition-colors">
                                    {q}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>;
                      });
                    })()}

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
                        ) : cleanStreamedText ? (
                          <div className="max-w-[85%] flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="text-black text-base leading-relaxed break-words px-3 py-2 streaming-text">
                              <MarkdownText>{cleanStreamedText}</MarkdownText>
                              <span className="animate-pulse text-black/60 ml-1">|</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-3 flex-shrink-0" />
                            <div className="flex items-center gap-1.5 px-3 py-3">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Voice call transcripts rendered as chat bubbles */}
                    {voiceTranscripts.map((t) => (
                      <motion.div
                        key={`voice-${t.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${t.speaker !== 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        {t.speaker !== 'agent' ? (
                          <div className={`max-w-[85%] sm:max-w-[70%] bg-white text-black rounded-2xl rounded-br-md px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg border border-gray-200 ${!t.isFinal ? 'opacity-60' : ''}`}>
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">{t.text}</p>
                          </div>
                        ) : (
                          <div className={`max-w-[85%] flex items-start gap-3 ${!t.isFinal ? 'opacity-60' : ''}`}>
                            <div className="w-2 h-2 bg-[#d0a4ff] rounded-full mt-2 flex-shrink-0" />
                            <div className="rounded-2xl rounded-bl-md px-3 py-2">
                              <p className="text-black text-base leading-relaxed break-words">{t.text}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    <div ref={chatEndRef} />
                    <div ref={voiceTranscriptsEndRef} />
                  </div>
                </div>

                {/* ── Chat Input (always visible) ── */}
                <div className="border-t border-white/30 px-3 sm:px-6 py-3 sm:py-4">
                  {/* Voice call status bar */}
                  <AnimatePresence>
                    {(voiceCallActive || voiceCallConnecting) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-7xl w-full mx-auto mb-2"
                      >
                        <div className="flex items-center justify-between px-4 py-2 rounded-full border border-white/40"
                          style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${voiceCallActive ? 'bg-green-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                            <span className="text-xs font-semibold text-[#1a1a2e]">
                              {voiceCallConnecting ? 'Connecting...' : 'Voice Call Active'}
                            </span>
                            {agentSpeaking && (
                              <span className="flex items-center gap-1 text-xs text-[#af71f1] font-medium">
                                <span className="flex gap-0.5">
                                  <span className="w-1 h-2.5 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1 h-3 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1 h-2 bg-[#af71f1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                                Speaking
                              </span>
                            )}
                          </div>
                          <button
                            onClick={endVoiceCall}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-full transition-colors"
                          >
                            <PhoneOff className="w-3 h-3" />
                            End
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                      <div className="max-w-7xl w-full mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex-1 relative">
                            <input
                              type="text" placeholder={isListening ? "Listening..." : "Type your message here..."}
                              value={message}
                              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                              onKeyDown={handleKeyPress}
                              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pr-12 sm:pr-14 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full text-sm sm:text-base placeholder:text-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-[#af71f1]/50 focus:border-[#af71f1]/40"
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
                          {/* Send button */}
                          <button
                            className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center bg-[#af71f1] rounded-full hover:bg-[#9c5ee0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSend} disabled={isLoading || !message.trim()}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                          </button>
                        </div>
                      </div>
                </div>
              </div>
            )}
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;