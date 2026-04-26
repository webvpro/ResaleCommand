<template>
  <div class="space-y-8">
    
    <!-- KEY METRICS (DaisyUI Stats) -->
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
      
      <div class="stat">
        <div class="stat-figure text-success">
          <Icon icon="solar:wallet-money-linear" class="w-8 h-8" />
        </div>
        <div class="stat-title">Total Profit</div>
        <div class="stat-value text-success">${{ globalProfit.toFixed(2) }}</div>
        <div class="stat-desc">From sold inventory</div>
      </div>
      
      <div class="stat">
        <div class="stat-figure text-info">
          <Icon icon="solar:chart-square-linear" class="w-8 h-8" />
        </div>
        <div class="stat-title">Est. Inventory Value</div>
        <div class="stat-value text-info">${{ globalProjectedRevenue.toFixed(2) }}</div>
        <div class="stat-desc">Unsold items in stock</div>
      </div>
      
      <div class="stat">
        <div class="stat-figure text-warning">
          <Icon icon="solar:box-linear" class="w-8 h-8" />
        </div>
        <div class="stat-value text-warning">{{ totalItems }}</div>
        <div class="stat-title">Items in Inventory</div>
        <div class="stat-desc text-warning">${{ globalSunkCost.toFixed(2) }} total sunk cost</div>
      </div>
      
    </div>

    <!-- AI BUSINESS INSIGHTS -->
    <div v-if="insights.length > 0" class="card bg-base-200 shadow-xl border border-warning/50">
      <div class="card-body p-5">
        <h3 class="card-title text-warning flex items-center gap-2 mb-2">
            <Icon icon="solar:lightbulb-bolt-bold-duotone" class="w-6 h-6" />
            AI Business Insights
        </h3>
        <p class="text-sm opacity-80 mb-4">I've analyzed your inventory. Here are some issues that might be affecting your metrics:</p>
        <ul class="space-y-3">
            <li v-for="(insight, idx) in insights" :key="idx" class="flex gap-3 text-sm bg-base-100 p-3 rounded-lg border-l-4" :class="insight.type === 'error' ? 'border-error' : 'border-warning'">
                <Icon :icon="insight.type === 'error' ? 'solar:danger-triangle-linear' : 'solar:info-circle-linear'" class="w-5 h-5 shrink-0" :class="insight.type === 'error' ? 'text-error' : 'text-warning'" />
                <div class="flex-1">
                    <strong>{{ insight.title }}</strong>
                    <p class="opacity-70 mb-2">{{ insight.description }}</p>
                    <a :href="`/inventory?insightFilter=${insight.filter}`" class="btn btn-xs btn-outline" :class="insight.type === 'error' ? 'btn-error' : 'btn-warning'">
                        Fix Now <Icon icon="solar:arrow-right-linear" class="w-4 h-4 ml-1" />
                    </a>
                </div>
            </li>
        </ul>
      </div>
    </div>



  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { databases, client } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Icon } from '@iconify/vue';

const CARTS_COL = import.meta.env.PUBLIC_APPWRITE_COLLECTION_CARTS;
import { isAlphaMode } from '../../stores/env';

const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID;
const getCollectionId = () => isAlphaMode.get() 
    ? (import.meta.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items') 
    : (import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items');

const items = ref<any[]>([]);

// --- Global Inventory Metrics ---
const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.quantity || 1), 0);
});

const parseValue = (item: any, key: string, noteKey: string) => {
    let val = 0;
    if (item[key]) {
        val = parseFloat(item[key]);
    } else if (item.conditionNotes) {
        const regex = new RegExp(`${noteKey}[:\\s]*\\$?([\\d.]+)`, 'i');
        const match = item.conditionNotes.match(regex);
        if (match) val = parseFloat(match[1]);
    }
    return isNaN(val) ? 0 : val;
};

const globalProfit = computed(() => {
    return items.value.filter(i => i.status === 'sold').reduce((sum, item) => {
        const qty = item.quantity || 1;
        const sold = parseValue(item, 'soldPrice', 'Sold') || parseValue(item, 'price', 'Sold') || 0;
        const cost = parseValue(item, 'cost', 'Paid') || parseValue(item, 'purchasePrice', 'Paid') || 0;
        return sum + ((sold - cost) * qty);
    }, 0);
});

