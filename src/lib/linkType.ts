// Decides what kind of link the customer must paste, from the selected category (then the service name).
export type LinkInfo = { label: string; hint: string; placeholder: string };
const PROFILE: LinkInfo = { label: "Paste your public profile link", hint: "Your profile or channel must be public (not private).", placeholder: "https://www.example.com/your-profile" };
const VIDEO: LinkInfo = { label: "Paste your video link", hint: "Paste the link of the video or post. It must be public.", placeholder: "https://www.example.com/your-video-or-post" };
const GENERIC: LinkInfo = { label: "Paste your public link", hint: "The link must be public.", placeholder: "https://…" };
const isProfile = (t: string) => /follower|subscriber|member|\bfans?\b|page like|friend/.test(t);
const isVideo = (t: string) => /view|like|comment|share|save|watch|reaction|repost|retweet|impression|reach/.test(t);
export function linkInfo(category: string, service: string): LinkInfo {
  for (const text of [category.toLowerCase(), service.toLowerCase()]) {
    if (isProfile(text)) return PROFILE;
    if (isVideo(text)) return VIDEO;
  }
  return GENERIC;
}
