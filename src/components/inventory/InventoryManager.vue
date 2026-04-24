<template>
    <div class="space-y-12">
        <!-- SHOPPING CART SECTION -->
        <div v-if="cartItems.length > 0" class="space-y-8">
            <h2 class="text-2xl font-bold flex items-center gap-2"><Icon icon="solar:object-scan-linear" class="w-8 h-8 text-primary" /> Active Sourcing Run <span class="badge badge-primary">{{ cartItems.length }}</span></h2>

            <div v-for="(groupItems, location) in cartGroups" :key="location" class="bg-base-200 p-6 rounded-2xl border-2 border-base-300 relative">
                <div class="absolute -top-3 left-6 px-2 bg-base-200 text-sm font-bold opacity-70 border border-base-300 rounded">
                    <Icon icon="solar:map-point-linear" class="w-4 h-4 inline" /> {{ location }} ({{ groupItems.length }})
                </div>
            
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 pt-2">
                    <div v-for="item in groupItems" :key="item.$id" class="card bg-base-100 shadow-sm border-2 border-primary/20 hover:border-primary transition-colors">
                        <div class="card-body p-4">
                            <div class="flex gap-4 cursor-pointer hover:opacity-80 transition-opacity" @click="openEdit(item)">
                                <div class="w-16 h-16 bg-base-300 rounded-lg shrink-0 overflow-hidden relative">
                                    <img v-if="getImageUrl(item)" :src="getImageUrl(item)" class="w-full h-full object-cover" />
                                    <div v-else class="flex items-center justify-center w-full h-full opacity-30"><Icon icon="solar:box-linear" class="w-8 h-8" /></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold truncate group-hover:text-primary transition-colors">{{ item.title }}</h3>
                                    <div class="text-xs opacity-70 mt-1">
                                        Max Buy: <span class="font-bold text-success">${{ item.maxBuyPrice }}</span>
                                    </div>
                                    <div v-if="item.storageLocation" class="badge badge-xs badge-outline mt-1">{{ item.storageLocation }}</div>
                                </div>
                            </div>
                            <div class="card-actions justify-end mt-2">
                                <button class="btn btn-sm btn-ghost text-error" @click="confirmDelete(item.$id)" :disabled="processingId === item.$id">✕</button>
                                <button class="btn btn-sm btn-primary" @click="openCheckout(item)">
                                    Purchase <Icon icon="solar:dollar-linear" class="w-4 h-4 ml-1 inline" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MAIN INVENTORY SECTION -->
        <div class="drawer lg:drawer-open">
            <input id="inventory-sidebar" type="checkbox" class="drawer-toggle" />
            
            <div class="drawer-content flex flex-col pb-8 lg:pl-6 pt-1">
                <!-- Mobile Toggle & Header -->
                <div class="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-200 py-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in relative z-20 pointer-events-auto">
                        <div class="flex flex-col">
                            <h1 class="text-3xl font-bold text-base-content tracking-tight">Inventory</h1>
                            <p v-if="insightFilter" class="text-sm text-warning flex items-center gap-1 mt-1">
                                <Icon icon="solar:lightbulb-bolt-bold-duotone" />
                                AI Filter Active: Fix {{ insightFilter.replace(/_/g, ' ') }}
                                <button class="btn btn-xs btn-ghost text-error ml-2" @click="insightFilter = ''; filterStatus = 'all'">Clear Filter</button>
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <label for="inventory-sidebar" class="btn btn-square btn-ghost lg:hidden shadow-sm border border-base-200 bg-base-100">
                                <Icon icon="solar:hamburger-menu-linear" class="w-5 h-5" />
                            </label>
                            <h2 class="text-2xl font-bold hidden sm:block">In Inventory</h2>
                        </div>
                        <div class="flex flex-wrap gap-2 items-center">
                            <button class="btn btn-sm btn-primary gap-2" @click="openAdd">
                                <Icon icon="solar:add-circle-linear" class="w-4 h-4" /> Add New
                            </button>
                            <button class="btn btn-sm btn-outline gap-2" @click="showImport = true">
                                <Icon icon="solar:import-linear" class="w-4 h-4" /> Import CSV
                            </button>
                            <button class="btn btn-sm btn-accent gap-2" @click="showReconciliation = true">
                                <Icon icon="solar:refresh-circle-linear" class="w-4 h-4" /> Booth Sync
                            </button>
                            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                        </div>
                    </div>

                    <!-- BULK ACTIONS ACCORDION (Sticky with header) -->
                    <div class="collapse collapse-arrow bg-base-200 border border-base-300 mt-2 transition-all shadow-sm" :class="{'bg-primary/10 border-primary shadow-md': selectedItems.length > 0}">
                        <input type="checkbox" v-model="bulkOpen" /> 
                        <div class="collapse-title min-h-0 p-3 flex items-center gap-3">
                            <input type="checkbox" :checked="isAllSelected" @change="toggleAll" @click.stop class="checkbox checkbox-sm checkbox-primary z-20 relative cursor-pointer" />
                            <span class="font-bold text-sm select-none">
                                Select All in View 
                                <span v-if="selectedItems.length > 0" class="text-primary ml-2 animate-fade-in">({{ selectedItems.length }} selected)</span>
                            </span>
                        </div>
                        <div class="collapse-content pb-3">
                            <div class="flex flex-col gap-3 w-full pt-3 border-t border-base-300/50">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                    <div class="join w-full">
                                        <select v-model="bulkStatusTarget" class="select select-sm select-bordered join-item bg-base-100 text-base-content flex-1">
                                            <option value="" disabled selected>Change Status...</option>
                                            <option value="acquired">Acquired</option>
                                            <option value="placed">Placed</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                        <button class="btn btn-sm btn-primary join-item shrink-0" @click="applyBulkStatus" :disabled="!bulkStatusTarget || processingBulk">
                                            <span v-if="processingBulk" class="loading loading-spinner loading-xs"></span>
                                            Apply
                                        </button>
                                    </div>
                                    <div class="join w-full" v-if="orgPlacedLocations && orgPlacedLocations.length > 0">
                                        <select v-model="bulkLocationTarget" class="select select-sm select-bordered join-item bg-base-100 text-base-content flex-1">
                                            <option value="" disabled selected>Change Location...</option>
                                            <option v-for="loc in orgPlacedLocations" :key="loc" :value="loc">{{ loc }}</option>
                                        </select>
                                        <button class="btn btn-sm btn-secondary join-item shrink-0" @click="applyBulkLocation" :disabled="!bulkLocationTarget || processingBulkLoc">
                                            <span v-if="processingBulkLoc" class="loading loading-spinner loading-xs"></span>
                                            Apply
                                        </button>
                                    </div>
                                </div>
                                <div class="flex justify-end w-full">
                                    <button class="btn btn-sm btn-ghost text-error" @click="selectedItems = []" v-if="selectedItems.length > 0">Clear Selection</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- DEBUG / ERROR ALERT -->
            <div v-if="error" class="alert alert-error mb-4">
                <span>Error: {{ error }}</span>
                <button class="btn btn-xs" @click="fetchInventory('')">Retry</button>
            </div>
            
            <div v-if="filteredInventory.length === 0 && !loading && !error" class="text-center py-12 bg-base-200 rounded-xl border-dashed border-2 border-base-300">
                <p class="text-lg opacity-60 mb-4">No items in inventory.</p>
            </div>
            
            <div v-else>




                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ItemCard 
                        v-for="item in filteredInventory" 
                        :key="item.$id" 
                        :item="item"
                        :compact="true"
                        @click-card="openPreview(item)"
                        :class="{'ring-2 ring-primary': selectedItems.includes(item.$id)}">
                        
                        <template #absolute-top-left>
                            <div class="z-20">
                                <input type="checkbox" :value="item.$id" v-model="selectedItems" class="checkbox checkbox-sm checkbox-primary shadow-sm cursor-pointer border-none bg-white/50 ring-1 ring-white/30" @click.stop />
                            </div>
                        </template>

                        <template #actions>
                            <div class="join w-full mt-1 pt-1 border-t border-base-200/50 z-10" @click.stop>
                                <button @click="copyShareLink(item.$id)" class="btn btn-ghost btn-xs join-item flex-1 opacity-70 hover:opacity-100"><Icon icon="solar:link-linear" class="w-4 h-4 inline" /> Share</button>
                                <button @click="openEdit(item)" class="btn btn-ghost btn-xs join-item flex-1 opacity-70 hover:opacity-100"><Icon icon="solar:pen-linear" class="w-4 h-4 inline" /> Edit</button>
                                <button @click="confirmDelete(item.$id)" class="btn btn-ghost btn-xs join-item flex-1 text-error opacity-80 hover:opacity-100 hover:bg-error/10" :disabled="processingId === item.$id">
                                    <span v-if="processingId === item.$id" class="loading loading-spinner loading-xs"></span>
                                    <span v-else><Icon icon="solar:trash-bin-trash-linear" class="w-4 h-4 inline" /> Delete</span>
                                </button>
                            </div>
                        </template>
                    </ItemCard>
            </div> <!-- End grid -->
            </div> <!-- End v-else -->

            <!-- ALL ITEMS LOADED (Pagination Removed) -->
            </div> <!-- End drawer-content -->

            <!-- Sidebar Filters -->
            <div class="drawer-side z-50 lg:z-auto">
                <label for="inventory-sidebar" aria-label="close sidebar" class="drawer-overlay"></label> 
                <div class="p-4 w-72 min-h-full bg-base-100 lg:bg-transparent border-r lg:border-transparent border-base-200 text-base-content flex flex-col gap-6 lg:p-0">
                    <div class="flex lg:hidden justify-between items-center pb-2 border-b border-base-200">
                        <span class="font-bold text-lg">Filters</span>
                        <label for="inventory-sidebar" class="btn btn-sm btn-circle btn-ghost">✕</label>
                    </div>

                    <div class="bg-base-200/50 rounded-xl p-4 border border-base-200 flex flex-col gap-4 shadow-sm">
                        <h3 class="font-bold border-b border-base-300 pb-2 hidden lg:block">Filters & Search</h3>

                        <div class="form-control w-full">
                            <label class="label pt-0"><span class="label-text font-bold text-[10px] uppercase opacity-70">Search</span></label>
                            <input type="text" v-model="searchQuery" placeholder="Search title, ID, bin..." class="input input-bordered input-sm w-full font-mono text-xs shadow-inner" />
                        </div>

                        <div class="form-control w-full">
                            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-70">Status</span></label>
                            <select v-model="filterStatus" class="select select-bordered select-sm w-full text-xs shadow-sm bg-base-100">
                                <option value="all">All Items</option>
                                <option value="acquired">Acquired</option>
                                <option value="placed">Placed</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>

                        <div class="form-control w-full">
                            <label class="label pt-0 -mb-2"><span class="label-text font-bold text-[10px] uppercase opacity-70">Keywords</span></label>
                            <TagInput 
                                v-model="filterKeywords" 
                                type="keyword" 
                                placeholder="Any..." 
                                badgeClass="badge-secondary" 
                            />
                            <div class="form-control w-full mt-2" v-if="orgPlacedLocations && orgPlacedLocations.length > 0">
                            <label class="label pt-0 -mb-2"><span class="label-text font-bold text-[10px] uppercase opacity-70">Location</span></label>
                            <select v-model="filterBinLocation" class="select select-bordered select-sm w-full text-xs shadow-sm bg-base-100 mt-2">
                                <option value="">All Locations</option>
                                <option v-for="loc in orgPlacedLocations" :key="loc" :value="loc">{{ loc }}</option>
                            </select>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ----------------------------------------------------------- -->
        <!-- CHECKOUT MODAL -->
        <!-- ----------------------------------------------------------- -->
        <dialog ref="checkoutModal" class="modal">
            <div class="modal-box">
                <div v-if="!checkoutSuccess">
                    <h3 class="font-bold text-lg mb-4">Confirm Purchase</h3>
                    <p>Purchasing: <span class="font-bold">{{ activeItem?.title }}</span></p>
                    
                    <div class="form-control w-full mt-4">
                        <label class="label"><span class="label-text">Verify Price Paid</span></label>
                        <input type="number" step="0.01" v-model="checkoutPrice" class="input input-bordered" placeholder="0.00" />
                    </div>

                    <div class="divider">Receipt</div>
                    <div class="flex flex-col gap-2">
                        <button v-if="!isCameraOpen" @click="startCamera('checkout')" class="btn btn-outline gap-2"><Icon icon="solar:camera-linear" class="w-5 h-5 inline" /> Take Receipt Photo</button>
                        
                        <!-- Camera View -->
                        <div v-if="isCameraOpen" class="relative rounded-lg overflow-hidden bg-black">
                             <video ref="cameraVideo" class="w-full h-48 object-cover" autoplay playsinline></video>
                             <button @click="capturePhoto('checkout')" class="btn btn-circle absolute bottom-2 left-1/2 -translate-x-1/2 btn-success border-2 border-white"><Icon icon="solar:camera-linear" class="w-5 h-5" /></button>
                             <button @click="stopCamera" class="btn btn-circle btn-ghost btn-sm text-white absolute top-2 right-2">✕</button>
                        </div>

                        <input v-else type="file" @change="handleFileSelect($event, 'receipt')" accept="image/*" class="file-input file-input-bordered w-full" />
                        
                        <div v-if="checkoutReceiptPreview" class="w-full h-32 bg-base-200 rounded-lg mt-2 overflow-hidden relative group">
                            <img :src="checkoutReceiptPreview" class="w-full h-full object-cover">
                            <button @click="clearCheckoutReceipt" class="absolute top-1 right-1 btn btn-xs btn-circle btn-error">✕</button>
                        </div>
                    </div>

                    <div class="modal-action">
                        <form method="dialog"><button class="btn btn-ghost" @click="closeCheckout">Cancel</button></form>
                        <button class="btn btn-primary" @click="submitCheckout" :disabled="processing">
                            <span v-if="processing" class="loading loading-spinner"></span>
                            Confirm Purchase
                        </button>
                    </div>
                </div>

                <div v-else class="text-center py-6">
                    <h3 class="font-bold text-lg text-success mb-4 flex justify-center items-center"><Icon icon="solar:check-circle-linear" class="w-6 h-6 mr-2 inline" /> Purchase Confirmed!</h3>
                    <p class="text-xs opacity-70 mb-4">Item moved to "Acquired".</p>
                    <div class="divider">AI Description</div>
                    <div class="p-4 bg-base-200 rounded-lg text-sm text-center">
                        <p>{{ generatedDescription }}</p>
                    </div>
                    <div class="modal-action">
                         <button class="btn btn-primary w-full" @click="closeCheckout">Done</button>
                    </div>
                </div>
            </div>
        </dialog>

        <!-- ----------------------------------------------------------- -->
        <!-- EDIT DRAWER -->
        <!-- ----------------------------------------------------------- -->
        <ItemDrawer v-if="isEditDrawerOpen" :item="activeItem" @isNew="!activeItem" @close="closeEditDrawer" @save="saveEdit" />

        <!-- FULLSCREEN PREVIEW MODAL -->
        <ItemPreviewModal 
            :item="previewItem" 
            @close="previewItem = null" 
            @edit="openEdit" 
        />

        <!-- Bulk Import Modal -->
        <BulkImport v-if="showImport" @close="showImport = false" @complete="showImport = false" />

        <!-- Booth Reconciliation Modal -->
        <BoothReconciliation :isOpen="showReconciliation" @close="showReconciliation = false" />

        <!-- Floating Total Count / Scroll to Top -->
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-transform hover:-translate-y-1 cursor-pointer shadow-xl rounded-full" @click="scrollToTop">
            <span class="badge badge-lg badge-primary border-none shadow-md px-6 py-4 font-bold text-sm flex gap-2 items-center">
                {{ filteredInventory.length }} / {{ totalItems }} Items <Icon icon="solar:round-alt-arrow-up-linear" class="w-4 h-4" />
            </span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useInventory } from '../../composables/useInventory';
