import { Place, Activity, Expense, Trip, PackingItem, DestinationMeta } from '../types';

export interface AiGeneratorOptions {
  destinationQuery: string;
  days: number;
  pace: 'Relaxed' | 'Balanced' | 'Intense';
  theme: string;
  budgetTier: 'Économique' | 'Équilibré' | 'Confort';
  groupType: 'Solo' | 'Couple' | 'Amis' | 'Famille';
  userId: string;
  userName: string;
  userCurrency: string;
  selectedParticipants?: string[];
  customStartDate?: string;
}

export interface AiGeneratedTripResult {
  trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>;
  places: Omit<Place, 'id' | 'tripId' | 'createdAt'>[];
  activities: Omit<Activity, 'id' | 'tripId' | 'placeId' | 'createdAt'>[];
  expenses: Omit<Expense, 'id' | 'tripId' | 'createdAt'>[];
}

interface CuratedPoi {
  name: string;
  category: Place['category'];
  cost: number;
  duration: number;
  rating: number;
  imageUrl: string;
  address: string;
  notes: string;
}

interface DestinationKnowledge {
  canonicalName: string;
  aliases: string[];
  city: string;
  country: string;
  lat: number;
  lon: number;
  coverImage: string;
  meta: DestinationMeta;
  insiderTips: string[];
  curatedPois: CuratedPoi[];
  specialPacking: string[];
}

