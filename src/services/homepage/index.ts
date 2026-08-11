"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getHomepageSettings(sectionName: string) {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("homepage_settings")
      .select("content_json")
      .eq("section_name", sectionName)
      .single();

    if (error) {
      // PGRST116 is 'Results contain 0 rows' (e.g. no data yet)
      // PGRST205 is 'relation does not exist' (e.g. table not created yet)
      if (error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn(`[getHomepageSettings] Could not fetch settings for ${sectionName}. Table might not exist yet.`);
      }
      return null;
    }

    return data?.content_json || null;
  } catch (err) {
    return null;
  }
}

export async function updateHomepageSettings(sectionName: string, contentJson: any) {
  const supabase = await createServerSupabase();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== 'innovacentra@gmail.com') {
    throw new Error("Unauthorized: Only admins can edit this.");
  }
  
  const { error } = await supabase
    .from("homepage_settings")
    .upsert({ section_name: sectionName, content_json: contentJson });

  if (error) {
    console.error(`Error updating settings for ${sectionName}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/");
  return { success: true };
}
