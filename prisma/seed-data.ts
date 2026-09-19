import type { ActivityDomain, CampaignStatus, EnrollmentStatus, SponsorTier } from "@prisma/client";

// All names, organizations and companies below are fictional.
// Visible content is French (default demo language). No emoji anywhere.

export const DEMO_EMAILS = {
  volunteer: "benevole.demo@tawa3.dz",
  organization: "org.demo@tawa3.dz",
  sponsor: "sponsor.demo@tawa3.dz",
} as const;

export const DEMO_CHECKIN_TOKEN = "TAWA3-DEMO-7K2Q9XHM";

export const PACKS: Array<{ tier: SponsorTier; priceDZD: number; benefitKeys: string[] }> = [
  {
    tier: "STARTER",
    priceDZD: 25_000,
    benefitKeys: ["packs.benefits.thanksPost", "packs.benefits.logoOnCampaignPage"],
  },
  {
    tier: "PRO",
    priceDZD: 75_000,
    benefitKeys: [
      "packs.benefits.thanksPost",
      "packs.benefits.logoOnCampaignPage",
      "packs.benefits.logoOnVolunteerShirts",
      "packs.benefits.impactReport",
    ],
  },
  {
    tier: "MAX",
    priceDZD: 200_000,
    benefitKeys: [
      "packs.benefits.thanksPost",
      "packs.benefits.logoOnCampaignPage",
      "packs.benefits.logoOnVolunteerShirts",
      "packs.benefits.impactReport",
      "packs.benefits.namedPartner",
      "packs.benefits.employeeVolunteeringDay",
    ],
  },
];

export type OrgKey = "A" | "B" | "C" | "D" | "E" | "F";

export const ORGANIZATIONS: Record<
  OrgKey,
  {
    email: string;
    name: string;
    city: string;
    domains: ActivityDomain[];
    verified: boolean;
    contactPhone: string;
    description: string;
  }
> = {
  A: {
    email: DEMO_EMAILS.organization,
    name: "Association Soummam Verte",
    city: "Akbou",
    domains: ["ECOLOGY", "ENVIRONMENT"],
    verified: true,
    contactPhone: "0555 12 34 56",
    description:
      "Association de la vallée de la Soummam engagée pour des berges, des plages et des forêts propres. Nous organisons des journées de nettoyage, de tri et de plantation, et nous publions les résultats de chaque action pour donner envie à d'autres de nous rejoindre.",
  },
  B: {
    email: "nour.sante@tawa3.dz",
    name: "Association Nour Santé",
    city: "Sétif",
    domains: ["HEALTH", "HUMANITARIAN"],
    verified: true,
    contactPhone: "0661 45 78 12",
    description:
      "Nour Santé accompagne les malades et leurs familles, en particulier les personnes atteintes de cancer. Nous organisons des collectes de sang, des formations aux premiers secours, des visites solidaires et des courses caritatives.",
  },
  C: {
    email: "elkhir@tawa3.dz",
    name: "Association El Khir Solidarité",
    city: "Béjaïa",
    domains: ["SOCIAL", "HUMANITARIAN"],
    verified: true,
    contactPhone: "0770 21 43 65",
    description:
      "El Khir Solidarité vient en aide aux familles démunies de la wilaya de Béjaïa : paniers alimentaires, couffins du Ramadan, maraudes hivernales et petits chantiers de rénovation dans les écoles et les lieux communautaires.",
  },
  D: {
    email: "savoir@tawa3.dz",
    name: "Association Savoir Pour Tous",
    city: "Tizi Ouzou",
    domains: ["EDUCATION", "CULTURE"],
    verified: true,
    contactPhone: "0552 98 76 54",
    description:
      "Savoir Pour Tous propose un soutien scolaire gratuit aux collégiens et lycéens, des révisions du BEM et du BAC, ainsi que des ateliers d'alphabétisation pour adultes.",
  },
  E: {
    email: "code.solidaire@tawa3.dz",
    name: "Collectif Code Solidaire",
    city: "Alger",
    domains: ["TECH", "EDUCATION"],
    verified: false,
    contactPhone: "0698 33 22 11",
    description:
      "Collectif de développeurs, designers et traducteurs bénévoles. Nous mettons nos compétences numériques au service des associations et initions les jeunes comme les seniors aux outils numériques.",
  },
  F: {
    email: "sport.sans.limites@tawa3.dz",
    name: "Association Sport Sans Limites",
    city: "Oran",
    domains: ["SPORT", "SOCIAL", "CULTURE"],
    verified: true,
    contactPhone: "0541 67 89 90",
    description:
      "Sport Sans Limites favorise l'inclusion des personnes en situation de handicap : basket fauteuil, tournois adaptés, journées sportives inclusives, accompagnement des personnes à mobilité réduite et enregistrement de livres audio pour les personnes malvoyantes.",
  },
};