import { updateInventoryItem, deleteInventoryItem, saveItemToInventory } from '../../lib/inventory';
import BulkImport from './BulkImport.vue';
import BoothReconciliation from './BoothReconciliation.vue';
import { useAuth } from '../../composables/useAuth';
import { databases, Query } from '../../lib/appwrite';
import { Icon } from '@iconify/vue';
import ItemDrawer from '../common/ItemDrawer.vue';
import ItemCard from '../common/ItemCard.vue';
import ItemPreviewModal from './ItemPreviewModal.vue';
import TagInput from '../common/TagInput.vue';
import { addToast } from '../../stores/toast';
import { confirmDialog } from '../../stores/confirm';

// Environment Variables
const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const BUCKET = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// Use Composable
const { inventoryItems, totalItems, loading, error, fetchInventory, hasMore, loadNextPage } = useInventory();
const loadMore = loadNextPage; // Alias for template
const { currentTeam, loading: authLoading } = useAuth();
const currentTeamId = computed(() => currentTeam.value?.$id); 

// State for Filters
const searchQuery = ref('');
const filterStatus = ref('all');
const insightFilter = ref('');

onMounted(() => {
    // Check URL for AI Insight filters
    const params = new URLSearchParams(window.location.search);
    if (params.has('insightFilter')) {
        insightFilter.value = params.get('insightFilter') || '';
    }
});

