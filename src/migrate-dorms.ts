import Database from "bun:sqlite";

const client = new Database("data/info.db");

// 1. Add facebook_link column
try {
  client.run(`ALTER TABLE dorms ADD COLUMN facebook_link TEXT`);
  console.log("Added facebook_link column");
} catch (e: any) {
  if (e.message?.includes("duplicate column")) console.log("facebook_link column already exists");
  else throw e;
}

// 2. Remove the 5 dorms the user doesn't want
const toRemove = [
  "Raymundo Area Boarding Houses",
  "Catalan Compound Boarding Houses",
  "Demarces Boarding Houses",
  "Antonio's Boarding House",
  "Koru Residences",
];

for (const name of toRemove) {
  const result = client.run(`DELETE FROM dorms WHERE dorm_name = ?`, [name]);
  console.log(`Deleted "${name}": ${result.changes} row(s)`);
}

// 3. Set Facebook links for dorms that have them
const facebookLinks: Record<string, string> = {
  // UP-managed — central OSH page
  "Men's Residence Hall": "https://www.facebook.com/uplbosh",
  "Women's Residence Hall": "https://www.facebook.com/uplbosh",
  "VetMed Residence Hall": "https://www.facebook.com/uplbosh",
  "New Dormitory Residence Hall": "https://www.facebook.com/uplbosh",
  "International House Residence Hall": "https://www.facebook.com/uplbosh",
  "ATI-NTC Residence Hall": "https://www.facebook.com/uplbosh",
  "Forestry Residence Hall": "https://www.facebook.com/uplbosh",
  "New Forestry Residence Hall": "https://www.facebook.com/uplbosh",
  "Makiling Residence Hall": "https://www.facebook.com/uplbosh",
  // Private
  "Centtro Residences": "https://www.facebook.com/CenttroResidences",
  "Westbrook Residences": "https://www.facebook.com/WestbrookResidences",
};

for (const [name, link] of Object.entries(facebookLinks)) {
  const result = client.run(`UPDATE dorms SET facebook_link = ? WHERE dorm_name = ?`, [link, name]);
  console.log(`Set FB link for "${name}": ${result.changes} row(s)`);
}

// 4. Fix short_name: only keep abbreviations, clear ones that just repeat first word
const dorms = client.query(`SELECT id, dorm_name, short_name FROM dorms`).all() as { id: number; dorm_name: string; short_name: string | null }[];
for (const dorm of dorms) {
  if (!dorm.short_name) continue;
  const firstName = dorm.dorm_name.split(/\s+/)[0].toLowerCase();
  const shortLower = dorm.short_name.toLowerCase();
  // If short_name is just the first word of the dorm name (e.g. "Westbrook" for "Westbrook Residences"), clear it
  if (firstName === shortLower || dorm.dorm_name.toLowerCase().startsWith(shortLower + " ")) {
    // But keep actual abbreviations like MRH, IH, MAREHA, etc.
    const isAbbreviation = dorm.short_name.toUpperCase() === dorm.short_name || 
                           !dorm.dorm_name.toLowerCase().includes(shortLower);
    if (!isAbbreviation) {
      client.run(`UPDATE dorms SET short_name = NULL WHERE id = ?`, [dorm.id]);
      console.log(`Cleared redundant short_name "${dorm.short_name}" for "${dorm.dorm_name}"`);
    }
  }
}

// Verify final state
const remaining = client.query(`SELECT id, dorm_name, short_name, is_up_managed, facebook_link FROM dorms`).all();
console.log("\n--- Final dorms ---");
console.log(JSON.stringify(remaining, null, 2));
console.log(`Total: ${remaining.length} dorms`);