// Comprehensive Knowledge Base for instant, high-fidelity, offline-capable AI generation
export const DESTINATIONS_DB: DestinationKnowledge[] = [
  {
    canonicalName: 'Djerba, Tunisie',
    aliases: ['djerba', 'jerba', 'zarzis', 'houmt souk', 'djerba la douce', 'djerbahood', 'midoun', 'guellala'],
    city: 'Djerba',
    country: 'Tunisie',
    lat: 33.8076,
    lon: 10.8451,
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '198 / 190' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Avril à Novembre'
    },
    insiderTips: [
      '🎨 Djerbahood (Erriadh) : Visitez la galerie de street-art à ciel ouvert en fin d\'après-midi quand la lumière dorée sublime les façades.',
      '🐟 Criée de Houmt Souk : Achetez votre poisson frais le matin aux enchères et faites-le griller directement sur place au restaurant de la criée pour 15 TND.',
      '🏺 Ateliers de Guellala : Visitez les poteries traditionnelles troglodytes pour acheter des pièces artisanales à prix direct fabricant.',
      '🌅 Coucher de soleil aux Flamants Roses : Balade en calèche ou bateau pirate vers la lagune pour voir les colonies d’oiseaux.'
    ],
    specialPacking: ['Crème solaire haute protection', 'Lunettes de soleil polarisées', 'Tenue légère en lin', 'Chapeau / Casquette', 'Anti-moustique corporel'],
    curatedPois: [
      {
        name: 'Djerbahood & Fresques d’Erriadh',
        category: 'Monuments',
        cost: 0,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
        address: 'Village d\'Erriadh, Djerba',
        notes: 'Musée à ciel ouvert regroupant plus de 250 artistes du monde entier.'
      },
      {
        name: 'Criée aux Poissons & Marché Central',
        category: 'Restaurant',
        cost: 15,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop&q=80',
        address: 'Centre de Houmt Souk, Djerba',
        notes: 'Ambiance authentique et dégustation minute de poisson grillé ultra frais.'
      },
      {
        name: 'Musée & Potiers de Guellala',
        category: 'Monuments',
        cost: 7,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Guellala, Sud de Djerba',
        notes: 'Héritage berbère et démonstration du travail de l\'argile.'
      },
      {
        name: 'Plage de Sidi Mahrez & Bord de Mer',
        category: 'Plage',
        cost: 0,
        duration: 150,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Zone Touristique Nord, Djerba',
        notes: 'Sable fin blanc et eaux cristallines calmes.'
      },
      {
        name: 'Synagogue de la Ghriba',
        category: 'Monuments',
        cost: 5,
        duration: 60,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Hara Sghira, Erriadh',
        notes: 'L\'une des plus anciennes synagogues au monde aux mosaïques bleu azur.'
      },
      {
        name: 'Dîner Fruits de Mer & Thé aux Pignons',
        category: 'Restaurant',
        cost: 25,
        duration: 100,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Front de mer, Marina de Houmt Souk',
        notes: 'Spécialités djerbiennes, ojja aux fruits de mer et thé à la menthe.'
      }
    ]
  },
  {
    canonicalName: 'Barcelone, Espagne',
    aliases: ['barcelon', 'brcelon', 'barcelona', 'barca', 'catalunya', 'espagne barcelone'],
    city: 'Barcelone',
    country: 'Espagne',
    lat: 41.3879,
    lon: 2.1699,
    coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Madrid)',
      emergencyNumbers: { police: '112 / 091', ambulance: '112 / 061' },
      plugType: 'Type C & F (230V / 50Hz)',
      language: 'Espagnol & Catalan',
      currency: 'EUR',
      bestMonths: 'Mai à Octobre'
    },
    insiderTips: [
      '🎟️ Sagrada Família & Parc Güell : Réservez vos billets coupe-file au moins 10 jours avant pour économiser jusqu\'à 20% et garantir votre créneau.',
      '🚇 Métro malin : Achetez le pass T-Casual (10 trajets) pour diviser vos frais de transport par deux.',
      '🍽️ Tapas locaux : Privilégiez les ruelles de Gràcia et Poble Sec plutôt que La Rambla pour des saveurs catalanes authentiques.',
      '🌅 Belvédère des Bunkers del Carmel : Vue panoramique à 360° sur toute la métropole et la Méditerranée au coucher du soleil (gratuit).'
    ],
    specialPacking: ['Chaussures de marche confortables', 'Petite sacoche antivol pour le métro', 'Gourde réutilisable', 'Veste légère coupe-vent'],
    curatedPois: [
      {
        name: 'Basilique de la Sagrada Família',
        category: 'Monuments',
        cost: 26,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
        address: 'Carrer de Mallorca, 401, Barcelone',
        notes: 'Le chef-d’œuvre absolu d’Antoni Gaudí avec ses vitraux féeriques.'
      },
      {
        name: 'Parc Güell & Vue Panoramique',
        category: 'Nature',
        cost: 10,
        duration: 100,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=600&auto=format&fit=crop&q=80',
        address: 'Gràcia, Barcelone',
        notes: 'Jardins féeriques et bancs en céramique surplombant la cité.'
      },
      {
        name: 'Marché de la Boqueria & Bar à Tapas',
        category: 'Restaurant',
        cost: 18,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'La Rambla, 91, Barcelone',
        notes: 'Dégustation de jambon ibérique, fruits frais et pinchos minute.'
      },
      {
        name: 'Quartier Gothique & Cathédrale',
        category: 'Monuments',
        cost: 0,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=600&auto=format&fit=crop&q=80',
        address: 'Barri Gòtic, Barcelone',
        notes: 'Dédale de ruelles médiévales pleines de charme et d’artistes de rue.'
      },
      {
        name: 'Plage de la Barceloneta & Paella au Feu de Bois',
        category: 'Plage',
        cost: 28,
        duration: 120,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Passeig Marítim de la Barceloneta',
        notes: 'Bord de mer, balade sur le port et paella catalane traditionnelle.'
      },
      {
        name: 'Casa Batlló & Passeig de Gràcia',
        category: 'Monuments',
        cost: 29,
        duration: 75,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Passeig de Gràcia, 43, Barcelone',
        notes: 'Façade ondulée magique rappelant le dos d’un dragon.'
      }
    ]
  },
  {
    canonicalName: 'Tokyo, Japon',
    aliases: ['tokyo', 'tokio', 'japon', 'shinjuku', 'shibuya', 'kyoto tokyo'],
    city: 'Tokyo',
    country: 'Japon',
    lat: 35.6762,
    lon: 139.6503,
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+9 (Heure de Tokyo)',
      emergencyNumbers: { police: '110', ambulance: '119' },
      plugType: 'Type A & B (100V / 50-60Hz)',
      language: 'Japonais',
      currency: 'JPY',
      bestMonths: 'Mars à Mai & Octobre à Décembre'
    },
    insiderTips: [
      '🚇 Tokyo Subway Ticket 72h : Métro illimité pour ~9 € (réservé aux touristes aux aéroports et grands guichets).',
      '🗼 Belvédère de la Mairie de Tokyo (Tocho) : Vue panoramique époustouflante à 360° au 45e étage, 100% gratuite.',
      '🍜 Ramen sur borne : Commandez vos plats authentiques sur les bornes automatiques dans les ruelles de Shinjuku pour ~6 €.',
      '⛩️ Temple Senso-ji : Venez à 7h du matin pour profiter de la sérénité des lieux avant l\'affluence touristique.'
    ],
    specialPacking: ['Adaptateur prise Type A américain plat', 'Chaussures faciles à enlever pour les temples', 'Parapluie compact', 'Batterie externe puissante'],
    curatedPois: [
      {
        name: 'Sanctuaire Meiji Jingu & Forêt de Yoyogi',
        category: 'Monuments',
        cost: 0,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
        address: '1-1 Yoyogikamizonocho, Shibuya, Tokyo',
        notes: 'Oasis spirituelle au cœur de la mégapole ombragée par des milliers d’arbres centenaires.'
      },
      {
        name: 'Carrefour de Shibuya & Hachiko',
        category: 'Shopping',
        cost: 0,
        duration: 60,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
        address: 'Shibuya City, Tokyo',
        notes: 'Le passage piéton le plus animé du monde et la statue du fidèle chien Hachiko.'
      },
      {
        name: 'Temple Senso-ji à Asakusa',
        category: 'Monuments',
        cost: 0,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&auto=format&fit=crop&q=80',
        address: '2-3-1 Asakusa, Taito, Tokyo',
        notes: 'Le plus vieux temple bouddhiste de Tokyo avec son imposante lanterne rouge.'
      },
      {
        name: 'Marché aux Poissons de Tsukiji & Sushis frais',
        category: 'Restaurant',
        cost: 22,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: '4 Chome Tsukiji, Chuo, Tokyo',
        notes: 'Dégustation de sashimi ultra-frais et brochettes de wagyu grillées sous vos yeux.'
      },
      {
        name: 'Quartier High-Tech & Manga d’Akihabara',
        category: 'Shopping',
        cost: 15,
        duration: 100,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
        address: 'Sotokanda, Chiyoda, Tokyo',
        notes: 'Mecque de la pop-culture japonaise, rétrogaming et néons futuristes.'
      },
      {
        name: 'Belvédère Shinjuku Sky & Dîner Ramen Authentique',
        category: 'Restaurant',
        cost: 18,
        duration: 110,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        address: 'Nishi-Shinjuku, Tokyo',
        notes: 'Panorama nocturne féerique et bol de ramen tonkotsu fumant dans une ruelle typique.'
      }
    ]
  },
  {
    canonicalName: 'Rome, Italie',
    aliases: ['rome', 'roma', 'italie rome', 'vatican'],
    city: 'Rome',
    country: 'Italie',
    lat: 41.9028,
    lon: 12.4964,
    coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Rome)',
      emergencyNumbers: { police: '112 / 113', ambulance: '118' },
      plugType: 'Type C, F & L (230V / 50Hz)',
      language: 'Italien',
      currency: 'EUR',
      bestMonths: 'Avril à Juin & Septembre à Novembre'
    },
    insiderTips: [
      '🏛️ Billet combiné Colisée + Forum : Réservez pour 08h30 pour éviter les longues files d’attente.',
      '🍝 Quartier Trastevere : Évitez les restaurants autour du Panthéon et traversez le Tibre pour de véritables Cacio e Pepe.',
      '💧 Fontaines Nasoni : Ne payez jamais pour de l\'eau en bouteille ! Plus de 2500 fontaines d\'eau fraîche historique sont disséminées dans la ville.',
      '⛪ Panthéon : Entrée gratuite le premier dimanche du mois.'
    ],
    specialPacking: ['Chaussures confortables pour les pavés romains', 'Gourde pour les fontaines Nasoni', 'Foulard léger pour couvrir les épaules dans les églises'],
    curatedPois: [
      {
        name: 'Colisée & Forum Romain',
        category: 'Monuments',
        cost: 18,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza del Colosseo, Rome',
        notes: 'Le monument emblématique de l\'Empire Romain chargé de deux millénaires d’histoire.'
      },
      {
        name: 'Fontaine de Trevi & Vœu à la pièce',
        category: 'Monuments',
        cost: 0,
        duration: 45,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza di Trevi, Rome',
        notes: 'Chef-d’œuvre baroque sculpté au son des cascades d’eau.'
      },
      {
        name: 'Panthéon de Rome & Piazza Navona',
        category: 'Monuments',
        cost: 5,
        duration: 75,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza della Rotonda, Rome',
        notes: 'Dôme antique parfait percé d\'un oculus ouvert vers le ciel.'
      },
      {
        name: 'Trastevere : Pâtes Carbonara & Glace Artisanale',
        category: 'Restaurant',
        cost: 22,
        duration: 100,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Trastevere, Rome',
        notes: 'Ruelles romantiques couvertes de lierre et trattorias familiales authentiques.'
      },
      {
        name: 'Cité du Vatican & Basilique Saint-Pierre',
        category: 'Monuments',
        cost: 17,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza San Pietro, Cité du Vatican',
        notes: 'La chapelle Sixtine de Michel-Ange et le plus grand édifice chrétien au monde.'
      },
      {
        name: 'Jardins de la Villa Borghèse & Belvédère du Pincio',
        category: 'Nature',
        cost: 0,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza Napoleone I, Rome',
        notes: 'Havre de verdure surplombant la Piazza del Popolo avec les plus beaux couchers de soleil de Rome.'
      }
    ]
  },
  {
    canonicalName: 'Marrakech, Maroc',
    aliases: ['marrakech', 'marakech', 'marrakch', 'maroc marrakech', 'jemaa el fna'],
    city: 'Marrakech',
    country: 'Maroc',
    lat: 31.6295,
    lon: -7.9811,
    coverImage: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1',
      emergencyNumbers: { police: '190', ambulance: '150' },
      plugType: 'Type C & E (220V)',
      language: 'Arabe & Français',
      currency: 'MAD',
      bestMonths: 'Mars à Mai & Octobre à Décembre'
    },
    insiderTips: [
      '🌿 Jardin Majorelle : Prenez impérativement le créneau de 08h30 en ligne pour éviter la foule.',
      '🍵 Rooftops de la Place Jemaa el-Fna : Montez sur une terrasse vers 18h30 pour voir s\'allumer les fumées des stands culinaires.',
      '🛍️ Négociation dans les souks : Prenez le temps d\'échanger avec le sourire et commencez par proposer la moitié du prix annoncé.',
      '🧖 Hammam traditionnel : Expérience revigorante au savon noir et à l\'eucalyptus indispensable.'
    ],
    specialPacking: ['Lunettes de soleil et chapeau', 'Tenue pudique couvrant les genoux et épaules', 'Écharpe en coton contre la poussière'],
    curatedPois: [
      {
        name: 'Jardin Majorelle & Musée Yves Saint Laurent',
        category: 'Nature',
        cost: 14,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&auto=format&fit=crop&q=80',
        address: 'Rue Yves St Laurent, Marrakech',
        notes: 'Bleu Majorelle éclatant, cactus géants et hommage à la haute couture.'
      },
      {
        name: 'Place Jemaa el-Fna & Échoppes de Rue',
        category: 'Restaurant',
        cost: 10,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
        address: 'Médina, Marrakech',
        notes: 'Spectacle vivant permanent de musiciens, charmeurs de serpents et tajines fumants.'
      },
      {
        name: 'Palais de la Bahia & Mosaïques Andalouses',
        category: 'Monuments',
        cost: 7,
        duration: 75,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Rue Riad Zitoun el Jdid, Marrakech',
        notes: 'Patios ornés de zelliges, fontaines en marbre et plafonds en bois de cèdre sculpté.'
      },
      {
        name: 'Souks de la Médina & Artisans Épices',
        category: 'Shopping',
        cost: 15,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: 'Médina de Marrakech',
        notes: 'Parfums de fleur d’oranger, travail du cuir, tapis berbères et lanternes ciselées.'
      },
      {
        name: 'Dîner Tajine d’Agneau aux Pruneaux & Couscous Royal',
        category: 'Restaurant',
        cost: 20,
        duration: 100,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Riad traditionnel, Médina',
        notes: 'Saveurs sucrées-salées d’exception au son du luth oriental.'
      },
      {
        name: 'Hammam Traditionnel & Soin à l\'Argan',
        category: 'Autre',
        cost: 25,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        address: 'Quartier Mouassine, Marrakech',
        notes: 'Gommage ancestral au kessa et massage décontractant aux huiles précieuses.'
      }
    ]
  },
  {
    canonicalName: 'Paris, France',
    aliases: ['paris', 'france', 'paname', 'louvre', 'eiffel'],
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lon: 2.3522,
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1',
      emergencyNumbers: { police: '112 / 17', ambulance: '112 / 15' },
      plugType: 'Type C & E (230V)',
      language: 'Français',
      currency: 'EUR',
      bestMonths: 'Avril à Octobre'
    },
    insiderTips: [
      '🎟️ Musée du Louvre : Entrée par le centre commercial Carrousel du Louvre pour éviter la longue file de la Pyramide extérieure.',
      '🚇 Métro : Utilisez le pass Navigo Easy pour recharger vos carnets sans tickets papier.',
      '🥐 Boulangeries : Cherchez l\'enseigne « Artisan Boulanger » pour de vrais croissants au beurre AOP.',
      '🚢 Bateaux-Mouches : Croisière au crépuscule pour voir s\'illuminer la Tour Eiffel et les ponts historiques.'
    ],
    specialPacking: ['Chaussures confortables et élégantes', 'Parapluie pliant', 'Veste demi-saison'],
    curatedPois: [
      {
        name: 'Musée du Louvre & Jardins des Tuileries',
        category: 'Monuments',
        cost: 22,
        duration: 180,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80',
        address: 'Rue de Rivoli, 75001 Paris',
        notes: 'La Joconde, la Vénus de Milo et l\'un des plus riches musées au monde.'
      },
      {
        name: 'Tour Eiffel & Champ-de-Mars',
        category: 'Monuments',
        cost: 29,
        duration: 100,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
        address: 'Champ de Mars, 75007 Paris',
        notes: 'La Dame de Fer et son panorama à couper le souffle sur tout Paris.'
      },
      {
        name: 'Montmartre & Basilique du Sacré-Cœur',
        category: 'Monuments',
        cost: 0,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=600&auto=format&fit=crop&q=80',
        address: 'Place du Tertre, 75018 Paris',
        notes: 'Village d\'artistes bohèmes, peintres portraitistes et vue panoramique.'
      },
      {
        name: 'Bistrot Parisien & Spécialités du Terroir',
        category: 'Restaurant',
        cost: 28,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Quartier Saint-Germain-des-Prés, Paris',
        notes: 'Confit de canard, bœuf bourguignon et crème brûlée croustillante.'
      },
      {
        name: 'Île de la Cité & Cathédrale Notre-Dame',
        category: 'Monuments',
        cost: 0,
        duration: 75,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=600&auto=format&fit=crop&q=80',
        address: '6 Parvis Notre-Dame, 75004 Paris',
        notes: 'Le cœur historique et spirituel de Paris au bord de la Seine.'
      },
      {
        name: 'Croisière Nocturne sur la Seine',
        category: 'Nature',
        cost: 16,
        duration: 70,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        address: 'Pont de l\'Alma, Paris',
        notes: 'Défilé féerique des monuments illuminés au fil de l’eau.'
      }
    ]
  }
];