export type VolunteerKey =
  | "V01" | "V02" | "V03" | "V04" | "V05" | "V06"
  | "V07" | "V08" | "V09" | "V10" | "V11" | "V12";

export const VOLUNTEERS: Record<
  VolunteerKey,
  {
    email: string;
    fullName: string;
    city: string;
    birthYear: number;
    totalPoints: number;
    eventsCompleted: number;
    preferredDomains: ActivityDomain[];
    bio: string;
  }
> = {
  V01: { email: "lina.meziane@tawa3.dz", fullName: "Lina Meziane", city: "Alger", birthYear: 1996, totalPoints: 4250, eventsCompleted: 31, preferredDomains: ["ECOLOGY", "HEALTH", "TECH"], bio: "Ingénieure en environnement, bénévole depuis le lycée." },
  V02: { email: "karim.boudiaf@tawa3.dz", fullName: "Karim Boudiaf", city: "Sétif", birthYear: 1991, totalPoints: 2180, eventsCompleted: 17, preferredDomains: ["HEALTH", "EDUCATION"], bio: "Infirmier, formateur aux premiers secours." },
  V03: { email: "sarah.amrani@tawa3.dz", fullName: "Sarah Amrani", city: "Tizi Ouzou", birthYear: 1999, totalPoints: 1920, eventsCompleted: 15, preferredDomains: ["EDUCATION", "ENVIRONMENT", "CULTURE"], bio: "Étudiante en lettres, je donne des cours de soutien le week-end." },
  V04: { email: "rayan.cherif@tawa3.dz", fullName: "Rayan Cherif", city: "Oran", birthYear: 1998, totalPoints: 1240, eventsCompleted: 10, preferredDomains: ["SPORT", "SOCIAL", "HEALTH"], bio: "Éducateur sportif, passionné de basket fauteuil." },
  V05: { email: "nesrine.belaid@tawa3.dz", fullName: "Nesrine Belaid", city: "Béjaïa", birthYear: 2000, totalPoints: 960, eventsCompleted: 8, preferredDomains: ["HUMANITARIAN", "ECOLOGY"], bio: "Toujours partante pour les maraudes et les distributions." },
  V06: { email: "walid.hamidi@tawa3.dz", fullName: "Walid Hamidi", city: "Constantine", birthYear: 1994, totalPoints: 810, eventsCompleted: 7, preferredDomains: ["HEALTH", "SPORT", "SOCIAL"], bio: "Donneur de sang régulier et coureur amateur." },
  V07: { email: DEMO_EMAILS.volunteer, fullName: "Yanis Amrouche", city: "Akbou", birthYear: 2001, totalPoints: 680, eventsCompleted: 6, preferredDomains: ["ECOLOGY", "ENVIRONMENT", "SOCIAL"], bio: "Étudiant à Béjaïa, je participe aux actions de nettoyage de la Soummam." },
  V08: { email: "imane.kaci@tawa3.dz", fullName: "Imane Kaci", city: "Akbou", birthYear: 2002, totalPoints: 540, eventsCompleted: 5, preferredDomains: ["HUMANITARIAN", "ECOLOGY"], bio: "Bénévole dans les actions solidaires de mon quartier." },
  V09: { email: "sofiane.aitahmed@tawa3.dz", fullName: "Sofiane Ait Ahmed", city: "Bouira", birthYear: 1997, totalPoints: 390, eventsCompleted: 4, preferredDomains: ["SOCIAL", "HUMANITARIAN", "HEALTH"], bio: "Peintre en bâtiment, je donne un coup de main aux chantiers solidaires." },
  V10: { email: "meriem.benali@tawa3.dz", fullName: "Meriem Benali", city: "Alger", birthYear: 1985, totalPoints: 260, eventsCompleted: 3, preferredDomains: ["EDUCATION", "TECH"], bio: "Enseignante de mathématiques, j'aide aux révisions du BAC." },
  V11: { email: "amine.ouali@tawa3.dz", fullName: "Amine Ouali", city: "Béjaïa", birthYear: 2003, totalPoints: 120, eventsCompleted: 1, preferredDomains: ["ECOLOGY", "HUMANITARIAN"], bio: "Première année de bénévolat." },
  V12: { email: "chaima.rahmani@tawa3.dz", fullName: "Chaima Rahmani", city: "Oran", birthYear: 2004, totalPoints: 0, eventsCompleted: 0, preferredDomains: ["CULTURE", "SPORT", "EDUCATION"], bio: "Nouvelle inscrite, j'aimerais enregistrer des livres audio." },
};

