<template>
  <nav class="navbar max-w-screen-lx mx-auto">
    <div class="navbar-start md:pl-2 lg:pl-8">
      <a href="/" class="btn btn-ghost text-xl font-bold text-primary">Resale Command</a>
    </div>
    <div class="navbar-center"></div>
    <div class="navbar-end md:pr-2 lg:pr-8">
      <!-- Nav Links -->
      <a v-for="link in navLinks" 
         :key="link.url"
         :href="link.url" 
         class="hidden md:inline-flex btn btn-lg btn-ghost hover:bg-base-200">
        {{ link.text }}
      </a>
      
      <!-- Auth Section -->
      <div v-if="loading" class="hidden md:inline-flex items-center gap-2">
         <button class="btn btn-ghost">
           <span class="loading loading-spinner loading-sm"></span>
         </button>
      </div>

      <div v-else class="hidden md:inline-flex items-center gap-2">
        <!-- Not Authenticated -->
        <a v-if="!isAuthenticated" href="/login" class="btn btn-ghost">Login</a>

        <!-- Authenticated -->
        <div v-else class="flex items-center gap-2">
           
           <!-- Team Selector -->
           <div class="dropdown dropdown-end mr-2">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2">
                 <span>{{ currentTeam ? currentTeam.name : 'Personal Inventory' }}</span>
                 <!-- Chevron Icon (using heroicons or similar simpler solution for now to avoid astro-icon complexity in Vue) -->
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                 </svg>
              </div>
              <ul tabindex="0" class="dropdown-content z-[50] menu p-2 shadow bg-base-100 rounded-box w-52">
                 <li><a @click="handleSwitchTeam(null)" :class="{ active: !currentTeam }">Personal Inventory</a></li>
                 <li v-for="team in teams" :key="team.$id">
                    <a @click="handleSwitchTeam(team)" :class="{ active: currentTeam && currentTeam.$id === team.$id }">{{ team.name }}</a>
                 </li>
                 <div class="divider my-0"></div>
                 <li v-if="!ownedTeam"><a @click="showCreateModal = true">+ Create Organization</a></li>
                 <li v-if="currentTeam && ownedTeam && currentTeam.$id === ownedTeam.$id">
                    <a @click="showInviteModal = true">+ Invite Member</a>
                 </li>
              </ul>
           </div>

           <!-- User Avatar -->
           <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost avatar placeholder cursor-pointer">
                <div class="bg-neutral text-neutral-content rounded-full w-10">
                  <span class="text-xs">{{ userInitial }}</span>
                </div>
              </div>
              <ul tabindex="0" class="mt-3 z-50 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li v-if="isPartner"><div class="badge badge-secondary w-full">Partner</div></li>
                <li><a @click="logout">Logout</a></li>
              </ul>
           </div>

        </div>
      </div>

      <!-- Mobile Menu Button -->
      <button @click="openMobile = !openMobile" class="btn btn-square btn-ghost md:hidden" aria-label="Menü öffnen">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" inline-block class="w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>

      <!-- Mobile Menu -->
      <div v-show="openMobile" class="fixed inset-0 bg-primary flex flex-col items-center justify-center space-y-6 z-50 transition-all">
          <button @click="openMobile = false" class="absolute top-6 right-6 text-4xl focus:outline-none">&times;</button>
          
          <a v-for="link in navLinks" :key="link.url" :href="link.url" class="text-2xl text-primary-content hover:text-accent" @click="openMobile = false">
             {{ link.text }}
          </a>

          <div v-if="!loading" class="flex flex-col items-center gap-4">
             <a v-if="!isAuthenticated" href="/login" class="text-2xl text-primary-content hover:text-accent" @click="openMobile = false">Login</a>
             <div v-else class="flex flex-col items-center gap-2">
                 <span class="text-lg font-bold text-primary-content">Hello, {{ user ? user.name : 'User' }}</span>
                 <span v-if="isPartner" class="badge badge-secondary">Partner</span>
                 <a @click="logout(); openMobile = false" class="text-2xl text-primary-content hover:text-accent cursor-pointer">Logout</a>
             </div>
          </div>
      </div>

    </div>

    <!-- Modals -->
    <!-- Create Team Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCreateModal }">
       <div class="modal-box">
          <h3 class="font-bold text-lg">Create New Organization</h3>
          <p class="py-2 text-sm">Create a shared workspace.</p>
          <div class="py-4">
             <input type="text" placeholder="Organization Name" class="input input-bordered w-full" v-model="newTeamName" @keydown.enter.prevent="handleCreateTeam" />
          </div>
          <div class="modal-action">
             <button class="btn" @click="showCreateModal = false">Cancel</button>
             <button class="btn btn-primary" @click="handleCreateTeam" :disabled="!newTeamName">Create</button>
          </div>
       </div>
    </dialog>

    <!-- Invite Member Modal -->
    <dialog class="modal" :class="{ 'modal-open': showInviteModal }">
       <div class="modal-box">
          <h3 class="font-bold text-lg">Invite New Member</h3>
          <p class="py-2 text-sm">Send an invitation email.</p>
          <div class="py-4">
             <input type="email" placeholder="Email Address" class="input input-bordered w-full" v-model="inviteEmail" @keydown.enter.prevent="handleInvite" />
          </div>
          <div class="modal-action">
             <button class="btn" @click="showInviteModal = false">Cancel</button>
             <button class="btn btn-primary" @click="handleInvite" :disabled="!inviteEmail">Send Invite</button>
          </div>
       </div>
    </dialog>

  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '../../composables/useAuth';

const { 
  user, isAuthenticated, currentTeam, teams, ownedTeam, isPartner, loading,
  switchTeam, createTeam, inviteMember, logout: authLogout 
} = useAuth();

// Dynamic Nav Links
const navLinks = computed(() => {
  const links = [
     // Scout is public
    { text: 'Scout', url: '/scout' }
  ];
  
  // Protected Routes
  if (isAuthenticated.value) {
    links.push(
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Inventory', url: '/inventory' },
      { text: 'Partners', url: '/partners' }
    );
  }
  return links;
});

const openMobile = ref(false);
const showCreateModal = ref(false);
const showInviteModal = ref(false);
const newTeamName = ref('');
const inviteEmail = ref('');

const userInitial = computed(() => {
   return user.value && user.value.name ? user.value.name.charAt(0).toUpperCase() : '?';
});

const logout = async () => {
    await authLogout();
};

const handleSwitchTeam = async (team: any) => {
    // Dropdown closes automatically or we force close? 
    // Usually daisyui dropdown closes on blur.
    await switchTeam(team);
};

const handleCreateTeam = async () => {
    if(!newTeamName.value) return;
    try {
        await createTeam(newTeamName.value);
        showCreateModal.value = false;
        newTeamName.value = '';
    } catch(e: any) {
        alert(e.message);
    }
};

const handleInvite = async () => {
    if(!inviteEmail.value || !currentTeam.value) return;
    try {
        await inviteMember(currentTeam.value.$id, inviteEmail.value);
        showInviteModal.value = false;
        inviteEmail.value = '';
        alert('Invitation sent!');
    } catch(e: any) {
        alert(e.message);
    }
};
</script>
