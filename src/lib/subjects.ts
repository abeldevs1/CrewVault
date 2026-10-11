export interface SubjectCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export const CABIN_CREW_SUBJECTS: SubjectCategory[] = [
  {
    id: "inflight_service",
    name: "Inflight Service & Hospitality",
    description: "Meal and beverage service, bar operations, galley management, VIP protocols, special passenger handling.",
    iconName: "Utensils",
  },
  {
    id: "first_aid",
    name: "Aviation First Aid & Medical",
    description: "CPR, AED, choking, aviation medicine, medical kits (EMK, FAK), burns, hypoxia, and childbirth in flight.",
    iconName: "HeartPulse",
  },
  {
    id: "dangerous_goods",
    name: "Dangerous Goods Regulations (DGR)",
    description: "IATA/ICAO DGR classes, lithium battery fires, spill procedures, forbidden cargo, and NOTOC handling.",
    iconName: "AlertTriangle",
  },
  {
    id: "security",
    name: "Aviation Security (AVSEC)",
    description: "Disruptive passengers, hijacking defense, bomb threats, flight deck access control, and search procedures.",
    iconName: "Shield",
  },
  {
    id: "crm",
    name: "Crew Resource Management (CRM)",
    description: "Communication, situational awareness, workload management, fatigue mitigation, decision-making drills.",
    iconName: "Users",
  },
  {
    id: "sep_emergency",
    name: "Emergency Procedures (SEP) & Evacuation",
    description: "Cabin decompression, planned & unplanned evacuations, emergency commands, smoke & fire fighting.",
    iconName: "Flame",
  },
  {
    id: "flight_deck",
    name: "Flight Deck & Security Doors",
    description: "Cockpit door deadbolt systems, blowout panels, decompression procedures, emergency keypad access.",
    iconName: "KeyRound",
  },
  {
    id: "doors_exits",
    name: "Cabin Doors, Exits & Escape Slides",
    description: "Door arming/disarming, girt bars, slide deployment, overwing exit operation, evacuation slide rafts.",
    iconName: "DoorOpen",
  },
  {
    id: "emergency_equipment",
    name: "Emergency Equipment & Fire Fighting",
    description: "PBE, Halon/water fire extinguishers, portable oxygen bottles, crash axe, Megaphones, ELT beacons.",
    iconName: "BriefcaseMedical",
  },
  {
    id: "survival",
    name: "Survival & Ditching",
    description: "Sea survival, life rafts, pyrotechnics, polar/desert/jungle survival tactics, water rescue.",
    iconName: "LifeBuoy",
  },
  {
    id: "sop",
    name: "Standard Operating Procedures (SOPs)",
    description: "Pre-flight briefings, cabin checks, passenger boarding, sterile flight deck, turnaround duties.",
    iconName: "ClipboardCheck",
  },
  {
    id: "regulations",
    name: "Aviation Law & Regulations",
    description: "ICAO, FAA, EASA, IATA cabin safety compliance, duty time limitations, safety reporting.",
    iconName: "BookOpen",
  },
];

export const MATERIAL_TYPES = [
  "Previous Exam",
  "Question Bank",
  "Study Notes",
  "PowerPoint",
  "Training Manual",
  "Procedure",
  "Study Guide",
  "Flashcards",
  "Checklist",
  "Other",
] as const;

export type MaterialTypeOption = (typeof MATERIAL_TYPES)[number];

/**
 * Dynamically detects material type, subject, and aircraft from text or filename
 */
