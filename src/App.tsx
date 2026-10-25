import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider } from './context/TripContext';
import { OfflineProvider } from './context/OfflineContext';
import { initializeDatabase } from './db/database';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AuthScreen } from './components/auth/AuthScreen';

// Module views
import { OverviewView } from './components/overview/OverviewView';
import { UserProfileView } from './components/users/UserProfileView';
import { AdminUsersManagementView } from './components/users/AdminUsersManagementView';
import { TripsView } from './components/trips/TripsView';
import { PlacesView } from './components/places/PlacesView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { BudgetView } from './components/budget/BudgetView';
import { MemoriesView } from './components/memories/MemoriesView';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { TeamView } from './components/team/TeamView';

function AppContent() {
  const { currentUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true);
    });
  }, []);

  if (isAuthLoading || !isDbReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-brand-300">
          Chargement de l'application & initialisation des données...
        </p>
      </div>
    );
  }

  // IF NOT AUTHENTICATED: Display Login & Registration Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  const renderCurrentView = () => {
    // Role protection: Admin does not have access to 'memories' or 'profile'
    if (isAdmin && (currentTab === 'profile' || currentTab === 'memories')) {
      return <AdminUsersManagementView />;
    }

    switch (currentTab) {
      case 'overview':
        return <OverviewView onNavigateTab={setCurrentTab} />;
      case 'profile':
        return <UserProfileView />;
      case 'admin-users':
        return <AdminUsersManagementView />;
      case 'users':
        return isAdmin ? <AdminUsersManagementView /> : <UserProfileView />;
      case 'trips':
        return <TripsView />;
      case 'places':
        return <PlacesView />;
      case 'activities':
        return <ActivitiesView />;
      case 'budget':
        return <BudgetView />;
      case 'memories':
        return <MemoriesView />;
      case 'complaints':
        return <ComplaintsView />;
      case 'team':
        return <TeamView onNavigateTab={setCurrentTab} />;
      default:
        return <OverviewView onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Offline Status Warning Banner */}
      <OfflineBanner />

      {/* Top Navigation Bar */}
      <Navbar
        onOpenNewTripModal={() => setCurrentTab('trips')}
        onNavigateTab={setCurrentTab}
      />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {/* Dynamic Module Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <TripProvider>
          <AppContent />
        </TripProvider>
      </AuthProvider>
    </OfflineProvider>
  );
}
