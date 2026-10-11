import { runAuthTests } from "./auth_verification.test";
import { runMaterialsFilesTests } from "./materials_files.test";
import { runSearchCommunityTests } from "./search_community.test";
import { runExamEngineTests } from "./exam_engine.test";
import { runAIStudyPacksTests } from "./ai_study_packs.test";
import { runNotificationsAdminTests } from "./notifications_admin.test";
import { runCrewVault2Tests } from "./crewvault_2_features.test";
import { runCurriculaAndSettingsTests } from "./curricula_and_settings.test";

async function runAll() {
  console.log("=================================================");
  console.log("🚀 CREWVAULT FULL-STACK VERIFICATION TEST RUNNER");
  console.log("=================================================\n");

  const startTime = Date.now();
  const results: Record<string, "PASS" | "FAIL"> = {};

  try {
    await runAuthTests();
    results["Authentication & RBAC"] = "PASS";
  } catch (e) {
    console.error("❌ Authentication & RBAC Failed:", e);
    results["Authentication & RBAC"] = "FAIL";
  }

  try {
    await runMaterialsFilesTests();
    results["Materials, Quotas, Parser & Storage"] = "PASS";
  } catch (e) {
    console.error("❌ Materials & Storage Failed:", e);
    results["Materials, Quotas, Parser & Storage"] = "FAIL";
  }

  try {
    await runSearchCommunityTests();
    results["FTS5 Search, Triggers & Community"] = "PASS";
  } catch (e) {
    console.error("❌ FTS5 Search & Community Failed:", e);
    results["FTS5 Search, Triggers & Community"] = "FAIL";
  }

  try {
    await runExamEngineTests();
    results["Examination Engine & Immutable Snapshots"] = "PASS";
  } catch (e) {
    console.error("❌ Examination Engine Failed:", e);
    results["Examination Engine & Immutable Snapshots"] = "FAIL";
  }

  try {
    await runAIStudyPacksTests();
    results["Gemini AI Service & Study Packs"] = "PASS";
  } catch (e) {
    console.error("❌ Gemini AI Service Failed:", e);
    results["Gemini AI Service & Study Packs"] = "FAIL";
  }

  try {
    await runNotificationsAdminTests();
    results["Targeted Notifications & Admin Dashboard"] = "PASS";
  } catch (e) {
    console.error("❌ Notifications & Admin Failed:", e);
    results["Targeted Notifications & Admin Dashboard"] = "FAIL";
  }

  try {
    await runCrewVault2Tests();
    results["CrewVault 2.0 Features & Privacy"] = "PASS";
  } catch (e) {
    console.error("❌ CrewVault 2.0 Features Failed:", e);
    results["CrewVault 2.0 Features & Privacy"] = "FAIL";
  }

  try {
    await runCurriculaAndSettingsTests();
    results["Curricula, Multi-Upload & Settings"] = "PASS";
  } catch (e) {
    console.error("❌ Curricula, Multi-Upload & Settings Failed:", e);
    results["Curricula, Multi-Upload & Settings"] = "FAIL";
  }

  const durationMs = Date.now() - startTime;
  console.log("=================================================");
  console.log("📊 TEST VERIFICATION SUMMARY");
  console.log("=================================================");
  let allPassed = true;
  for (const [suite, status] of Object.entries(results)) {
    const symbol = status === "PASS" ? "✅" : "❌";
    console.log(`${symbol} ${suite.padEnd(42)} [${status}]`);
    if (status !== "PASS") allPassed = false;
  }
  console.log(`\n⏱ Completed in ${(durationMs / 1000).toFixed(2)}s`);
  console.log("=================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
  process.exit(0);
}

runAll().catch((err) => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