/**
 * Intelligent fuzzy matching for destination queries, tolerant to misspellings
 */
export async function resolveDestinationIntelligence(query: string): Promise<DestinationKnowledge> {
  const q = (query || '').trim().toLowerCase();

  // 1. Direct and fuzzy match in curated knowledge base
  for (const item of DESTINATIONS_DB) {
    if (
      q === item.city.toLowerCase() ||
      q === item.canonicalName.toLowerCase() ||
      item.aliases.some(alias => q.includes(alias) || alias.includes(q))
    ) {
      return item;
    }
  }

  // 2. Online Geocoding with OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`,
      { headers: { 'Accept-Language': 'fr,en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const place = data[0];
      const city = place.address?.city || place.address?.town || place.address?.village || place.name || query.split(',')[0].trim();
      const country = place.address?.country || 'International';
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const canonicalName = `${city}, ${country}`;

      return buildProceduralDestination(canonicalName, city, country, lat, lon);
    }
  } catch (err) {
    console.warn('[AI Planner] Nominatim search fallback to procedural engine:', err);
  }

  // 3. Fallback procedural destination
  const cityGuess = query.split(',')[0].trim() || 'Destination Inoubliable';
  const countryGuess = query.includes(',') ? query.split(',')[1].trim() : 'International';
  return buildProceduralDestination(query, cityGuess, countryGuess, 41.3851, 2.1699);
}

