<template>
  <div v-if="loading" class="flex justify-center py-12">
    <span class="loading loading-spinner loading-lg"></span>
  </div>

  <div v-else-if="!isAuthenticated" class="alert alert-warning">
    <span>Please login to view settings.</span>
  </div>

  <div v-else-if="!currentTeam" class="alert alert-info">
    <span>No organization selected. Please create or join an organization.</span>
  </div>

  <div v-else class="space-y-8">

    <!-- Org Overview -->
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h2 class="card-title text-2xl mb-4">{{ currentTeam.name }}</h2>
            
            <div class="stats shadow w-full">
                <div class="stat">
                    <div class="stat-title">Created</div>
                    <div class="stat-value text-lg">{{ new Date(currentTeam.$createdAt).toLocaleDateString() }}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">Members</div>
                    <div class="stat-value text-lg">{{ members.length }}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">My Role</div>
                    <div class="stat-value text-lg badge badge-primary mt-2">{{ isOwner ? 'Owner' : 'Member' }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Members Management (Owner Only) -->
    <div v-if="isOwner" class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-xl">Team Members</h3>
                <button @click="showInviteModal = true" class="btn btn-primary btn-sm gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Invite Member
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="member in members" :key="member.$id">
                            <td>{{ member.userName || '(Pending)' }}</td>
                            <td>{{ member.userEmail }}</td>
                            <td>
                                <span v-if="member.roles.includes('owner')" class="badge badge-primary badge-outline">Owner</span>
                                <span v-else class="badge badge-ghost">Member</span>
                            </td>
                            <td>{{ new Date(member.$createdAt).toLocaleDateString() }}</td>
                            <td>
                                <button v-if="!member.confirm" class="btn btn-ghost btn-xs text-primary" @click="handleResend(member)">Resend</button>
                                <button v-if="!member.roles.includes('owner')" class="btn btn-ghost btn-xs text-error" @click="confirmRemove(member)">Remove</button>
                            </td>
                        </tr>
                        <tr v-if="members.length === 0">
                            <td colspan="5" class="text-center opacity-50">No members found (Wait, that's impossible if you are here!)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div v-else class="alert">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Only organization owners can manage settings.</span>
    </div>

    <!-- API Security Settings (Owner Only) -->
    <div v-if="isOwner" class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h3 class="font-bold text-xl mb-2">API Security</h3>
            
            <div class="form-control w-full max-w-md">
                <label class="label">
                    <span class="label-text font-bold">Allowed API Domains</span>
                    <span class="label-text-alt">Limit 3</span>
                </label>
                
                <div class="flex gap-2">
                    <input type="url" v-model="newDomain" placeholder="https://example.com" class="input input-bordered w-full" @keydown.enter.prevent="addDomain" :disabled="orgSettings.allowedDomains && orgSettings.allowedDomains.length >= 3" />
                    <button class="btn btn-primary" @click="addDomain" :disabled="!newDomain || savingSettings || (orgSettings.allowedDomains && orgSettings.allowedDomains.length >= 3)">Add</button>
                </div>
            </div>

            <div class="flex flex-col gap-2 mt-4" v-if="orgSettings.allowedDomains && orgSettings.allowedDomains.length > 0">
                <div v-for="(dom, idx) in orgSettings.allowedDomains" :key="idx" class="flex justify-between items-center bg-base-200 p-2 rounded">
                    <span class="font-mono text-sm">{{ dom }}</span>
                    <button class="btn btn-xs btn-error btn-ghost" @click="removeDomain(idx)">Remove</button>
                </div>
            </div>
            <div v-else class="text-sm opacity-50 mt-4">
                No custom domains added. Your API key will accept requests from any origin.
            </div>
        </div>
    </div>

    <!-- Operations Settings (Owner Only) -->
    <div v-if="isOwner" class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h3 class="font-bold text-xl mb-2">Operations Settings</h3>
            
            <div class="form-control w-full max-w-md">
                <label class="label">
                    <span class="label-text font-bold">Standard Placed Locations</span>
                    <span class="label-text-alt">e.g., Bin A, Shelf 1</span>
                </label>
                
                <div class="flex gap-2">
                    <input type="text" v-model="newLocation" placeholder="Add a new location..." class="input input-bordered w-full" @keydown.enter.prevent="addLocation" />
                    <button class="btn btn-primary" @click="addLocation" :disabled="!newLocation || savingSettings">Add</button>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-4" v-if="orgSettings.placedLocations && orgSettings.placedLocations.length > 0">
                <div v-for="(loc, idx) in orgSettings.placedLocations" :key="idx" class="badge badge-secondary badge-lg gap-2 cursor-pointer hover:badge-error transition-colors" @click="removeLocation(idx)">
                    {{ loc }}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-4 h-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
            </div>
            <div v-else class="text-sm opacity-50 mt-4">
                No custom locations added yet.
            </div>
            <div class="mt-4 text-xs opacity-70">
                Click a location to remove it. Changes are saved automatically.
            </div>
        </div>
    </div>

    <!-- Invite Modal -->
    <dialog class="modal" :class="{ 'modal-open': showInviteModal }">
       <div class="modal-box">
          <h3 class="font-bold text-lg">Invite New Member</h3>
          <p class="py-2 text-sm">Send an invitation email.</p>
          <div class="py-4">
             <input type="email" placeholder="Email Address" class="input input-bordered w-full" v-model="inviteEmail" @keydown.enter.prevent="handleInvite" />
          </div>
          <div class="modal-action">
             <button class="btn" @click="showInviteModal = false">Cancel</button>
             <button class="btn btn-primary" @click="handleInvite" :disabled="!inviteEmail || inviting">
                 <span v-if="inviting" class="loading loading-spinner loading-xs"></span>
                 Send Invite
             </button>
          </div>
       </div>
    </dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { teams, ID, databases, Query } from '../../lib/appwrite';
import type { Models } from 'appwrite';

const { user, isAuthenticated, currentTeam, loading } = useAuth();

const members = ref<Models.Membership[]>([]);
const inviteEmail = ref('');
const showInviteModal = ref(false);
const inviting = ref(false);

const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const orgSettings = ref({ $id: null, tenantId: '', placedLocations: [], allowedDomains: [] });
const newLocation = ref('');
const newDomain = ref('');
const savingSettings = ref(false);

const isOwner = computed(() => {
    // We need to check if the CURRENT USER is an owner of the CURRENT TEAM
    // Since we don't have the user's role in the `currentTeam` object directly (it's accurate in `ownedTeam` but `currentTeam` might be one we are just a member of),
    // We should rely on the membership list we fetch, OR the derived state
    // Ideally, we fetch members and check our own ID.
    if (!user.value || !members.value.length) return false;
    const myMembership = members.value.find(m => m.userId === user.value?.$id);
    return myMembership?.roles.includes('owner') || false;
});

const fetchMembers = async () => {
    if (!currentTeam.value) return;
    try {
        const response = await teams.listMemberships(currentTeam.value.$id);
        members.value = response.memberships;
    } catch (e) {
        console.error("Failed to load members", e);
    }
};

const fetchOrgSettings = async () => {
    if (!currentTeam.value) return;
    try {
        const response = await databases.listDocuments(DB_ID, 'org_settings', [
            Query.equal('tenantId', currentTeam.value.$id)
        ]);
        if (response.documents.length > 0) {
            const doc = response.documents[0];
            orgSettings.value = {
                $id: doc.$id,
                tenantId: doc.tenantId,
                placedLocations: doc.placedLocations || [],
                allowedDomains: doc.allowedDomains || []
            };
        } else {
            orgSettings.value = { $id: null, tenantId: currentTeam.value.$id, placedLocations: [], allowedDomains: [] };
        }
    } catch (e) {
        console.error("Failed to fetch org settings:", e);
    }
};

const saveOrgSettings = async () => {
    if (!currentTeam.value) return;
    savingSettings.value = true;
    try {
        if (orgSettings.value.$id) {
            await databases.updateDocument(DB_ID, 'org_settings', orgSettings.value.$id, {
                placedLocations: orgSettings.value.placedLocations,
                allowedDomains: orgSettings.value.allowedDomains
            });
        } else {
            const doc = await databases.createDocument(DB_ID, 'org_settings', ID.unique(), {
                tenantId: currentTeam.value.$id,
                placedLocations: orgSettings.value.placedLocations,
                allowedDomains: orgSettings.value.allowedDomains
            });
            orgSettings.value.$id = doc.$id;
        }
    } catch (e) {
        console.error("Failed to save org settings:", e);
        alert("Failed to save settings. See console.");
    } finally {
        savingSettings.value = false;
    }
};

const addDomain = () => {
    let dom = newDomain.value.trim().toLowerCase();
    if (!dom) return;
    if (dom.endsWith('/')) dom = dom.slice(0, -1);
    
    if (!orgSettings.value.allowedDomains) orgSettings.value.allowedDomains = [];
    if (orgSettings.value.allowedDomains.length >= 3) {
        alert("Maximum 3 allowed domains permitter per organization.");
        return;
    }
    
    if (!orgSettings.value.allowedDomains.includes(dom)) {
        orgSettings.value.allowedDomains.push(dom);
        saveOrgSettings();
    }
    newDomain.value = '';
};

const removeDomain = (idx: number) => {
    if (orgSettings.value.allowedDomains) {
        orgSettings.value.allowedDomains.splice(idx, 1);
        saveOrgSettings();
    }
};

const addLocation = () => {
    const loc = newLocation.value.trim();
    if (!loc) return;
    if (!orgSettings.value.placedLocations) orgSettings.value.placedLocations = [];
    if (!orgSettings.value.placedLocations.includes(loc)) {
        orgSettings.value.placedLocations.push(loc);
        saveOrgSettings();
    }
    newLocation.value = '';
};

const removeLocation = (idx: number) => {
    if (orgSettings.value.placedLocations) {
        orgSettings.value.placedLocations.splice(idx, 1);
        saveOrgSettings();
    }
};

const handleInvite = async () => {
    if (!inviteEmail.value || !currentTeam.value) return;
    inviting.value = true;
    try {
        const url = `${window.location.origin}/join`;
        
        try {
            // First try: Create new user/membership with explicit ID (Standard for new users)
            await teams.createMembership(currentTeam.value.$id, ['member'], inviteEmail.value, ID.unique(), undefined, url);
        } catch (firstError: any) {
            console.log("First invite attempt failed, retrying with auto-ID...", firstError);
            // If that fails (e.g. user exists and ID mismatch, or ID doesn't exist 404),
            // Try again letting Appwrite handle the ID (lookup by email or auto-gen)
            // We pass 'undefined' for userId explicitly (or allow the overload if possible, but passing undefined is safer for the param slot)
            // Note: createMembership signature: (teamId, roles, email, userId, phone, url, name)
            // We pass undefined for userId.
            await teams.createMembership(currentTeam.value.$id, ['member'], inviteEmail.value, undefined, undefined, url);
        }

        inviteEmail.value = '';
        showInviteModal.value = false;
        alert('Invitation sent!');
        fetchMembers(); // Refresh list to show pending
    } catch (e: any) {
        if (e.message.includes('unique') || e.code === 409) {
            alert('This user is already a member or has a pending invitation.');
        } else {
            alert(`Failed to send invite: ${e.message}`);
        }
    } finally {
        inviting.value = false;
    }
};

const confirmRemove = async (member: Models.Membership) => {
    if (confirm(`Are you sure you want to remove ${member.userName || member.userEmail}?`)) {
        try {
            await teams.deleteMembership(currentTeam.value!.$id, member.$id);
            fetchMembers();
        } catch (e: any) {
             alert(e.message);
        }
    }
};

const handleResend = async (member: Models.Membership) => {
    if (confirm(`Resend invitation to ${member.userEmail}? This will generate a new invite link.`)) {
        try {
             // To resend, we delete the old membership (canceling old link) and create a new one
             try {
                 await teams.deleteMembership(currentTeam.value!.$id, member.$id);
             } catch (delErr: any) {
                 // Ignore 404 (already deleted) but throw others
                 if (delErr.code !== 404) throw delErr;
                 console.log("Member already removed, proceeding to re-invite");
             }
             
             const url = `${window.location.origin}/join`;
             
             // Small delay to ensure DB consistency after delete
             await new Promise(r => setTimeout(r, 500));

             try {
                console.log("Resending invite to:", member.userEmail); // DEBUG
                if (!member.userEmail) throw new Error("Email is missing from membership object");
                
                await teams.createMembership(currentTeam.value!.$id, ['member'], member.userEmail, ID.unique(), undefined, url);
             } catch (err: any) {
                console.warn("First resend attempt failed, trying fallback...", err);
                // Fallback for existing user
                await teams.createMembership(currentTeam.value!.$id, ['member'], member.userEmail, undefined, undefined, url);
             }

             alert('New invitation sent!');
             fetchMembers();
        } catch (e: any) {
             console.error("Resend flow error:", e);
             alert(`Failed to resend: ${e.message}`);
        }
    }
};

// React to team changes
watch(currentTeam, (newTeam) => {
    if (newTeam) {
        fetchMembers();
        fetchOrgSettings();
    }
}, { immediate: true });

</script>
