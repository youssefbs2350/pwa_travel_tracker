import { UserModel } from './models/User';
import { TripModel } from './models/Trip';
import { PlaceModel } from './models/Place';
import { ActivityModel } from './models/Activity';
import { ExpenseModel } from './models/Expense';
import { MemoryModel, ReviewModel } from './models/Memory';
import { ComplaintModel } from './models/Complaint';

export async function seedMongoDBIfEmpty() {
  const usersCount = await UserModel.countDocuments();
  if (usersCount > 0) {
    console.log('[MongoDB] Données déjà présentes en base.');
    return;
  }

  console.log('[MongoDB] Base vide détectée. Initialisation des données de démonstration avec mots de passe sécurisés...');

  // 1. Users with real default password 'password123'
  const user1 = new UserModel({
    name: 'Chaima',
    email: 'chaima@traveltracker.io',
    password: 'password123',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    preferences: { currency: 'EUR', travelPace: 'Balanced', interests: ['Culture', 'Gastronomie', 'Monuments'], theme: 'dark' }
  });
  await user1.save();

  const user2 = new UserModel({
    name: 'Youssef',
    email: 'youssef@traveltracker.io',
    password: 'password123',
    role: 'Organizer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    preferences: { currency: 'EUR', travelPace: 'Intense', interests: ['Aventure', 'Nature', 'Shopping'], theme: 'dark' }
  });
  await user2.save();

  const user3 = new UserModel({
    name: 'Ameni',
    email: 'ameni@traveltracker.io',
    password: 'password123',
    role: 'Traveler',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    preferences: { currency: 'TND', travelPace: 'Relaxed', interests: ['Plage', 'Gastronomie', 'Nature'], theme: 'dark' }
  });
  await user3.save();

  // 2. Trips
  const trip1 = await TripModel.create({
    userId: user2._id.toString(),
    title: 'Voyage Culturel & Gastronomique au Japon',
    destination: 'Tokyo & Kyoto',
    country: 'Japon',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200',
    budgetTotal: 3200,
    currency: 'EUR',
    status: 'En cours',
    participants: ['Youssef', 'Chaima', 'Hedi', 'Nour'],
    itinerarySummary: 'Itinéraire optimisé sur 10 jours couvrant les sanctuaires, Shibuya, et les temples de Kyoto.'
  });

  const trip2 = await TripModel.create({
    userId: user3._id.toString(),
    title: 'Échappée Soleil & Héritage à Djerba',
    destination: 'Djerba la Douce',
    country: 'Tunisie',
    startDate: '2026-12-05',
    endDate: '2026-12-11',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200',
    budgetTotal: 1800,
    currency: 'TND',
    status: 'Planifié',
    participants: ['Ameni', 'Nourhene', 'Amine'],
    itinerarySummary: 'Détente en bord de mer, Djerbahood et coucher de soleil sur la lagune.'
  });

  // 3. Places
  const p1 = await PlaceModel.create({
    tripId: trip1._id.toString(),
    name: 'Sanctuaire Meiji Jingu',
    category: 'Monuments',
    address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo',
    latitude: 35.6764,
    longitude: 139.6993,
    rating: 4.8,
    estimatedDurationMinutes: 120,
    costEstimate: 0,
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
    notes: 'Visite paisible au milieu de la forêt sacrée.'
  });

  const p2 = await PlaceModel.create({
    tripId: trip1._id.toString(),
    name: 'Carrefour de Shibuya & Hachiko',
    category: 'Shopping',
    address: 'Shibuya, Tokyo',
    latitude: 35.6595,
    longitude: 139.7005,
    rating: 4.7,
    estimatedDurationMinutes: 90,
    costEstimate: 25,
    imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600',
    notes: 'Le passage piéton illuminé emblématique.'
  });

  const p3 = await PlaceModel.create({
    tripId: trip1._id.toString(),
    name: 'Marché aux poissons de Tsukiji extérieur',
    category: 'Restaurant',
    address: '4 Chome Tsukiji, Chuo City, Tokyo',
    latitude: 35.6654,
    longitude: 139.7707,
    rating: 4.9,
    estimatedDurationMinutes: 110,
    costEstimate: 45,
    imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600',
    notes: 'Dégustation de sashimis ultra-frais.'
  });

  // 4. Activities
  await ActivityModel.create([
    {
      tripId: trip1._id.toString(),
      placeId: p1._id.toString(),
      dayNumber: 1,
      date: '2026-11-10',
      startTime: '09:00',
      endTime: '11:00',
      title: 'Immersion spirituelle au Sanctuaire Meiji',
      description: 'Balade méditative dans le parc.',
      cost: 0,
      status: 'Terminé',
      orderIndex: 0
    },
    {
      tripId: trip1._id.toString(),
      placeId: p2._id.toString(),
      dayNumber: 1,
      date: '2026-11-10',
      startTime: '11:45',
      endTime: '13:30',
      title: 'Exploration Shibuya Crossing & Déjeuner Ramen',
      description: 'Traversée du carrefour le plus fréquenté au monde.',
      cost: 25,
      status: 'Terminé',
      orderIndex: 1
    },
    {
      tripId: trip1._id.toString(),
      placeId: p3._id.toString(),
      dayNumber: 2,
      date: '2026-11-11',
      startTime: '08:30',
      endTime: '11:00',
      title: 'Visite gastronomique à Tsukiji',
      description: 'Dégustation de spécialités au marché.',
      cost: 45,
      status: 'En cours',
      orderIndex: 0
    }
  ]);

  // 5. Expenses
  await ExpenseModel.create([
    {
      tripId: trip1._id.toString(),
      title: 'Billet de train Shinkansen Tokyo-Kyoto',
      category: 'Transport',
      amount: 280,
      currency: 'EUR',
      date: '2026-11-09',
      paidBy: 'Youssef',
      splitWith: ['Youssef', 'Chaima', 'Hedi', 'Nour'],
      notes: 'Pass JR 7 jours.'
    },
    {
      tripId: trip1._id.toString(),
      title: 'Hôtel Ryokan Traditionnel Shinjuku',
      category: 'Hébergement',
      amount: 680,
      currency: 'EUR',
      date: '2026-11-10',
      paidBy: 'Chaima',
      splitWith: ['Youssef', 'Chaima', 'Hedi', 'Nour'],
      notes: 'Petit-déjeuner kaiseki inclus.'
    },
    {
      tripId: trip1._id.toString(),
      title: 'Dîner Gastronomique Sushi & Wagyu',
      category: 'Nourriture',
      amount: 190,
      currency: 'EUR',
      date: '2026-11-10',
      paidBy: 'Youssef',
      splitWith: ['Youssef', 'Chaima'],
      notes: 'Excellente table locale.'
    }
  ]);

  // 6. Memories & Reviews
  await MemoryModel.create([
    {
      tripId: trip1._id.toString(),
      placeId: p1._id.toString(),
      title: 'Le silence sacré sous les cèdres géants de Meiji',
      story: 'Le contraste entre l’agitation de Tokyo et la paix absolue de ce sanctuaire était saisissant.',
      date: '2026-11-10',
      photos: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'],
      mood: '✨ Magique',
      locationName: 'Tokyo, Shibuya'
    }
  ]);

  await ReviewModel.create([
    {
      tripId: trip1._id.toString(),
      placeId: p1._id.toString(),
      placeName: 'Sanctuaire Meiji Jingu',
      userId: user1._id.toString(),
      userName: 'Chaima',
      rating: 5,
      comment: 'Un lieu magique et reposant. Accessible très facilement.',
      tags: ['Sérénité', 'Culture'],
      date: '2026-11-10'
    }
  ]);

  // 7. Complaints
  await ComplaintModel.create([
    {
      tripId: trip1._id.toString(),
      userId: user2._id.toString(),
      userName: 'Youssef',
      title: 'Retard de 4 heures sur vol de correspondance Tokyo-Haneda',
      category: 'Transport / Vol',
      priority: 'Haute',
      status: 'En cours d\'analyse',
      description: 'Le vol initial a subi une avarie technique causant la perte de la première nuit d’hôtel.',
      requestedCompensation: '250 EUR + frais de transfert',
      awardedCompensation: 'Dossier transmis au service sinistre partenaire.',
      incidentDate: '2026-11-09'
    }
  ]);

  console.log('[MongoDB] Base initialisée avec succès avec tous les modules !');
}
