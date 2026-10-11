"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlaneTakeoff,
  Key,
  RotateCcw,
  Plus,
  Search,
  ArrowLeft,
  Target,
  Zap,
  BarChart2,
  Eye,
  Info,
  Sparkles,
  BookOpen,
  Play,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Check,
  Cpu,
  Loader2,
  Layers,
  Activity,
  Award,
} from "lucide-react";

// ─── 1. FULL CABIN CREW PRESET DATASET (23 ITEMS) ──────────────────────────
export interface PassageItemFeature {
  term: string;
  def: string;
}

export interface Passage {
  id: string;
  title: string;
  category: string;
  type: "sequence" | "features" | "text";
  items?: (string | PassageItemFeature)[];
  text?: string;
}

export interface ProgressItem {
  sessions: number;
  bestAccuracy: number;
  lastPracticed: number | null;
  bestWpm: number;
  aiScore: number | null;
  aiAttempts: number;
}

const FULL_PRESET_DATA: Passage[] = [
  // --- SAFETY EQUIPMENT (OXYGEN BOTTLES) ---
  {
    id: "o2-1",
    title: "Portable Oxygen Bottle Type I",
    category: "Safety Equipment",
    type: "features",
    items: [
      {
        term: "Description / Precaution",
        def: "Grey/Green Cylinder with carry strap. Used for First Aid and post decompression. Has two outlets (Hi and Low). On the green bottle Facing the gauge Both outlets are on the Right side labeled as HI/LOW. High outlets supplies 4 liter per minute for 75 mins. Low outlets supplies 2 liter per minute for 150 mins. Gauge reads 1800-2000 PSI indicating full oxygen. Hydrostatic expiry date is 5 years and Discard interval is 15 years.",
      },
      {
        term: "Preflight Check",
        def: "Proper location, properly secured, expiry date both on the bottle and mask, PSI gauge reads 1800 PSI and more, carry strap must be attached, knob is sealed, 2 masks attached, dust cover in place.",
      },
      {
        term: "Operation",
        def: "Inform flight deck. Obtain Portable oxygen bottle. Ensure no smoking sign is respected. Wipe grease/makeup from face. Loosen tight clothing. Recline seat or lie passenger down. Elevate passenger's feet. Attach mask to the desired outlet. Facing the gauge turn on the knob Anti-clockwise to start oxygen flow. Check the flow indicator on the mask or pinch the mask on the bottom to ensure the oxygen flow. Put the mask on the user's face, covering nose and mouth. Monitor and assure passenger. Change bottle when gauge reads 500 PSI for Cabin crew use and 50 PSI for maintenance purpose. After use turn the knob clockwise to stop oxygen flow. Return to proper location. Log it on the log book.",
      },
    ],
  },
  {
    id: "o2-2",
    title: "Portable Oxygen Bottle Type II",
    category: "Safety Equipment",
    type: "features",
    items: [
      {
        term: "Description / Precaution",
        def: "Green Cylinder with carry strap. Used for First Aid and post decompression. Has one outlet only. High outlets supplies 4 liter per minute for 75 mins. Low outlets supplies 2 liter per minute for 150 mins. Gauge reads 1850 PSI indicating full oxygen supply. Flow rate is indicated on the window above the gauge.",
      },
      {
        term: "Preflight Check",
        def: "Proper location, properly secured, expiry date, PSI gauge reads 1850 PSI and more, carry strap must be attached, one mask comes attached to outlet, one extra mask attached, expiry date of both masks.",
      },
      {
        term: "Operation",
        def: "Inform flight deck. Obtain Portable oxygen bottle. Ensure no smoking sign is respected. Wipe grease/makeup from face. Loosen tight clothing. Recline seat or lie passenger down. Elevate passenger's feet. Attach mask. Turn the flow selector knob to the 2 liters per minute or 4 liters per minute position \"2\" or \"4\" must be centered. Check the flow indicator on the mask or pinch the mask on the bottom to ensure the O2 flow. Put the mask on the user's face, covering nose and mouth. Monitor and assure passenger. Change bottle when pressure gauge reads 500 PSI for Cabin crew use and 50 PSI for maintenance purpose. After use turn the knob clockwise until the red band appeared on the indicating window to stop oxygen flow.",
      },
    ],
  },
  {
    id: "o2-3",
    title: "Portable Oxygen Bottle Type III (A350-1000)",
    category: "Safety Equipment",
    type: "features",
    items: [
      {
        term: "Description / Precaution",
        def: "Green cylinder with carry strap. Installed in bracket. The mask has an oxygen flow indicator. Has an oxygen flow rate of 2 and 4 liters per minute. It can supply oxygen during decompression, the flow rate must be set 4 liters per minute. A flow selector knob enables the oxygen flow selection. An ON-OFF control knob enables the user to open the oxygen valve and deliver oxygen.",
      },
      {
        term: "Preflight Check",
        def: "Check proper location, properly secured, expiry date, PSI gauge reads 1800 PSI and more.",
      },
      {
        term: "Operation",
        def: "Inform flight deck. Obtain Portable oxygen bottle. Ensure no smoking sign is respected. Wipe grease/makeup from face. Loosen tight clothing. Recline seat or lie passenger down. Elevate passenger's feet. Attach mask. Turn the flow selector knob to the 2 liters per minute or 4 liters per minute position \"2\" or \"4\" must be centered. Turn the ON-OFF control knob fully to the ON position to start the flow of oxygen (monitor the mask flow indicator and pressure gauge to make sure oxygen is flowing). Check the flow indicator on the mask or pinch the mask on the bottom to ensure the O2 flow. Put the mask on the user's face, covering nose and mouth. Change bottle when pressure gauge reads 500 PSI for Cabin crew use and 50 PSI for maintenance purpose. When the user no longer requires oxygen, turn the ON-OFF control knob to the OFF position to stop the oxygen flow. Put the mask back in the bag and the portable oxygen bottle to its location. Log used oxygen bottle on the Cabin Log Book. Note: Avoid using excessive force when turning the control knob. Excessive force may damage the oxygen bottle.",
      },
    ],
  },

  // --- PROTECTIVE GEAR & MISC SAFETY ---
  {
    id: "prot-gloves",
    title: "Protective Gloves",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description", def: "Protective hand wear found at each cabin crew jump seat and two in the cockpit." },
      { term: "Pre-flight Check", def: "Ensure it is present under each cabin crew jump seat." },
      { term: "Operation", def: "Heat resistant for firefighting purposes. Used for cleaning dangerous goods spills." },
    ],
  },
  {
    id: "hand-axe",
    title: "Hand Axe",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description", def: "Has 2 edges: 1 pointed and 1 flat. Has insulated handle to prevent shock." },
      { term: "Pre-flight Check", def: "Proper location (only in the cockpit)." },
      { term: "Operation", def: "For firefighting (to reach the base of the fire). For survival." },
    ],
  },
  {
    id: "smoke-goggle",
    title: "Smoke Goggle",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description", def: "Smoke goggles are protective devices that protect the eyes from smoke. Located in flight deck only, one for each seat (captain, first officer and observer)." },
      { term: "Operation", def: "To be used in combination with flight deck oxygen mask for protection against smoke or CO2." },
    ],
  },
  {
    id: "flashlight",
    title: "Flashlight",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description", def: "Flashlight is a hand held portable light source. Located under and/or beside each cabin crew seats. To be used in a smoke-filled cabin or darkness for emergency purpose only. In a smoke-filled cabin, aim the light at knee level, as smoke rises. In complete darkness, aim the light at eye level. Lasts for up to 4 hours, depending on battery charge." },
      { term: "Pre-flight Check (TYPE I)", def: "Proper location. See if the red indicator light is flashing every 3-4 secs. If the red indicator light is flashing more than 4 seconds away, the flash light has to be replaced." },
      { term: "Operation (TYPE I)", def: "Pull flashlight from its bracket, illuminates. It extinguishes when placed back on its bracket." },
      { term: "Pre-flight Check (TYPE II)", def: "Proper location. Press the test switch on the bracket/charger and see if the light indicator illuminates green. If the light indicator is red, the flash light has to be replaced. If the light indicator flashes every 10 sec. the battery reached its end of life. It should be replaced." },
      { term: "Operation (TYPE II)", def: "Pull flashlight from its bracket, illuminates. It extinguishes when placed back on its bracket." },
      { term: "Pre-flight Check (TYPE III)", def: "Proper location." },
      { term: "Operation (TYPE III)", def: "Pull flashlight from its bracket, press ON/Off button flashlight illuminates." },
    ],
  },

  // --- PBE & EXTINGUISHERS ---
  {
    id: "pbe-1",
    title: "PBE Type I Specifications",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Used for fire fighting. Stowed in protective container. Used when smoke or gas makes breathing difficult. Has oxygen cartridge which provides O2 lasting 15 minutes. Suffocation may occur if used without oxygen supply. Do not touch hot generator." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, tamper seal in place and properly packed. Found adjacent to each fire fighting equipment." },
      { term: "Operation", def: "Remove from stowage and open container. Pull red tab to open pouch. Unfold hood and hold with generator in front of you. Pull activating ring on side to release oxygen. Hissing sound ensures oxygen flow. Insert hands and open neck seal, ensure proper seal on neck and hair inside. Put on PBE. Hood becomes foggy indicating no more oxygen. After use remove hood grasping from top. Shake head and run fingers through hair." },
    ],
  },
  {
    id: "pbe-2",
    title: "PBE Type II Specifications",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Used for fire fighting. Stowed in protective container. Used when smoke or gas makes breathing difficult. Has oxygen cartridge which provides O2 lasting 15 minutes. Suffocation may occur if used without oxygen supply. It will take 2 minutes for PBE to fully inflate." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, tamper seal in place and properly packed. Found adjacent to each fire fighting equipment." },
      { term: "Operation", def: "Remove from stowage and open container. Pull red tab to open pouch. Unfold hood and hold with cylinder. Snap apart to start oxygen flow. Green light ensures oxygen flow. Insert hands and open neck seal, ensure hair is inside. Put on PBE. Red light illuminates indicating no more oxygen. After use remove hood upward by widening neck seal. Shake head and run fingers through hair." },
    ],
  },
  {
    id: "pbe-3",
    title: "PBE Type III Specifications",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Used for fire fighting. Stowed in protective container. Used when smoke or gas makes breathing difficult. Has oxygen cartridge which provides O2 lasting 15 minutes. Suffocation may occur if used without oxygen supply. Has speech transmitter." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, tamper seal in place and properly packed. Found adjacent to each fire fighting equipment." },
      { term: "Operation", def: "Remove from stowage and open container. Pull red tab to open pouch. Unfold hood and hold with generator in front of you. Put on PBE with generator at back of neck. Insert hands and open neck seal. Yank forward straps and pull backwards to initiate oxygen supply. Hissing sound ensures oxygen flow (starts within 10-15 seconds). Hood becomes foggy when supply ends. After use loosen straps and widen neck seal to remove upward. Shake head and run fingers through hair." },
    ],
  },
  {
    id: "pbe-4",
    title: "PBE Type IV Specifications",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Used for fire fighting. Stowed in protective container. Used when smoke or gas makes breathing difficult. Has oxygen cartridge providing O2 lasting 15 minutes. Suffocation may occur without oxygen supply. Has speech transmitter. Is Apron type. Has breathing bag where expired air is regenerated." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, tamper seal in place, humidity/condition indicator colour is green. Found adjacent to each fire fighting equipment." },
      { term: "Operation", def: "Remove from stowage and open container. Pull red tab to open pouch. Unfold hood and hold upright. Put on PBE. Open neck seal with hands. Pull down lanyard at bottom to initiate oxygen flow. Hissing sound and hood inflation ensure flow (hissing stops in ~50 secs). Fasten body seat belt. Hood collapses and temp increases when oxygen stops. Unfasten body belt, remove hood upward by widening seal, shake head and run fingers through hair, log in cabin logbook." },
    ],
  },
  {
    id: "halon-1",
    title: "Halon Fire Extinguisher Type I",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder. Has liquid gas in it. Eliminates oxygen. Used on all classes of fires. Duration 7-10 seconds. Effective range 8-10 feet. Do not discharge into skin (irritation/suffocation). Do not get close to fire (might scatter fire)." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, gauge indicator in green zone, safety pin is sealed, nozzle free from obstruction. At least one fire extinguisher shall be kept in each compartment." },
      { term: "Operation", def: "Remove Halon from stowage. Use PASS acronym: Pull pin out (breaks seal), Hold bottle in upright position, Aim at base of fire, Squeeze handle to discharge, Spray in sweeping motion. Return to stowage and log down on cabin logbook." },
    ],
  },
  {
    id: "halon-2",
    title: "Halon Fire Extinguisher Type II (Q-400)",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder with liquid gas. Eliminates oxygen. Used on all classes of fires. Duration 15-20 seconds. Effective range 8-10 feet. Irritation/suffocation risk on skin. Has long nozzle. Found on Q-400 A/C only." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, gauge indicator in green zone, safety pin sealed, nozzle free from obstruction. At least one fire extinguisher shall be kept in each compartment." },
      { term: "Operation", def: "Remove Halon from stowage. Use PASS acronym: Pull pin, Hold upright, Aim at base of fire, Squeeze handle, Spray in sweeping motion. Return to stowage and log down on cabin logbook." },
    ],
  },
  {
    id: "halon-3",
    title: "Halon Fire Extinguisher Type III",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder with liquid gas. Eliminates oxygen. Used on all classes of fires. Duration 8-10 seconds. Effective range 4-6 feet. Do not discharge into skin or get too close to fire." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, gauge indicator in green zone, safety pin sealed, nozzle free from obstruction. At least one fire extinguisher shall be kept in each compartment." },
      { term: "Operation", def: "Remove Halon from stowage. Bent down the black safe guard and remove the seal wire. Hold bottle upright. Aim at base of fire. Lift white handle and squeeze it with red lever. Spray in sweeping motion. Return to stowage and log down on cabin logbook." },
    ],
  },
  {
    id: "halon-free",
    title: "Halon Free Extinguisher (A350 A/C)",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder. Found on A350 A/C (AYA, AYB, AYM, AYN, AZI, AZN, BAW). Duration 9-10 seconds. Effective range 1.5-2 Meters (4.9-6.5 feet)." },
      { term: "Preflight Check", def: "Proper location, properly secured, expiry date, gauge indicator in green zone, safety pin sealed, nozzle free from obstruction. At least one fire extinguisher shall be kept in each compartment." },
      { term: "Operation", def: "Remove Halon from stowage. Use PASS acronym: Pull pin (breaks seal), Hold upright, Aim at base of fire, Squeeze handle, Spray in sweeping motion. Return to stowage and log down on cabin logbook." },
    ],
  },
  {
    id: "water-1",
    title: "Type I Water Fire Extinguisher",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Grey cylinder filled with water. Used for class A fire only. Has CO2 cartridge on handle which must be punctured to deliver pressure. Effective range 10-12 feet (Duration 8-10 Sec). Not safe for drinking as it has anti-freezing component." },
      { term: "Preflight Check", def: "Proper location, properly secured, safety seal on handle is intact." },
      { term: "Operation", def: "Turn handle clockwise to puncture CO2 cartridge. Aim at base of Class A fire and press lever to discharge in sweeping motion." },
    ],
  },
  {
    id: "water-2",
    title: "Type II Water Fire Extinguisher (A350-1000)",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder. Used for Class A fire only. Extinguishing agent is water glycol." },
      { term: "Preflight Check", def: "Proper location, properly secured, gauge in green zone, safety pin intact." },
      { term: "Operation", def: "Pull safety pin, hold upright, aim at base of Class A fire, squeeze handle and sweep." },
    ],
  },
  {
    id: "btp-2",
    title: "2-BTP Fire Extinguisher (777-300 BBG)",
    category: "Safety Equipment",
    type: "features",
    items: [
      { term: "Description / Precaution", def: "Red cylinder color. Primarily used on Class B and C fires. Found on 777-300 A/C BBG. Duration 8.4-10.4 seconds. Effective range is six feet." },
      { term: "Preflight Check", def: "Proper location, properly secured, gauge in green zone, safety seal intact." },
      { term: "Operation", def: "Pull safety pin, hold upright, aim at base of fire, squeeze handle to discharge in sweeping motion." },
    ],
  },

  // --- SERVICE PROCEDURES ---
  {
    id: "srv-1",
    title: "1. HLM – DAY Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve HLM tray with drinks",
      "Serve 2nd drinks with hot beverage (extra drink in the trolley)",
      "Serve 2nd hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-2",
    title: "2. HLM – NIGHT Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve HLM tray with drinks",
      "Serve hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-3",
    title: "3. LCH – COCKTAIL Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve 1st drink with crackers",
      "Collect",
      "Serve LCH tray with 2nd drink",
      "Serve 1st hot beverage",
      "Serve 2nd hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-4",
    title: "4. LCH – EARLY MORNING / SDW Service",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve sandwich + soft drink + hot beverage",
      "Collect",
      "Pass duty-free",
      "Serve LCH with drink + 2nd drink",
      "Pass tea & coffee",
      "Collect main tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-5",
    title: "5. DUR – BEFORE 21:00 Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve drinks with cocktail biscuit",
      "Collect trash",
      "Serve DUR with 2nd drink",
      "Pass hot beverage",
      "Pass 2nd hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-6",
    title: "6. DUR – AFTER 21:00 Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve drinks with DUR tray",
      "Serve 2nd drinks with hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-7",
    title: "7. FBF / CBF Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve hot towel (8 hours & more)",
      "Serve juice & hot beverage with tray",
      "Serve 2nd hot beverage",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-8",
    title: "8. RSDW (RICH SANDWICH) Service",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve RSDW tray with drink + hot beverage",
      "Collect RSDW tray",
      "Check cabin",
      "RSDW – IMPORTANT: Extra: Put the mixed soft drink inside the trolley",
    ],
  },
  {
    id: "srv-9",
    title: "9. EYE OPENER Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "Serve hot towel (more than 8 hours)",
      "Serve drinks + hot beverage (except alcohol) with cake or muffin",
      "Collect",
    ],
  },
  {
    id: "srv-10",
    title: "10. LBM – LIGHT BITE Service Sequence",
    category: "Cabin Service",
    type: "sequence",
    items: [
      "LBM = Light Bite (only for Europe; more than 6:30)",
      "Serve LBM with a tray of salad, focaccia & dessert",
      "Serve tea/coffee & drinks",
      "Collect tray",
      "Check cabin",
    ],
  },
  {
    id: "srv-notes",
    title: "Service Important Notes & Golden Rule",
    category: "Important Notes",
    type: "sequence",
    items: [
      "Hot towel: for services noted as 8 hours & more / more than 8 hours",
      "Eye Opener: hot beverage is served except alcohol (with cake or muffin)",
      "LBM: Light Bite, only for Europe and more than 6:30",
      "RSDW: rich sandwich with drink + hot beverage (put mixed soft drink inside trolley)",
      "LCH Cocktail: first drink is served with crackers",
      "LCH Early Morning / SDW: includes sandwich, soft drink and hot beverage",
      "Duty-free is passed after the first collection in early-morning service",
      "DUR before 21:00: cocktail biscuit is served with drinks; DUR after 21:00: drinks served with DUR tray",
      "FBF/CBF: includes juice + hot beverage with tray",
      "GOLDEN RULE: Serve with a Smile, Care with Heart! ❤️",
      "Check cabin is the last step in almost every service!",
    ],
  },
];