const scrollToTop = () => {
    // Check if we are inside a drawer-content or window
    const drawer = document.querySelector('.drawer-content');
    if (drawer) {
        drawer.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
const filterKeywords = ref([]);
const filterBinLocation = ref('');
const orgPlacedLocations = ref([]);

const fetchLocations = async () => {
    if (!currentTeam.value) return;
    try {
        const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
        const res = await databases.listDocuments(DB_ID, 'org_settings', [
            Query.equal('tenantId', currentTeam.value.$id)
        ]);
        if (res.documents.length) {
            orgPlacedLocations.value = res.documents[0].placedLocations || [];
        }
    } catch(e) {}
};

watch(currentTeam, (n) => { if(n) fetchLocations(); }, { immediate: true });

// Lifecycle
const cartItems = computed(() => inventoryItems.value.filter(i => i.status === 'scouted'));
const filteredInventory = computed(() => {
    return inventoryItems.value.filter(item => {
        // Exclude cart items
        if (item.status === 'scouted') return false;

        // --- AI Insight Filters ---
        if (insightFilter.value) {
            const parseVal = (itm, key, noteKey) => {
                let val = 0;
                if (itm[key]) {
                    val = parseFloat(itm[key]);
                } else if (itm.conditionNotes) {
                    const regex = new RegExp(`${noteKey}[:\\s]*\\$?([\\d.]+)`, 'i');
                    const match = itm.conditionNotes.match(regex);
                    if (match) val = parseFloat(match[1]);
                }
                return isNaN(val) ? 0 : val;
            };

            if (insightFilter.value === 'missing_sold_price') {
                if (item.status !== 'sold' || (parseVal(item, 'soldPrice', 'Sold') || parseVal(item, 'price', 'Sold'))) return false;
            } else if (insightFilter.value === 'missing_est_value') {
                if (item.status === 'sold' || (parseVal(item, 'estValue', 'Est') || parseVal(item, 'listPrice', 'Est'))) return false;
            } else if (insightFilter.value === 'missing_cost') {
                if (item.status === 'sold' || (parseVal(item, 'cost', 'Paid') || parseVal(item, 'purchasePrice', 'Paid'))) return false;
            }
        }
        
        // Filter by Status (Only if not using insight filter that forces status)
        if (!insightFilter.value && filterStatus.value !== 'all' && item.status !== filterStatus.value) {
            return false;
        }

        // Filter by Bin Location
        if (filterBinLocation.value && item.storageLocation !== filterBinLocation.value) {
            return false;
        }

        // Filter by specific Keywords (must have all selected keywords)
        if (filterKeywords.value.length > 0) {
            if (!item.keywords || item.keywords.length === 0) return false;
            const itemKeywordsLower = item.keywords.map(k => k.toLowerCase());
            const hasAllKeywords = filterKeywords.value.every(kw => itemKeywordsLower.includes(kw.toLowerCase()));
            if (!hasAllKeywords) return false;
        }

        // Filter by Search (Free text)
        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase();
            const titleMatch = (item.title || item.itemName || '').toLowerCase().includes(query);
            const idMatch = (item.identity || item.$id || '').toLowerCase().includes(query);
            const binMatch = (item.storageLocation || '').toLowerCase().includes(query);
            const keywordMatch = Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(query));
            if (!titleMatch && !idMatch && !binMatch && !keywordMatch) return false;
        }
        
        return true;
    });
});

