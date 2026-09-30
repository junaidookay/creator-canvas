

# Gap Analysis: Joulecorp vs YouTube

## What's Already Built
- Video upload, playback, likes, comments, view counting
- Shorts support (upload toggle + vertical cards)
- Creator channels with tabs (Home/Videos/Shorts/Posts)
- Community posts with images, likes, comments
- Search with category/sort filters
- Explore page with infinite scroll
- Notifications (likes, comments, follows)
- Subscriptions (follow/unfollow)
- Email auth with verification flow
- Admin dashboard with moderation tools
- Dark/light theme, responsive design

## What's Missing (Priority Order)

### Critical — Core YouTube Features
1. **Subscribe feed / Subscriptions page** — No way to see videos from channels you follow. YouTube's core loop is Subscribe → see their new content.
2. **Watch History** — No record of what you've watched. YouTube uses this for recommendations.
3. **Playlists** — Can't save or organize videos. YouTube's "Watch Later" and custom playlists are essential.
4. **Video edit/delete by creator** — Creators can't manage their own uploaded videos (edit title, delete).
5. **Subscribe button on Watch page** — The watch page shows the creator but has no follow/subscribe button.
6. **Comment replies / threading** — Comments are flat, no reply chains.
7. **Dislike button** — Only likes exist, no dislike.

### Important — Engagement & Discovery
8. **Autoplay / Up Next** — Watch page doesn't auto-advance to the next video.
9. **Video duration overlay** — No duration badge on thumbnails.
10. **Subscriber count on video cards** — Creator info is minimal.
11. **Trending / algorithm-based recommendations** — Homepage just shows by views/date, no personalization.
12. **Report video/comment** — Users can't flag inappropriate content (reports table exists but no UI on watch page).
13. **Share modal** — Currently just copies link, no social sharing options.

### Nice-to-Have — Polish
14. **Google/OAuth sign-in** — Only email/password auth exists.
15. **Video chapters / timestamps** — No chapter markers in player.
16. **Picture-in-Picture** — No PiP support.
17. **Keyboard shortcuts** — No player keyboard controls.
18. **Creator Studio / Analytics** — Creators can't see their own video stats.
19. **Live streaming** — No live video support.
20. **Monetization / Super Chat** — Placeholder only.
21. **Video quality selector** — Single quality, no adaptive streaming.
22. **Captions / subtitles** — No subtitle support.
23. **Age restriction / content rating** — No content classification.
24. **Embed support** — Can't embed videos on external sites.
25. **Profile auto-creation on signup** — No trigger to create a profile row when a user signs up.

### Technical Gaps
26. **No profile creation trigger** — When users sign up, no profile row is created automatically. This means new users have no username/display_name until they manually go to Settings.
27. **Foreign keys missing** — `comments`, `likes`, `notifications`, `post_comments`, `post_likes` tables have no foreign keys, which could cause orphaned data.
28. **No avatars storage bucket** — Settings page uploads avatars but there's no `avatars` bucket listed.

---

## Recommended Next Sprint (highest impact)

If you want me to build the next batch, I'd suggest these 5 features as the highest-impact additions:

1. **Subscriptions page** (`/subscriptions`) — feed of videos from channels you follow
2. **Profile auto-creation trigger** — so new signups immediately get a profile
3. **Subscribe button on Watch page** — follow creators while watching
4. **Watch History tracking** — store views per user, show history page
5. **Video management for creators** — edit/delete own videos from profile

Want me to proceed with implementing any or all of these?

