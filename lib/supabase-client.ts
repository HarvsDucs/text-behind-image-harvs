import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadToSupabase = async (file: File, userId: string) => {
    const timestamp = new Date().getTime();
    const fileName = `${userId}/${timestamp}-${file.name}`;

    const { data, error } = await supabase.storage
        .from('saved_images')
        .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('saved_images')
        .getPublicUrl(data.path);

    return publicUrl;
};
