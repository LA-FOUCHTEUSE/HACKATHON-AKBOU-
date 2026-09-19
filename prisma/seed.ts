import { PrismaClient, type Prisma } from "@prisma/client";
import {
  ATTENDANCES,
  CAMPAIGNS,
  DEMO_CHECKIN_TOKEN,
  DONATIONS,
  ENROLLMENTS,
  FAVORITES,
  ORGANIZATIONS,
  PACKS,
  SPONSORS,
  SPONSORSHIPS,
  VOLUNTEERS,
  type CampaignKey,
  type OrgKey,
  type SponsorKey,
  type VolunteerKey,
  type When,
} from "./seed-data";

const prisma = new PrismaClient();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = new Date();

// Africa/Algiers is UTC+1 all year (no daylight saving time).
function localHour(days: number, hour: number): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour - 1, 0, 0, 0);
  return d;
}

function dates(when: When): { startAt: Date; endAt: Date } {
  if (when.kind === "ongoing") {
    return {
      startAt: new Date(now.getTime() - when.startedHoursAgo * HOUR),
      endAt: new Date(now.getTime() + when.endsInHours * HOUR),
    };
  }
  if (when.kind === "absolute") {
    const startAt = new Date(when.start);
    return { startAt, endAt: new Date(startAt.getTime() + when.durationHours * HOUR) };
  }
  const startAt = localHour(when.days, when.hour);
  return { startAt, endAt: new Date(startAt.getTime() + when.durationHours * HOUR) };
}

const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);

function notification(
  userId: string,
  type: Prisma.NotificationCreateManyInput["type"],
  prefix: string,
  params: Record<string, string | number>,
  campaignId: string,
  read: boolean,
  createdAt: Date,
): Prisma.NotificationCreateManyInput {
  return { userId, type, titleKey: `${prefix}.title`, bodyKey: `${prefix}.body`, params, campaignId, read, createdAt };
}

