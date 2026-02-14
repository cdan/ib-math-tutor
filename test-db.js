// test-db.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing connection to:", supabaseUrl);
  
  // Try to insert a dummy row into 'questions' (or just select if you prefer not to write)
  // Let's just try to read count of questions
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("❌ Connection Failed:", error.message);
  } else {
    console.log("✅ Connection Successful!");
    console.log(`   Found ${count} questions in the database.`);
  }
}

testConnection();
