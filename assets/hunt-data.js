/* SPOILS V2 — the one file edited per hunt.
   Until name, dateLabel and timeLabel are all filled in, the site shows
   "The next hunt starts soon. Hunters, be ready." instead of hunt details.
   opensAt uses ISO format with Lagos offset, e.g. "2026-11-14T19:00:00+01:00". */
window.SPOILS_DATA = {
  nextHunt: {
    teaser: null,        // one detail that doesn't add up, e.g. "One detail in this photograph should not be there."
    name: null,          // e.g. "The Last Login"
    opensAt: null,       // ISO date-time; drives the orange countdown
    dateLabel: null,     // e.g. "Sat 14 Nov"
    timeLabel: null,     // e.g. "7:00 PM"
    reward: null,        // e.g. "₦50,000 cash"
    entry: null,         // e.g. "₦1,000" or "Free"
    winners: null,       // e.g. "200 winners · rewards listed from 1st to 200th place"
    status: "next",      // "next" | "live" | "claimed"
    registerUrl: "https://app.spoils.live"
  },
  /* Newest first. */
  pastHunts: [
    { name: "The Affair That Cost ₦10 Million", date: "18 Oct 2026", reward: "₦11,500 cash, shared by the top 5", status: "SPOILS claimed" },
    { name: "UNDERPAINTING", date: "11 Oct 2026", reward: "₦10,000 cash, shared by the top 3", status: "SPOILS claimed" },
    { name: "The Alert That Never Landed", date: "4 Oct 2026", reward: "Bragging rights", status: "SPOILS claimed" },
    { name: "The Great Hunt", date: "27 Sep 2026", reward: "Bragging rights", status: "SPOILS claimed" },
    { name: "The Last Meeting", date: "20 Sep 2026", reward: "Bragging rights", status: "SPOILS claimed" },
    { name: "The Last Login", date: "11 Jul 2026", reward: "Event ticket to Sidequesters Potluck and Presentation Night", note: "In partnership with The Housz", status: "SPOILS claimed" }
  ],
  links: {
    app: "https://app.spoils.live",
    huntersClub: "https://bit.ly/SpoilsBeta",
    x: "https://x.com/spoilsapp",
    instagram: "https://www.instagram.com/spoilsapp",
    linkedin: "https://www.linkedin.com/company/spoilsapp",
    email: "hello@spoils.live",
    phone: "+2348104291619"
  }
};