async function wipe() {
  await prisma.notification.deleteMany();
  await prisma.pointsTransaction.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.checkInToken.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.savedCard.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.sponsorshipPack.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.organizationProfile.deleteMany();
  await prisma.sponsorProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await wipe();

  await prisma.sponsorshipPack.createMany({ data: PACKS });
  const packPrice = Object.fromEntries(PACKS.map((p) => [p.tier, p.priceDZD]));

  // Organizations
  const org: Record<OrgKey, { profileId: string; userId: string; name: string }> = {} as never;
  for (const [key, o] of Object.entries(ORGANIZATIONS) as Array<[OrgKey, (typeof ORGANIZATIONS)[OrgKey]]>) {
    const user = await prisma.user.create({
      data: {
        role: "ORGANIZATION",
        email: o.email,
        displayName: o.name,
        createdAt: daysAgo(120),
        organization: {
          create: {
            name: o.name,
            domains: o.domains,
            description: o.description,
            city: o.city,
            contactPhone: o.contactPhone,
            verified: o.verified,
          },
        },
      },
      include: { organization: true },
    });
    org[key] = { profileId: user.organization!.id, userId: user.id, name: o.name };
  }

  // Volunteers
  const vol: Record<VolunteerKey, { profileId: string; userId: string }> = {} as never;
  for (const [key, v] of Object.entries(VOLUNTEERS) as Array<[VolunteerKey, (typeof VOLUNTEERS)[VolunteerKey]]>) {
    const user = await prisma.user.create({
      data: {
        role: "VOLUNTEER",
        email: v.email,
        displayName: v.fullName,
        createdAt: daysAgo(key === "V12" ? 2 : 100),
        volunteer: {
          create: {
            fullName: v.fullName,
            city: v.city,
            birthYear: v.birthYear,
            preferredDomains: v.preferredDomains,
            bio: v.bio,
            totalPoints: v.totalPoints,
            eventsCompleted: v.eventsCompleted,
          },
        },
      },
      include: { volunteer: true },
    });
    vol[key] = { profileId: user.volunteer!.id, userId: user.id };
  }

  // Sponsors with one mock saved card each (last4 only)
  const spon: Record<SponsorKey, { profileId: string; userId: string; companyName: string }> = {} as never;
  for (const [key, s] of Object.entries(SPONSORS) as Array<[SponsorKey, (typeof SPONSORS)[SponsorKey]]>) {
    const user = await prisma.user.create({
      data: {
        role: "SPONSOR",
        email: s.email,
        displayName: s.companyName,
        createdAt: daysAgo(60),
        sponsor: { create: { companyName: s.companyName, sector: s.sector } },
        savedCards: { create: { holderName: s.card.holderName, last4: s.card.last4, brand: "EDAHABIA" } },
      },
      include: { sponsor: true },
    });
    spon[key] = { profileId: user.sponsor!.id, userId: user.id, companyName: s.companyName };
  }

  // Campaigns, newest first in the feed: C01 is the most recent.
  const camp: Record<CampaignKey, { id: string; title: string; startAt: Date; endAt: Date; pointsValue: number; org: OrgKey }> =
    {} as never;
  const campaignKeys = Object.keys(CAMPAIGNS) as CampaignKey[];
  for (const [index, key] of campaignKeys.entries()) {
    const c = CAMPAIGNS[key];
    const { startAt, endAt } = dates(c.when);
    // Created 3 days ago minus 5 hours per position, and always at least a week before a past start.
    const createdAt = new Date(Math.min(now.getTime() - 3 * DAY - index * 5 * HOUR, startAt.getTime() - (startAt < now ? 7 * DAY : 0)));
    const created = await prisma.campaign.create({
      data: {
        orgId: org[c.org].profileId,
        title: c.title,
        description: c.description,
        domain: c.domain,
        city: c.city,
        location: c.location,
        startAt,
        endAt,
        capacity: c.capacity,
        pointsValue: c.pointsValue,
        status: c.status,
        needsFunding: c.needsFunding ?? false,
        fundingGoal: c.fundingGoal ?? null,
        sponsorRequested: c.sponsorRequested ?? false,
        createdAt,
      },
    });
    camp[key] = { id: created.id, title: c.title, startAt, endAt, pointsValue: c.pointsValue, org: c.org };
  }

  // Current enrollments
  await prisma.enrollment.createMany({
    data: ENROLLMENTS.map(([c, v, status]) => ({
      volunteerId: vol[v].profileId,
      campaignId: camp[c].id,
      status,
      enrolledAt: new Date(Math.min(camp[c].startAt.getTime() - 3 * DAY, now.getTime() - 3 * DAY)),
    })),
  });

  // Past attendance: enrollment ATTENDED + CheckIn + ledger row
  const seededPoints = new Map<VolunteerKey, number>();
  for (const [c, volunteers] of ATTENDANCES) {
    const campaign = camp[c];
    for (const v of volunteers) {
      const at = new Date(campaign.startAt.getTime() + HOUR);
      await prisma.enrollment.create({
        data: {
          volunteerId: vol[v].profileId,
          campaignId: campaign.id,
          status: "ATTENDED",
          enrolledAt: new Date(campaign.startAt.getTime() - 7 * DAY),
        },
      });
      await prisma.checkIn.create({
        data: { volunteerId: vol[v].profileId, campaignId: campaign.id, pointsAwarded: campaign.pointsValue, checkedInAt: at },
      });
      await prisma.pointsTransaction.create({
        data: { volunteerId: vol[v].profileId, amount: campaign.pointsValue, reason: `ATTENDED:${campaign.id}`, createdAt: at },
      });
      seededPoints.set(v, (seededPoints.get(v) ?? 0) + campaign.pointsValue);
    }
  }

  // Opening balance so that sum(ledger) == totalPoints (older, unseeded history).
  for (const [key, v] of Object.entries(VOLUNTEERS) as Array<[VolunteerKey, (typeof VOLUNTEERS)[VolunteerKey]]>) {
    const opening = v.totalPoints - (seededPoints.get(key) ?? 0);
    if (opening < 0) throw new Error(`Seeded attendance exceeds totalPoints for ${key}`);
    if (opening > 0) {
      await prisma.pointsTransaction.create({
        data: { volunteerId: vol[key].profileId, amount: opening, reason: "OPENING_BALANCE", createdAt: daysAgo(90) },
      });
    }
  }

  await prisma.favorite.createMany({
    data: FAVORITES.map(([v, c]) => ({ volunteerId: vol[v].profileId, campaignId: camp[c].id })),
  });

  // Contributions (confirmed mock payments)
  await prisma.donation.createMany({
    data: DONATIONS.map((d) => ({
      campaignId: camp[d.campaign].id,
      donorName: d.donorName,
      amountDZD: d.amountDZD,
      method: "EDAHABIA_MOCK",
      status: "CONFIRMED",
      createdAt: daysAgo(d.daysAgo),
    })),
  });
  await prisma.sponsorship.createMany({
    data: SPONSORSHIPS.map((s) => ({
      sponsorId: spon[s.sponsor].profileId,
      campaignId: camp[s.campaign].id,
      tier: s.tier,
      amountDZD: packPrice[s.tier],
      status: "CONFIRMED",
      createdAt: daysAgo(s.daysAgo),
    })),
  });

  // Notifications (keys + params only)
  const demo = vol.V07.userId;
  const notifications: Prisma.NotificationCreateManyInput[] = [
    notification(demo, "POINTS_AWARDED", "notifications.pointsAwarded", { campaignTitle: camp.C10.title, points: 120, total: 680 }, camp.C10.id, true, daysAgo(34)),
    notification(demo, "ENROLLMENT_CONFIRMED", "notifications.enrollmentConfirmed", { campaignTitle: camp.C01.title }, camp.C01.id, true, daysAgo(4)),
    notification(demo, "CAMPAIGN_CANCELLED", "notifications.cancelled", { campaignTitle: camp.C14.title, orgName: org.C.name }, camp.C14.id, false, daysAgo(2)),
    notification(demo, "CAMPAIGN_RECOMMENDATION", "notifications.recommendation", { campaignTitle: camp.C04.title, orgName: org.A.name }, camp.C04.id, false, daysAgo(1)),
    notification(demo, "CAMPAIGN_RECOMMENDATION", "notifications.recommendation", { campaignTitle: camp.C13.title, orgName: org.C.name }, camp.C13.id, false, new Date(now.getTime() - 20 * HOUR)),
    notification(demo, "CAMPAIGN_REMINDER", "notifications.reminder", { campaignTitle: camp.C01.title, startAt: camp.C01.startAt.toISOString() }, camp.C01.id, false, new Date(now.getTime() - 3 * HOUR)),
  ];
  for (const s of SPONSORSHIPS) {
    const c = camp[s.campaign];
    notifications.push(
      notification(org[c.org].userId, "SPONSOR_CONFIRMED", "notifications.sponsorConfirmed", {
        campaignTitle: c.title,
        companyName: spon[s.sponsor].companyName,
        tierKey: `packs.${s.tier}.name`,
        amount: packPrice[s.tier],
      }, c.id, false, daysAgo(s.daysAgo)),
    );
  }
  for (const d of DONATIONS.filter((x) => x.daysAgo <= 3)) {
    const c = camp[d.campaign];
    notifications.push(
      notification(org[c.org].userId, "DONATION_RECEIVED", "notifications.donationReceived", {
        campaignTitle: c.title,
        donorName: d.donorName,
        amount: d.amountDZD,
      }, c.id, false, daysAgo(d.daysAgo)),
    );
  }
  await prisma.notification.createMany({ data: notifications });

  // Reliable demo check-in token for the stage fallback (opaque, no PII, 30 days).
  await prisma.checkInToken.create({
    data: {
      token: DEMO_CHECKIN_TOKEN,
      volunteerId: vol.V07.profileId,
      campaignId: camp.C01.id,
      expiresAt: new Date(now.getTime() + 30 * DAY),
    },
  });

  const counts = {
    users: await prisma.user.count(),
    campaigns: await prisma.campaign.count(),
    enrollments: await prisma.enrollment.count(),
    checkIns: await prisma.checkIn.count(),
    donations: await prisma.donation.count(),
    sponsorships: await prisma.sponsorship.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("Seed complete", counts);
  console.log("Demo check-in campaign (C01) id:", camp.C01.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