const isActiveInventory = (i: any) => !['sold', 'tracked', 'scouted'].includes(i.status);

const globalProjectedRevenue = computed(() => {
    return items.value.filter(isActiveInventory).reduce((sum, item) => {
        const qty = item.quantity || 1;
        const est = parseValue(item, 'resalePrice', 'Resale') || parseValue(item, 'estValue', 'Est. Low') || parseValue(item, 'listPrice', 'Est') || 0;
        return sum + (est * qty);
    }, 0);
});

const globalSunkCost = computed(() => {
    return items.value.filter(isActiveInventory).reduce((sum, item) => {
        const qty = item.quantity || 1;
        const cost = parseValue(item, 'cost', 'Paid') || parseValue(item, 'purchasePrice', 'Paid') || 0;
        return sum + (cost * qty);
    }, 0);
});

// --- AI Insights Generator ---
const insights = computed(() => {
    const alerts = [];
    
    // 1. Sold items missing a sale price (Causes negative profit)
    const soldNoPrice = items.value.filter(i => i.status === 'sold' && !(parseValue(i, 'soldPrice', 'Sold') || parseValue(i, 'price', 'Sold')));
    if (soldNoPrice.length > 0) {
        alerts.push({
            type: 'error',
            filter: 'missing_sold_price',
            title: `${soldNoPrice.length} Sold Items Missing Sale Price`,
            description: `You have items marked as 'Sold' but didn't enter how much they sold for. This is dragging your Total Profit down into the negatives because we only see the cost!`
        });
    }

    // 2. Active inventory missing an estimated value (Causes low projected revenue)
    const activeNoEst = items.value.filter(i => isActiveInventory(i) && !(parseValue(i, 'resalePrice', 'Resale') || parseValue(i, 'estValue', 'Est. Low') || parseValue(i, 'listPrice', 'Est')));
    if (activeNoEst.length > 0) {
        alerts.push({
            type: 'warning',
            filter: 'missing_est_value',
            title: `${activeNoEst.length} Items Missing Estimated Value`,
            description: `Some of your active inventory doesn't have an Estimated Value or List Price. Updating these will give you a much more accurate Projected Revenue.`
        });
    }

    // 3. Active inventory missing a cost basis
    const activeNoCost = items.value.filter(i => isActiveInventory(i) && !(parseValue(i, 'cost', 'Paid') || parseValue(i, 'purchasePrice', 'Paid')));
    if (activeNoCost.length > 0) {
        alerts.push({
            type: 'warning',
            filter: 'missing_cost',
            title: `${activeNoCost.length} Items Missing Cost Basis`,
            description: `You have items in stock with $0 cost. If you got them for free, great! If not, logging the cost will help calculate accurate ROI later.`
        });
    }

    // 4. Missing Descriptions (Critical for selling)
    const activeNoDesc = items.value.filter(i => isActiveInventory(i) && (!i.marketDescription || i.marketDescription.length < 10));
    if (activeNoDesc.length > 0) {
        alerts.push({
            type: 'warning',
            filter: 'missing_description',
            title: `${activeNoDesc.length} Items Missing Descriptions`,
            description: `You can't sell without a good pitch! These items are missing a description. We should use AI to bulk-generate them.`
        });
    }

    // 5. Missing Photos
    const activeNoPhotos = items.value.filter(i => {
        if (!isActiveInventory(i)) return false;
        if (i.imageId || (i.galleryImageIds && i.galleryImageIds.length > 0)) return false;
        if (i.conditionNotes && (i.conditionNotes.includes('[MAIN IMAGE ID:') || i.conditionNotes.includes('[IMAGE_ID:'))) return false;
        return true;
    });
    if (activeNoPhotos.length > 0) {
        alerts.push({
            type: 'error',
            filter: 'missing_photos',
            title: `${activeNoPhotos.length} Items Missing Photos`,
            description: `An item without photos is invisible. Get snapping or grab some stock images for these items!`
        });
    }

    return alerts;
});

const fetchItems = async () => {
    try {
        const response = await databases.listDocuments(DB_ID, getCollectionId(), [
            Query.limit(5000)
        ]);
        items.value = response.documents;
    } catch (e) {
        console.error("Error fetching items", e);
    }
};

onMounted(() => {
    fetchItems();
});
</script>
