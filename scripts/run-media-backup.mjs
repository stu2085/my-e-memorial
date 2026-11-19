import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://www.myememorial.com" +
  "/api/cron/media-backups";
const batchSize = 5;
const identity = ({ bucket, path }) => JSON.stringify([bucket, path]);

async function main() {
  const [inventoryPath, mode] = process.argv.slice(2);
  const secret = process.env.MEDIA_BACKUP_TEST_SECRET;
  if (!inventoryPath || !["--pilot", "--full"].includes(mode) || !secret) {
    throw new Error("Supply an inventory JSON file, --pilot or --full, and MEDIA_BACKUP_TEST_SECRET.");
  }

  const raw = await readFile(inventoryPath);
  const inventory = JSON.parse(raw.toString("utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(inventory) || !inventory.length || inventory.some((entry) =>
    !entry || typeof entry.bucket !== "string" || typeof entry.path !== "string" ||
    !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > 20 * 1024 * 1024
  )) {
    throw new Error("Invalid inventory or a file exceeds 20 MiB.");
  }
  const entries = new Map(inventory.map((entry) => [identity(entry), entry]));
  if (entries.size !== inventory.length) throw new Error("Duplicate inventory paths.");

  const inventoryHash = createHash("sha256").update(raw).digest("hex");
  const checkpoint = resolve(`${inventoryPath}.${inventoryHash.slice(0, 16)}.checkpoint.json`);
  let receipts = [];
  try {
    receipts = JSON.parse(await readFile(checkpoint, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  function validReceipt(item) {
    const source = entries.get(identity(item));
    return source && item.verified === true && source.bytes === item.bytes &&
      typeof item.sha256 === "string" && /^[0-9a-f]{64}$/.test(item.sha256) &&
      typeof item.key === "string" && item.key.startsWith(`files/${item.bucket}/`);
  }

  if (!Array.isArray(receipts) || !receipts.every(validReceipt)) {
    throw new Error("Invalid checkpoint. Preserve it for review.");
  }

  const done = new Map(receipts.map((item) => [identity(item), item]));
  const pending = inventory.filter((item) => !done.has(identity(item)));
  const selected = mode === "--pilot" ? pending.slice(0, batchSize) : pending;
  console.log(`Verified at start: ${done.size}/${inventory.length}. Selected: ${selected.length}.`);

  for (let offset = 0; offset < selected.length; offset += batchSize) {
    const batch = selected.slice(offset, offset + batchSize);
    const response = await fetch(endpoint, {
      method: "PUT",
      redirect: "error",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Backup endpoint returned HTTP ${response.status}.`);
    const { results } = await response.json();
    if (!Array.isArray(results) || results.length !== batch.length ||
        results.some((item, index) => !item || identity(item) !== identity(batch[index]))) {
      throw new Error("Backup response did not match the requested batch.");
    }
    const failed = [];
    for (const item of results) {
      if (validReceipt(item)) done.set(identity(item), item);
      else failed.push(item);
    }

    const temporary = `${checkpoint}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify([...done.values()], null, 2));
    await rename(temporary, checkpoint);
    console.log(`Verified: ${done.size}/${inventory.length}`);
    if (failed.length) {
      for (const item of failed) console.error(`${item.bucket}/${item.path}: ${item.stage ?? "invalid receipt"}`);
      throw new Error("Batch had failures. Rerun with the same inventory to retry unverified files.");
    }
  }

  const totals = new Map();
  for (const item of inventory) {
    const counts = totals.get(item.bucket) ?? { expected: 0, verified: 0 };
    counts.expected += 1;
    if (done.has(identity(item))) counts.verified += 1;
    totals.set(item.bucket, counts);
  }
  console.table(Object.fromEntries(totals));
  console.log(`Checkpoint: ${checkpoint}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
