import { account, teams, ID, Query } from './appwrite';
import type { Models } from 'appwrite';

export interface AuthState {
  isAuthenticated: boolean;
  user: Models.User<Models.Preferences> | null;
  isPartner: boolean;
  loading: boolean;
}

export const auth = {
  async login(email: string, password: string) {
    try {
      await account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(email: string, password: string, name: string) {
    try {
      await account.create(ID.unique(), email, password, name);
      return await this.login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always cleanup local state if possible here, or let the caller handle it
    }
  },

  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await account.get();
    } catch (error) {
      // Not logged in
      return null;
    }
  },

  async isPartner(user: Models.User<Models.Preferences> | null): Promise<boolean> {
    if (!user) return false;
    // Check for "partner" label
    return user.labels.includes('partner');
  },

  async getTeams() {
      try {
          const response = await teams.list();
          return response.teams;
      } catch (error) {
          console.error("Error fetching teams:", error);
          return [];
      }
  },

  async getOwnedTeam(userId: string) {
      try {
          const allTeams = await this.getTeams();
          for (const team of allTeams) {
              try {
                  const response = await teams.listMemberships(team.$id);
                  const myMembership = response.memberships.find(m => m.userId === userId);
                  if (myMembership && myMembership.roles.includes('owner')) {
                      return team;
                  }
              } catch (e) {
                  // Ignore error for specific team check (e.g. if we left team concurrently?)
                  console.warn(`Failed to checking membership for team ${team.$id}`, e);
              }
          }
          return null;
      } catch (error) {
           console.error("Error getting owned team:", error);
           return null;
      }
  },

  async createTeam(name: string) {
      try {
          // Check if user already owns a team
          const user = await this.getCurrentUser();
          if (!user) throw new Error("User not logged in");
          
          const ownedTeam = await this.getOwnedTeam(user.$id);
          if (ownedTeam) {
              throw new Error(`You can only own one organization. You already own: ${ownedTeam.name}`);
          }

          return await teams.create(ID.unique(), name);
      } catch (error) {
          console.error("Error creating team:", error);
          throw error;
      }
  },

  async inviteMember(teamId: string, email: string) {
      try {
          // Construct absolute URL for the join page
          const url = `${window.location.origin}/join`;
          // 'member' is the default role. 
          // Appwrite params: teamId, roles, email, userId, phone, url, name
          return await teams.createMembership(teamId, ['member'], email, ID.unique(), undefined, url);
      } catch (error) {
          console.error("Error inviting member:", error);
          throw error;
      }
  },

  async acceptInvite(teamId: string, membershipId: string, userId: string, secret: string) {
      try {
          return await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
      } catch (error) {
          console.error("Error accepting invite:", error);
          throw error;
      }
  }
};