export type CampaignKey =
  | "C01" | "C02" | "C03" | "C04" | "C05" | "C06" | "C07" | "C08" | "C09" | "C10" | "C11" | "C12"
  | "C13" | "C14" | "C15" | "C16" | "C17" | "C18" | "C19" | "C20" | "C21" | "C22" | "C23";

// When: days relative to the seed day at a local hour (Africa/Algiers), or an absolute ISO date.
export type When =
  | { kind: "relative"; days: number; hour: number; durationHours: number }
  | { kind: "ongoing"; startedHoursAgo: number; endsInHours: number }
  | { kind: "absolute"; start: string; durationHours: number };

export interface CampaignSeed {
  org: OrgKey;
  title: string;
  description: string;
  domain: ActivityDomain;
  city: string;
  location: string;
  when: When;
  capacity: number;
  pointsValue: number;
  status: CampaignStatus;
  needsFunding?: boolean;
  fundingGoal?: number;
  sponsorRequested?: boolean;
}

const rel = (days: number, hour = 9, durationHours = 4): When => ({ kind: "relative", days, hour, durationHours });

export const CAMPAIGNS: Record<CampaignKey, CampaignSeed> = {
  C01: {
    org: "A",
    title: "Nettoyage des berges de la Soummam à Akbou",
    description:
      "Grande journée de nettoyage des berges de la Soummam, du pont d'Akbou jusqu'à la zone de loisirs. Gants, sacs et pinces sont fournis sur place. Les déchets collectés sont triés et pesés, et les photos avant et après seront partagées avec les habitants.",
    domain: "ECOLOGY",
    city: "Akbou",
    location: "Pont d'Akbou, rive gauche",
    when: { kind: "ongoing", startedHoursAgo: 2, endsInHours: 48 },
    capacity: 30,
    pointsValue: 150,
    status: "ONGOING",
  },
  C02: {
    org: "A",
    title: "Nettoyage de la plage de Tichy",
    description:
      "Avant la fin de la saison, nous nettoyons la plage de Tichy : ramassage des plastiques, des mégots et des déchets laissés sur le sable. Prévoyez une casquette et une bouteille d'eau. Le matériel est financé par les dons et nos partenaires.",
    domain: "ECOLOGY",
    city: "Tichy",
    location: "Plage centrale de Tichy, devant le poste de secours",
    when: rel(12, 8, 4),
    capacity: 40,
    pointsValue: 150,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 120_000,
    sponsorRequested: true,
  },
  C03: {
    org: "A",
    title: "Journée de nettoyage du quartier et tri des déchets recyclables",
    description:
      "Nettoyage des rues du quartier Guendouza puis atelier de tri : plastique, carton, verre et métal. Les matières recyclables sont remises à un récupérateur local. Une action simple pour montrer que chaque quartier peut changer d'aspect en une matinée.",
    domain: "ECOLOGY",
    city: "Akbou",
    location: "Place du quartier Guendouza",
    when: rel(-20, 9, 4),
    capacity: 25,
    pointsValue: 120,
    status: "COMPLETED",
  },
  C04: {
    org: "A",
    title: "Plantation d'arbres dans la forêt de Yakouren",
    description:
      "Reboisement d'une parcelle touchée par les incendies dans la forêt de Yakouren, en lien avec les services forestiers. Nous planterons des chênes-lièges et des cèdres. Une navette part d'Akbou à 7 h. Chaussures de marche conseillées.",
    domain: "ENVIRONMENT",
    city: "Yakouren",
    location: "Maison forestière de Yakouren",
    when: rel(25, 8, 6),
    capacity: 50,
    pointsValue: 200,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 150_000,
  },
  C05: {
    org: "A",
    title: "Nettoyage de la forêt de Chréa",
    description:
      "Ramassage des déchets le long des sentiers de randonnée du parc national de Chréa. Action réalisée avec les gardes du parc, suivie d'une sensibilisation des visiteurs au respect de la forêt.",
    domain: "ENVIRONMENT",
    city: "Blida",
    location: "Entrée du parc national de Chréa",
    when: rel(-40, 9, 5),
    capacity: 30,
    pointsValue: 150,
    status: "COMPLETED",
  },
  C06: {
    org: "B",
    title: "Journée de don de sang",
    description:
      "Collecte de sang organisée avec le centre de transfusion sanguine de Sétif. Les bénévoles accueillent les donneurs, gèrent l'attente et servent la collation après le don. Les donneurs eux-mêmes sont les bienvenus.",
    domain: "HEALTH",
    city: "Sétif",
    location: "Maison de jeunes du centre-ville, Sétif",
    when: rel(8, 9, 7),
    capacity: 60,
    pointsValue: 150,
    status: "PUBLISHED",
  },
  C07: {
    org: "B",
    title: "Formation aux premiers secours",
    description:
      "Formation pratique aux gestes qui sauvent : position latérale de sécurité, massage cardiaque, utilisation d'un défibrillateur et gestion des hémorragies. Encadrée par des secouristes diplômés. Places limitées pour garantir la pratique.",
    domain: "HEALTH",
    city: "Sétif",
    location: "Siège de l'association Nour Santé",
    when: rel(15, 9, 6),
    capacity: 4,
    pointsValue: 200,
    status: "PUBLISHED",
  },
  C08: {
    org: "B",
    title: "Visite solidaire aux patients du service d'oncologie",
    description:
      "Après-midi de visite et d'accompagnement des patients hospitalisés en oncologie : discussion, lecture, jeux de société et soutien moral, en coordination avec l'équipe soignante. Une courte séance de préparation a lieu avant la visite.",
    domain: "HEALTH",
    city: "Constantine",
    location: "Hall d'accueil du CHU de Constantine",
    when: rel(10, 14, 3),
    capacity: 12,
    pointsValue: 150,
    status: "PUBLISHED",
  },
  C09: {
    org: "B",
    title: "Course solidaire contre le cancer",
    description:
      "Course et marche de 5 km ouvertes à tous pour soutenir les personnes atteintes de cancer. Les fonds collectés financent le transport des patients vers les centres de traitement. Les bénévoles assurent l'accueil, le ravitaillement et la sécurité du parcours.",
    domain: "HEALTH",
    city: "Sétif",
    location: "Parc d'attractions de Sétif",
    when: rel(30, 8, 5),
    capacity: 0,
    pointsValue: 100,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 300_000,
    sponsorRequested: true,
  },
  C10: {
    org: "C",
    title: "Distribution de paniers alimentaires",
    description:
      "Préparation et distribution de paniers alimentaires pour cent familles démunies de la région d'Akbou : semoule, huile, légumes secs, lait et produits d'hygiène. Les familles ont été identifiées avec les comités de quartier.",
    domain: "HUMANITARIAN",
    city: "Akbou",
    location: "Salle polyvalente d'Akbou",
    when: rel(-35, 9, 5),
    capacity: 30,
    pointsValue: 120,
    status: "COMPLETED",
    needsFunding: true,
    fundingGoal: 200_000,
  },
  C11: {
    org: "C",
    title: "Maraude hivernale et distribution de couvertures",
    description:
      "Maraudes de nuit dans les rues de Béjaïa pendant les premiers froids : distribution de couvertures, de repas chauds et de vêtements chauds aux personnes sans abri. Les équipes partent en binôme, accompagnées d'un responsable expérimenté.",
    domain: "HUMANITARIAN",
    city: "Béjaïa",
    location: "Local de l'association, quartier Nacéria",
    when: rel(75, 19, 4),
    capacity: 25,
    pointsValue: 150,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 180_000,
    sponsorRequested: true,
  },
  C12: {
    org: "C",
    title: "Action solidaire du Ramadan : préparation et distribution de couffins",
    description:
      "Pendant le mois de Ramadan, nous préparons et distribuons des couffins aux familles dans le besoin et servons des repas d'iftar. Les bénévoles participent au conditionnement, à la logistique et à la distribution.",
    domain: "HUMANITARIAN",
    city: "Akbou",
    location: "Salle polyvalente d'Akbou",
    when: { kind: "absolute", start: "2027-02-20T13:00:00.000Z", durationHours: 5 },
    capacity: 50,
    pointsValue: 200,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 400_000,
    sponsorRequested: true,
  },
  C13: {
    org: "C",
    title: "Rénovation et peinture de l'école primaire de Seddouk",
    description:
      "Chantier solidaire de deux jours pour repeindre les salles de classe, réparer les tables et rafraîchir la cour de l'école primaire. Nous cherchons des peintres, des bricoleurs et des aides générales. Le matériel est pris en charge par nos partenaires.",
    domain: "SOCIAL",
    city: "Seddouk",
    location: "École primaire du centre, Seddouk",
    when: rel(20, 8, 8),
    capacity: 15,
    pointsValue: 250,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 250_000,
    sponsorRequested: true,
  },
  C14: {
    org: "C",
    title: "Nettoyage et entretien de la mosquée du quartier",
    description:
      "Grand nettoyage de la mosquée et de ses abords : tapis, sanitaires, jardin et façade. Action annulée en raison des intempéries annoncées ; elle sera reprogrammée prochainement.",
    domain: "SOCIAL",
    city: "Akbou",
    location: "Mosquée du quartier Ighil Nacer",
    when: rel(3, 9, 4),
    capacity: 20,
    pointsValue: 100,
    status: "CANCELLED",
  },
  C15: {
    org: "D",
    title: "Révisions gratuites du BAC",
    description:
      "Séances de révision gratuites pour les candidats au BAC : mathématiques, physique, sciences et philosophie. Les bénévoles, étudiants ou enseignants, encadrent des groupes de dix élèves maximum.",
    domain: "EDUCATION",
    city: "Tizi Ouzou",
    location: "Bibliothèque communale de Tizi Ouzou",
    when: rel(7, 9, 6),
    capacity: 25,
    pointsValue: 150,
    status: "PUBLISHED",
  },
  C16: {
    org: "D",
    title: "Soutien scolaire pour collégiens : préparation du BEM",
    description:
      "Soutien scolaire hebdomadaire pour les élèves de quatrième année moyenne qui préparent le BEM : français, mathématiques et arabe. Chaque bénévole suit un petit groupe tout au long du mois.",
    domain: "EDUCATION",
    city: "Tizi Ouzou",
    location: "Maison de jeunes de la Nouvelle-Ville",
    when: { kind: "ongoing", startedHoursAgo: 72, endsInHours: 720 },
    capacity: 15,
    pointsValue: 120,
    status: "ONGOING",
  },
  C17: {
    org: "D",
    title: "Atelier d'alphabétisation pour adultes",
    description:
      "Atelier d'apprentissage de la lecture et de l'écriture pour des adultes, principalement des mères de famille. Méthode progressive, supports fournis, séances en petits groupes.",
    domain: "EDUCATION",
    city: "Bouira",
    location: "Centre culturel de Bouira",
    when: rel(-15, 14, 3),
    capacity: 12,
    pointsValue: 150,
    status: "COMPLETED",
  },
  C18: {
    org: "E",
    title: "Atelier d'initiation à la programmation",
    description:
      "Atelier d'une journée pour initier des lycéens à la programmation : logique, premiers programmes et création d'une petite page web. Les bénévoles accompagnent les participants sur les postes de la salle informatique.",
    domain: "TECH",
    city: "Alger",
    location: "Espace jeunes de Bab Ezzouar",
    when: rel(9, 10, 6),
    capacity: 20,
    pointsValue: 150,
    status: "PUBLISHED",
  },
  C19: {
    org: "E",
    title: "Initiation des seniors à Internet et aux outils numériques",
    description:
      "Accompagnement individuel de personnes âgées pour utiliser un smartphone, envoyer des messages, passer des appels vidéo avec leur famille et effectuer des démarches en ligne en toute sécurité.",
    domain: "EDUCATION",
    city: "Alger",
    location: "Maison de retraite de Kouba",
    when: rel(14, 14, 3),
    capacity: 10,
    pointsValue: 120,
    status: "PUBLISHED",
  },
  C20: {
    org: "E",
    title: "Création du site web et traduction des contenus d'une association",
    description:
      "Mission de compétences : concevoir le site d'une petite association, réaliser la charte graphique et traduire ses contenus en arabe, français et tamazight. Profils recherchés : développeurs, designers, traducteurs.",
    domain: "TECH",
    city: "Alger",
    location: "À distance, réunion de lancement à Alger",
    when: rel(21, 18, 2),
    capacity: 5,
    pointsValue: 250,
    status: "DRAFT",
  },
  C21: {
    org: "F",
    title: "Tournoi de basket fauteuil",
    description:
      "Tournoi régional de basket fauteuil réunissant six équipes. Les bénévoles assurent l'accueil, l'arbitrage de table, l'accompagnement des joueurs et l'animation. Une initiation est proposée au public entre les matchs.",
    domain: "SPORT",
    city: "Oran",
    location: "Salle omnisports de Haï Essabah",
    when: rel(18, 9, 8),
    capacity: 20,
    pointsValue: 150,
    status: "PUBLISHED",
    needsFunding: true,
    fundingGoal: 160_000,
    sponsorRequested: true,
  },
  C22: {
    org: "F",
    title: "Enregistrement de livres audio et accompagnement de personnes malvoyantes",
    description:
      "Enregistrement de livres et de manuels scolaires en audio pour des élèves malvoyants, suivi d'un après-midi d'accompagnement dans les déplacements et les activités. Une bonne diction est appréciée ; le matériel d'enregistrement est fourni.",
    domain: "CULTURE",
    city: "Oran",
    location: "Bibliothèque municipale d'Oran",
    when: rel(6, 10, 5),
    capacity: 10,
    pointsValue: 150,
    status: "PUBLISHED",
  },
  C23: {
    org: "F",
    title: "Journée sportive inclusive",
    description:
      "Journée de sport partagé entre personnes valides et personnes en situation de handicap : volley assis, handball adapté et parcours d'orientation. Les bénévoles ont accompagné les participants tout au long de la journée.",
    domain: "SPORT",
    city: "Oran",
    location: "Complexe sportif de Seddikia",
    when: rel(-25, 9, 7),
    capacity: 30,
    pointsValue: 120,
    status: "COMPLETED",
  },
};

