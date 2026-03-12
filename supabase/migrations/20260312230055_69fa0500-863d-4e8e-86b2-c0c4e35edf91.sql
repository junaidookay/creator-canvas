
-- Create sample auth users for seeding (migrations run as superuser)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'techexplorer@sample.joulecorp.com', crypt('SamplePass123!', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'naturevibe@sample.joulecorp.com', crypt('SamplePass123!', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'codecraft@sample.joulecorp.com', crypt('SamplePass123!', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fitlife@sample.joulecorp.com', crypt('SamplePass123!', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'musicmix@sample.joulecorp.com', crypt('SamplePass123!', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Create identities for the sample users
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'techexplorer@sample.joulecorp.com', 'email', '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567801","email":"techexplorer@sample.joulecorp.com"}', now(), now(), now()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'naturevibe@sample.joulecorp.com', 'email', '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567802","email":"naturevibe@sample.joulecorp.com"}', now(), now(), now()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'codecraft@sample.joulecorp.com', 'email', '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567803","email":"codecraft@sample.joulecorp.com"}', now(), now(), now()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'fitlife@sample.joulecorp.com', 'email', '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567804","email":"fitlife@sample.joulecorp.com"}', now(), now(), now()),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'musicmix@sample.joulecorp.com', 'email', '{"sub":"a1b2c3d4-e5f6-7890-abcd-ef1234567805","email":"musicmix@sample.joulecorp.com"}', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Create sample profiles
INSERT INTO profiles (id, username, display_name, bio) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'techexplorer', 'Tech Explorer', 'Exploring the latest in technology and innovation.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'naturevibe', 'Nature Vibes', 'Capturing the beauty of nature around the world.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'codecraft', 'CodeCraft Studio', 'Programming tutorials and coding tips.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'fitlife', 'FitLife Coach', 'Fitness routines and healthy living.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'musicmix', 'Music Mix Daily', 'Daily music mixes and artist spotlights.')
ON CONFLICT (id) DO NOTHING;

-- Insert 12 sample videos
INSERT INTO videos (title, description, video_url, video_path, creator_id, category, tags, views, visibility, is_featured, thumbnail_url) VALUES
  ('The Future of Artificial Intelligence', 'An in-depth look at how AI is transforming industries.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'samples/ai.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Technology', ARRAY['AI','technology','future'], 15420, 'public', true, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=80'),
  ('Stunning Mountain Landscapes in 4K', 'Breathtaking mountain footage for relaxation.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'samples/mountains.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Travel', ARRAY['nature','mountains','4K'], 8340, 'public', true, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80'),
  ('Learn React in 30 Minutes', 'A quick crash course on React fundamentals.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'samples/react.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Education', ARRAY['react','programming','tutorial'], 23100, 'public', true, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&q=80'),
  ('Full Body HIIT Workout', 'A 20-minute HIIT session with zero equipment.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'samples/hiit.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Fitness', ARRAY['fitness','HIIT','workout'], 11200, 'public', false, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80'),
  ('Lo-Fi Beats to Study and Relax', 'Chill lo-fi beats for studying and working.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'samples/lofi.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Music', ARRAY['music','lo-fi','chill'], 45600, 'public', true, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&q=80'),
  ('Building a Startup from Scratch', 'Real talk about building a tech startup.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'samples/startup.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Business', ARRAY['startup','business'], 6780, 'public', false, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=640&q=80'),
  ('Ocean Waves – 1 Hour Relaxation', 'Calming ocean waves for sleep and meditation.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'samples/ocean.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Entertainment', ARRAY['ocean','relaxation','nature'], 31400, 'public', false, 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=640&q=80'),
  ('Python for Data Science', 'Start your data science journey with Python.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'samples/python.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Education', ARRAY['python','data science','tutorial'], 19800, 'public', false, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=640&q=80'),
  ('Street Food Tour – Bangkok', 'Exploring Bangkok street food scene.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'samples/bangkok.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Food', ARRAY['food','travel','Bangkok'], 9450, 'public', false, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&q=80'),
  ('Electronic Music Production Basics', 'Learn electronic music production fundamentals.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'samples/music-prod.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Music', ARRAY['music','production','electronic'], 7200, 'public', false, 'https://images.unsplash.com/photo-1598488035139-bdbb2231cb64?w=640&q=80'),
  ('Morning Yoga Flow – 15 Minutes', 'Energizing 15-minute yoga for all levels.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'samples/yoga.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Fitness', ARRAY['yoga','fitness','wellness'], 14300, 'public', false, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&q=80'),
  ('Gaming Setup Tour 2025', 'Complete tour of my ultimate gaming setup.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'samples/gaming.mp4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Gaming', ARRAY['gaming','setup','PC'], 28900, 'public', false, 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=640&q=80');
