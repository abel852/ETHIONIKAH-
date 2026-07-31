require("dotenv").config();

// Test parseDatabaseUrl
const url = process.env.DATABASE_URL;
console.log("DATABASE_URL (first 80 chars):", url?.substring(0, 80));

const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (match) {
  console.log("Parsed DB:", { user: match[1], host: match[3], port: match[4], database: match[5] });
} else {
  console.log("REGEX FAILED TO MATCH");
}

// Test psql command
const { exec } = require("child_process");
const db = { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
const env = { ...process.env, PGPASSWORD: db.password };
const cmd = `psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -c "SELECT count(*) FROM \\\"User\\\";"`;
console.log("Running:", cmd);

exec(cmd, { env, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
  if (err) console.log("error:", err.message);
});
