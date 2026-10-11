export interface AircraftModel {
  id: string;
  manufacturer: string;
  family: string;
  model: string;
  category: "Narrow-body" | "Wide-body" | "Turboprop" | "Regional Jet" | "General";
}

export const AIRCRAFT_FLEET: AircraftModel[] = [
  // General fleet (Non-aircraft specific)
  {
    id: "general_fleet",
    manufacturer: "All Manufacturers",
    family: "General / All Fleet",
    model: "General / All Fleet (Non-Aircraft Specific)",
    category: "General",
  },

  // BOEING FLEET
  { id: "b717_200", manufacturer: "Boeing", family: "717", model: "Boeing 717-200", category: "Narrow-body" },
  { id: "b727_200", manufacturer: "Boeing", family: "727", model: "Boeing 727-200", category: "Narrow-body" },
  { id: "b737_700", manufacturer: "Boeing", family: "737 NG", model: "Boeing 737-700", category: "Narrow-body" },
  { id: "b737_800", manufacturer: "Boeing", family: "737 NG", model: "Boeing 737-800", category: "Narrow-body" },
  { id: "b737_900er", manufacturer: "Boeing", family: "737 NG", model: "Boeing 737-900ER", category: "Narrow-body" },
  { id: "b737_max7", manufacturer: "Boeing", family: "737 MAX", model: "Boeing 737 MAX 7", category: "Narrow-body" },
  { id: "b737_max8", manufacturer: "Boeing", family: "737 MAX", model: "Boeing 737 MAX 8", category: "Narrow-body" },
  { id: "b737_max9", manufacturer: "Boeing", family: "737 MAX", model: "Boeing 737 MAX 9", category: "Narrow-body" },
  { id: "b737_max10", manufacturer: "Boeing", family: "737 MAX", model: "Boeing 737 MAX 10", category: "Narrow-body" },
  { id: "b747_400", manufacturer: "Boeing", family: "747", model: "Boeing 747-400", category: "Wide-body" },
  { id: "b747_8", manufacturer: "Boeing", family: "747", model: "Boeing 747-8 Intercontinental", category: "Wide-body" },
  { id: "b757_200", manufacturer: "Boeing", family: "757", model: "Boeing 757-200", category: "Narrow-body" },
  { id: "b757_300", manufacturer: "Boeing", family: "757", model: "Boeing 757-300", category: "Narrow-body" },
  { id: "b767_300er", manufacturer: "Boeing", family: "767", model: "Boeing 767-300ER", category: "Wide-body" },
  { id: "b767_400er", manufacturer: "Boeing", family: "767", model: "Boeing 767-400ER", category: "Wide-body" },
  { id: "b777_200er", manufacturer: "Boeing", family: "777", model: "Boeing 777-200ER", category: "Wide-body" },
  { id: "b777_300er", manufacturer: "Boeing", family: "777", model: "Boeing 777-300ER", category: "Wide-body" },
  { id: "b777_9", manufacturer: "Boeing", family: "777X", model: "Boeing 777-9 (777X)", category: "Wide-body" },
  { id: "b787_8", manufacturer: "Boeing", family: "787 Dreamliner", model: "Boeing 787-8 Dreamliner", category: "Wide-body" },
  { id: "b787_9", manufacturer: "Boeing", family: "787 Dreamliner", model: "Boeing 787-9 Dreamliner", category: "Wide-body" },
  { id: "b787_10", manufacturer: "Boeing", family: "787 Dreamliner", model: "Boeing 787-10 Dreamliner", category: "Wide-body" },

  // AIRBUS FLEET
  { id: "a220_100", manufacturer: "Airbus", family: "A220", model: "Airbus A220-100", category: "Narrow-body" },
  { id: "a220_300", manufacturer: "Airbus", family: "A220", model: "Airbus A220-300", category: "Narrow-body" },
  { id: "a300_600", manufacturer: "Airbus", family: "A300/A310", model: "Airbus A300-600", category: "Wide-body" },
  { id: "a310_300", manufacturer: "Airbus", family: "A300/A310", model: "Airbus A310-300", category: "Wide-body" },
  { id: "a318_100", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A318", category: "Narrow-body" },
  { id: "a319_ceo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A319ceo", category: "Narrow-body" },
  { id: "a319_neo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A319neo", category: "Narrow-body" },
  { id: "a320_ceo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A320-200 ceo", category: "Narrow-body" },
  { id: "a320_neo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A320neo", category: "Narrow-body" },
  { id: "a321_ceo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A321-200 ceo", category: "Narrow-body" },
  { id: "a321_neo", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A321neo", category: "Narrow-body" },
  { id: "a321_lr", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A321LR", category: "Narrow-body" },
  { id: "a321_xlr", manufacturer: "Airbus", family: "A320 Family", model: "Airbus A321XLR", category: "Narrow-body" },
  { id: "a330_200", manufacturer: "Airbus", family: "A330", model: "Airbus A330-200", category: "Wide-body" },
  { id: "a330_300", manufacturer: "Airbus", family: "A330", model: "Airbus A330-300", category: "Wide-body" },
  { id: "a330_800neo", manufacturer: "Airbus", family: "A330neo", model: "Airbus A330-800neo", category: "Wide-body" },
  { id: "a330_900neo", manufacturer: "Airbus", family: "A330neo", model: "Airbus A330-900neo", category: "Wide-body" },
  { id: "a340_300", manufacturer: "Airbus", family: "A340", model: "Airbus A340-300", category: "Wide-body" },
  { id: "a340_600", manufacturer: "Airbus", family: "A340", model: "Airbus A340-600", category: "Wide-body" },
  { id: "a350_900", manufacturer: "Airbus", family: "A350 XWB", model: "Airbus A350-900", category: "Wide-body" },
  { id: "a350_1000", manufacturer: "Airbus", family: "A350 XWB", model: "Airbus A350-1000", category: "Wide-body" },
  { id: "a380_800", manufacturer: "Airbus", family: "A380 Superjumbo", model: "Airbus A380-800", category: "Wide-body" },

  // REGIONAL & TURBOPROP FLEET
  { id: "q400", manufacturer: "De Havilland", family: "Dash 8", model: "Dash 8 Q400", category: "Turboprop" },
  { id: "atr42_600", manufacturer: "ATR", family: "ATR", model: "ATR 42-600", category: "Turboprop" },
  { id: "atr72_600", manufacturer: "ATR", family: "ATR", model: "ATR 72-600", category: "Turboprop" },
  { id: "e175", manufacturer: "Embraer", family: "E-Jets", model: "Embraer E175", category: "Regional Jet" },
  { id: "e190", manufacturer: "Embraer", family: "E-Jets", model: "Embraer E190", category: "Regional Jet" },
  { id: "e195", manufacturer: "Embraer", family: "E-Jets", model: "Embraer E195", category: "Regional Jet" },
  { id: "e190_e2", manufacturer: "Embraer", family: "E-Jets E2", model: "Embraer E190-E2", category: "Regional Jet" },
  { id: "e195_e2", manufacturer: "Embraer", family: "E-Jets E2", model: "Embraer E195-E2", category: "Regional Jet" },
  { id: "crj700", manufacturer: "Bombardier", family: "CRJ", model: "Bombardier CRJ700", category: "Regional Jet" },
  { id: "crj900", manufacturer: "Bombardier", family: "CRJ", model: "Bombardier CRJ900", category: "Regional Jet" },
];

export const POPULAR_AIRCRAFT_KEYS = [
  "General / All Fleet (Non-Aircraft Specific)",
  "Boeing 787-9 Dreamliner",
  "Boeing 737-800",
  "Boeing 737 MAX 8",
  "Airbus A380-800",
  "Airbus A350-900",
  "Airbus A320neo",
  "Airbus A321neo",
  "Boeing 777-300ER",
  "Dash 8 Q400",
];

export function getAircraftGrouped() {
  const groups: Record<string, AircraftModel[]> = {
    "General / Fleet-Wide": [],
    "Boeing Commercial Fleet": [],
    "Airbus Commercial Fleet": [],
    "Regional & Turboprop Fleet": [],
  };

  for (const ac of AIRCRAFT_FLEET) {
    if (ac.category === "General") {
      groups["General / Fleet-Wide"].push(ac);
    } else if (ac.manufacturer === "Boeing") {
      groups["Boeing Commercial Fleet"].push(ac);
    } else if (ac.manufacturer === "Airbus") {
      groups["Airbus Commercial Fleet"].push(ac);
    } else {
      groups["Regional & Turboprop Fleet"].push(ac);
    }
  }

  return groups;
}
