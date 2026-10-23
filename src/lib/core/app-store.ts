import { create } from "zustand";
import { SEED_FEED, TX_SEED } from "./data";
import { readStoredTheme, writeStoredTheme } from "./theme-storage";
import { readStoredLanguage, writeStoredLanguage } from "./language-storage";
import { detectCurrencyCode } from "./currency";
import type { ModalState, PayoutReq, PollOpt, Post, ToastMsg, TxItem } from "./types";

/**
 * Fan/Creator app store.
 *
 * BACKEND SEAM: every action below maps to exactly one API endpoint.
 * Keep the signature, replace the body with a repository call, keep the
 * optimistic mutation + rollback-on-failure. See README → Integration.
 */

let _seq = 900;
const uid = () => ++_seq;

export interface AppState {
  // session
  authed: boolean;
  theme: "dark" | "light";
  language: string;
  preferences: string[];
  prefsSet: boolean;
  currency: string;
  twoFaEnabled: boolean;
  profile: {
    fullName: string;
    name: string; // display name — what the sidebar, profile header and @mentions show
    handle: string;
    email: string;
    gender: string;
    location: string;
    interest: string;
    bio: string;
    avatarUrl?: string;
    coverUrl?: string;
  };
  /* Fan-only until they ask to be a creator — gates Wallet's Withdraw (there is
     nothing to withdraw as a fan) and swaps the sidebar's studio switch for a
     "Become a creator" prompt. */
  isCreator: boolean;
  // wallet
  coins: number;
  walletTx: TxItem[];
  payoutReqs: PayoutReq[];
  // engagement
  liked: Record<string, boolean>;
  saved: Record<string, boolean>;
  votes: Record<string, number>;
  unlocked: Record<string, boolean>;
  subs: Record<string, boolean>;
  follows: Record<string, boolean>;
  hidden: Record<string, boolean>;
  muted: Record<string, boolean>;
  blocked: Record<string, boolean>;
  reported: Record<string, string>;
  myPosts: Post[];
  comments: Record<string, string[]>;
  notifsRead: boolean;
  // messages
  dms: Record<string, string[]>;
  dmUnlocked: Record<string, boolean>;
  // Studio's floating chat popups — a separate thread space from `dms`, which
  // is the fan's own outgoing side of a creator DM. Here the creator is the
  // one replying, so "mine" would mean the opposite thing in the same array.
  chatPopups: Array<{ handle: string; minimized: boolean }>;
  studioChats: Record<string, Array<{ me: boolean; text: string }>>;
  // ui
  toasts: ToastMsg[];
  modal: ModalState | null;

  // actions
  setAuthed(v: boolean): void;
  setTheme(t: "dark" | "light"): void;
  setLanguage(code: string): void;
  setPreferences(tags: string[]): void;
  setCurrency(code: string): void;
  setTwoFaEnabled(v: boolean): void;
  updateProfile(p: Partial<AppState["profile"]>): void;
  becomeCreator(): void;
  toast(msg: string, tone?: "ok" | "err" | "", actionLabel?: string, action?: () => void): void;
  openModal(t: ModalState["t"], d?: unknown): void;
  closeModal(): void;
  spend(amt: number, label: string): boolean;
  buyCoins(amt: number, usd: string): void;
  tipUsd(v: number, handle: string): void;
  payoutError(amt: number): string | null;
  requestPayout(amt: number): void;
  toggleLike(id: string): void;
  toggleSave(id: string): void;
  vote(id: string, ix: number): void;
  unlockPost(p: Post): boolean;
  subscribe(handle: string): void;
  unsub(handle: string): void;
  toggleFollow(handle: string): void;
  hide(id: string): void;
  mute(handle: string): void;
  block(handle: string): void;
  unblock(handle: string): void;
  report(id: string, reason: string): void;
  addComment(id: string, text: string): void;
  addPost(p: { text: string; media?: boolean; poll?: PollOpt[]; vis?: string; when?: string | null; price?: number }): void;
  delPost(id: string): void;
  markNotifsRead(): void;
  sendDm(threadKey: string, text: string): void;
  unlockDm(threadKey: string): boolean;
  openChatPopup(handle: string): void;
  closeChatPopup(handle: string): void;
  toggleMinimizeChatPopup(handle: string): void;
  sendStudioChat(handle: string, text: string): void;
  receiveStudioChat(handle: string, text: string): void;
  feed(): Post[];
}