const cartGroups = computed(() => {
    return cartItems.value.reduce((groups, item) => {
        const loc = item.sourcingLocation || 'Unknown Location';
        if (!groups[loc]) groups[loc] = [];
        groups[loc].push(item);
        return groups;
    }, {});
});


// State
const processingId = ref(null); // deleting/updating ID
const processing = ref(false); // general loading state
const processingBulk = ref(false); // bulk action state
const activeItem = ref(null); // used for edit drawer
const previewItem = ref(null); // used for full preview modal
const showReconciliation = ref(false); // Booth sync modal

const openPreview = (item) => {
    previewItem.value = item;
};

// Bulk Selection State
const selectedItems = ref([]);
const bulkStatusTarget = ref('');
const bulkLocationTarget = ref('');
const processingBulkLoc = ref(false);
const bulkOpen = ref(false);

watch(selectedItems, (newVal, oldVal) => {
    if (newVal.length > 0 && oldVal.length === 0) bulkOpen.value = true;
    else if (newVal.length === 0) bulkOpen.value = false;
});

const isAllSelected = computed(() => {
    return filteredInventory.value.length > 0 && selectedItems.value.length === filteredInventory.value.length;
});

const toggleAll = (event) => {
    if (event.target.checked) {
        selectedItems.value = filteredInventory.value.map(i => i.$id);
    } else {
        selectedItems.value = [];
    }
};

