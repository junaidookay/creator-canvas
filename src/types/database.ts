export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  video_path: string;
  storage_type: 'supabase' | 'bunny' | 's3' | 'r2' | 'b2' | 'local';
  storage_provider_ref: string | null;
  category: string;
  tags: string[];
  creator_id: string;
  views: number;
  created_at: string;
  creator?: Profile;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Like {
  id: string;
  video_id: string;
  user_id: string;
}

export interface Subscription {
  id: string;
  follower_id: string;
  creator_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export const VIDEO_CATEGORIES = [
  'Entertainment', 'Education', 'Gaming', 'Music', 'Technology',
  'Sports', 'News', 'Comedy', 'Film', 'Art', 'Science', 'Travel',
  'Food', 'Fitness', 'Fashion', 'Business', 'Lifestyle', 'Other'
];
