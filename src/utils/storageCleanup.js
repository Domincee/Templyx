import { supabase } from '../lib/supabaseClient';

export async function deleteAllUserStorage({ userId, username }) {
  try {
    // List all files in the user's storage folder
    const { data: files, error: listError } = await supabase.storage
      .from('project-images')
      .list(userId);

    if (listError) throw listError;

    if (files && files.length > 0) {
      // Construct full paths
      const paths = files.map(file => `${userId}/${file.name}`);

      // Delete all files
      const { error: removeError } = await supabase.storage
        .from('project-images')
        .remove(paths);

      if (removeError) throw removeError;

      console.log(`Deleted ${files.length} storage files for user ${userId}`);
    }
  } catch (e) {
    console.error('Failed to delete user storage:', e);
    throw e;
  }
}