const applyBulkStatus = async () => {
    if (!bulkStatusTarget.value || selectedItems.value.length === 0) return;
    
    processingBulk.value = true;
    const targetStatus = bulkStatusTarget.value;
    const idsToUpdate = [...selectedItems.value];
    
    try {
        // Run updates in parallel
        const promises = idsToUpdate.map(id => updateInventoryItem(id, { status: targetStatus }));
        await Promise.all(promises);
        
        // Optimistically update local state so we don't need a full refetch immediately
        inventoryItems.value.forEach(item => {
            if (idsToUpdate.includes(item.$id)) {
                item.status = targetStatus;
            }
        });
        
        // Reset selection
        selectedItems.value = [];
        bulkStatusTarget.value = '';
        addToast({ type: 'success', message: 'Bulk update applied.' });
    } catch (e) {
        addToast({ type: 'error', message: "Failed to apply bulk update: " + e.message });
    } finally {
        processingBulk.value = false;
    }
};

const applyBulkLocation = async () => {
    if (!bulkLocationTarget.value || selectedItems.value.length === 0) return;
    
    processingBulkLoc.value = true;
    const targetLoc = bulkLocationTarget.value;
    const idsToUpdate = [...selectedItems.value];
    
    try {
        const promises = idsToUpdate.map(id => updateInventoryItem(id, { storageLocation: targetLoc }));
        await Promise.all(promises);
        
        // Optimistically update local state
        inventoryItems.value.forEach(item => {
            if (idsToUpdate.includes(item.$id)) {
                item.storageLocation = targetLoc;
            }
        });
        
        // Reset selection
        selectedItems.value = [];
        bulkLocationTarget.value = '';
        addToast({ type: 'success', message: 'Bulk location updated.' });
    } catch (e) {
        addToast({ type: 'error', message: "Failed to apply bulk location update: " + e.message });
    } finally {
        processingBulkLoc.value = false;
    }
};