// Current (non-attended) enrollments. The demo volunteer is V07.
export const ENROLLMENTS: Array<[CampaignKey, VolunteerKey, EnrollmentStatus]> = [
  ["C01", "V07", "ENROLLED"], ["C01", "V08", "ENROLLED"], ["C01", "V05", "ENROLLED"],
  ["C01", "V11", "ENROLLED"], ["C01", "V01", "ENROLLED"], ["C01", "V09", "ENROLLED"],
  ["C02", "V07", "ENROLLED"], ["C02", "V05", "ENROLLED"], ["C02", "V11", "ENROLLED"],
  ["C04", "V03", "ENROLLED"], ["C04", "V01", "ENROLLED"], ["C04", "V10", "ENROLLED"],
  ["C06", "V02", "ENROLLED"], ["C06", "V09", "ENROLLED"], ["C06", "V06", "ENROLLED"],
  ["C06", "V04", "ENROLLED"], ["C06", "V08", "WITHDRAWN"],
  // C07 capacity 4: full, the next enrollment becomes WAITLISTED.
  ["C07", "V02", "ENROLLED"], ["C07", "V03", "ENROLLED"], ["C07", "V06", "ENROLLED"], ["C07", "V10", "ENROLLED"],
  ["C08", "V02", "ENROLLED"], ["C08", "V06", "ENROLLED"],
  ["C09", "V04", "ENROLLED"], ["C09", "V01", "ENROLLED"], ["C09", "V12", "ENROLLED"],
  ["C09", "V05", "ENROLLED"], ["C09", "V08", "ENROLLED"],
  ["C11", "V05", "ENROLLED"], ["C11", "V11", "ENROLLED"],
  ["C12", "V08", "ENROLLED"], ["C12", "V09", "ENROLLED"], ["C12", "V11", "ENROLLED"],
  ["C13", "V04", "ENROLLED"], ["C13", "V06", "ENROLLED"], ["C13", "V09", "ENROLLED"],
  // C14 was cancelled: these volunteers received the cancellation notice.
  ["C14", "V07", "ENROLLED"], ["C14", "V08", "ENROLLED"], ["C14", "V11", "ENROLLED"], ["C14", "V05", "ENROLLED"],
  ["C15", "V03", "ENROLLED"], ["C15", "V10", "ENROLLED"], ["C15", "V12", "ENROLLED"],
  ["C16", "V03", "ENROLLED"], ["C16", "V10", "ENROLLED"], ["C16", "V12", "ENROLLED"],
  ["C16", "V02", "ENROLLED"], ["C16", "V09", "ENROLLED"], ["C16", "V06", "ENROLLED"],
  ["C18", "V01", "ENROLLED"], ["C18", "V12", "ENROLLED"], ["C18", "V10", "ENROLLED"],
  ["C19", "V01", "ENROLLED"], ["C19", "V10", "ENROLLED"],
  ["C21", "V04", "ENROLLED"], ["C21", "V12", "ENROLLED"],
  ["C22", "V04", "ENROLLED"], ["C22", "V03", "ENROLLED"],
  ["C05", "V10", "NO_SHOW"], ["C05", "V09", "NO_SHOW"],
];

