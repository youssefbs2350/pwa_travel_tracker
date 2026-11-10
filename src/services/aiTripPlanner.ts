import { Trip, Place, Activity, Expense, PackingItem, DestinationMeta } from '../types';

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
  duration: number; // in minutes
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
  // --- TUNISIE ---
  {
    canonicalName: 'Tunis, Tunisie',
    aliases: ['tunis', 'tounes', 'tunise', 'tuns', 'tunisia', 'tunis ville', 'sidi bou said', 'carthage', 'la goulette', 'la marsa'],
    city: 'Tunis',
    country: 'Tunisie',
    lat: 36.8065,
    lon: 10.1815,
    coverImage: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '190 / 198' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Mars à Juin, Septembre à Novembre'
    },
    insiderTips: [
      '☕ Café des Délices (Sidi Bou Saïd) : Dégustez un thé à la menthe aux pignons avec vue plongeante sur le golfe de Tunis.',
      '🏛️ Musée National du Bardo : Abrite la plus grande et prestigieuse collection de mosaïques romaines au monde.',
      '🛍️ Souks de la Médina : Perdez-vous dans le Souk El Attarine (parfums) et grimpez sur la terrasse de la Maison d’Orient pour une vue panoramique sur les toits.',
      '🥖 Fricassé & Bambalouni : Ne repartez pas sans goûter un bambalouni tout chaud à la sortie de Sidi Bou Saïd.'
    ],
    specialPacking: ['Chapeau de soleil', 'Lunettes de soleil', 'Chaussures de marche confortables', 'Tenue respectueuse pour la Médina', 'Monnaie liquide en dinars (TND)'],
    curatedPois: [
      {
        name: 'Médina de Tunis & Mosquée Zitouna',
        category: 'Monuments',
        cost: 0,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&auto=format&fit=crop&q=80',
        address: 'Rue Jamaa Ezzitouna, Médina de Tunis',
        notes: 'Joyau classé au patrimoine mondial UNESCO avec ses ruelles voûtées et artisans traditionnels.'
      },
      {
        name: 'Musée National du Bardo',
        category: 'Monuments',
        cost: 13,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Palais du Bardo, Tunis',
        notes: 'Collection mondiale unique de mosaïques romaines et chefs-d’œuvre carthaginois.'
      },
      {
        name: 'Village de Sidi Bou Saïd & Café des Délices',
        category: 'Nature',
        cost: 0,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        address: 'Colline de Sidi Bou Saïd, Banlieue Nord',
        notes: 'Maisons blanches aux portes cloutées bleues et bougainvilliers éclatants face à la Méditerranée.'
      },
      {
        name: 'Site Archéologique de Carthage & Thermes d’Antonin',
        category: 'Monuments',
        cost: 12,
        duration: 110,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Rue des Thermes d’Antonin, Carthage',
        notes: 'Vestiges grandioses de la capitale punique et romaine au bord de l’eau.'
      },
      {
        name: 'Restaurant Traditionnel Dar El Jeld',
        category: 'Restaurant',
        cost: 35,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: '5-10 Rue Dar El Jeld, Médina de Tunis',
        notes: 'Haute gastronomie tunisienne dans un somptueux palais restauré.'
      },
      {
        name: 'Avenue Habib Bourguiba & Théâtre Municipal',
        category: 'Shopping',
        cost: 0,
        duration: 75,
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: 'Avenue Habib Bourguiba, Centre-ville Tunis',
        notes: 'Les Champs-Élysées tunisiens avec terrasses de cafés animées et architecture Art nouveau.'
      }
    ]
  },
  {
    canonicalName: 'Djerba, Tunisie',
    aliases: ['djerba', 'jerba', 'zarzis', 'houmt souk', 'djerba la douce', 'djerbahood', 'midoun', 'guellala', 'djerba tunisie'],
    city: 'Djerba',
    country: 'Tunisie',
    lat: 33.8076,
    lon: 10.8451,
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '190 / 198' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Avril à Novembre'
    },
    insiderTips: [
      '🎨 Djerbahood (Erriadh) : Visitez la galerie de street-art à ciel ouvert en fin d\'après-midi quand la lumière dorée sublime les façades.',
      '🐟 Criée de Houmt Souk : Achetez votre poisson frais le matin aux enchères et faites-le griller directement sur place au restaurant de la criée pour 15 TND.',
      '🏺 Ateliers de Guellala : Visitez les poteries traditionnelles troglodytes pour acheter des pièces artisanales à prix direct fabricant.',
      '🌅 Coucher de soleil aux Flamants Roses : Balade en calèche ou bateau vers la lagune pour voir les colonies d’oiseaux.'
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
    canonicalName: 'Tozeur, Tunisie',
    aliases: ['tozeur', 'tozur', 'nefta', 'chott el djerid', 'chott el jerid', 'chebika', 'tamerza', 'tozeur sud tunisien'],
    city: 'Tozeur',
    country: 'Tunisie',
    lat: 33.9197,
    lon: 8.1335,
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '190 / 198' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Octobre à Avril (Saison saharienne idéale)'
    },
    insiderTips: [
      '🌴 Palmeraie en Calèche : Faites une balade guidée au coucher du soleil dans les 1000 hectares de palmiers nourris par les sources d’eau fossile.',
      '🌌 Chott el-Djérid au lever du jour : Admirez les mirages et reflets cristallins de sel s\'étendant à l\'infini sur le lac salé asséché.',
      '🎬 Décors Star Wars (Ong Jmel / Mos Espa) : Excursion 4x4 dans les dunes du Sahara pour explorer les décors originaux de Tatooine.',
      '🍯 Dattes Deglet Nour : Achetez des dattes fraîches branchées directement chez les producteurs locaux.'
    ],
    specialPacking: ['Chèche / Foulard saharien', 'Lunettes de soleil de catégorie 3 ou 4', 'Chaussures de trek fermées', 'Veste chaude pour les nuits fraîches dans le désert'],
    curatedPois: [
      {
        name: 'Grande Palmeraie & Oasis de Tozeur',
        category: 'Nature',
        cost: 10,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
        address: 'Oasis centrale, Route de Nefta, Tozeur',
        notes: 'Forêt luxuriante de palmiers dattiers, grenadiers et canaux d’irrigation traditionnels.'
      },
      {
        name: 'Chott el-Djérid & Cristaux de Sel',
        category: 'Nature',
        cost: 0,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Route GP16 reliant Tozeur à Kébili',
        notes: 'Immense lac salé féerique célèbre pour ses mirages optiques et ses reflets roses.'
      },
      {
        name: 'Décor Star Wars de Mos Espa (Ong Jmel)',
        category: 'Monuments',
        cost: 15,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: 'Dunes d’Ong Jmel, Nefta',
        notes: 'Village complet de Tatooine préservé au cœur des dunes dorées du désert.'
      },
      {
        name: 'Médina Historique d’Ouled El Hadef',
        category: 'Monuments',
        cost: 0,
        duration: 90,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Quartier Ouled El Hadef, Tozeur',
        notes: 'Façades emblématiques en briques d’argile cuite disposées en motifs géométriques berbères.'
      },
      {
        name: 'Oasis de Montagne de Chebika & Cascades',
        category: 'Nature',
        cost: 8,
        duration: 130,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
        address: 'Gorges de Chebika, Nord de Tozeur',
        notes: 'Sources d’eau cristalline jaillissant des falaises rocailleuses avec vue saharienne.'
      },
      {
        name: 'Dîner Sous Tente Bédouine & Pain de Sable',
        category: 'Restaurant',
        cost: 30,
        duration: 110,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Campement saharien, Tozeur',
        notes: 'Couscous au mouton du Sud, dromadaire mijoté et dégustation du pain cuit sous les braises.'
      }
    ]
  },
  {
    canonicalName: 'Sousse, Tunisie',
    aliases: ['sousse', 'sous', 'soussa', 'sousse tunisie', 'port el kantaoui', 'kantaoui', 'ribat de sousse', 'boujaafar'],
    city: 'Sousse',
    country: 'Tunisie',
    lat: 35.8256,
    lon: 10.6369,
    coverImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '190 / 198' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Mai à Octobre'
    },
    insiderTips: [
      '🏰 Ribat de Sousse : Montez au sommet de la tour de vigie pour une vue spectaculaire à 360° sur toute la baie et la Médina.',
      '⛵ Port El Kantaoui : Baladez-vous sur les quais de la marina bordés de cafés andalous et faites une virée en catamaran.',
      '🏛️ Musée Archéologique : Deuxième collection de mosaïques de Tunisie installée dans la superbe Kasbah.',
      '🏖️ Plage Boujaafar : Promenade au crépuscule sur la corniche avec une glace artisanale.'
    ],
    specialPacking: ['Maillot de bain', 'Crème solaire', 'Chapeau', 'Chaussures légères de marche'],
    curatedPois: [
      {
        name: 'Ribat Historique & Tour de Vigie',
        category: 'Monuments',
        cost: 8,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&auto=format&fit=crop&q=80',
        address: 'Place des Martyrs, Médina de Sousse',
        notes: 'Monastère fortifié du VIIIe siècle offrant le plus beau panorama sur la côte sahélienne.'
      },
      {
        name: 'Marina de Port El Kantaoui',
        category: 'Nature',
        cost: 0,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Port El Kantaoui, 4089 Sousse',
        notes: 'Premier port de plaisance-jardin de la Méditerranée avec ses yachts et son architecture mauresque.'
      },
      {
        name: 'Médina de Sousse & Souks Traditionnels',
        category: 'Monuments',
        cost: 0,
        duration: 110,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&auto=format&fit=crop&q=80',
        address: 'Centre historique de Sousse',
        notes: 'Cité médiévale ceinte de remparts imposants classée par l’UNESCO.'
      },
      {
        name: 'Musée Archéologique de la Kasbah',
        category: 'Monuments',
        cost: 10,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Kasbah de Sousse, Boulevard du Maréchal Tito',
        notes: 'Mosaïques exceptionnelles dont le fameux Triomphe de Bacchus.'
      },
      {
        name: 'Dîner Grillades de Poissons du Golfe',
        category: 'Restaurant',
        cost: 22,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Corniche Boujaafar, Sousse',
        notes: 'Daurades et loups de mer grillés, salade méchouia et bricks croustillantes.'
      }
    ]
  },
  {
    canonicalName: 'Hammamet, Tunisie',
    aliases: ['hammamet', 'hamamet', 'yasmine hammamet', 'nabeul', 'hammamet tunisie', 'cap bon'],
    city: 'Hammamet',
    country: 'Tunisie',
    lat: 36.4000,
    lon: 10.6167,
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Tunis)',
      emergencyNumbers: { police: '197', ambulance: '190 / 198' },
      plugType: 'Type C & E (230V / 50Hz)',
      language: 'Arabe & Français',
      currency: 'TND',
      bestMonths: 'Mai à Octobre'
    },
    insiderTips: [
      '🏰 Fort & Kasbah d’Hammamet : Montez sur les remparts pour admirer les barques de pêcheurs colorées au pied de la forteresse.',
      '🎭 Centre Culturel Dar Sébastian : Villa des années 1930 d’un raffinement inouï au milieu d’un immense verger d’agrumes.',
      '⛵ Yasmine Hammamet : Profitez de la longue esplanade piétonne et de la marina animée.',
      '🍊 Ateliers de Poterie de Nabeul : À seulement 15 minutes, découvrez la capitale tunisienne de la céramique et des fleurs d’oranger.'
    ],
    specialPacking: ['Tenue de plage', 'Serviette microfibre', 'Lunettes de soleil', 'Crème solaire résistante à l’eau'],
    curatedPois: [
      {
        name: 'Médina d’Hammamet & Kasbah du XVe siècle',
        category: 'Monuments',
        cost: 7,
        duration: 100,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&auto=format&fit=crop&q=80',
        address: 'Place des Martyrs, Médina d’Hammamet',
        notes: 'Ruelles immaculées plongeant directement dans la mer turquoise.'
      },
      {
        name: 'Centre Culturel International (Dar Sébastian)',
        category: 'Monuments',
        cost: 5,
        duration: 80,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Avenue des Nations Unies, Hammamet',
        notes: 'Villa d’architecte iconique saluée par Frank Lloyd Wright avec théâtre de plein air.'
      },
      {
        name: 'Marina & Promenade de Yasmine Hammamet',
        category: 'Nature',
        cost: 0,
        duration: 110,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Yasmine Hammamet Sud',
        notes: 'Port de plaisance moderne, restaurants de bord de mer et ambiance festive.'
      },
      {
        name: 'Dîner Poissons & Fruits de Mer Chez Achour',
        category: 'Restaurant',
        cost: 28,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Rue Ali Belhouane, Hammamet',
        notes: 'Institution culinaire réputée pour ses poissons sauvages cuits au gros sel.'
      }
    ]
  },

  // --- EUROPE ---
  {
    canonicalName: 'Barcelone, Espagne',
    aliases: ['barcelone', 'barcelon', 'brcelon', 'barcelona', 'barca', 'catalunya', 'espagne barcelone'],
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
      bestMonths: 'Avril à Juin, Septembre à Novembre'
    },
    insiderTips: [
      '🎟️ Sagrada Família : Réservez au moins 3 semaines à l\'avance le créneau de 16h30 pour voir le soleil traverser les vitraux multicolores.',
      '🍷 Tapas au Mercat del Ninot : Préférez le marché Ninot ou Santa Caterina à la Boqueria pour des tapas authentiques 40% moins chères.',
      '🚇 Métro T-Casual : Achetez la carte T-Casual (10 trajets pour ~12€) plutôt que des tickets unitaires à 2,55€.'
    ],
    specialPacking: ['Chaussures de marche respirantes', 'Sac à bandoulière anti-pickpockets', 'Adaptateur prise Type F'],
    curatedPois: [
      {
        name: 'Basilique de la Sagrada Família',
        category: 'Monuments',
        cost: 26,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
        address: 'Carrer de Mallorca, 401, 08013 Barcelona',
        notes: 'Chef-d\'œuvre absolu d\'Antoni Gaudí mêlant art nouveau et forêt de piliers organiques.'
      },
      {
        name: 'Parc Güell & Vue Panoramique',
        category: 'Nature',
        cost: 10,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600&auto=format&fit=crop&q=80',
        address: 'Gràcia, 08024 Barcelona',
        notes: 'Jardin féerique ponctué de mosaïques multicolores (trencadís) et panorama sur la mer.'
      },
      {
        name: 'Quartier Gothique (Barri Gòtic) & Cathédrale',
        category: 'Monuments',
        cost: 0,
        duration: 100,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&auto=format&fit=crop&q=80',
        address: 'Pla de la Seu, 08002 Barcelona',
        notes: 'Dédale de ruelles médiévales pleines de charme, places secrètes et artistes de rue.'
      },
      {
        name: 'Dégustation Tapas & Sangria à El Born',
        category: 'Restaurant',
        cost: 22,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop&q=80',
        address: 'Carrer de Montcada, 08003 Barcelona',
        notes: 'Jambon ibérique Bellota, pimientos de Padrón, patatas bravas et croquetas artisanales.'
      }
    ]
  },
  {
    canonicalName: 'Paris, France',
    aliases: ['paris', 'france', 'paname', 'louvre', 'eiffel', 'paris france'],
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lon: 2.3522,
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Paris)',
      emergencyNumbers: { police: '17 / 112', ambulance: '15 / 112' },
      plugType: 'Type E (230V / 50Hz)',
      language: 'Français',
      currency: 'EUR',
      bestMonths: 'Avril à Octobre'
    },
    insiderTips: [
      '🎟️ Musée du Louvre : Entrez par la porte des Lions ou le Carrousel pour éviter la foule sous la Pyramide.',
      '🚇 Métro : Utilisez le pass Navigo Easy pour recharger vos trajets sans tickets papier.',
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
      }
    ]
  },
  {
    canonicalName: 'Rome, Italie',
    aliases: ['rome', 'roma', 'italie rome', 'vatican', 'colisee', 'rome italie'],
    city: 'Rome',
    country: 'Italie',
    lat: 41.9028,
    lon: 12.4964,
    coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1 (Heure de Rome)',
      emergencyNumbers: { police: '112 / 113', ambulance: '112 / 118' },
      plugType: 'Type C, F & L (230V / 50Hz)',
      language: 'Italien',
      currency: 'EUR',
      bestMonths: 'Avril à Juin, Septembre à Novembre'
    },
    insiderTips: [
      '🏛️ Billet Combiné Colisée-Forum : Commencez tôt par le Forum Romain pour éviter la file interminable du Colisée.',
      '⛲ Fontaine de Trevi : Visitez-la à 7h du matin ou après 23h pour profiter du ruissellement magique dans un calme absolu.',
      '🍝 Trastevere : Dînez dans les trattorias typiques pour de vraies pâtes Cacio e Pepe ou Carbonara authentiques.'
    ],
    specialPacking: ['Chaussures fermées très confortables (pavés romains sampietrini)', 'Gourde réutilisable pour boire aux nasoni gratuits'],
    curatedPois: [
      {
        name: 'Colisée & Forum Romain',
        category: 'Monuments',
        cost: 18,
        duration: 180,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza del Colosseo, 1, 00184 Roma',
        notes: 'L’amphithéâtre le plus grand de l’Empire romain et berceau de l’Antiquité.'
      },
      {
        name: 'Panthéon de Rome & Piazza Navona',
        category: 'Monuments',
        cost: 5,
        duration: 75,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600&auto=format&fit=crop&q=80',
        address: 'Piazza della Rotonda, 00186 Roma',
        notes: 'Dôme antique prodigieux à oculus ouvert et fontaines baroques du Bernin.'
      },
      {
        name: 'Trattoria Romaine & Pâtes Artisanales',
        category: 'Restaurant',
        cost: 20,
        duration: 80,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop&q=80',
        address: 'Rione Trastevere, Roma',
        notes: 'Spaghetti alla Carbonara aux guanciale et pecorino romano, suivis d’un tiramisu minute.'
      }
    ]
  },
  {
    canonicalName: 'Madrid, Espagne',
    aliases: ['madrid', 'madri', 'espagne madrid', 'prado', 'retiro'],
    city: 'Madrid',
    country: 'Espagne',
    lat: 40.4168,
    lon: -3.7038,
    coverImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1',
      emergencyNumbers: { police: '112 / 091', ambulance: '112 / 061' },
      plugType: 'Type C & F',
      language: 'Espagnol',
      currency: 'EUR',
      bestMonths: 'Avril à Juin, Septembre à Novembre'
    },
    insiderTips: [
      '🖼️ Musée du Prado : Entrée gratuite du lundi au samedi de 18h à 20h.',
      '🛶 Parc du Retiro : Louez une barque sur le grand bassin et admirez le Palais de Cristal.',
      '🍫 Chocolaterie San Ginés : Goûtez les churros con chocolate artisanaux ouverts 24h/24.'
    ],
    specialPacking: ['Chaussures confortables', 'Lunettes de soleil', 'Adaptateur Type F'],
    curatedPois: [
      {
        name: 'Musée National du Prado',
        category: 'Monuments',
        cost: 15,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&auto=format&fit=crop&q=80',
        address: 'Calle de Ruiz de Alarcón, 23, Madrid',
        notes: 'Chefs-d’œuvre de Velázquez, Goya, El Greco et Bosch.'
      },
      {
        name: 'Palais Royal de Madrid & Cathédrale de l’Almudena',
        category: 'Monuments',
        cost: 14,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80',
        address: 'Calle de Bailén, Madrid',
        notes: 'Plus grand palais royal d’Europe occidentale entouré des jardins de Sabatini.'
      },
      {
        name: 'Marché de San Miguel & Tapas Royales',
        category: 'Restaurant',
        cost: 24,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Plaza de San Miguel, Madrid',
        notes: 'Marché gastronomique centenaire sous verrière d’époque en fer forgé.'
      }
    ]
  },
  {
    canonicalName: 'Istanbul, Turquie',
    aliases: ['istanbul', 'istambul', 'stamboul', 'turquie istanbul', 'bosphore', 'sainte sophie'],
    city: 'Istanbul',
    country: 'Turquie',
    lat: 41.0082,
    lon: 28.9784,
    coverImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+3 (Heure d\'Istanbul)',
      emergencyNumbers: { police: '155 / 112', ambulance: '112' },
      plugType: 'Type C & F (230V / 50Hz)',
      language: 'Turc & Anglais',
      currency: 'TRY / EUR',
      bestMonths: 'Avril à Juin, Septembre à Novembre'
    },
    insiderTips: [
      '🕌 Sainte-Sophie & Mosquée Bleue : Visitez entre les heures de prière avec une tenue couvrant les épaules et les genoux.',
      '🚢 Ferry Bosphore : Prenez le ferry public d’Eminönü vers Kadıköy (côté asiatique) pour 1€ avec thé turc sur le pont.',
      '🛍️ Grand Bazar : Négociez toujours avec le sourire autour d’un thé aux pommes offert par les marchands.'
    ],
    specialPacking: ['Foulard pour les visites de mosquées', 'Chaussures faciles à enlever', 'Adaptateur secteur'],
    curatedPois: [
      {
        name: 'Basilique Sainte-Sophie (Ayasofya)',
        category: 'Monuments',
        cost: 25,
        duration: 110,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&auto=format&fit=crop&q=80',
        address: 'Sultan Ahmet, Ayasofya Meydanı, Fatih/İstanbul',
        notes: 'Chef-d’œuvre byzantin millénaire aux coupoles monumentales et marbres dorés.'
      },
      {
        name: 'Palais de Topkapi & Harem Impérial',
        category: 'Monuments',
        cost: 30,
        duration: 150,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Cankurtaran, Fatih/İstanbul',
        notes: 'Résidence des sultans ottomans surplombant la Corne d’Or et la mer de Marmara.'
      },
      {
        name: 'Dîner Poissons & Mezzés au Pont de Galata',
        category: 'Restaurant',
        cost: 20,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
        address: 'Karaköy, Beyoğlu/İstanbul',
        notes: 'Sandwich de poisson balik ekmek, mezzés frais et vue magique sur les minarets illuminés.'
      }
    ]
  },

  // --- MONDE ---
  {
    canonicalName: 'Marrakech, Maroc',
    aliases: ['marrakech', 'marakech', 'marrakch', 'maroc marrakech', 'jemaa el fna', 'guéliz'],
    city: 'Marrakech',
    country: 'Maroc',
    lat: 31.6295,
    lon: -7.9811,
    coverImage: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC+1',
      emergencyNumbers: { police: '19 / 112', ambulance: '15' },
      plugType: 'Type C & E',
      language: 'Arabe & Français',
      currency: 'MAD',
      bestMonths: 'Mars à Mai, Octobre à Décembre'
    },
    insiderTips: [
      '🌿 Jardin Majorelle : Réservez votre créneau en ligne 48h à l\'avance, aucune vente sur place.',
      '🥁 Place Jemaa el-Fna : Venez à la tombée de la nuit pour le spectacle des charmeurs de serpents et conteurs.',
      '🛁 Hammam Traditionnel : Offrez-vous un gommage au savon noir et ghassoul dans un riad.'
    ],
    specialPacking: ['Crème solaire', 'Chapeau', 'Chèche léger', 'Chaussures fermées pour les souks'],
    curatedPois: [
      {
        name: 'Jardin Majorelle & Musée Yves Saint Laurent',
        category: 'Nature',
        cost: 15,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&auto=format&fit=crop&q=80',
        address: 'Rue Yves St Laurent, Marrakech',
        notes: 'Oasis bleu cobalt créée par Jacques Majorelle puis sauvée par Yves Saint Laurent.'
      },
      {
        name: 'Place Jemaa el-Fna & Souks de la Médina',
        category: 'Monuments',
        cost: 0,
        duration: 140,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        address: 'Médina de Marrakech',
        notes: 'Théâtre à ciel ouvert inscrit au patrimoine immatériel mondial de l’UNESCO.'
      },
      {
        name: 'Palais Bahia & Jardins Secrets',
        category: 'Monuments',
        cost: 7,
        duration: 90,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: 'Avenue Imam El Ghazali, Marrakech',
        notes: 'Chef-d’œuvre d’architecture marocaine aux plafonds en cèdre sculpté.'
      }
    ]
  },
  {
    canonicalName: 'Tokyo, Japon',
    aliases: ['tokyo', 'tokio', 'japon', 'shinjuku', 'shibuya', 'kyoto tokyo', 'japon tokyo'],
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
      bestMonths: 'Mars à Mai (Sakura), Octobre à Novembre'
    },
    insiderTips: [
      '🚇 Carte Suica / Pasmo : Indispensable pour payer les métros, trains et même boissons dans les distributeurs.',
      '🍣 Marché de Toyosu : Arrivez tôt pour déguster des sushis d’une fraîcheur inégalée.',
      '🗼 Shibuya Sky : Vue panoramique époustouflante sur le carrefour le plus fréquenté au monde.'
    ],
    specialPacking: ['Adaptateur secteur Type A', 'Pochettes plastiques pour déchets personnels', 'Chaussures faciles à retirer'],
    curatedPois: [
      {
        name: 'Temple Sensō-ji d’Asakusa',
        category: 'Monuments',
        cost: 0,
        duration: 120,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
        address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
        notes: 'Le plus ancien temple bouddhiste de Tokyo avec son immense lanterne rouge Kaminarimon.'
      },
      {
        name: 'Carrefour de Shibuya & Sanctuaire Meiji',
        category: 'Nature',
        cost: 0,
        duration: 110,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
        address: 'Shibuya & Yoyogi Park, Tokyo',
        notes: 'Contraste saisissant entre l’effervescence futuriste et la sérénité des cèdres centenaires.'
      },
      {
        name: 'Expérience Ramen & Gyozas Authentiques',
        category: 'Restaurant',
        cost: 12,
        duration: 60,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
        address: 'Shinjuku Omoide Yokocho, Tokyo',
        notes: 'Dégustation au comptoir d’un bouillon Tonkotsu fumant mijoté pendant 16 heures.'
      }
    ]
  },
  {
    canonicalName: 'New York, États-Unis',
    aliases: ['new york', 'newyork', 'nyc', 'manhattan', 'brooklyn', 'usa new york'],
    city: 'New York',
    country: 'États-Unis',
    lat: 40.7128,
    lon: -74.0060,
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=85',
    meta: {
      timezone: 'UTC-5 (Heure de New York)',
      emergencyNumbers: { police: '911', ambulance: '911' },
      plugType: 'Type A & B (120V / 60Hz)',
      language: 'Anglais',
      currency: 'USD',
      bestMonths: 'Avril à Juin, Septembre à Décembre'
    },
    insiderTips: [
      '🗽 Ferry de Staten Island : Entièrement gratuit, il passe au plus près de la Statue de la Liberté avec vue sur Manhattan.',
      '🌳 High Line & Central Park : Parcourez la promenade suspendue arborée construite sur d’anciennes voies ferrées.',
      '🍕 Dollar Slice Pizza : Goûtez les parts géantes de pizza au pepperoni dans le Village.'
    ],
    specialPacking: ['Adaptateur prise Type A/B', 'Chaussures de marche d’excellente qualité', 'Batterie externe'],
    curatedPois: [
      {
        name: 'Central Park & Belvédère Castle',
        category: 'Nature',
        cost: 0,
        duration: 150,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80',
        address: 'Central Park, Manhattan, New York',
        notes: 'Poumon vert mythique de 340 hectares niché entre les gratte-ciel.'
      },
      {
        name: 'Empire State Building & Observatoire Top of the Rock',
        category: 'Monuments',
        cost: 44,
        duration: 110,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: 'Rockefeller Plaza, New York',
        notes: 'Vue panoramique vertigineuse à 360° sur toute la skyline new-yorkaise.'
      },
      {
        name: 'Traversée du Pont de Brooklyn & DUMBO',
        category: 'Nature',
        cost: 0,
        duration: 90,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        address: 'Brooklyn Bridge, New York',
        notes: 'Promenade suspendue au-dessus de l’East River reliant Manhattan à Brooklyn.'
      }
    ]
  }
];

