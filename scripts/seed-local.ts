import { getDB, generateId } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function seed() {
  console.log("🌱 Seeding local CrewVault database with full Boeing & Airbus fleet and Cabin Crew curricula...");
  const db = await getDB();

  // 1. Seed Accounts
  const adminPwd = await hashPassword("Admin1234!");
  const managerPwd = await hashPassword("Manager1234!");
  const memberPwd = await hashPassword("Member1234!");

  const adminId = "usr_admin_default";
  const managerId = "usr_manager_default";
  const memberId = "usr_member_default";

  await db
    .prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, airline, aircraft_studied, subjects_studied)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      adminId,
      "admin@crewvault.local",
      adminPwd,
      "Chief Administrator",
      "ADMIN",
      "Global Airways",
      JSON.stringify(["Boeing 787-9 Dreamliner", "Airbus A380-800", "Airbus A320neo", "Boeing 737 MAX 8"]),
      JSON.stringify([
        "Inflight Service & Hospitality",
        "Aviation First Aid & Medical",
        "Dangerous Goods Regulations (DGR)",
        "Cabin Doors, Exits & Escape Slides",
        "Flight Deck & Security Doors",
      ])
    )
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, airline, aircraft_studied, subjects_studied)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      managerId,
      "manager@crewvault.local",
      managerPwd,
      "Lead Instructor Sarah",
      "MANAGER",
      "Global Airways",
      JSON.stringify(["Boeing 787-9 Dreamliner", "Airbus A350-900"]),
      JSON.stringify(["Inflight Service & Hospitality", "Aviation First Aid & Medical"])
    )
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, airline, aircraft_studied, subjects_studied)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      memberId,
      "member@crewvault.local",
      memberPwd,
      "Cadet Trainee Alex",
      "MEMBER",
      "Skyways Aviation",
      JSON.stringify(["Q400", "Boeing 737-800", "Airbus A320neo"]),
      JSON.stringify(["Dangerous Goods Regulations (DGR)", "Aviation First Aid & Medical"])
    )
    .run();

  for (const uid of [adminId, managerId, memberId]) {
    await db
      .prepare(`INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)`)
      .bind(uid)
      .run();
  }

  // 2. Comprehensive Seed Questions
  const questions = [
    // Service
    {
      id: "q_service_1",
      question_text: "During hot beverage service in the cabin, what is the mandatory safety requirement regarding coffee pot handling?",
      options: [
        "Never pass hot beverage pots directly over seated passengers",
        "Fill pots to 100% capacity to maximize service speed",
        "Place hot pots directly on empty passenger armrests",
        "Allow passengers to pour directly from the galley pot",
      ],
      correct_answer: "Never pass hot beverage pots directly over seated passengers",
      explanation: "Standard airline service safety regulations prohibit transferring hot pots over passengers to prevent severe scalding burns.",
      topic: "Inflight Service & Hospitality",
      aircraft: "General / All Fleet (Non-Aircraft Specific)",
      subject: "Inflight Service & Hospitality",
      difficulty: "Easy",
    },
    // First Aid
    {
      id: "q_firstaid_1",
      question_text: "What is the recommended compression-to-ventilation ratio for adult CPR according to ICAO cabin first aid standards?",
      options: [
        "30 compressions to 2 rescue breaths",
        "15 compressions to 2 rescue breaths",
        "50 compressions to 5 rescue breaths",
        "Continuous compressions with no breaths under any circumstances",
      ],
      correct_answer: "30 compressions to 2 rescue breaths",
      explanation: "Standard adult CPR protocol is 30 chest compressions followed by 2 rescue breaths at 100-120 compressions per minute.",
      topic: "Aviation First Aid & Medical",
      aircraft: "General / All Fleet (Non-Aircraft Specific)",
      subject: "Aviation First Aid & Medical",
      difficulty: "Medium",
    },
    // Dangerous Goods (DGR)
    {
      id: "q_dgr_1",
      question_text: "In the event of a passenger lithium battery thermal runaway in the cabin, what is the correct cooling procedure?",
      options: [
        "Extinguish flames with Halon or water, then douse continuously with water or non-alcoholic liquid to cool the cells",
        "Cover the device completely with dry blankets and pillows",
        "Smother the device with ice from the galley bar cart",
        "Throw the device immediately into the aircraft toilet bowl and flush",
      ],
      correct_answer: "Extinguish flames with Halon or water, then douse continuously with water or non-alcoholic liquid to cool the cells",
      explanation: "ICAO DGR guidelines require flooding thermal runaway lithium batteries with water to cool adjacent battery cells and prevent reignition. Ice must never be used as it acts as an insulator.",
      topic: "Dangerous Goods Regulations (DGR)",
      aircraft: "General / All Fleet (Non-Aircraft Specific)",
      subject: "Dangerous Goods Regulations (DGR)",
      difficulty: "Hard",
    },
    // Boeing 787
    {
      id: "q_b787_door_1",
      question_text: "On the Boeing 787 Dreamliner passenger entry doors, how is the emergency escape slide armed?",
      options: [
        "Move the slide arming lever to the ARMED position and verify the orange indicator flag and electro-mechanical indicator",
        "Manually pin the heavy girt bar into the cabin floor fittings",
        "Turn the door handle 90 degrees outward during taxi",
        "Depress the cockpit overhead door arming toggle only",
      ],
      correct_answer: "Move the slide arming lever to the ARMED position and verify the orange indicator flag and electro-mechanical indicator",
      explanation: "The Boeing 787 features an electro-mechanical arming lever with illuminated flag confirmation.",
      topic: "Cabin Doors, Exits & Escape Slides",
      aircraft: "Boeing 787-9 Dreamliner",
      subject: "Cabin Doors, Exits & Escape Slides",
      difficulty: "Medium",
    },
    // Airbus A380
    {
      id: "q_a380_slides_1",
      question_text: "What type of evacuation slide system is installed at the upper deck emergency exits (U1, U2, U3) on the Airbus A380-800?",
      options: [
        "Dual-lane dual-chamber inflatable slide rafts with automatic high-angle wind restraint systems",
        "Single-lane basic canvas evacuation chutes",
        "Rope ladders dropped from overhead storage bins",
        "Inflatable stairs requiring manual ground anchoring",
      ],
      correct_answer: "Dual-lane dual-chamber inflatable slide rafts with automatic high-angle wind restraint systems",
      explanation: "Due to the 8-meter elevation of the A380 upper deck, high-capacity dual-lane slide rafts with high-wind stabilizing trusses are deployed.",
      topic: "Cabin Doors, Exits & Escape Slides",
      aircraft: "Airbus A380-800",
      subject: "Cabin Doors, Exits & Escape Slides",
      difficulty: "Hard",
    },
    // Dash 8 Q400 Questions
    {
      id: "q_q400_doors_1",
      question_text: "On the Dash 8 Q400, what is the primary passenger door type and normal operating mechanism?",
      options: [
        "Forward airstair door manually operated with handrail deployment",
        "Pneumatic plug door with automatic power assist",
        "Translating slide door with pneumatic actuators",
        "Overwing gull-wing canopy door",
      ],
      correct_answer: "Forward airstair door manually operated with handrail deployment",
      explanation: "The Dash 8 Q400 features a forward passenger airstair door that is counterbalanced and manually deployed with integral handrails.",
      topic: "Cabin Doors, Exits & Escape Slides",
      aircraft: "Q400",
      subject: "Cabin Doors, Exits & Escape Slides",
      difficulty: "Medium",
    },
    {
      id: "q_q400_emer_2",
      question_text: "What emergency exit equipment is installed above the overwing type III emergency exits on the Q400?",
      options: [
        "Life line attachment fittings stored in the upper window recess",
        "Inflatable dual-lane slide rafts",
        "Emergency descent cables attached to wing tips",
        "Automatic escape chutes mounted in lower fairings",
      ],
      correct_answer: "Life line attachment fittings stored in the upper window recess",
      explanation: "On the Q400, ditching life lines are installed in recesses adjacent to the overwing emergency exits to assist passenger egress along the wing root.",
      topic: "Cabin Doors, Exits & Escape Slides",
      aircraft: "Q400",
      subject: "Cabin Doors, Exits & Escape Slides",
      difficulty: "Hard",
    },
  ];

  for (const q of questions) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO questions 
         (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, ai_generated, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'approved')`
      )
      .bind(
        q.id,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.difficulty,
        q.topic,
        q.aircraft,
        q.subject
      )
      .run();
  }

  // 3. Seed Official & Practice Exams
  const examId = "exam_service_safety_2026";
  await db
    .prepare(
      `INSERT OR REPLACE INTO exams 
       (id, title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, randomize_questions, randomize_answers, is_official, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?)`
    )
    .bind(
      examId,
      "2026 Recurrent Inflight Service & Cabin Safety Official Exam",
      "Official 20-minute examination covering inflight hospitality, dangerous goods handling, medical emergencies, and door procedures.",
      "General / All Fleet (Non-Aircraft Specific)",
      "Inflight Service & Hospitality",
      "Medium",
      5,
      20,
      80,
      managerId
    )
    .run();

  // 4. Seed Previous Exam Paper (Material)
  const examMatId = "mat_past_exam_2026_demo";
  const examVerId = "ver_past_exam_2026_demo_v1";

  const pastExamMd = `# 2026 Recurrent Inflight Safety & Service Previous Exam Paper