// Checkout State
const checkoutModal = ref(null);
const checkoutPrice = ref('');
const checkoutReceiptFile = ref(null);
const checkoutReceiptPreview = ref(null);
const checkoutSuccess = ref(false);
const generatedDescription = ref('');

// Edit Drawer State
const isEditDrawerOpen = ref(false);

// Camera State (Checkout only)
const cameraVideo = ref(null);
const isCameraOpen = ref(false);
const cameraStream = ref(null);

// Lifecycle
onMounted(async () => {
    console.log("InventoryManager Mounted - Version with Image Fetcher");
    // ONLY fetch if auth is already loaded.
    if (!authLoading.value) {
        await fetchInventory(''); 
    }
});

// Watch for Auth to finish loading so we know if the user is in Alpha mode
watch(authLoading, async (newVal) => {
    if (!newVal) {
        await fetchInventory(''); 
    }
});

// Helpers
const getNoteValue = (notes, key, isCurrency = false) => {
    if (!notes) return null;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow optional colon, capture value until newline or end of string
    const regex = new RegExp(`${escapedKey}[:\\s]*([^\\n\\r]+)`, 'i');
    const match = notes.match(regex);
    if (match) {
        let val = match[1].trim();
        if (isCurrency) val = val.replace('$', '').trim();
        return val;
    }
    return null;
};

const getImageUrl = (item) => {
    let id = item.imageId;
    if (!id && item.galleryImageIds?.length > 0) id = item.galleryImageIds[0];
    
    // Fallback: Check Notes
    if (!id && item.conditionNotes) {
         const match = item.conditionNotes.match(/\[MAIN IMAGE ID: ([^\]]+)\]/);
         if (match) id = match[1].split(',')[0].trim();
    }
    
    if (!id) return null;
    if (id.startsWith('http')) return proxify(id);
    return getAssetUrl(id);
};