const drop = <T extends object>(m: T, k: string): T => {
  const n = { ...(m as Record<string, unknown>) };
  delete n[k];
  return n as T;
};

export const useAppStore = create<AppState>()((set, get) => ({
  authed: false,
  /* Read at module evaluation, which happens after the pre-paint script in
     `index.html` has already put the same value on `<body>`. Both read the same
     key, so React mounts agreeing with what is on screen instead of correcting
     it. Everything else in this store is session state and stays in memory. */
  theme: readStoredTheme(),
  language: readStoredLanguage(),
  preferences: (() => { try { return JSON.parse(localStorage.getItem("fan_prefs") ?? "[]"); } catch { return []; } })(),
  prefsSet: localStorage.getItem("fan_prefs_set") === "1",
  currency: (() => { try { return localStorage.getItem("fan_currency") || detectCurrencyCode(); } catch { return "USD"; } })(),
  twoFaEnabled: localStorage.getItem("fan_2fa") === "1",
  /* Matches the identity the sidebar's account card and the settings/logout
     copy already showed before this was editable — changing it here is the
     only place that needs to change now that both read from the store. */
  profile: {
    fullName: "Emmanuel Ekpenyong",
    name: "Emmanuel Ekpenyong",
    handle: "imanuelekpess",
    email: "emmanuel.ekpenyong@fanation.app",
    gender: "Prefer not to say",
    location: "Lagos, Nigeria",
    interest: "",
    bio: "",
  },
  isCreator: false,
  coins: 12400,
  walletTx: [],
  payoutReqs: [],
  liked: {},
  /* An account that has been used has history. Collections opening on its own
     empty state is technically correct and reads as a broken page, so the demo
     account arrives with a few things already bookmarked — deliberately across
     five creators and three post types. "3" is Priscilla's PPV drop: it stays
     blurred in Collections, which is the point. Saving a locked post is not a
     way around paying for it. */
  saved: { "1": true, "3": true, "6": true, "7": true, "9": true, "14": true },
  votes: {},
  unlocked: {},
  subs: { sofiaa: true, marcusbeats: true, elenalive: true },
  /* Following is free and subscribing is not, so the two lists overlap without
     matching — this account follows six creators and pays three of them. */
  follows: { sofiaa: true, aishab: true, lenaart: true, zaraali: true, leochef: true, noahk: true },
  hidden: {},
  muted: {},
  blocked: {},
  reported: {},
  myPosts: [],
  comments: {},
  notifsRead: false,
  dms: {},
  dmUnlocked: {},
  chatPopups: [],
  studioChats: {},
  toasts: [],
  modal: null,

  setAuthed: (v) => set({ authed: v }),

  setPreferences: (tags) => {
    try {
      localStorage.setItem("fan_prefs", JSON.stringify(tags));
      localStorage.setItem("fan_prefs_set", "1");
    } catch { /* storage blocked */ }
    set({ preferences: tags, prefsSet: true });
  },

  setCurrency: (code) => {
    try { localStorage.setItem("fan_currency", code); } catch { /* storage blocked */ }
    set({ currency: code });
  },

  setTwoFaEnabled: (v) => {
    try { localStorage.setItem("fan_2fa", v ? "1" : "0"); } catch { /* storage blocked */ }
    set({ twoFaEnabled: v });
  },
  /* Write first, then set. Only an explicit choice is ever stored — a visitor
     who never touches the toggle leaves no key behind, so the default stays
     changeable without stranding anyone on a value they never picked. */
  setTheme: (t) => {
    writeStoredTheme(t);
    set({ theme: t });
  },

  /* Unconditional — whether `code` actually has a dictionary is a Settings →
     Display concern (see isLanguageSupported in lib/core/i18n.ts), not the
     store's. Keeping that check out of here also avoids app-store.ts and
     i18n.ts importing each other. */
  setLanguage: (code) => {
    writeStoredLanguage(code);
    set({ language: code });
  },

  // PATCH /me (avatar/cover would be a separate multipart POST /me/avatar,
  // /me/cover at integration — held as data URLs here since nothing but this
  // session ever needs to read them back)
  updateProfile: (p) => {
    set((s) => ({ profile: { ...s.profile, ...p } }));
    get().toast("Profile updated", "ok");
  },

  // POST /me/become-creator — instant here, same as every other seed-data
  // toggle in this store; a real integration would gate this on the /studio/verify flow.
  becomeCreator: () => {
    set({ isCreator: true });
    get().toast("You're a creator now — welcome to Creator Studio", "ok");
  },

  toast: (msg, tone = "", actionLabel, action) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone, actionLabel, action }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3400);
  },

  openModal: (t, d) => set({ modal: { t, d } }),
  closeModal: () => set({ modal: null }),

  // POST /wallet/spend
  spend: (amt, label) => {
    const { coins, toast } = get();
    if (coins < amt) {
      toast("Not enough coins — top up your wallet to continue", "err");
      return false;
    }
    set((s) => ({
      coins: s.coins - amt,
      walletTx: [{ t: label, s: "Coins", a: "", d: "Just now", coin: `-${amt.toLocaleString()}` }, ...s.walletTx],
    }));
    return true;
  },

  // POST /wallet/purchase
  buyCoins: (amt, usd) => {
    set((s) => ({
      coins: s.coins + amt,
      walletTx: [{ t: `Coin pack — ${amt.toLocaleString()} coins`, s: "Card · Paystack", a: `-${usd}.00`, d: "Just now", coin: `+${amt.toLocaleString()}` }, ...s.walletTx],
    }));
    get().toast(`${amt.toLocaleString()} coins added to your wallet`, "ok");
  },

  // POST /tips
  tipUsd: (v, handle) => {
    set((s) => ({ walletTx: [{ t: `Tip to @${handle}`, s: "Card · Paystack", a: `-$${v}.00`, d: "Just now", coin: "" }, ...s.walletTx] }));
    get().toast(`$${v} tip sent to @${handle} 💛`, "ok");
  },

  payoutError: (amt) =>
    amt < 50 ? "Minimum payout is $50" : amt > 4280 ? "Exceeds your available balance ($4,280)" : null,

  // POST /payouts
  requestPayout: (amt) => {
    set((s) => ({ payoutReqs: [{ amt, st: "Pending review", d: "Just now" }, ...s.payoutReqs] }));
    get().toast(`Payout of $${amt.toLocaleString()} requested — arrives in 1–3 business days`, "ok");
  },

  // POST /posts/:id/like
  toggleLike: (id) => set((s) => ({ liked: { ...s.liked, [id]: !s.liked[id] } })),

  // POST /posts/:id/save
  toggleSave: (id) => {
    const on = !get().saved[id];
    set((s) => ({ saved: { ...s.saved, [id]: on } }));
    get().toast(on ? "Saved to your collection" : "Removed from your collection", on ? "ok" : "");
  },

  // POST /polls/:id/vote — one vote per user, enforced client + server
  vote: (id, ix) => {
    if (get().votes[id] != null) return;
    set((s) => ({ votes: { ...s.votes, [id]: ix } }));
    get().toast("Vote recorded", "ok");
  },

  // POST /purchases (PPV)
  unlockPost: (p) => {
    if (!get().spend(p.price ?? 150, "PPV unlock")) return false;
    set((s) => ({ unlocked: { ...s.unlocked, [p.id]: true } }));
    get().toast("Content unlocked 🔓", "ok");
    return true;
  },

  // POST /subscriptions
  subscribe: (handle) => {
    set((s) => ({ subs: { ...s.subs, [handle]: true } }));
    get().toast(`Subscribed to @${handle} · renews Aug 17`, "ok");
  },

  // DELETE /subscriptions/:handle
  unsub: (handle) => {
    set((s) => ({ subs: drop(s.subs, handle) }));
    get().toast(`Subscription to @${handle} cancelled — active until Aug 17`);
  },

  // POST /follows
  toggleFollow: (handle) => {
    const was = get().follows[handle];
    set((s) => ({ follows: { ...s.follows, [handle]: !was } }));
    get().toast(was ? `Unfollowed @${handle}` : `Following @${handle}`, was ? "" : "ok");
  },

  // POST /posts/:id/hide
  hide: (id) => {
    set((s) => ({ hidden: { ...s.hidden, [id]: true } }));
    get().toast("Post hidden — we'll show fewer like it", "", "Undo", () =>
      set((s) => ({ hidden: drop(s.hidden, id) })),
    );
  },

  // POST /users/:handle/mute
  mute: (handle) => {
    set((s) => ({ muted: { ...s.muted, [handle]: true } }));
    get().toast(`Muted @${handle} — their posts won't appear in your feed`, "", "Undo", () =>
      set((s) => ({ muted: drop(s.muted, handle) })),
    );
  },

  // POST /users/:handle/block
  block: (handle) => {
    set((s) => ({ blocked: { ...s.blocked, [handle]: true } }));
    get().toast(`Blocked @${handle} — they can't see your profile or message you`, "err", "Undo", () =>
      set((s) => ({ blocked: drop(s.blocked, handle) })),
    );
  },

  unblock: (handle) => {
    set((s) => ({ blocked: drop(s.blocked, handle) }));
    get().toast(`@${handle} unblocked`, "ok");
  },

  // POST /reports
  report: (id, reason) => {
    set((s) => ({ reported: { ...s.reported, [id]: reason } }));
    get().toast("Report submitted — Trust & Safety reviews within 24h", "ok");
  },

  // POST /posts/:id/comments
  addComment: (id, text) =>
    set((s) => ({ comments: { ...s.comments, [id]: [...(s.comments[id] ?? []), text] } })),

  // POST /posts
  addPost: (p) => {
    const id = `u${uid()}`;
    const post: Post = {
      id,
      who: "You",
      h: "yourhandle",
      t: "now",
      v: false,
      text: p.text,
      type: p.media ? "image" : p.poll ? "poll" : "text",
      seed: `me${id}`,
      likes: 0,
      comments: 0,
      coins: 0,
      poll: p.poll,
      mine: true,
      vis: p.vis,
      price: p.price,
    };
    set((s) => ({ myPosts: [post, ...s.myPosts] }));
    get().toast(p.when ? `Scheduled for ${p.when}` : "Posted to your feed", "ok");
  },

  // DELETE /posts/:id
  delPost: (id) => {
    set((s) => ({ myPosts: s.myPosts.filter((x) => x.id !== id) }));
    get().toast("Post deleted");
  },

  // POST /notifications/read-all
  markNotifsRead: () => {
    set({ notifsRead: true });
    get().toast("All notifications marked as read", "ok");
  },

  // POST /dms/:thread/messages
  sendDm: (threadKey, text) =>
    set((s) => ({ dms: { ...s.dms, [threadKey]: [...(s.dms[threadKey] ?? []), text] } })),

  // POST /dms/:thread/unlock
  unlockDm: (threadKey) => {
    if (!get().spend(200, "Unlock paid message")) return false;
    set((s) => ({ dmUnlocked: { ...s.dmUnlocked, [threadKey]: true } }));
    get().toast("Message unlocked", "ok");
    return true;
  },

  // Floating chat popups (Studio's fan-message widget) — a fixed shelf, so
  // opening a fourth drops the oldest the way Messenger's own popup row does.
  openChatPopup: (handle) => {
    set((s) => {
      const rest = s.chatPopups.filter((p) => p.handle !== handle);
      const capped = rest.length >= 3 ? rest.slice(1) : rest;
      return { chatPopups: [...capped, { handle, minimized: false }] };
    });
  },
  closeChatPopup: (handle) => set((s) => ({ chatPopups: s.chatPopups.filter((p) => p.handle !== handle) })),
  toggleMinimizeChatPopup: (handle) =>
    set((s) => ({ chatPopups: s.chatPopups.map((p) => (p.handle === handle ? { ...p, minimized: !p.minimized } : p)) })),
  sendStudioChat: (handle, text) =>
    set((s) => ({ studioChats: { ...s.studioChats, [handle]: [...(s.studioChats[handle] ?? []), { me: true, text }] } })),
  receiveStudioChat: (handle, text) => {
    set((s) => ({ studioChats: { ...s.studioChats, [handle]: [...(s.studioChats[handle] ?? []), { me: false, text }] } }));
    get().openChatPopup(handle);
  },

  // GET /feed
  feed: () => {
    const s = get();
    return [...s.myPosts, ...SEED_FEED].filter(
      (p) => !s.hidden[p.id] && !s.muted[p.h] && !s.blocked[p.h],
    );
  },
}));

export const walletHistory = (state: Pick<AppState, "walletTx">): TxItem[] => [
  ...state.walletTx,
  ...TX_SEED,
];