## Section 1: Inflight Hospitality & Service Safety
1. What is the mandatory protocol when carrying coffee pots in the passenger cabin?
A. Never pass hot beverage pots directly over seated passengers
B. Keep pots filled to 100% capacity
C. Allow passengers to self-serve from galley carts
D. Rest pots on armrests during turbulence
Correct Answer: A

2. In the event of passenger turbulence injuries during meal service:
A. Immediately stow and latch all service carts in galleys or lock trolley brakes
B. Continue meal delivery to calm passengers
C. Leave carts in aisle and sit in nearest passenger seat without setting brakes
D. Evacuate through overwing exits
Correct Answer: A

## Section 2: Dangerous Goods & Medical Emergencies
3. What is the primary cooling agent for lithium battery thermal runaways?
A. Plain water or non-alcoholic liquid poured continuously
B. Dry ice from galley bar
C. Wet blankets without water
D. Halon gas only
Correct Answer: A`;

  await db
    .prepare(
      `INSERT OR REPLACE INTO materials 
       (id, title, description, material_type, subject, aircraft, airline, course, difficulty, year, uploader_id, current_version_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2026, ?, ?, 'approved')`
    )
    .bind(
      examMatId,
      "2026 Official Recurrent Inflight Safety & Service Past Paper",
      "Official past examination paper covering meal service safety, galley operations, and lithium fire protocols.",
      "Previous Exam",
      "Inflight Service & Hospitality",
      "General / All Fleet (Non-Aircraft Specific)",
      "Global Airways",
      "Annual Recurrent 2026",
      "Intermediate",
      managerId,
      examVerId
    )
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO material_versions
       (id, material_id, version_number, r2_key_original, r2_key_markdown, r2_key_text, filename, mime_type, size_bytes, extracted_markdown, extracted_text, processing_status, uploader_id)
       VALUES (?, ?, 1, ?, ?, ?, ?, 'text/markdown', 2100, ?, ?, 'completed', ?)`
    )
    .bind(
      examVerId,
      examMatId,
      `originals/${examMatId}/${examVerId}/past_exam_2026.md`,
      `derived/${examMatId}/${examVerId}/markdown.md`,
      `derived/${examMatId}/${examVerId}/text.txt`,
      "past_exam_2026.md",
      pastExamMd,
      pastExamMd,
      managerId
    )
    .run();

  // 5. Populate FTS5 index
  await db.prepare(`DELETE FROM materials_fts`).run();
  await db.prepare(`
    INSERT INTO materials_fts(material_id, title, description, markdown_content, subject, aircraft, airline, course)
    SELECT m.id, m.title, m.description, mv.extracted_markdown, m.subject, m.aircraft, m.airline, m.course
    FROM materials m
    LEFT JOIN material_versions mv ON m.current_version_id = mv.id
    WHERE m.status = 'approved'
  `).run();

  // 6. Comprehensive Boeing & Airbus Families & Variants
  const families = [
    // Boeing
    { id: "fam_b717", mfr: "Boeing", name: "717", desc: "Narrow-body twin-jet airliner (106 seats)" },
    { id: "fam_b727", mfr: "Boeing", name: "727", desc: "Tri-jet narrow-body airliner" },
    { id: "fam_b737_ng", mfr: "Boeing", name: "737 Next Generation", desc: "World standard twin-jet narrowbody (737-700/800/900ER)" },
    { id: "fam_b737_max", mfr: "Boeing", name: "737 MAX", desc: "High efficiency CFM LEAP-1B powered airliner (MAX 7/8/9/10)" },
    { id: "fam_b747", mfr: "Boeing", name: "747", desc: "Wide-body Queen of the Skies (747-400 / 747-8)" },
    { id: "fam_b757", mfr: "Boeing", name: "757", desc: "Long range narrow-body twinjet (757-200/300)" },
    { id: "fam_b767", mfr: "Boeing", name: "767", desc: "Twin-aisle transatlantic airliner (767-300ER/400ER)" },
    { id: "fam_b777", mfr: "Boeing", name: "777", desc: "Twin-aisle long-range airliner (777-200ER/300ER/777X)" },
    { id: "fam_b787", mfr: "Boeing", name: "787 Dreamliner", desc: "Composite widebody super-efficient airliner (787-8/9/10)" },

    // Airbus
    { id: "fam_a220", mfr: "Airbus", name: "A220", desc: "Single-aisle Pratt & Whitney GTF airliner (A220-100/300)" },
    { id: "fam_a300", mfr: "Airbus", name: "A300/A310", desc: "Pioneering widebody twinjet airliner (A300-600/A310)" },
    { id: "fam_a320", mfr: "Airbus", name: "A320 Family", desc: "Benchmark single-aisle aircraft (A318/A319/A320/A321)" },
    { id: "fam_a330", mfr: "Airbus", name: "A330 / A330neo", desc: "Medium to long-range widebody airliner (A330-200/300/800neo/900neo)" },
    { id: "fam_a340", mfr: "Airbus", name: "A340", desc: "Four-engine long-range widebody airliner (A340-300/600)" },
    { id: "fam_a350", mfr: "Airbus", name: "A350 XWB", desc: "Carbon-composite ultra-long range airliner (A350-900/1000)" },
    { id: "fam_a380", mfr: "Airbus", name: "A380 Superjumbo", desc: "Double-deck four-engine widebody aircraft (A380-800)" },

    // Regional
    { id: "fam_q400", mfr: "De Havilland", name: "Dash 8 Q400", desc: "High-speed turboprop regional airliner (78-90 seats)" },
    { id: "fam_atr", mfr: "ATR", name: "ATR 42 / 72", desc: "Regional turboprop airliner family" },
    { id: "fam_ejets", mfr: "Embraer", name: "E-Jets / E2", desc: "Regional jet family (E175/E190/E195/E2)" },
    { id: "fam_crj", mfr: "Bombardier", name: "CRJ Series", desc: "Regional jet family (CRJ700/CRJ900)" },
  ];

  for (const fam of families) {
    await db
      .prepare(`INSERT OR REPLACE INTO aircraft_families (id, manufacturer, family_name, description) VALUES (?, ?, ?, ?)`)
      .bind(fam.id, fam.mfr, fam.name, fam.desc)
      .run();
  }

  const variants = [
    // Boeing Variants
    { id: "var_b717_200", famId: "fam_b717", name: "Boeing 717-200", doors: "4 Main Entry, 2 Overwing", cap: "106-117" },
    { id: "var_b727_200", famId: "fam_b727", name: "Boeing 727-200", doors: "2 Forward, 2 Mid/Aft, Ventral Aft Stair", cap: "149-189" },
    { id: "var_b737_800", famId: "fam_b737_ng", name: "Boeing 737-800", doors: "4 Main Entry/Service, 4 Overwing Exits", cap: "162-189" },
    { id: "var_b737_900er", famId: "fam_b737_ng", name: "Boeing 737-900ER", doors: "4 Main Entry, 4 Overwing, 2 Mid-Exit Doors", cap: "180-215" },
    { id: "var_b737_max8", famId: "fam_b737_max", name: "Boeing 737 MAX 8", doors: "4 Main Entry/Service, 4 Overwing Exits", cap: "178-210" },
    { id: "var_b737_max9", famId: "fam_b737_max", name: "Boeing 737 MAX 9", doors: "4 Main Entry, 4 Overwing, 2 Mid-Exit Doors", cap: "193-220" },
    { id: "var_b747_400", famId: "fam_b747", name: "Boeing 747-400", doors: "10 Main Deck, 2 Upper Deck Exits", cap: "416-524" },
    { id: "var_b747_8", famId: "fam_b747", name: "Boeing 747-8 Intercontinental", doors: "10 Main Deck, 2 Upper Deck Exits", cap: "467-581" },
    { id: "var_b757_200", famId: "fam_b757", name: "Boeing 757-200", doors: "8 Main Entry/Service or 6 Doors + 4 Overwing", cap: "200-239" },
    { id: "var_b767_300er", famId: "fam_b767", name: "Boeing 767-300ER", doors: "4 Main Entry, 4 Overwing Exits", cap: "218-269" },
    { id: "var_b777_300er", famId: "fam_b777", name: "Boeing 777-300ER", doors: "10 Main Entry / Service Doors (Type A)", cap: "365-451" },
    { id: "var_b777_9", famId: "fam_b777", name: "Boeing 777-9 (777X)", doors: "10 Main Entry Doors with Folding Wingtips", cap: "426-515" },
    { id: "var_b787_8", famId: "fam_b787", name: "Boeing 787-8 Dreamliner", doors: "8 Main Entry / Service Doors (Type A)", cap: "248-290" },
    { id: "var_b787_9", famId: "fam_b787", name: "Boeing 787-9 Dreamliner", doors: "8 Main Entry / Service Doors (Type A)", cap: "296-338" },
    { id: "var_b787_10", famId: "fam_b787", name: "Boeing 787-10 Dreamliner", doors: "8 Main Entry / Service Doors (Type A)", cap: "336-390" },

    // Airbus Variants
    { id: "var_a220_100", famId: "fam_a220", name: "Airbus A220-100", doors: "4 Main Entry/Service, 2 Overwing Exits", cap: "100-135" },
    { id: "var_a220_300", famId: "fam_a220", name: "Airbus A220-300", doors: "4 Main Entry/Service, 2 Overwing Exits", cap: "130-160" },
    { id: "var_a300_600", famId: "fam_a300", name: "Airbus A300-600", doors: "6 Type A Main Entry, 2 Type I Exits", cap: "250-280" },
    { id: "var_a319_neo", famId: "fam_a320", name: "Airbus A319neo", doors: "4 Main Entry, 2 or 4 Overwing Exits", cap: "140-160" },
    { id: "var_a320_200", famId: "fam_a320", name: "Airbus A320-200 ceo", doors: "4 Main Entry/Service, 4 Overwing Exits", cap: "150-180" },
    { id: "var_a320_neo", famId: "fam_a320", name: "Airbus A320neo", doors: "4 Main Entry/Service, 4 Overwing Exits", cap: "165-195" },
    { id: "var_a321_neo", famId: "fam_a320", name: "Airbus A321neo", doors: "4 Main Entry, 4 Overwing/Mid Cabin Exits (Cabin Flex)", cap: "190-244" },
    { id: "var_a321_xlr", famId: "fam_a320", name: "Airbus A321XLR", doors: "4 Main Entry, 4 Overwing/Mid Exits with Rear Center Tank", cap: "180-220" },
    { id: "var_a330_300", famId: "fam_a330", name: "Airbus A330-300", doors: "8 Main Entry / Service Doors (Type A)", cap: "277-335" },
    { id: "var_a330_900neo", famId: "fam_a330", name: "Airbus A330-900neo", doors: "8 Main Entry / Service Doors (Type A)", cap: "287-350" },
    { id: "var_a340_600", famId: "fam_a340", name: "Airbus A340-600", doors: "8 Main Entry Doors, 2 Center Escape Exits", cap: "320-375" },
    { id: "var_a350_900", famId: "fam_a350", name: "Airbus A350-900", doors: "8 Main Entry / Service Doors (Type A)", cap: "300-350" },
    { id: "var_a350_1000", famId: "fam_a350", name: "Airbus A350-1000", doors: "8 Main Entry / Service Doors (Type A)", cap: "350-410" },
    { id: "var_a380_800", famId: "fam_a380", name: "Airbus A380-800 Superjumbo", doors: "10 Main Deck Type A, 6 Upper Deck Type A Exits", cap: "525-853" },

    // Regional Variants
    { id: "var_q400_std", famId: "fam_q400", name: "Dash 8 Q400 NextGen", doors: "2 Passenger Doors, 2 Service/Emergency Doors", cap: "76-90" },
    { id: "var_atr72_600", famId: "fam_atr", name: "ATR 72-600", doors: "2 Aft Entry, 2 Fwd Service/Cargo, 2 Overwing", cap: "70-78" },
    { id: "var_e190_e2", famId: "fam_ejets", name: "Embraer E190-E2", doors: "4 Main Entry/Service, 2 Overwing Exits", cap: "97-114" },
    { id: "var_crj900", famId: "fam_crj", name: "Bombardier CRJ900", doors: "2 Forward Passenger, 2 Overwing Exits", cap: "76-90" },
  ];

  for (const v of variants) {
    await db
      .prepare(`INSERT OR REPLACE INTO aircraft_variants (id, family_id, variant_name, door_configuration, capacity_passengers) VALUES (?, ?, ?, ?, ?)`)
      .bind(v.id, v.famId, v.name, v.doors, v.cap)
      .run();
  }

  console.log("✅ Seed completed successfully!");
  console.log("✈️ Boeing Fleet seeded: 717, 727, 737 NG & MAX, 747, 757, 767, 777, 787 Dreamliner");
  console.log("✈️ Airbus Fleet seeded: A220, A300, A310, A318, A319, A320, A321, A330, A340, A350, A380 Superjumbo");
  console.log("✈️ Regional Fleet seeded: Dash 8 Q400, ATR 42/72, Embraer E-Jets, CRJ");
  console.log("📖 Cabin Crew Subjects seeded: Inflight Service, First Aid, Dangerous Goods (DGR), AVSEC, CRM, Doors, etc.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