// Helper to calculate mastery score
function calculateMasteryScore(p?: ProgressItem): number {
  if (!p || !p.sessions) return 0;
  const sessionScore = Math.min(p.sessions * 14, 50);
  const accuracyScore = ((p.bestAccuracy || 0) / 100) * 35;
  const aiBonus = p.aiScore ? (p.aiScore / 100) * 15 : 0;
  return Math.min(100, Math.round(sessionScore + accuracyScore + aiBonus));
}

function getMasteryBadge(score: number) {
  if (score >= 85)
    return {
      label: "Mastered",
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/15 border-emerald-500/30",
      barClass: "mastered-glow",
    };
  if (score >= 65)
    return {
      label: "Proficient",
      colorClass: "text-teal-400",
      bgClass: "bg-teal-500/15 border-teal-500/30",
      barClass: "bg-teal-500",
    };
  if (score >= 40)
    return {
      label: "Practiced",
      colorClass: "text-amber-400",
      bgClass: "bg-amber-500/15 border-amber-500/30",
      barClass: "bg-amber-500",
    };
  if (score > 0)
    return {
      label: "Familiar",
      colorClass: "text-orange-400",
      bgClass: "bg-orange-500/15 border-orange-500/30",
      barClass: "bg-orange-500",
    };
  return {
    label: "New",
    colorClass: "text-slate-500",
    bgClass: "bg-slate-800/50 border-slate-700",
    barClass: "bg-slate-700",
  };
}

