const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// We must use the SERVICE_ROLE_KEY to bypass RLS and create users directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createAdminUser() {
  const email = 'innovacentra@gmail.com';
  const password = 'password123';

  console.log(`Setting up admin user: ${email}...`);

  // 1. Create or fetch the user in Supabase Auth
  let userId;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Automatically confirm the email so they can log in immediately
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('User already exists')) {
        console.log('User already exists in authentication system. Fetching their ID...');
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users.find(u => u.email === email);
        if (existingUser) {
            userId = existingUser.id;
            
            // Optionally update password if needed
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: password, email_confirm: true });
            console.log('Updated existing user password and confirmed email.');
        } else {
            console.error('Failed to find the existing user.');
            return;
        }
    } else {
        console.error('Error creating user in auth:', authError);
        return;
    }
  } else {
      userId = authData.user.id;
      console.log('Created new user in authentication system.');
  }
  
  if (!userId) {
     console.error('Could not determine user ID');
     return;
  }
  
  console.log(`User ID: ${userId}`);

  // 2. Ensure profile exists in public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      profile_id: userId,
      email: email,
      username: 'Admin',
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }
  console.log('Profile created in public.profiles.');

  // 3. Add to public.admin_users table to grant admin access
  const { error: adminError } = await supabaseAdmin
    .from('admin_users')
    .upsert({
      profile_id: userId,
    });

  if (adminError) {
    console.error('Error adding to admin_users:', adminError);
    return;
  }

  console.log('SUCCESS: User has been granted Admin privileges!');
}

createAdminUser();
