const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Products Error:', error);
  } else {
    console.log('Products:', data);
  }

  const { data: catData, error: catError } = await supabase.from('categories').select('*');
  if (catError) {
    console.error('Categories Error:', catError);
  } else {
    console.log('Categories:', catData);
  }
}

test();
