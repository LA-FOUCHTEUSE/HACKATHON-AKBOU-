export const landingCopy = {
  nav: {
    wordmark: "TIWIZI",
    links: [
      { label: "Campagnes", href: "#campagnes" },
      { label: "Comment ça marche", href: "#methode" },
      { label: "Pour les entreprises", href: "#entreprises" },
    ],
    signIn: "Se connecter",
    menu: "Menu",
    close: "Fermer",
    languages: [
      { code: "fr", label: "FR" },
      { code: "en", label: "EN" },
      { code: "ar", label: "ع" },
    ],
  },

  hero: {
    wordmark: "TIWIZI",
    tagline:
      "Le bénévolat n'est pas un concept importé. C'est la tiwizi — l'entraide collective, remise en ligne.",
    volunteer: {
      label: "Je suis bénévole",
      headline: "Contribuez. Aidez. Progressez.",
      cta: "Trouver une campagne",
      href: "#campagnes",
    },
    organization: {
      label: "Je suis une association",
      headline: "Organisez. Mobilisez. Financez.",
      cta: "Créer une campagne",
      href: "#methode",
    },
    thirdPath: "Vous êtes une entreprise ? Soutenez une campagne",
    thirdPathHref: "#entreprises",
    scrollCue: "Découvrir",
  },

  problem: {
    heading: "Trois blocages, un même gâchis",
    cards: [
      {
        title: "Les jeunes",
        body: "Envie d'agir, mais aucune idée d'où commencer. Et une confusion persistante entre bénévolat et emploi rémunéré.",
      },
      {
        title: "Les associations",
        body: "Des projets solides, mais peu de visibilité, peu de moyens logistiques et presque aucun financement.",
      },
      {
        title: "Les entreprises",
        body: "Des budgets RSE qui existent, mais aucun canal clair pour les transformer en actions concrètes sur le terrain.",
      },
    ],
  },

  method: {
    heading: "Comment ça marche",
    tabs: ["Pour les bénévoles", "Pour les associations"],
    volunteerSteps: [
      { number: "01", title: "Choisissez une campagne" },
      { number: "02", title: "Présentez-vous sur place" },
      { number: "03", title: "Scannez, cumulez, progressez" },
    ],
    organizationSteps: [
      { number: "01", title: "Publiez votre campagne" },
      { number: "02", title: "Gérez vos participants" },
      { number: "03", title: "Trouvez un financement" },
    ],
  },

  progression: {
    heading: "Votre engagement se voit",
    // Thresholds mirror TIERS in src/lib/tiers.ts so the showcase matches the product.
    tiers: [
      { name: "Nouveau", threshold: "0" },
      { name: "Contributeur", threshold: "300" },
      { name: "Engagé", threshold: "800" },
      { name: "Champion", threshold: "1 800" },
      { name: "Légende", threshold: "4 000" },
    ],
    activeTierIndex: 2,
    pointsLabel: "pts",
    currentPoints: "1 240",
    currentPointsLabel: "Vos points",
    nextTierLabel: "Prochain palier",
    nextTierGap: "560 pts pour devenir Champion",
    note: "Chaque présence confirmée sur le terrain ajoute des points à votre profil. Les paliers et le classement national sont publics.",
    leaderboardTitle: "Classement national",
    leaderboardPeriod: "Septembre",
    leaderboard: [
      { rank: "01", name: "Lyna B.", points: "4 820 pts" },
      { rank: "02", name: "Yacine M.", points: "4 105 pts" },
      { rank: "03", name: "Sarah K.", points: "3 960 pts" },
      { rank: "04", name: "Anis T.", points: "3 412 pts" },
      { rank: "05", name: "Meriem H.", points: "3 187 pts" },
    ],
  },

  campaigns: {
    heading: "Campagnes en cours",
    imagePlaceholder: "Visuel de campagne",
    participantsSuffix: "participants",
    viewCampaign: "Voir la campagne",
    items: [
      {
        domain: "Environnement",
        title: "Nettoyage de la plage de Tichy",
        image: "/campaigns/plage-tichy.webp",
        imageAlt: "Deux jeunes bénévoles ramassent des déchets sur une plage",
        organization: "Association Thiwizi Verte",
        city: "Béjaïa",
        date: "Samedi 3 octobre",
        participants: "64",
      },
      {
        domain: "Éducation",
        title: "Révisions gratuites du BAC",
        image: "/campaigns/revisions-bac.webp",
        imageAlt: "Des lycéens révisent ensemble autour d'une table",
        organization: "Club Scientifique d'Akbou",
        city: "Akbou",
        date: "Tous les dimanches",
        participants: "28",
      },
      {
        domain: "Santé",
        title: "Journée de don de sang",
        image: "/campaigns/don-de-sang.webp",
        imageAlt: "Un donneur tient un papier découpé en forme de cœur",
        organization: "Croissant-Rouge, comité local",
        city: "Sétif",
        date: "Jeudi 15 octobre",
        participants: "112",
      },
      {
        domain: "Social et entraide",
        title: "Distribution de repas en hiver",
        image: "/campaigns/distribution-repas.webp",
        imageAlt: "Des bénévoles servent des repas chauds dans la rue",
        organization: "Collectif Tafat",
        city: "Tizi Ouzou",
        date: "Chaque vendredi",
        participants: "47",
      },
      {
        domain: "Numérique",
        title: "Initiation au code pour lycéennes",
        image: "/campaigns/initiation-code.webp",
        imageAlt: "Un atelier de programmation avec des adolescents devant des ordinateurs",
        organization: "Association Numidia Digital",
        city: "Constantine",
        date: "Samedi 24 octobre",
        participants: "35",
      },
    ],
  },

  sponsors: {
    heading: "Transformez votre budget RSE en impact visible",
    priceSuffix: "DZD / campagne",
    mostChosen: "Le plus choisi",
    cta: "Choisir ce pack",
    packs: [
      {
        name: "Starter",
        price: "80 000",
        featured: false,
        benefits: [
          "Logo sur la page de campagne",
          "Mention dans le bilan d'impact",
          "Rapport de participation",
        ],
      },
      {
        name: "Pro",
        price: "200 000",
        featured: true,
        benefits: [
          "Tout le pack Starter",
          "Logo sur les visuels de l'événement",
          "Présence de vos équipes sur le terrain",
          "Bilan RSE détaillé",
        ],
      },
      {
        name: "Max",
        price: "500 000",
        featured: false,
        benefits: [
          "Tout le pack Pro",
          "Campagne co-signée à votre nom",
          "Couverture photo et vidéo",
          "Accompagnement dédié",
        ],
      },
    ],
  },

  footer: {
    description: "La tiwizi, l'entraide collective algérienne, remise en ligne.",
    columns: [
      {
        title: "Plateforme",
        links: [
          { label: "Campagnes", href: "#campagnes" },
          { label: "Comment ça marche", href: "#methode" },
          { label: "Pour les entreprises", href: "#entreprises" },
          { label: "Classement national", href: "#top" },
        ],
      },
      {
        title: "Ressources",
        links: [
          { label: "Guide du bénévole", href: "#top" },
          { label: "Créer une association", href: "#top" },
          { label: "Questions fréquentes", href: "#top" },
          { label: "Journal", href: "#top" },
        ],
      },
    ],
    contactTitle: "Contact",
    contact: {
      email: "contact@tiwizi.dz",
      city: "Alger, Algérie",
      social: [
        { label: "Instagram", href: "#top" },
        { label: "LinkedIn", href: "#top" },
      ],
    },
    copyright: "© 2026 Tiwizi",
  },
} as const;