function formatRelativeTime(ts: number | null): string | null {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function RecallStudioPage() {
  const STORAGE_KEY = "memotype_passages_v4";
  const PROGRESS_KEY = "memotype_progress_v1";

  // State
  const [passages, setPassages] = useState<Passage[]>([]);
  const [progressData, setProgressData] = useState<Record<string, ProgressItem>>({});
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  // Views & Modals
  const [currentView, setCurrentView] = useState<"library" | "practice">("library");
  const [activePassage, setActivePassage] = useState<Passage | null>(null);
  const [currentMode, setCurrentMode] = useState<"first" | "full" | "cloze" | "blind" | "ai_concept">("first");

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studyPassage, setStudyPassage] = useState<Passage | null>(null);
  const [editingPassageId, setEditingPassageId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [modalType, setModalType] = useState<"sequence" | "features" | "text">("sequence");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formContent, setFormContent] = useState("");

  // Practice state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalTypedChars, setTotalTypedChars] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);
  const [peeksCount, setPeeksCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [isPracticeFinished, setIsPracticeFinished] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null);

  // AI Concept Drill state
  const [aiUserAnswer, setAiUserAnswer] = useState("");
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{
    scorePercentage: number;
    coveredPoints: string[];
    missingOrInaccuratePoints: string[];
    feedback: string;
    isLocalFallback?: boolean;
  } | null>(null);

  // ── 1. Initialization ──
  useEffect(() => {
    try {
      const savedPassages = localStorage.getItem(STORAGE_KEY);
      if (savedPassages) {
        setPassages(JSON.parse(savedPassages));
      } else {
        setPassages(FULL_PRESET_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(FULL_PRESET_DATA));
      }
    } catch {
      setPassages(FULL_PRESET_DATA);
    }

    try {
      const savedProg = localStorage.getItem(PROGRESS_KEY);
      if (savedProg) setProgressData(JSON.parse(savedProg));
    } catch {}

    const savedKey = localStorage.getItem("gemini_api_key") || "";
    setApiKey(savedKey);
  }, []);

  // Save passages helper
  const updatePassages = (newPassages: Passage[]) => {
    setPassages(newPassages);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPassages));
    } catch {}
  };

  // Save progress helper
  const updateProgress = (id: string, updates: Partial<ProgressItem>) => {
    setProgressData((prev) => {
      const existing = prev[id] || {
        sessions: 0,
        bestAccuracy: 0,
        lastPracticed: null,
        bestWpm: 0,
        aiScore: null,
        aiAttempts: 0,
      };
      const updated: ProgressItem = {
        sessions: updates.sessions !== undefined ? updates.sessions : existing.sessions,
        bestAccuracy: updates.bestAccuracy !== undefined ? Math.max(existing.bestAccuracy, updates.bestAccuracy) : existing.bestAccuracy,
        lastPracticed: updates.lastPracticed !== undefined ? updates.lastPracticed : Date.now(),
        bestWpm: updates.bestWpm !== undefined ? Math.max(existing.bestWpm, updates.bestWpm) : existing.bestWpm,
        aiScore: updates.aiScore !== undefined && updates.aiScore !== null ? Math.max(existing.aiScore || 0, updates.aiScore) : existing.aiScore,
        aiAttempts: updates.aiAttempts !== undefined ? updates.aiAttempts : existing.aiAttempts,
      };
      const newObj = { ...prev, [id]: updated };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(newObj));
      } catch {}
      return newObj;
    });
  };

  // Reset to full preset defaults
  const handleResetDefaults = () => {
    if (confirm("Reset all procedures back to official Cabin Safety & Service presets?")) {
      setPassages(FULL_PRESET_DATA);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(FULL_PRESET_DATA));
      } catch {}
    }
  };

  // Setup current target step
  const setupStepTarget = useCallback((passage: Passage, stepIdx: number) => {
    const pType = passage.type || "text";
    let text = "";
    if (pType === "sequence" && passage.items?.length) {
      const item = passage.items[stepIdx];
      text = typeof item === "string" ? item : `${item.term}: ${item.def}`;
    } else if (pType === "features" && passage.items?.length) {
      const item = passage.items[stepIdx] as PassageItemFeature;
      text = item.def || "";
    } else {
      text = passage.text || "";
    }
    setTargetText(text);
    setTypedText("");
  }, []);

  // Launch Practice
  const startPractice = (passage: Passage) => {
    setActivePassage(passage);
    setCurrentStepIndex(0);
    setIsPracticeFinished(false);
    setTypedText("");
    setTotalErrors(0);
    setTotalTypedChars(0);
    setPeeksCount(0);
    setWpm(0);
    setAccuracy(100);
    setPracticeProgress(0);
    setAiResult(null);
    setAiUserAnswer("");
    startTimeRef.current = null;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setupStepTarget(passage, 0);
    setCurrentView("practice");

    setTimeout(() => {
      if (hiddenInputRef.current && currentMode !== "ai_concept") {
        hiddenInputRef.current.focus();
      }
    }, 100);
  };

  // Stop practice and return to library
  const returnToLibrary = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCurrentView("library");
  };

  // Switch practice mode
  const handleModeChange = (mode: "first" | "full" | "cloze" | "blind" | "ai_concept") => {
    setCurrentMode(mode);
    if (mode !== "ai_concept") {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 50);
    }
  };

  // Space / Tab Peek listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView !== "practice" || currentMode === "ai_concept") return;
      if (e.key === " " || e.key === "Tab") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          setIsPeeking(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Tab") {
        setIsPeeking(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentView, currentMode]);

  // Typing Input Handler
  const handleTypingInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentMode === "ai_concept" || isPracticeFinished) return;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
        setTotalTypedChars((chars) => {
          const calculatedWpm = elapsedMin > 0 ? Math.round(chars / 5 / elapsedMin) : 0;
          setWpm(calculatedWpm);
          return chars;
        });
      }, 500);
    }

    const val = e.target.value;
    if (!val) return;
    const typedChar = val.slice(-1);
    e.target.value = "";

    if (typedText.length >= targetText.length) return;

    const expectedChar = targetText[typedText.length];

    if (typedChar && expectedChar && typedChar.toLowerCase() === expectedChar.toLowerCase()) {
      const nextTyped = typedText + expectedChar;
      setTypedText(nextTyped);
      setTotalTypedChars((c) => c + 1);

      // Check step finish
      if (nextTyped.length === targetText.length) {
        handleStepFinish();
      }
    } else {
      setTotalErrors((errs) => errs + 1);
    }

    // Update stats
    const totalAttempts = totalTypedChars + 1 + totalErrors;
    const currentAcc = totalAttempts > 0 ? Math.round((totalTypedChars / totalAttempts) * 100) : 100;
    setAccuracy(currentAcc);

    if (activePassage) {
      const pType = activePassage.type || "text";
      const totalSteps = activePassage.items?.length || 1;
      const stepContrib = (currentStepIndex / totalSteps) * 100;
      const charContrib = (typedText.length / Math.max(1, targetText.length)) * (100 / totalSteps);
      setPracticeProgress(Math.min(100, Math.round(stepContrib + charContrib)));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Backspace" && typedText.length > 0) {
      setTypedText(typedText.slice(0, -1));
    }
  };

  // Step or Drill Completion
  const handleStepFinish = () => {
    if (!activePassage) return;
    const pType = activePassage.type || "text";
    const totalSteps = activePassage.items?.length || 1;

    if ((pType === "sequence" || pType === "features") && currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setTimeout(() => {
        setupStepTarget(activePassage, nextIdx);
      }, 200);
      return;
    }

    // Complete session!
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsPracticeFinished(true);

    const totalAttempts = totalTypedChars + totalErrors;
    const finalAccuracy = totalAttempts > 0 ? Math.round((totalTypedChars / totalAttempts) * 100) : 100;
    const elapsedMin = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 0;
    const finalWpm = elapsedMin > 0 ? Math.round(totalTypedChars / 5 / elapsedMin) : 0;

    const existing = progressData[activePassage.id] || { sessions: 0, bestAccuracy: 0, bestWpm: 0 };
    updateProgress(activePassage.id, {
      sessions: (existing.sessions || 0) + 1,
      bestAccuracy: finalAccuracy,
      bestWpm: finalWpm,
      lastPracticed: Date.now(),
    });
  };

  // Peek Trigger
  const triggerPeek = (active: boolean) => {
    setIsPeeking(active);
    if (active) {
      setPeeksCount((p) => p + 1);
    }
  };

  // AI Concept Recall Evaluation
  const evaluateAIConcept = async () => {
    if (!activePassage || !aiUserAnswer.trim()) return;
    setIsEvaluatingAI(true);
    setAiResult(null);

    const refString =
      activePassage.type === "features" && activePassage.items
        ? (activePassage.items as PassageItemFeature[]).map((it) => `${it.term}: ${it.def}`).join("\n")
        : activePassage.items
        ? activePassage.items.join("\n")
        : activePassage.text || "";

    // 1. Try with user's client key if saved
    if (apiKey) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `Procedure / Topic Title: "${activePassage.title}"
Required Reference Key Points / Steps:
${refString}

Trainee's Freeform Explanation:
"${aiUserAnswer}"

Evaluate whether all essential key points are adequately explained regardless of exact wording.
Return a valid JSON object matching:
{
  "scorePercentage": 85,
  "coveredPoints": ["Point 1 description", "Point 2 description"],
  "missingOrInaccuratePoints": ["Any critical point missed or incorrectly stated"],
  "feedback": "Constructive 2-sentence encouraging comment for drill/real-life readiness."
}`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        };

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textRes) {
            const parsed = JSON.parse(textRes);
            setAiResult(parsed);
            updateProgress(activePassage.id, {
              aiScore: parsed.scorePercentage,
              aiAttempts: ((progressData[activePassage.id]?.aiAttempts || 0) + 1),
            });
            setIsEvaluatingAI(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Client Gemini direct eval failed:", e);
      }
    }

    // 2. Call server route `/api/ai`
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_concept",
          title: activePassage.title,
          reference: refString,
          userAnswer: aiUserAnswer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) {
          setAiResult(data.evaluation);
          updateProgress(activePassage.id, {
            aiScore: data.evaluation.scorePercentage,
            aiAttempts: ((progressData[activePassage.id]?.aiAttempts || 0) + 1),
          });
          setIsEvaluatingAI(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Server AI eval error:", e);
    }

    // 3. High quality local semantic fallback
    const lowerAns = aiUserAnswer.toLowerCase();
    const refLines = refString.split("\n").filter((l) => l.trim().length > 4);
    const covered: string[] = [];
    const missing: string[] = [];

    refLines.forEach((line) => {
      const keywords = line
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["with", "from", "that", "this", "have"].includes(w));
      const match = keywords.some((k) => lowerAns.includes(k));
      if (match) covered.push(line);
      else missing.push(line);
    });

    const score = Math.min(100, Math.round((covered.length / Math.max(1, refLines.length)) * 100));
    const fallbackRes = {
      scorePercentage: score,
      coveredPoints: covered.slice(0, 5),
      missingOrInaccuratePoints: missing.slice(0, 5),
      feedback:
        score >= 75
          ? "Solid recall demonstration! You captured the required procedures."
          : "Review the remaining steps or equipment specifications to strengthen recall readiness.",
      isLocalFallback: true,
    };
    setAiResult(fallbackRes);
    updateProgress(activePassage.id, {
      aiScore: score,
      aiAttempts: ((progressData[activePassage.id]?.aiAttempts || 0) + 1),
    });
    setIsEvaluatingAI(false);
  };

  // ── Modals Handling ──
  const openStudy = (p: Passage) => {
    setStudyPassage(p);
    setShowStudyModal(true);
  };

  const openEdit = (p: Passage) => {
    setEditingPassageId(p.id);
    setFormTitle(p.title);
    setFormCategory(p.category || "");
    const pType = p.type || "text";
    let raw = "";
    if (pType === "sequence" && p.items) {
      raw = p.items.map((i) => (typeof i === "string" ? i : `${i.term}: ${i.def}`)).join("\n");
    } else if (pType === "features" && p.items) {
      raw = (p.items as PassageItemFeature[]).map((i) => `${i.term} : ${i.def}`).join("\n");
    } else {
      raw = p.text || "";
    }
    setFormContent(raw);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassageId) return;

    const updated = passages.map((p) => {
      if (p.id !== editingPassageId) return p;
      const copy: Passage = { ...p, title: formTitle.trim(), category: formCategory.trim() || p.category };
      if (p.type === "sequence") {
        copy.items = formContent
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
      } else if (p.type === "features") {
        copy.items = formContent
          .split("\n")
          .map((line) => {
            const parts = line.split(":");
            if (parts.length >= 2) {
              return { term: parts[0].trim(), def: parts.slice(1).join(":").trim() };
            }
            return { term: "Key Point", def: line.trim() };
          })
          .filter((i) => i.def.length > 0);
      } else {
        copy.text = formContent.trim();
      }
      return copy;
    });

    updatePassages(updated);
    setShowEditModal(false);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const newPassage: Passage = {
      id: "custom-" + Date.now(),
      title: formTitle.trim(),
      category: formCategory.trim() || "Custom Procedure",
      type: modalType,
    };

    if (modalType === "sequence") {
      newPassage.items = formContent
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } else if (modalType === "features") {
      newPassage.items = formContent
        .split("\n")
        .map((line) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            return { term: parts[0].trim(), def: parts.slice(1).join(":").trim() };
          }
          return { term: "Key Point", def: line.trim() };
        })
        .filter((i) => i.def.length > 0);
    } else {
      newPassage.text = formContent.trim();
    }

    updatePassages([newPassage, ...passages]);
    setShowAddModal(false);
    setFormTitle("");
    setFormCategory("");
    setFormContent("");
  };

  const handleDeletePassage = (id: string) => {
    if (confirm("Delete this recall drill from your studio?")) {
      updatePassages(passages.filter((p) => p.id !== id));
    }
  };

  // Filtered passages
  const filteredPassages = passages.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      JSON.stringify(p.items || "").toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (activeFilter === "all") return true;
    if (activeFilter === "service") return p.category.toLowerCase().includes("service");
    if (activeFilter === "safety") return p.category.toLowerCase().includes("safety");
    if (activeFilter === "notes") return p.category.toLowerCase().includes("note");
    return true;
  });

  // Calculate overall metrics
  const totalItemsCount = passages.length;
  let practicedCount = 0;
  let masteredCount = 0;
  let totalMasteryScore = 0;

  passages.forEach((p) => {
    const score = calculateMasteryScore(progressData[p.id]);
    if (score > 0) practicedCount++;
    if (score >= 85) masteredCount++;
    totalMasteryScore += score;
  });

  const avgMastery = totalItemsCount > 0 ? Math.round(totalMasteryScore / totalItemsCount) : 0;
  const overallBadge = getMasteryBadge(avgMastery);
  const remainingCount = totalItemsCount - masteredCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── TOP HEADER BAR ── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={returnToLibrary}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PlaneTakeoff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                TypeToMemorize
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider font-semibold">
                  Pro Aviation
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Active Recall & Concept Mastery Studio</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title="AI Settings"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title="Reload full Service & Safety presets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Presets</span>
            </button>
            <button
              onClick={() => {
                setFormTitle("");
                setFormCategory("");
                setFormContent("");
                setModalType("sequence");
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Content</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* ═════════ 1. LIBRARY VIEW ═════════ */}
        {currentView === "library" && (
          <div className="space-y-6">
            {/* Overall Progress Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Items</p>
                  <p className="text-2xl font-bold text-white">{totalItemsCount}</p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Practiced</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {practicedCount}
                    <span className="text-sm font-normal text-slate-500"> / {totalItemsCount}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mastered</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {masteredCount}
                    <span className="text-sm font-normal text-slate-500"> / {totalItemsCount}</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Overall Mastery</p>
                  <span className={`text-sm font-bold ${overallBadge.colorClass}`}>{avgMastery}%</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full mastery-bar ${overallBadge.barClass}`}
                    style={{ width: `${avgMastery}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {remainingCount > 0 ? `${remainingCount} item${remainingCount > 1 ? "s" : ""} left to master` : "🎉 All items mastered!"}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PBE, Oxygen, Halon, Water Extinguisher, HLM, LCH, DUR, notes..."
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Items" },
                  { id: "service", label: "Cabin Service" },
                  { id: "safety", label: "Safety Equipment" },
                  { id: "notes", label: "Important Notes" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      activeFilter === f.id
                        ? "border-slate-700 bg-slate-800 text-slate-200"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPassages.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No procedures found matching your search.</p>
                </div>
              ) : (
                filteredPassages.map((passage) => {
                  const pType = passage.type || "text";
                  const itemCount =
                    pType === "sequence"
                      ? `${passage.items?.length || 0} steps`
                      : pType === "features"
                      ? `${passage.items?.length || 0} sections`
                      : `${passage.text?.split(" ").length || 0} words`;

                  let summaryText = "";
                  if (pType === "sequence") {
                    summaryText = passage.items?.map((i) => (typeof i === "string" ? i : `${i.term}: ${i.def}`)).join(" ➔ ") || "";
                  } else if (pType === "features") {
                    summaryText = (passage.items as PassageItemFeature[])?.map((i) => `${i.term}: ${i.def}`).join(" | ") || "";
                  } else {
                    summaryText = passage.text || "";
                  }

                  const mScore = calculateMasteryScore(progressData[passage.id]);
                  const mBadge = getMasteryBadge(mScore);
                  const prog = progressData[passage.id];
                  const timeSince = formatRelativeTime(prog?.lastPracticed || null);
                  const sessCount = prog?.sessions || 0;
                  const bestAcc = prog?.bestAccuracy || 0;
                  const aiS = prog?.aiScore;

                  return (
                    <div
                      key={passage.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${mBadge.bgClass} ${mBadge.colorClass}`}>
                            {mBadge.label}
                          </span>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(passage)}
                              className="text-slate-500 hover:text-indigo-400 p-1 rounded-lg hover:bg-indigo-500/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePassage(passage.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1.5 line-clamp-2">{passage.title}</h3>
                        <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-relaxed mb-3">{summaryText}</p>

                        {/* Mastery Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Mastery</span>
                            <span className={`text-[10px] font-bold ${mBadge.colorClass}`}>{mScore}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full mastery-bar ${mBadge.barClass}`} style={{ width: `${mScore}%` }} />
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            {sessCount} session{sessCount !== 1 ? "s" : ""}
                          </span>
                          {sessCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {bestAcc}%
                            </span>
                          )}
                          {aiS !== null && aiS !== undefined && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <Sparkles className="w-3 h-3" />
                              {aiS}%
                            </span>
                          )}
                          {timeSince ? (
                            <span className="ml-auto">{timeSince}</span>
                          ) : (
                            <span className="ml-auto text-slate-700">Not practiced</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-medium">{itemCount}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openStudy(passage)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-1.5 transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Read</span>
                          </button>
                          <button
                            onClick={() => startPractice(passage)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all"
                          >
                            <span>Test</span>
                            <Play className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═════════ 2. PRACTICE WORKSPACE VIEW ═════════ */}
        {currentView === "practice" && activePassage && (
          <div className="flex-1 flex flex-col space-y-5">
            {/* Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center space-x-3">
                <button
                  onClick={returnToLibrary}
                  className="p-2 rounded-xl border border-slate-700/80 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {activePassage.category || "General"}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">{activePassage.title}</h2>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
                {[
                  { id: "first", label: "First Letter" },
                  { id: "full", label: "Full Text" },
                  { id: "cloze", label: "Cloze" },
                  { id: "blind", label: "Blind Recall" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentMode === m.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  onClick={() => handleModeChange("ai_concept")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                    currentMode === "ai_concept"
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-md"
                      : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                  }`}
                  title="Practice explaining in your own words (AI Key-Point Checker)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Own Words (AI)</span>
                </button>
              </div>
            </div>

            {/* Stats Bar (Typing Mode) */}
            {currentMode !== "ai_concept" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Accuracy</p>
                    <p className="text-xl font-bold text-emerald-400 mt-0.5">{accuracy}%</p>
                  </div>
                  <Target className="w-5 h-5 text-emerald-500/50" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Speed</p>
                    <p className="text-xl font-bold text-indigo-400 mt-0.5">{wpm} WPM</p>
                  </div>
                  <Zap className="w-5 h-5 text-indigo-500/50" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Progress</p>
                    <p className="text-xl font-bold text-blue-400 mt-0.5">{practiceProgress}%</p>
                  </div>
                  <BarChart2 className="w-5 h-5 text-blue-500/50" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Peeks Used</p>
                    <p className="text-xl font-bold text-amber-400 mt-0.5">{peeksCount}</p>
                  </div>
                  <Eye className="w-5 h-5 text-amber-500/50" />
                </div>
              </div>
            )}

            {/* ── Strict Typing Canvas Mode ── */}
            {currentMode !== "ai_concept" && (
              <div
                className="flex-1 min-h-[340px] bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl overflow-hidden cursor-text"
                onClick={() => hiddenInputRef.current?.focus()}
              >
                {/* Step / Section indicator */}
                {activePassage.items && activePassage.items.length > 0 && (
                  <div className="mb-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                      {activePassage.type === "sequence"
                        ? `Step ${currentStepIndex + 1} of ${activePassage.items.length}`
                        : `Section ${currentStepIndex + 1} of ${activePassage.items.length}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-md">
                      {activePassage.type === "features"
                        ? `Feature: ${(activePassage.items[currentStepIndex] as PassageItemFeature)?.term}`
                        : "Sequence Step"}
                    </span>
                  </div>
                )}

                {/* Finished screen or dynamic typing spans */}
                {isPracticeFinished ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Procedure Recalled!</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      You have completed all items for this procedure with active recall precision.
                    </p>
                    <div className="pt-2 flex items-center justify-center space-x-3">
                      <button
                        onClick={() => startPractice(activePassage)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
                      >
                        Practice Again
                      </button>
                      <button
                        onClick={() => handleModeChange("ai_concept")}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-all shadow-lg shadow-amber-600/25 flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Test in Own Words</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-lg sm:text-xl leading-relaxed text-slate-300 break-words flex-1 min-h-[180px] focus:outline-none select-none">
                    {Array.from(targetText).map((char, i) => {
                      const isTyped = i < typedText.length;
                      const isCurrent = i === typedText.length;
                      let displayChar = char;

                      if (!isTyped && !isPeeking) {
                        if (currentMode === "first") {
                          const isFirstLetter =
                            i === 0 ||
                            targetText[i - 1] === " " ||
                            targetText[i - 1] === "-" ||
                            targetText[i - 1] === "(";
                          if (!isFirstLetter && ![" ", "(", ")", "-", "/", ":"].includes(char)) {
                            displayChar = "•";
                          }
                        } else if (currentMode === "cloze") {
                          if (i % 3 === 0 && char !== " ") displayChar = "_";
                        } else if (currentMode === "blind") {
                          if (char !== " ") displayChar = "•";
                        }
                      }

                      if (isTyped) {
                        return (
                          <span key={i} className="text-indigo-400 font-semibold">
                            {char}
                          </span>
                        );
                      }
                      if (isCurrent) {
                        return (
                          <span
                            key={i}
                            className="bg-indigo-500/30 text-white border-b-2 border-indigo-400 cursor-blink"
                          >
                            {displayChar}
                          </span>
                        );
                      }
                      return (
                        <span key={i} className="text-slate-600">
                          {displayChar}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Invisible input listener */}
                <textarea
                  ref={hiddenInputRef}
                  onChange={handleTypingInput}
                  onKeyDown={handleInputKeyDown}
                  className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />

                {/* Action controls footer */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>
                      Start typing directly. Casing ignored. Hold{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Space</kbd> or{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Tab</kbd> to peek.
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onMouseDown={() => triggerPeek(true)}
                      onMouseUp={() => triggerPeek(false)}
                      onMouseLeave={() => triggerPeek(false)}
                      onTouchStart={() => triggerPeek(true)}
                      onTouchEnd={() => triggerPeek(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hold Peek</span>
                    </button>
                    <button
                      onClick={() => startPractice(activePassage)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Freeform / Own-Words Concept Recall Workspace ── */}
            {currentMode === "ai_concept" && (
              <div className="flex-1 min-h-[340px] bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Flexible Concept Drill (Explain in your own phrasing)
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Set API Key</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Type out or summarize this procedure/equipment spec in your own words as you would during a drill or real-life briefing. The AI evaluator will verify whether all required points are covered!
                  </p>

                  {/* Concept Target Hint / Reference */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Target Reference & Points:
                    </span>
                    <div className="font-mono leading-relaxed text-slate-300 max-h-48 overflow-y-auto pr-2 space-y-1">
                      {activePassage.type === "sequence" &&
                        activePassage.items?.map((it, idx) => (
                          <div key={idx}>
                            {idx + 1}. {typeof it === "string" ? it : `${it.term}: ${it.def}`}
                          </div>
                        ))}
                      {activePassage.type === "features" &&
                        (activePassage.items as PassageItemFeature[])?.map((it, idx) => (
                          <div key={idx}>
                            <strong className="text-amber-400">{it.term}:</strong> {it.def}
                          </div>
                        ))}
                      {activePassage.type === "text" && <div>{activePassage.text}</div>}
                    </div>
                  </div>

                  {/* User Answer Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                      Your Explanation / Recall:
                    </label>
                    <textarea
                      rows={5}
                      value={aiUserAnswer}
                      onChange={(e) => setAiUserAnswer(e.target.value)}
                      placeholder="e.g. Inform flight deck, obtain bottle, check no smoking sign, wipe makeup, recline seat, elevate feet, attach mask to HI/LOW outlet, turn knob anti-clockwise, check flow, put mask on face, change at 500 PSI..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={evaluateAIConcept}
                      disabled={isEvaluatingAI || !aiUserAnswer.trim()}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-amber-600/20 transition-all"
                    >
                      {isEvaluatingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Key Points...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4" />
                          <span>Evaluate My Concept Recall</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Evaluation Result Output */}
                  {aiResult && (
                    <div
                      className={`p-5 rounded-xl border text-sm space-y-4 shadow-xl ${
                        aiResult.scorePercentage >= 75
                          ? "bg-emerald-950/30 border-emerald-500/40"
                          : "bg-amber-950/30 border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-2xl font-bold ${
                              aiResult.scorePercentage >= 75 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {aiResult.scorePercentage}%
                          </span>
                          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                            {aiResult.scorePercentage >= 75 ? "Ready for Drills!" : "Concept Review Needed"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full ${
                            aiResult.scorePercentage >= 75
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {aiResult.isLocalFallback ? "Local Semantic Analysis" : "AI Semantic Analysis"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed italic">{aiResult.feedback}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                            Correctly Explained Points:
                          </span>
                          <ul className="space-y-1.5">
                            {aiResult.coveredPoints && aiResult.coveredPoints.length > 0 ? (
                              aiResult.coveredPoints.map((pt, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-xs text-emerald-300">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{pt}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-slate-500">None detected.</li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 block">
                            Missed / Review Items:
                          </span>
                          <ul className="space-y-1.5">
                            {aiResult.missingOrInaccuratePoints && aiResult.missingOrInaccuratePoints.length > 0 ? (
                              aiResult.missingOrInaccuratePoints.map((pt, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-xs text-amber-300">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{pt}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-emerald-400">All core points successfully covered!</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL: READ / STUDY ── */}
      {showStudyModal && studyPassage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {studyPassage.category || "General"}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{studyPassage.title}</h3>
              </div>
              <button onClick={() => setShowStudyModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-sm leading-relaxed text-slate-200 bg-slate-900/80 p-5 rounded-xl border border-slate-700/60 overflow-y-auto flex-1">
              {studyPassage.type === "sequence" && studyPassage.items && (
                <ol className="list-decimal list-inside space-y-2">
                  {studyPassage.items.map((item, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-200">
                      {typeof item === "string" ? item : `${item.term}: ${item.def}`}
                    </li>
                  ))}
                </ol>
              )}

              {studyPassage.type === "features" && studyPassage.items && (
                <div className="space-y-3">
                  {(studyPassage.items as PassageItemFeature[]).map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      <div className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">{item.term}</div>
                      <div className="text-slate-200 text-sm leading-relaxed">{item.def}</div>
                    </div>
                  ))}
                </div>
              )}

              {studyPassage.type === "text" && (
                <div className="whitespace-pre-wrap leading-relaxed">{studyPassage.text}</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
              <span className="text-xs text-slate-400">Review carefully before testing your recall.</span>
              <div className="flex items-center space-x-3 justify-end">
                <button
                  onClick={() => setShowStudyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowStudyModal(false);
                    startPractice(studyPassage);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
                >
                  <span>Test Myself</span>
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ENTRY ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Edit Entry</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category / Tag</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-400">Content</label>
                  <span className="text-[11px] text-slate-500">For features: "Term : Definition" per line</span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM CONTENT ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white">Add Custom Procedure / Equipment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Structure Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalType("sequence")}
                    className={`py-2 text-xs font-medium rounded-lg ${
                      modalType === "sequence" ? "text-white bg-indigo-600" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sequence
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType("features")}
                    className={`py-2 text-xs font-medium rounded-lg ${
                      modalType === "features" ? "text-white bg-indigo-600" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Equipment / Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType("text")}
                    className={`py-2 text-xs font-medium rounded-lg ${
                      modalType === "text" ? "text-white bg-indigo-600" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Text / Notes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Halon Type IV"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Cabin Service, Safety Equipment"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-400">
                    {modalType === "sequence"
                      ? "Sequence Steps (One per line)"
                      : modalType === "features"
                      ? "Feature / Action : Details (One per line)"
                      : "Text Content"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {modalType === "sequence"
                      ? "Step 1, Step 2..."
                      : modalType === "features"
                      ? "e.g. Operation : Pull red tab to open pouch"
                      : "Paste paragraph or notes"}
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste your procedures or steps here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GEMINI API KEY SETTINGS ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Gemini API Key Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              CrewVault provides automatic built-in server evaluation. If you want direct browser evaluation with your personal Google Gemini API key, enter it below.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Get a free key from{" "}
                <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                  Google AI Studio
                </a>.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("gemini_api_key", apiKey.trim());
                  } catch {}
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-lg shadow-amber-600/20"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