// Past attendance on completed campaigns: CheckIn + ATTENDED + ledger row.
export const ATTENDANCES: Array<[CampaignKey, VolunteerKey[]]> = [
  ["C03", ["V07", "V08", "V05", "V11", "V01"]],
  ["C05", ["V01", "V02", "V03", "V04", "V06"]],
  ["C10", ["V07", "V05", "V08", "V09", "V01", "V03"]],
  ["C17", ["V03", "V10", "V02"]],
  ["C23", ["V04", "V01", "V06", "V02"]],
];

export const FAVORITES: Array<[VolunteerKey, CampaignKey]> = [
  ["V07", "C04"], ["V07", "C13"],
  ["V01", "C09"], ["V01", "C18"],
  ["V03", "C15"],
  ["V12", "C21"], ["V12", "C22"],
  ["V05", "C11"],
];

export type SponsorKey = "S1" | "S2" | "S3" | "S4";

export const SPONSORS: Record<
  SponsorKey,
  { email: string; companyName: string; sector: string; card: { holderName: string; last4: string } }
> = {
  S1: { email: DEMO_EMAILS.sponsor, companyName: "Soummam Agro SARL", sector: "Agroalimentaire", card: { holderName: "Karim Messaoudi", last4: "4821" } },
  S2: { email: "kabylie.numerique@tawa3.dz", companyName: "Kabylie Numérique SPA", sector: "Numérique", card: { holderName: "Nadia Hamdi", last4: "7310" } },
  S3: { email: "atlas.batiment@tawa3.dz", companyName: "Atlas Bâtiment", sector: "BTP", card: { holderName: "Mourad Ziani", last4: "2294" } },
  S4: { email: "pharma.hodna@tawa3.dz", companyName: "Pharma Hodna", sector: "Pharmaceutique", card: { holderName: "Samia Bouzid", last4: "5567" } },
};

