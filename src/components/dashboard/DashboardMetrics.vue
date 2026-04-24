<template>
  <div class="space-y-8">
    
    <!-- KEY METRICS (DaisyUI Stats) -->
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
      
      <div class="stat">
        <div class="stat-figure text-primary">
          <Icon icon="solar:wallet-money-linear" class="w-8 h-8" />
        </div>
        <div class="stat-title">Total Profit</div>
        <div class="stat-value text-primary">\${{ totalProfit.toFixed(2) }}</div>
        <div class="stat-desc">From {{ completedCarts.length }} completed trips</div>
      </div>
      
      <div class="stat">
        <div class="stat-figure text-secondary">
          <Icon icon="solar:chart-square-linear" class="w-8 h-8" />
        </div>
        <div class="stat-title">Projected Revenue</div>
        <div class="stat-value text-secondary">\${{ totalRevenue.toFixed(2) }}</div>
        <div class="stat-desc">Based on Gemini Estimates</div>
      </div>
      
      <div class="stat">
        <div class="stat-figure text-secondary">
          <div class="avatar online">
            <div class="w-16 rounded-full">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            </div>
          </div>
        </div>
        <div class="stat-value">{{ totalItems }}</div>
        <div class="stat-title">Items Scouted</div>
        <div class="stat-desc text-secondary">{{ activeCarts.length }} active trips now</div>
      </div>
      
    </div>

    <!-- LIVE ACTIVE CARTS -->
    <div v-if="activeCarts.length > 0">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <span class="loading loading-ring loading-md text-success"></span>
            Live Trips
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="cart in activeCarts" :key="cart.$id" class="card bg-base-100 shadow-xl border-l-4 border-success">
                <div class="card-body p-4">
                    <h2 class="card-title text-sm">{{ cart.source }}</h2>
                    <p class="text-xs opacity-60">Started {{ new Date(cart.createdAt).toLocaleTimeString() }}</p>
                    <div class="card-actions justify-end">
                        <a href="/scout" class="btn btn-xs btn-outline">Join</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- RECENT TRIPS TABLE -->
    <div class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <!-- head -->
        <thead>
          <tr>
            <th>Date</th>
            <th>Source</th>
            <th>Items</th>
            <th>Cost</th>
            <th>Est. Revenue</th>
            <th>Profit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cart in completedCarts" :key="cart.$id">
            <th>{{ new Date(cart.processedAt || cart.updatedAt).toLocaleDateString() }}</th>
            <td>{{ cart.source }}</td>
            <td>{{ cart.itemCount || 0 }}</td>
            <td class="text-error font-mono">-\${{ (cart.totalCost || 0).toFixed(2) }}</td>
            <td class="text-info font-mono">\${{ (cart.projectedRevenue || 0).toFixed(2) }}</td>
            <td class="font-black font-mono" :class="cart.potentialProfit >= 0 ? 'text-success' : 'text-error'">
                {{ cart.potentialProfit >= 0 ? '+' : '' }}\${{ (cart.potentialProfit || 0).toFixed(2) }}
            </td>
            <td>
                <div class="badge badge-success badge-outline">Completed</div>
            </td>
          </tr>
          <tr v-if="completedCarts.length === 0">
            <td colspan="7" class="text-center py-8 opacity-50">No completed trips yet. go Scout!</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { databases, client } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Icon } from '@iconify/vue';

const CARTS_COL = import.meta.env.PUBLIC_APPWRITE_COLLECTION_CARTS;
const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID;

const carts = ref<any[]>([]);

const activeCarts = computed(() => carts.value.filter(c => c.status === 'active'));
const completedCarts = computed(() => carts.value.filter(c => c.status === 'completed').sort((a,b) => new Date(b.processedAt || b.updatedAt).getTime() - new Date(a.processedAt || a.updatedAt).getTime()));

const totalProfit = computed(() => completedCarts.value.reduce((sum, c) => sum + (c.potentialProfit || 0), 0));
const totalRevenue = computed(() => completedCarts.value.reduce((sum, c) => sum + (c.projectedRevenue || 0), 0));
const totalItems = computed(() => completedCarts.value.reduce((sum, c) => sum + (c.itemCount || 0), 0));

const fetchCarts = async () => {
    try {
        const response = await databases.listDocuments(DB_ID, CARTS_COL, [
            Query.orderDesc('$updatedAt'),
            Query.limit(50)
        ]);
        carts.value = response.documents;
    } catch (e) {
        console.error("Error fetching carts", e);
    }
};

onMounted(() => {
    fetchCarts();

    // Subscribe to ALL cart updates for realtime dashboard
    client.subscribe(`databases.${DB_ID}.collections.${CARTS_COL}.documents`, (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            carts.value.unshift(response.payload);
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            const index = carts.value.findIndex(c => c.$id === response.payload.$id);
            if (index !== -1) {
                carts.value[index] = response.payload;
            } else {
                carts.value.unshift(response.payload); // Add if not found (unexpected)
            }
        }
    });

    // Also subscribe to Expenses creation to animate charts? (Maybe later)
});
</script>