function buildProceduralDestination(
  canonicalName: string,
  city: string,
  country: string,
  lat: number,
  lon: number
): DestinationKnowledge {
  return {
    canonicalName,
    aliases: [city.toLowerCase()],
    city,
    country,
    lat,
    lon,
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'Heure locale destination',
      emergencyNumbers: { police: '112 / Numéro local', ambulance: '112 / Urgences' },
      plugType: 'Prise standard internationale',
      language: 'Langue officielle locale & Anglais',
      currency: 'EUR',
      bestMonths: 'Printemps & Automne'
    },
    insiderTips: [
      `🎟️ Réservations anticipées : Renseignez-vous auprès de l'office de tourisme de ${city} pour les billets combinés coupe-file.`,
      `🍽️ Gastronomie locale : Éloignez-vous des artères principales pour goûter aux plats traditionnels prisés par les habitants.`,
      `🚇 Mobilité douce : Privilégiez les forfaits transports à la journée ou les vélos en libre-service pour explorer les quartiers.`
    ],
    specialPacking: ['Chaussures confortables de marche', 'Gourde isotherme réutilisable', 'Adaptateur de voyage universel', 'Trousse de premiers secours'],
    curatedPois: [
      {
        name: `Centre Historique & Patrimoine de ${city}`,
        category: 'Monuments',
        cost: 12,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: `Cœur de ville historique, ${city}`,
        notes: `Découverte architecturale et histoire vivante de ${city}.`
      },
      {
        name: `Saveurs Locales & Marché Gourmand de ${city}`,
        category: 'Restaurant',
        cost: 20,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: `Marché central, ${city}`,
        notes: `Dégustation des spécialités du terroir et produits frais régionaux.`
      },
      {
        name: `Belvédère Panoramique & Espaces Verts de ${city}`,
        category: 'Nature',
        cost: 0,
        duration: 75,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: `Hauteurs de ${city}`,
        notes: `Vue imprenable à 360° sur toute l'agglomération.`
      },
      {
        name: `Grand Musée d'Art & Culture de ${city}`,
        category: 'Monuments',
        cost: 15,
        duration: 110,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: `Quartier culturel, ${city}`,
        notes: `Exposition des chefs-d’œuvre artistiques et trésors archéologiques.`
      },
      {
        name: `Ruelles Commerçantes & Boutiques d’Artisans`,
        category: 'Shopping',
        cost: 15,
        duration: 80,
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
        address: `Centre piétonnier, ${city}`,
        notes: `Créations locales et souvenirs authentiques.`
      },
      {
        name: `Dîner Convivial & Atmosphère Nocturne de ${city}`,
        category: 'Restaurant',
        cost: 25,
        duration: 100,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        address: `Front de fleuve / Place animée, ${city}`,
        notes: `Repas soigné dans un restaurant réputé pour sa convivialité.`
      }
    ]
  };
}

