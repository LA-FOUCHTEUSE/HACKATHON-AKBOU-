import "server-only";
import { revalidatePath } from "next/cache";

// Pattern paths cover every locale. All pages are dynamic; this mainly clears the client router cache.
const page = (path: string) => revalidatePath(`/[locale]${path}`, "page");

export const revalidate = {
  all() {
    revalidatePath("/[locale]", "layout");
  },
  feeds() {
    page("");
    page("/campaigns");
    page("/volunteer/feed");
  },
  campaign() {
    page("/campaigns/[id]");
  },
  volunteerProfile() {
    page("/volunteer/profile");
    page("/leaderboard");
    page("/volunteer/checkin/[campaignId]");
  },
  inbox() {
    page("/volunteer/inbox");
    page("/org/inbox");
    revalidatePath("/[locale]", "layout");
  },
  orgDashboard() {
    page("/org/dashboard");
  },
  orgCampaigns() {
    page("/org/campaigns");
    page("/org/campaigns/[id]/edit");
  },
  orgCampaign() {
    page("/org/campaigns/[id]/participants");
    page("/org/dashboard");
  },
  sponsorBrowse() {
    page("/sponsor/browse");
    page("/sponsor/checkout/[campaignId]");
  },
  caisse() {
    page("/org/caisse");
    page("/org/dashboard");
    revalidate.sponsorBrowse();
    revalidate.campaign();
    revalidate.inbox();
  },
  attendance() {
    revalidate.orgCampaign();
    revalidate.volunteerProfile();
    revalidate.inbox();
    revalidate.campaign();
  },
};
