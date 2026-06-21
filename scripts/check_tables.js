const postgres = require('postgres');

const connectionString = 'postgresql://postgres.dtjcazcwajqgyjqwgasw:Luzma7834..@aws-1-us-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const sql = postgres(connectionString);

  const res = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log('Tables in database:');
  res.forEach(row => console.log(`- ${row.table_name}`));

  await sql.end();
}

main().catch(console.error);
