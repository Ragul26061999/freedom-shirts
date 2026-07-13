import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data: user } = await supabase.auth.getSession(); // Won't work without token, use a generic select
  
  const { error } = await supabase
    .from('profiles')
    .update({ username: 'test2' })
    .eq('profile_id', '0ce807e1-9172-4faa-97d8-29e4727b64a4')
    .select()
    .single();
  console.log('Update Error:', error);

  console.log('Update error:', JSON.stringify(error, null, 2));
}

testUpdate();