export function autoDetectMaterialMetadata(filename: string, content: string = ""): {
  suggestedType: MaterialTypeOption;
  suggestedSubject: string;
  suggestedAircraft: string;
  confidenceReason: string;
} {
  const combined = `${filename} ${content.substring(0, 2000)}`.toLowerCase();

  let suggestedType: MaterialTypeOption = "Study Notes";
  let suggestedSubject = "Inflight Service & Hospitality";
  let suggestedAircraft = "General / All Fleet (Non-Aircraft Specific)";
  const reasons: string[] = [];

  // 1. Detect Material Type
  if (/(exam|quiz|recurrent|mock|past paper|assessment|test paper|checkride)/i.test(combined)) {
    suggestedType = "Previous Exam";
    reasons.push("Found exam/test terms");
  } else if (/(question bank|mcq|q&a|multiple choice|questions)/i.test(combined)) {
    suggestedType = "Question Bank";
    reasons.push("Found question bank pattern");
  } else if (/\.(pptx?|ppsx?)$/i.test(filename) || /(slide presentation|slide deck|module slides)/i.test(combined)) {
    suggestedType = "PowerPoint";
    reasons.push("Identified PowerPoint presentation");
  } else if (/(manual|fcom|om|handbook|fctm|study guide)/i.test(combined)) {
    suggestedType = "Training Manual";
    reasons.push("Identified manual reference");
  } else if (/(procedure|checklist|drill|sop)/i.test(combined)) {
    suggestedType = "Procedure";
    reasons.push("Found procedure guidelines");
  } else if (/(flashcard)/i.test(combined)) {
    suggestedType = "Flashcards";
    reasons.push("Identified flashcard set");
  }

  // 2. Detect Subject
  if (/(first aid|medical|cpr|aed|choking|hypoxia|burns|fak|emk|childbirth)/i.test(combined)) {
    suggestedSubject = "Aviation First Aid & Medical";
    reasons.push("Aviation First Aid detected");
  } else if (/(dangerous goods|dgr|lithium|hazmat|un number|class \d|notoc|spill kit)/i.test(combined)) {
    suggestedSubject = "Dangerous Goods Regulations (DGR)";
    reasons.push("DGR keywords detected");
  } else if (/(security|avsec|hijack|disruptive|bomb|restraint|unruly|cockpit access)/i.test(combined)) {
    suggestedSubject = "Aviation Security (AVSEC)";
    reasons.push("Aviation Security detected");
  } else if (/(service|hospitality|meal|bar|galley|catering|beverage|vip|special meal)/i.test(combined)) {
    suggestedSubject = "Inflight Service & Hospitality";
    reasons.push("Inflight Service detected");
  } else if (/(crm|crew resource|situational awareness|fatigue|human factors)/i.test(combined)) {
    suggestedSubject = "Crew Resource Management (CRM)";
    reasons.push("CRM detected");
  } else if (/(door|girt bar|slide|overwing|exit handle|slide raft)/i.test(combined)) {
    suggestedSubject = "Cabin Doors, Exits & Escape Slides";
    reasons.push("Door & Exit systems detected");
  } else if (/(flight deck|cockpit door|deadbolt|blowout panel)/i.test(combined)) {
    suggestedSubject = "Flight Deck & Security Doors";
    reasons.push("Flight deck door operations detected");
  } else if (/(pbe|halon|extinguisher|fire fighting|smoke hood|crash axe|megaphones)/i.test(combined)) {
    suggestedSubject = "Emergency Equipment & Fire Fighting";
    reasons.push("Emergency safety equipment detected");
  } else if (/(ditching|survival|raft|pyrotechnic|sea survival|life jacket)/i.test(combined)) {
    suggestedSubject = "Survival & Ditching";
    reasons.push("Survival procedures detected");
  } else if (/(evacuation|decompression|sep|brace position|emergency descent)/i.test(combined)) {
    suggestedSubject = "Emergency Procedures (SEP) & Evacuation";
    reasons.push("Emergency procedures detected");
  }

  // 3. Detect Aircraft Model
  if (/(787|dreamliner)/i.test(combined)) {
    suggestedAircraft = "Boeing 787-9 Dreamliner";
    reasons.push("Boeing 787 detected");
  } else if (/(a380|380|superjumbo)/i.test(combined)) {
    suggestedAircraft = "Airbus A380-800";
    reasons.push("Airbus A380 detected");
  } else if (/(a350|350)/i.test(combined)) {
    suggestedAircraft = "Airbus A350-900";
    reasons.push("Airbus A350 detected");
  } else if (/(a320|a321|a319|a220)/i.test(combined)) {
    suggestedAircraft = combined.includes("a321") ? "Airbus A321neo" : "Airbus A320neo";
    reasons.push("Airbus single-aisle detected");
  } else if (/(a330|330)/i.test(combined)) {
    suggestedAircraft = "Airbus A330-300";
    reasons.push("Airbus A330 detected");
  } else if (/(737 max|max 8|max 9)/i.test(combined)) {
    suggestedAircraft = "Boeing 737 MAX 8";
    reasons.push("Boeing 737 MAX detected");
  } else if (/(737|b737)/i.test(combined)) {
    suggestedAircraft = "Boeing 737-800";
    reasons.push("Boeing 737 detected");
  } else if (/(777|b777|triple seven)/i.test(combined)) {
    suggestedAircraft = "Boeing 777-300ER";
    reasons.push("Boeing 777 detected");
  } else if (/(747|b747|jumbo)/i.test(combined)) {
    suggestedAircraft = "Boeing 747-400";
    reasons.push("Boeing 747 detected");
  } else if (/(q400|dash 8)/i.test(combined)) {
    suggestedAircraft = "Dash 8 Q400";
    reasons.push("Q400 detected");
  } else if (/(atr|atr 72|atr 42)/i.test(combined)) {
    suggestedAircraft = "ATR 72-600";
    reasons.push("ATR detected");
  }

  return {
    suggestedType,
    suggestedSubject,
    suggestedAircraft,
    confidenceReason: reasons.join(" • ") || "Default cabin crew standard",
  };
}