/**
 * Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Normalized string similarity score between 0 and 1
 */
function similarityScore(str1: string, str2: string): number {
  const s1 = (str1 || '').trim().toLowerCase();
  const s2 = (str2 || '').trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const maxLen = Math.max(s1.length, s2.length);
  const dist = levenshtein(s1, s2);
  return 1 - dist / maxLen;
}

/**
 * Capitalize city/place names properly (e.g. "nice" -> "Nice", "sidi bou said" -> "Sidi Bou Saïd")
 */
function formatProperName(text: string): string {
  if (!text) return '';
  return text
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Intelligent fuzzy matching for destination queries, tolerant to misspellings and abbreviations
 */
export async function resolveDestinationIntelligence(query: string): Promise<DestinationKnowledge> {
  const raw = (query || '').trim();
  const q = raw.toLowerCase().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Direct exact or token match in curated knowledge base
  for (const item of DESTINATIONS_DB) {
    const cityLow = item.city.toLowerCase();
    const canonLow = item.canonicalName.toLowerCase();

    // Exact match
    if (q === cityLow || q === canonLow) {
      return item;
    }

    // Exact alias match
    if (item.aliases.some(alias => alias.toLowerCase() === q)) {
      return item;
    }

    // Clean word boundary / inclusion match
    if (q.length >= 3) {
      if (item.aliases.some(alias => alias.toLowerCase().split(' ').includes(q) || q.split(' ').includes(alias.toLowerCase()))) {
        return item;
      }
    }
  }

  // 2. Fuzzy Levenshtein match with tolerance for misspellings (e.g. "tuns" -> "Tunis", "tozur" -> "Tozeur")
  let bestMatch: DestinationKnowledge | null = null;
  let highestScore = 0;

  for (const item of DESTINATIONS_DB) {
    const cityScore = similarityScore(q, item.city);
    if (cityScore > highestScore) {
      highestScore = cityScore;
      bestMatch = item;
    }

    for (const alias of item.aliases) {
      const aliasScore = similarityScore(q, alias);
      if (aliasScore > highestScore) {
        highestScore = aliasScore;
        bestMatch = item;
      }
    }
  }

  // If high confidence match (>= 68% similarity), return curated destination
  if (bestMatch && highestScore >= 0.68) {
    return bestMatch;
  }

  // 3. Online Geocoding with OpenStreetMap Nominatim (if online)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(raw)}&format=json&addressdetails=1&limit=1`,
      { headers: { 'Accept-Language': 'fr,en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const place = data[0];
      const city = place.address?.city || place.address?.town || place.address?.village || place.name || formatProperName(raw.split(',')[0]);
      const country = place.address?.country || 'International';
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const canonicalName = `${city}, ${country}`;

      return buildProceduralDestination(canonicalName, city, country, lat, lon);
    }
  } catch (err) {
    console.warn('[AI Planner] Nominatim search fallback to procedural engine:', err);
  }

  // 4. Fallback procedural destination with realistic coordinates based on region/country
  const parts = raw.split(',').map(p => p.trim());
  const cityGuess = formatProperName(parts[0]) || 'Destination Inoubliable';
  const countryGuess = parts.length > 1 ? formatProperName(parts[1]) : detectCountryFromQuery(raw);
  const approxCoords = getEstimatedCoordinates(countryGuess, cityGuess);

  const canonicalName = `${cityGuess}, ${countryGuess}`;
  return buildProceduralDestination(canonicalName, cityGuess, countryGuess, approxCoords.lat, approxCoords.lon);
}

function detectCountryFromQuery(text: string): string {
  const low = text.toLowerCase();
  if (low.includes('tunis') || low.includes('djerba') || low.includes('tozeur') || low.includes('sousse') || low.includes('hammamet')) return 'Tunisie';
  if (low.includes('franc') || low.includes('paris') || low.includes('nice') || low.includes('lyon')) return 'France';
  if (low.includes('espagn') || low.includes('spain') || low.includes('madrid') || low.includes('barcelon')) return 'Espagne';
  if (low.includes('itali') || low.includes('rome') || low.includes('milan') || low.includes('venis')) return 'Italie';
  if (low.includes('maroc') || low.includes('morocco') || low.includes('marrakech')) return 'Maroc';
  return 'International';
}

function getEstimatedCoordinates(country: string, city: string): { lat: number; lon: number } {
  // Region-based realistic fallback coordinates instead of arbitrary Barcelona
  const c = country.toLowerCase();
  if (c.includes('tunisie')) return { lat: 36.8065, lon: 10.1815 }; // Tunis region
  if (c.includes('france')) return { lat: 48.8566, lon: 2.3522 };   // France
  if (c.includes('italie')) return { lat: 41.9028, lon: 12.4964 };  // Italie
  if (c.includes('espagne')) return { lat: 40.4168, lon: -3.7038 }; // Espagne
  if (c.includes('maroc')) return { lat: 31.6295, lon: -7.9811 };   // Maroc
  if (c.includes('royaume') || c.includes('angleterre')) return { lat: 51.5074, lon: -0.1278 };
  return { lat: 48.8566, lon: 2.3522 };
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
      currency: country === 'Tunisie' ? 'TND' : 'EUR',
      bestMonths: 'Printemps & Automne'
    },
    insiderTips: [
      `🎟️ Réservations anticipées : Renseignez-vous auprès de l'office de tourisme de ${city} pour les billets coupe-file.`,
      `🍽️ Gastronomie locale : Éloignez-vous des artères principales pour goûter aux plats traditionnels authentiques.`,
      `🚇 Mobilité douce : Privilégiez les transports locaux ou les vélos en libre-service pour explorer les quartiers.`
    ],
    specialPacking: ['Chaussures confortables de marche', 'Gourde isotherme réutilisable', 'Adaptateur de voyage universel', 'Trousse de premiers secours'],
    curatedPois: [
      {
        name: `Centre Historique & Cœur Vivant de ${city}`,
        category: 'Monuments',
        cost: 10,
        duration: 120,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80',
        address: `Centre historique, ${city}`,
        notes: `Découverte architecturale et histoire vivante de ${city}.`
      },
      {
        name: `Saveurs Locales & Marché Gourmand de ${city}`,
        category: 'Restaurant',
        cost: 18,
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
        name: `Grand Musée d'Art & Patrimoine de ${city}`,
        category: 'Monuments',
        cost: 14,
        duration: 110,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80',
        address: `Quartier culturel, ${city}`,
        notes: `Exposition des chefs-d’œuvre artistiques et trésors de ${city}.`
      },
      {
        name: `Ruelles Commerçantes & Boutiques d’Artisans`,
        category: 'Shopping',
        cost: 15,
        duration: 80,
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
        address: `Zone piétonne commerçante, ${city}`,
        notes: `Créations locales et souvenirs authentiques.`
      },
      {
        name: `Dîner Convivial & Atmosphère Nocturne de ${city}`,
        category: 'Restaurant',
        cost: 25,
        duration: 100,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        address: `Place animée, ${city}`,
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

  if (theme.includes('Nature') || theme.includes('Randonnée') || theme.includes('Aventure')) {
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

// ─── Google Gemini API Integration ──────────────────────────────────────────
async function callGeminiApiForTrip(options: AiGeneratorOptions): Promise<any | null> {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
                 (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY)) ||
                 '';

  const prompt = `Tu es le moteur d'intelligence artificielle de Travel Tracker PWA.
Génère un programme de voyage complet et réaliste pour :
- Destination : ${options.destinationQuery}
- Durée : ${options.days} jours
- Rythme : ${options.pace} (Relaxed=2 act/j, Balanced=3 act/j, Intense=4 act/j)
- Thème : ${options.theme}
- Budget : ${options.budgetTier}
- Groupe : ${options.groupType}

Réponds STRICTEMENT avec un objet JSON sans markdown, respectant ce format exact :
{
  "summary": "Résumé de l'escapade",
  "insiderTips": ["Conseil local 1", "Conseil local 2", "Conseil local 3"],
  "meta": {
    "timezone": "UTC+1",
    "language": "Français & Arabe",
    "currency": "EUR",
    "bestMonths": "Avril à Octobre"
  },
  "packing": ["Passeport", "Adaptateur", "Chaussures de marche", "Crème solaire"],
  "activities": [
    {
      "day": 1,
      "order": 0,
      "name": "Nom du lieu",
      "category": "Monuments",
      "address": "Quartier, Ville",
      "startTime": "09:30",
      "endTime": "11:30",
      "duration": 120,
      "cost": 15,
      "rating": 4.8,
      "notes": "Description de l'activité"
    }
  ]
}`;

  try {
    // 1. Appel direct API Gemini si clé configurée
    if (apiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
          console.log('[Gemini API] Itinéraire généré avec succès par Google Gemini 1.5 Flash !');
          return parsed;
        }
      }
    }

    // 2. Appel du proxy backend Gemini si présent
    const backendRes = await fetch('/api/trips/gemini-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (backendRes.ok) {
      const bData = await backendRes.json();
      if (bData && bData.activities) {
        return bData;
      }
    }
  } catch (err) {
    console.warn('[Gemini API] Bascule automatique vers le moteur local haute fidélité:', err);
  }

  return null;
}

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

  // 1. Resolve destination intelligence with typo tolerance & canonical normalization
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