export const SPONSORSHIPS: Array<{ sponsor: SponsorKey; campaign: CampaignKey; tier: SponsorTier; daysAgo: number }> = [
  { sponsor: "S1", campaign: "C12", tier: "PRO", daysAgo: 6 },
  { sponsor: "S3", campaign: "C13", tier: "MAX", daysAgo: 4 },
  { sponsor: "S4", campaign: "C09", tier: "PRO", daysAgo: 9 },
  { sponsor: "S2", campaign: "C02", tier: "STARTER", daysAgo: 2 },
];

export const DONATIONS: Array<{ campaign: CampaignKey; donorName: string; amountDZD: number; daysAgo: number }> = [
  { campaign: "C10", donorName: "Famille Hadjadj", amountDZD: 15_000, daysAgo: 45 },
  { campaign: "C10", donorName: "Mohamed Larbi", amountDZD: 12_000, daysAgo: 42 },
  { campaign: "C10", donorName: "Anonyme", amountDZD: 10_000, daysAgo: 40 },
  { campaign: "C10", donorName: "Houria Saadi", amountDZD: 9_000, daysAgo: 38 },
  { campaign: "C02", donorName: "Samir Bouchareb", amountDZD: 5_000, daysAgo: 3 },
  { campaign: "C02", donorName: "Kahina Idir", amountDZD: 3_500, daysAgo: 1 },
  { campaign: "C09", donorName: "Club des coureurs de Sétif", amountDZD: 10_000, daysAgo: 12 },
  { campaign: "C09", donorName: "Nadia Ferhat", amountDZD: 8_000, daysAgo: 10 },
  { campaign: "C09", donorName: "Anonyme", amountDZD: 6_000, daysAgo: 8 },
  { campaign: "C09", donorName: "Rachid Mansouri", amountDZD: 4_000, daysAgo: 5 },
  { campaign: "C09", donorName: "Lydia Khelifi", amountDZD: 3_000, daysAgo: 2 },
  { campaign: "C12", donorName: "Commerçants du marché d'Akbou", amountDZD: 10_000, daysAgo: 7 },
  { campaign: "C12", donorName: "Farid Bensalem", amountDZD: 7_000, daysAgo: 5 },
  { campaign: "C12", donorName: "Anonyme", amountDZD: 5_000, daysAgo: 1 },
];
