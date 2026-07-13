const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: product } = await supabase.from('products').select('*').limit(1).single();
  if (!product) {
    console.log('No products found');
    return;
  }
  console.log('Updating product:', product.product_id);

  const { data, error } = await supabase
    .from("products")
    .update({
      title: product.title + " test",
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", product.product_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success:", data.product_id);
    
    // revert
    await supabase.from('products').update({ title: product.title }).eq('product_id', product.product_id);
  }
}

main();
