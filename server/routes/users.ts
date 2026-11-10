import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'travel-tracker-super-secret-key-2026';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET all users : STRICTEMENT RÉSERVÉ À L'ADMIN
router.get('/', async (req: Request, res: Response) => {
  try {
    const requesterRole = req.headers['x-user-role'] as string;
    
    // Si l'utilisateur n'est pas Admin, interdire strictement l'accès à la liste des comptes
    if (requesterRole !== 'Admin') {
      return res.status(403).json({ error: 'Accès interdit : Seul l’administrateur peut consulter la liste des comptes utilisateurs.' });
    }

    const users = await UserModel.find().select('-password -resetPasswordCode -resetPasswordExpires').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET single user profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password -resetPasswordCode -resetPasswordExpires');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST register : Inscription
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, avatar, preferences } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Le nom est requis et doit contenir au moins 2 caractères.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Veuillez fournir une adresse email valide.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse email.' });
    }

    const user = new UserModel({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'Traveler', // Rôle de base systématique pour tout nouvel inscrit
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      authProvider: 'local',
      preferences: preferences || {
        currency: 'EUR',
        travelPace: 'Balanced',
        interests: ['Culture', 'Gastronomie'],
        theme: 'dark'
      }
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;
    delete (userResponse as any).resetPasswordCode;
    delete (userResponse as any).resetPasswordExpires;

    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Veuillez renseigner votre adresse email.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Veuillez saisir votre mot de passe.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse email.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez vérifier vos identifiants.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;
    delete (userResponse as any).resetPasswordCode;
    delete (userResponse as any).resetPasswordExpires;

    res.json({ user: userResponse, token });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST google : Connexion / Inscription rapide avec Google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, profile } = req.body;

    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    // 1. Si un ID Token (JWT) officiel Google est fourni
    if (credential && typeof credential === 'string') {
      try {
        // Tentative de vérification officielle via tokeninfo Google
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (googleRes.ok) {
          const gData = await googleRes.json();
          email = gData.email || '';
          name = gData.name || gData.given_name || email.split('@')[0];
          avatar = gData.picture || '';
          googleId = gData.sub || '';
        }
      } catch (verifyErr) {
        console.warn('[Google Auth] Notice tokeninfo :', verifyErr);
      }

      // Si tokeninfo a échoué (réseau local ou dev), parser le payload du JWT
      if (!email && credential.includes('.')) {
        try {
          const payloadBase64 = credential.split('.')[1];
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          email = decoded.email || '';
          name = decoded.name || decoded.given_name || (email ? email.split('@')[0] : '');
          avatar = decoded.picture || '';
          googleId = decoded.sub || '';
        } catch (jwtErr) {
          console.warn('[Google Auth] Erreur décodage JWT :', jwtErr);
        }
      }
    }

    // 2. Profil direct ou mode démo / simulation locale
    if (!email && profile && profile.email) {
      email = profile.email;
      name = profile.name || profile.email.split('@')[0];
      avatar = profile.avatar || '';
      googleId = profile.googleId || ('google-' + Date.now());
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Données Google invalides ou adresse e-mail manquante.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Recherche du compte utilisateur existant
    let user = await UserModel.findOne({
      $or: [
        { email: normalizedEmail },
        ...(googleId ? [{ googleId }] : [])
      ]
    });

    if (user) {
      // Mettre à jour l'ID Google et l'avatar si approprié
      let modified = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'google';
        modified = true;
      }
      if (avatar && (!user.avatar || user.avatar.includes('unsplash.com'))) {
        user.avatar = avatar;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      // Création automatique du compte voyageur associé à Google
      user = new UserModel({
        name: name.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'Traveler',
        authProvider: 'google',
        googleId: googleId || ('google-' + Date.now()),
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        preferences: {
          currency: 'EUR',
          travelPace: 'Balanced',
          interests: ['Culture', 'Gastronomie'],
          theme: 'dark'
        }
      });
      await user.save();
    }

    // 4. Génération du JWT de session Travel Tracker
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete (userResponse as any).password;
    delete (userResponse as any).resetPasswordCode;
    delete (userResponse as any).resetPasswordExpires;

    res.json({ user: userResponse, token });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Veuillez fournir une adresse email valide.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse email.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordCode = code;
    user.resetPasswordExpires = expires;
    await user.save();

    console.log(`[Auth] Code de réinitialisation généré pour ${user.email} : ${code}`);

    // Tentative d'envoi d'e-mail réel
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      code,
      userName: user.name
    });

    res.json({ 
      message: mailResult.sent
        ? 'Un e-mail de réinitialisation avec votre code OTP a été envoyé à votre adresse.'
        : 'Code de sécurité généré.', 
      sent: mailResult.sent,
      expiresInMinutes: 15 
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code.trim()) {
      return res.status(400).json({ error: 'Le code de confirmation est invalide.' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Le code de confirmation a expiré.' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Votre mot de passe a été réinitialisé avec succès !' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT update user (Role change strictly restricted to Admin)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { role, preferences, requesterRole, name, avatar, emergencyInfo } = req.body;
    const targetId = req.params.id;

    if (role && requesterRole !== 'Admin') {
      return res.status(403).json({ 
        error: 'Accès refusé : Seul l’Administrateur (Admin) a l’autorisation de modifier les rôles.' 
      });
    }

    const updates: Record<string, unknown> = {};
    if (role && requesterRole === 'Admin') updates.role = role;
    if (preferences) updates.preferences = preferences;
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (emergencyInfo) updates.emergencyInfo = emergencyInfo;

    const user = await UserModel.findByIdAndUpdate(targetId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE user : STRICTEMENT RÉSERVÉ À L'ADMIN
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const requesterRole = req.headers['x-user-role'] as string;
    if (requesterRole !== 'Admin') {
      return res.status(403).json({ error: 'Accès refusé : Seul l’administrateur peut supprimer un compte.' });
    }

    await UserModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Compte utilisateur supprimé avec succès de MongoDB.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