/**
 * Generate a smart Packing List based on destination profile and travel length
 */
export function generateSmartPackingList(dest: DestinationKnowledge, days: number, theme: string): PackingItem[] {
  const baseItems: { label: string; category: PackingItem['category'] }[] = [
    { label: 'Passeport ou Carte d’Identité valide', category: 'Documents' },
    { label: 'Billets de transport & Réservations', category: 'Documents' },
    { label: 'Carte bancaire internationale sans frais', category: 'Documents' },
    { label: 'Assurance voyage & Carte européenne / rapatriement', category: 'Documents' },
    { label: `${days}x Sous-vêtements et chaussettes de rechange`, category: 'Vêtements' },
    { label: `${Math.min(days, 5)}x Hauts / T-shirts adaptés`, category: 'Vêtements' },
    { label: 'Pantalons / Shorts confortables', category: 'Vêtements' },
    { label: 'Chaussures de marche respirantes déjà faites au pied', category: 'Vêtements' },
    { label: 'Veste de pluie légère ou coupe-vent', category: 'Vêtements' },
    { label: 'Brosse à dents, dentifrice et soins de base', category: 'Hygiène & Soins' },
    { label: 'Trousse pharmacie (pansements, paracétamol, désinfectant)', category: 'Hygiène & Soins' },
    { label: 'Smartphone, chargeur et câble résistant', category: 'Électronique' },
    { label: 'Batterie externe de secours (Powerbank 10 000 mAh)', category: 'Électronique' }
  ];

  // Specific destination items
  dest.specialPacking.forEach(item => {
    baseItems.push({ label: item, category: 'Spécifique Destination' });
  });

  if (theme.includes('Plage') || theme.includes('Détente')) {
    baseItems.push(
      { label: 'Maillot de bain & Serviette microfibre', category: 'Spécifique Destination' },
      { label: 'Pochette étanche pour téléphone', category: 'Électronique' }
    );
  }

  if (theme.includes('Nature') || theme.includes('Randonnée')) {
    baseItems.push(
      { label: 'Chaussures de randonnée crantées', category: 'Vêtements' },
      { label: 'Gourde filtrante ou isotherme', category: 'Spécifique Destination' }
    );
  }

  return baseItems.map((item, index) => ({
    id: `pack-${index + 1}-${Date.now()}`,
    label: item.label,
    category: item.category,
    isPacked: false
  }));
}