const getAssetUrl = (id) => `${ENDPOINT}/storage/buckets/${BUCKET}/files/${id}/view?project=${PROJECT}`;
const getObjectUrl = (file) => URL.createObjectURL(file);
const formatCurrency = (val) => {
    if(!val) return '-';
    const num = parseFloat(val.toString().replace('$',''));
    return isNaN(num) ? val : '$' + num.toFixed(2);
};

const formatPriceRange = (val) => {
    if (!val) return '-';
    
    // 1. Try to parse if string looks like JSON
    if (typeof val === 'string' && val.trim().startsWith('{')) {
        try {
            val = JSON.parse(val);
        } catch (e) { /* ignore */ }
    }

    // 2. Handle Object { low, high }
    if (typeof val === 'object' && val !== null) {
        const low = val.low ?? val.Low ?? val.min ?? val.Min ?? val.low_price ?? val.start;
        const high = val.high ?? val.High ?? val.max ?? val.Max ?? val.high_price ?? val.end;
        
        if (low !== undefined && high !== undefined) return `$${low} - $${high}`;
        if (low !== undefined) return `$${low}+`;
        
        // Fallback: simple stringify only numbers?
        return JSON.stringify(val).replace(/[{}"]/g, '').replace(/,/g, ', ');
    }
    
    return val;
};

const formatPriceOnly = (val) => {
    if (!val) return '';
    const s = formatPriceRange(val);
    // Extract first price-like substring "$5 - $15" or "$10"
    // Stop at any character that isn't digit, dot, dash, space, or $
    // Actually, simpler: just take the first part before any paren or alpha text
    // E.g. "$5 - $15 (some text)" -> "$5 - $15"
    return s.split(/[a-z(]/i)[0].trim();
};

// Global Helpers for Price Parsing
const parsePrice = (p) => {
    if (!p) return 0;
    if (typeof p === 'number') return p;
    // Handle Object {min, max}
    if (typeof p === 'object') {
        const l = parseFloat((p.low || p.min || p.mint || 0).toString().replace(/,/g, ''));
        const h = parseFloat((p.high || p.max || p.fair || l).toString().replace(/,/g, ''));
        return (l + h) / 2;
    }
    
    // Aggressive cleanup: Remove $, commas, parens, letters (except 'to' separator logic handled in match)
    // Actually, let's just strip $, commas to start
    const s = String(p).replace(/[$,]/g, '').trim(); 

    // Handle range "10-20", "10 to 20", "10–20" (en dash), "10−20" (minus)
    // Regex: (Number) (Separator) (Number)
    const range = s.match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
    
    if (range) {
        return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    }
    // Handle single number "15.00", "15"
    const single = s.match(/(\d+(?:\.\d+)?)/);
    return single ? parseFloat(single[1]) : 0;
};

const getRationalPrice = (item) => {
    const fair = parsePrice(item.price_breakdown?.fair);
    const mint = parsePrice(item.price_breakdown?.mint);
    const poor = parsePrice(item.price_breakdown?.poor);

    // Sanity Check: If Fair is crazy high vs Mint (e.g. Fair $1000, Mint $40)
    if (mint > 0 && fair > mint * 1.5) {
        return (mint + (poor || 0)) / 2;
    }
    
    return fair || mint || 0;
};

const renderMarkdown = (text) => marked(text || '');

const proxify = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    // Don't proxy blobs, data URIs, or already proxied URLs
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('/api/proxy-image')) return url;
    // Don't proxy internal Appwrite storage links (usually safe, avoids double traffic)
    if (url.includes('/storage/buckets/')) return url;
    
    // Proxy all other http(s) links to avoid mixed content / CORS / Hotlinking issues
    if (url.startsWith('http')) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
};



//---------------------------------------------------------
// CHECKOUT LOGIC
//---------------------------------------------------------
const openCheckout = (item) => {
    activeItem.value = item;
    checkoutPrice.value = '';
    checkoutReceiptFile.value = null;
    checkoutReceiptPreview.value = null;
    checkoutSuccess.value = false;
    generatedDescription.value = '';
    checkoutModal.value.showModal();
};

const closeCheckout = () => {
    checkoutModal.value.close();
    stopCamera();
};

const clearCheckoutReceipt = () => {
    checkoutReceiptFile.value = null;
    checkoutReceiptPreview.value = null;
};

const submitCheckout = async () => {
    if (!activeItem.value) return;
    processing.value = true;
    try {
        await updateInventoryItem(activeItem.value.$id, {
            status: 'received',
            cost: checkoutPrice.value,
            receiptFile: checkoutReceiptFile.value
        });
        
        // Success UI
        checkoutSuccess.value = true;
        
        // Removed AI Gen trigger: The user requested generation be deferred until listing
        generatedDescription.value = "Item correctly transitioned to 'Acquired'. Description generation has been deferred until the item is placed for sale.";
        
    } catch (e) {
        addToast({ type: 'error', message: 'Checkout failed: ' + e.message });
    } finally {
        processing.value = false;
    }
};

//---------------------------------------------------------
// EDIT DRAWER LOGIC
//---------------------------------------------------------

const openAdd = () => {
    activeItem.value = null; // Create Mode
    isEditDrawerOpen.value = true;
};

const openEdit = (item) => {
    activeItem.value = item;
    isEditDrawerOpen.value = true;
};

const closeEditDrawer = () => {
    isEditDrawerOpen.value = false;
};

const saveEdit = async (payload) => {
    processing.value = true;
    try {
        if (activeItem.value) {
            // UPDATE EXISTING
            const updatedDoc = await updateInventoryItem(activeItem.value.$id, payload);
            // Optimistic update to immediately reflect in UI before Appwrite query cache clears
            const idx = inventoryItems.value.findIndex(i => i.$id === activeItem.value.$id);
            if (idx !== -1) {
                inventoryItems.value[idx] = updatedDoc;
            }
        } else {
            // CREATE NEW
             const newDoc = await saveItemToInventory(
                { title: payload.title || 'Untitled Item', identity: payload.title, condition_notes: '' }, 
                payload.imageFile,
                payload,
                currentTeamId.value // Pass team ID
            );
            inventoryItems.value.unshift(newDoc);
        }

        closeEditDrawer();
        // Fire async refresh in background just in case
        fetchInventory('').catch(() => {});
        addToast({ type: 'success', message: 'Item saved successfully.' });
    } catch (e) {
        addToast({ type: 'error', message: 'Save failed: ' + e.message });
    } finally {
        processing.value = false;
    }
};

//---------------------------------------------------------
// CAMERA & FILE LOGIC (Checkout)
//---------------------------------------------------------
const handleFileSelect = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'receipt') {
        processFile(files[0], (file, url) => {
            checkoutReceiptFile.value = file;
            checkoutReceiptPreview.value = url;
        });
    }
};

