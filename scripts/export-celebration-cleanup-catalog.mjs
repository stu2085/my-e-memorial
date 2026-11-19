import { readFile } from "node:fs/promises";

const input = process.argv[2];
if (!input) throw new Error("Pass the verified media backup checkpoint JSON file.");
const records = JSON.parse((await readFile(input, "utf8")).replace(/^\uFEFF/, ""));
if (!Array.isArray(records) || records.length !== 1012 || records.some(({ verified }) => verified !== true)) {
  throw new Error("Expected the completed 1,012-file initial backup checkpoint.");
}

const presentationUploads = records.filter(({ path }) => path?.startsWith("celebration-presentations/"));
if (presentationUploads.length !== 418 || presentationUploads.some(({ bucket, path, key }) =>
  !["memorial-photos", "memorial-audio"].includes(bucket) ||
  !/^celebration-presentations\/[0-9a-f-]{36}\/.+/.test(path) ||
  typeof key !== "string" || !key.startsWith(`files/${bucket}/`)
)) {
  throw new Error("The presentation backup inventory did not match the verified baseline.");
}
const paths = presentationUploads.map(({ bucket, path }) => ({ bucket, path }));
if (new Set(paths.map((entry) => JSON.stringify(entry))).size !== paths.length) {
  throw new Error("Duplicate presentation upload paths.");
}

// Base64 keeps user-controlled filenames out of the SQL syntax.
const payload = Buffer.from(JSON.stringify(paths)).toString("base64");
console.log(`
insert into public.celebration_cleanup_backup_catalog (bucket, path)
select entry.bucket, entry.path
from jsonb_to_recordset(convert_from(decode('${payload}', 'base64'), 'UTF8')::jsonb)
  as entry(bucket text, path text)
on conflict (bucket, path) do nothing;

select count(*) as catalogued_backup_paths from public.celebration_cleanup_backup_catalog;
`.trim());