/**
 * Main AI Engine: Orchestrates Trip, Places, Activities, Budget and Packing List
 */
export async function generateFullSmartTrip(options: AiGeneratorOptions): Promise<AiGeneratedTripResult> {
  const {
    destinationQuery,
    days,
    pace,
    theme,
    budgetTier,
    groupType,
    userId,
    userName,
    userCurrency,
    selectedParticipants = [],
    customStartDate
  } = options;

  // 1. Resolve destination intelligence
  const dest = await resolveDestinationIntelligence(destinationQuery);

  // Dates
  const startDate = customStartDate || new Date().toISOString().split('T')[0];
  const startObj = new Date(startDate);
  const endObj = new Date(startObj.getTime() + days * 86400000);
  const endDate = endObj.toISOString().split('T')[0];

  // Unique 6-character share code
  const shareCode = 'TRIP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  // Multipliers by budget tier
  const lodgingCostPerNight = budgetTier === 'Économique' ? 45 : budgetTier === 'Équilibré' ? 95 : 190;
  const transportPerDay = budgetTier === 'Économique' ? 10 : budgetTier === 'Équilibré' ? 25 : 50;

  // Activities per day based on pace
  const activitiesPerDay = pace === 'Relaxed' ? 2 : pace === 'Balanced' ? 3 : 4;

  const timeSlots = [
    { start: '09:30', end: '11:30' },
    { start: '12:00', end: '13:30' },
    { start: '14:30', end: '17:00' },
    { start: '18:30', end: '20:30' }
  ];

  const participantsList = selectedParticipants.length > 0 
    ? selectedParticipants 
    : [userName || 'Moi', groupType === 'Solo' ? '' : 'Compagnon'].filter(Boolean);

  const packingList = generateSmartPackingList(dest, days, theme);

  // 2. Generate Places & sequenced non-overlapping Activities
  const generatedPlaces: Omit<Place, 'id' | 'tripId' | 'createdAt'>[] = [];
  const generatedActivities: Omit<Activity, 'id' | 'tripId' | 'placeId' | 'createdAt'>[] = [];

  const baseLat = dest.lat;
  const baseLon = dest.lon;
  const pool = dest.curatedPois;

  let totalActivityCost = 0;

  for (let day = 1; day <= days; day++) {
    const dayDate = new Date(startObj.getTime() + (day - 1) * 86400000).toISOString().split('T')[0];

    for (let step = 0; step < activitiesPerDay; step++) {
      const poiIndex = ((day - 1) * activitiesPerDay + step) % pool.length;
      const poi = pool[poiIndex];
      const slot = timeSlots[step % timeSlots.length];

      // Realistic GPS dispersion around central landmark
      const angle = (day * 1.5 + step * 0.8) + (poiIndex * 0.5);
      const radius = 0.004 + (step * 0.002) + (day * 0.001);

      const placeLat = Number((baseLat + Math.sin(angle) * radius).toFixed(6));
      const placeLon = Number((baseLon + Math.cos(angle) * radius).toFixed(6));

      // Adjust cost according to budget tier
      const costFactor = budgetTier === 'Économique' ? 0.75 : budgetTier === 'Équilibré' ? 1.0 : 1.4;
      const adjustedCost = Math.round(poi.cost * costFactor);
      totalActivityCost += adjustedCost;

      generatedPlaces.push({
        name: poi.name,
        category: poi.category,
        address: poi.address,
        latitude: placeLat,
        longitude: placeLon,
        rating: poi.rating,
        estimatedDurationMinutes: poi.duration,
        costEstimate: adjustedCost,
        imageUrl: poi.imageUrl,
        notes: poi.notes
      });

      generatedActivities.push({
        dayNumber: day,
        date: dayDate,
        startTime: slot.start,
        endTime: slot.end,
        title: poi.name,
        description: `${poi.notes} (${poi.duration} min environ)`,
        cost: adjustedCost,
        status: 'À faire',
        orderIndex: step
      });
    }
  }

  // 3. Compute realistic initial expenses
  const generatedExpenses: Omit<Expense, 'id' | 'tripId' | 'createdAt'>[] = [];

  // Lodging expense
  const totalLodging = days * lodgingCostPerNight;
  generatedExpenses.push({
    title: `Hébergement (${days} nuits à ${dest.city})`,
    category: 'Hébergement',
    amount: totalLodging,
    currency: userCurrency,
    date: startDate,
    paidBy: userName || 'Moi',
    splitWith: participantsList,
    notes: `Estimation pour séjour formule ${budgetTier}`
  });

  // Transport expense
  const totalTransport = 100 + (days * transportPerDay);
  generatedExpenses.push({
    title: `Transport aller-retour & Forfaits urbains (${dest.city})`,
    category: 'Transport',
    amount: totalTransport,
    currency: userCurrency,
    date: startDate,
    paidBy: userName || 'Moi',
    splitWith: participantsList,
    notes: 'Pass transports et trajet principal'
  });

  // Activities expense
  if (totalActivityCost > 0) {
    generatedExpenses.push({
      title: `Activités culturelles & Visites guidées (${days} jours)`,
      category: 'Activités',
      amount: totalActivityCost,
      currency: userCurrency,
      date: startDate,
      paidBy: userName || 'Moi',
      splitWith: participantsList,
      notes: 'Total prévisionnel des entrées et visites générées'
    });
  }

  // Food forecast
  const foodPerDay = budgetTier === 'Économique' ? 25 : budgetTier === 'Équilibré' ? 45 : 85;
  const totalFood = days * foodPerDay;
  generatedExpenses.push({
    title: `Restauration & Gastronomie locale (${days} jours)`,
    category: 'Nourriture',
    amount: totalFood,
    currency: userCurrency,
    date: startDate,
    paidBy: userName || 'Moi',
    splitWith: participantsList,
    notes: 'Petits déjeuners, déjeuners et dîners estimés'
  });

  // Calculate total budget with 10% safety cushion
  const totalEstimatedCost = Math.round((totalLodging + totalTransport + totalActivityCost + totalFood) * 1.1);

  // 4. Construct complete Trip record
  const tripTitle = `${theme} à ${dest.city} (${days}j)`;
  const itinerarySummary = `Séjour sur-mesure de ${days} jours conçu par IA : rythme ${pace}, profil ${budgetTier}, pour ${groupType}. ${generatedActivities.length} activités ordonnées sur la carte sans conflit d'horaires.`;
  const tipsNotes = `💡 BONS PLANS & ASTUCES IA POUR ${dest.city.toUpperCase()} :\n` + dest.insiderTips.join('\n');

  const trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    title: tripTitle,
    destination: dest.canonicalName,
    country: dest.country,
    startDate,
    endDate,
    coverImage: dest.coverImage,
    budgetTotal: totalEstimatedCost,
    currency: userCurrency,
    status: 'Planifié',
    participants: participantsList,
    itinerarySummary,
    notes: tipsNotes,
    shareCode,
    packingList,
    travelDocs: [],
    destinationMeta: dest.meta,
    tripPace: pace,
    tripTheme: theme,
    travelStyle: budgetTier
  };

  return {
    trip,
    places: generatedPlaces,
    activities: generatedActivities,
    expenses: generatedExpenses
  };
}