const processFile = (file, cb) => {
    cb(file, URL.createObjectURL(file));
};

const startCamera = async (context) => {
    try {
        cameraStream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        if (context === 'checkout') {
            isCameraOpen.value = true;
            setTimeout(() => {
                if (cameraVideo.value) cameraVideo.value.srcObject = cameraStream.value;
            }, 100);
        }
    } catch (e) {
        addToast({ type: 'error', message: "Camera Error: " + e.message });
    }
};

const stopCamera = () => {
    if (cameraStream.value) {
        cameraStream.value.getTracks().forEach(t => t.stop());
        cameraStream.value = null;
    }
    isCameraOpen.value = false;
};

const capturePhoto = (context) => {
    const videoEl = cameraVideo.value;
    if (!videoEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);

    canvas.toBlob(blob => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        if (context === 'checkout') {
            checkoutReceiptFile.value = file;
            checkoutReceiptPreview.value = URL.createObjectURL(blob);
            stopCamera();
        }
    }, 'image/jpeg', 0.8);
};

// General
const confirmDelete = async (id) => {
    if (!(await confirmDialog('Are you sure you want to delete this item?', 'Delete Item', 'Delete', 'Cancel', 'btn-error'))) return;
    processingId.value = id;
    try {
        await deleteInventoryItem(id);
        addToast({ type: 'success', message: 'Item deleted.' });
        // Realtime should handle removal from list, but manual optimistic update supported by useInventory too
    } catch(e) {
        addToast({ type: 'error', message: 'Delete failed' });
    } finally {
        processingId.value = false;
    }
};

const copyShareLink = async (id) => {
    if (!id) return;
    const url = `${window.location.origin}/item/${id}`;
    try {
        await navigator.clipboard.writeText(url);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied to clipboard!', type: 'success' } }));
        addToast({ type: 'success', message: 'Link copied to clipboard!' });
    } catch (err) {
        addToast({ type: 'error', message: 'Failed to copy link: ' + url });
    }
};



const showImport = ref(false); // CSV Modal



</script>
