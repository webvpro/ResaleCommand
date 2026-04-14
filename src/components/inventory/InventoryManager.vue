<template>
    <div class="space-y-12">
        <!-- SHOPPING CART SECTION -->
        <div v-if="cartItems.length > 0" class="space-y-8">
            <h2 class="text-2xl font-bold flex items-center gap-2">🛒 Active Shopping Cart <span class="badge badge-primary">{{ cartItems.length }}</span></h2>

            <div v-for="(groupItems, location) in cartGroups" :key="location" class="bg-base-200 p-6 rounded-2xl border-2 border-base-300 relative">
                <div class="absolute -top-3 left-6 px-2 bg-base-200 text-sm font-bold opacity-70 border border-base-300 rounded">
                    📍 {{ location }} ({{ groupItems.length }})
                </div>
            
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 pt-2">
                    <div v-for="item in groupItems" :key="item.$id" class="card bg-base-100 shadow-sm border-2 border-primary/20 hover:border-primary transition-colors">
                        <div class="card-body p-4">
                            <div class="flex gap-4 cursor-pointer hover:opacity-80 transition-opacity" @click="openEdit(item)">
                                <div class="w-16 h-16 bg-base-300 rounded-lg shrink-0 overflow-hidden relative">
                                    <img v-if="getImageUrl(item)" :src="getImageUrl(item)" class="w-full h-full object-cover" />
                                    <div v-else class="flex items-center justify-center w-full h-full text-2xl">📦</div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold truncate group-hover:text-primary transition-colors">{{ item.title }}</h3>
                                    <div class="text-xs opacity-70 mt-1">
                                        Max Buy: <span class="font-bold text-success">${{ item.maxBuyPrice }}</span>
                                    </div>
                                    <div v-if="item.binLocation" class="badge badge-xs badge-outline mt-1">{{ item.binLocation }}</div>
                                </div>
                            </div>
                            <div class="card-actions justify-end mt-2">
                                <button class="btn btn-sm btn-ghost text-error" @click="confirmDelete(item.$id)" :disabled="processingId === item.$id">✕</button>
                                <button class="btn btn-sm btn-primary" @click="openCheckout(item)">
                                    Purchase 💸
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
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div class="flex items-center gap-3">
                        <label for="inventory-sidebar" class="btn btn-square btn-ghost lg:hidden shadow-sm border border-base-200 bg-base-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </label>
                        <h2 class="text-2xl font-bold">In Inventory</h2>
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                        <button class="btn btn-sm btn-primary gap-2" @click="openAdd">
                            ➕ Add New
                        </button>
                        <button class="btn btn-sm btn-outline gap-2" @click="showImport = true">
                            📥 Import CSV
                        </button>
                        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                        <span class="badge badge-lg shadow-sm border border-base-200">{{ filteredInventory.length }} / {{ totalItems }} Items</span>
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
                <!-- BULK ACTIONS BAR -->
                <div v-if="selectedItems.length > 0" class="bg-primary/10 border border-primary text-primary-content p-3 rounded-lg flex justify-between items-center mb-4 transition-all animate-fade-in">
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-sm text-primary">{{ selectedItems.length }} items selected</span>
                        <div class="join">
                            <select v-model="bulkStatusTarget" class="select select-sm select-bordered join-item bg-base-100 text-base-content min-w-[120px]">
                                <option value="" disabled selected>Change Status...</option>
                                <option value="acquired">Acquired</option>
                                <option value="placed">Placed</option>
                                <option value="sold">Sold</option>
                            </select>
                            <button class="btn btn-sm btn-primary join-item" @click="applyBulkStatus" :disabled="!bulkStatusTarget || processingBulk">
                                <span v-if="processingBulk" class="loading loading-spinner loading-xs"></span>
                                Apply
                            </button>
                        </div>
                        <div class="join" v-if="orgPlacedLocations && orgPlacedLocations.length > 0">
                            <select v-model="bulkLocationTarget" class="select select-sm select-bordered join-item bg-base-100 text-base-content min-w-[120px]">
                                <option value="" disabled selected>Change Location...</option>
                                <option v-for="loc in orgPlacedLocations" :key="loc" :value="loc">{{ loc }}</option>
                            </select>
                            <button class="btn btn-sm btn-secondary join-item" @click="applyBulkLocation" :disabled="!bulkLocationTarget || processingBulkLoc">
                                <span v-if="processingBulkLoc" class="loading loading-spinner loading-xs"></span>
                                Apply
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-ghost text-error" @click="selectedItems = []">Cancel</button>
                </div>

                <!-- ALL CHECKBOX (Optional header) -->
                <div class="flex items-center gap-2 mb-2 px-2">
                    <input type="checkbox" :checked="isAllSelected" @change="toggleAll" class="checkbox checkbox-sm checkbox-primary" />
                    <span class="text-xs font-bold opacity-70">Select All in View</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                    <ItemCard 
                        v-for="item in filteredInventory" 
                        :key="item.$id" 
                        :item="item"
                        :compact="true"
                        @click-card="openPreview(item)"
                        :class="{'ring-2 ring-primary': selectedItems.includes(item.$id)}">
                        
                        <template #absolute-top-left>
                            <div class="absolute top-1 left-1 z-20">
                                <input type="checkbox" :value="item.$id" v-model="selectedItems" class="checkbox checkbox-sm checkbox-primary bg-base-100/80 backdrop-blur shadow-sm cursor-pointer" @click.stop />
                            </div>
                        </template>

                        <template #actions>
                            <div class="flex justify-end items-center mt-1 pt-1 border-t border-base-200">
                                <button class="btn btn-xs btn-ghost text-error btn-square h-6 min-h-0 w-6" @click.stop="confirmDelete(item.$id)" :disabled="processingId === item.$id">
                                    <span v-if="processingId === item.$id" class="loading loading-spinner loading-xs"></span>
                                    <span v-else>🗑️</span>
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
                        <button v-if="!isCameraOpen" @click="startCamera('checkout')" class="btn btn-outline gap-2">📷 Take Receipt Photo</button>
                        
                        <!-- Camera View -->
                        <div v-if="isCameraOpen" class="relative rounded-lg overflow-hidden bg-black">
                             <video ref="cameraVideo" class="w-full h-48 object-cover" autoplay playsinline></video>
                             <button @click="capturePhoto('checkout')" class="btn btn-circle absolute bottom-2 left-1/2 -translate-x-1/2 btn-success border-2 border-white">📸</button>
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
                    <h3 class="font-bold text-lg text-success mb-4">✅ Purchase Confirmed!</h3>
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useInventory } from '../../composables/useInventory';
import { updateInventoryItem, deleteInventoryItem, saveItemToInventory } from '../../lib/inventory';
import BulkImport from './BulkImport.vue';
import { useAuth } from '../../composables/useAuth';
import { databases, Query } from '../../lib/appwrite';
import ItemDrawer from '../common/ItemDrawer.vue';
import ItemCard from '../common/ItemCard.vue';
import ItemPreviewModal from './ItemPreviewModal.vue';
import TagInput from '../common/TagInput.vue';

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
        
        // Filter by Status
        if (filterStatus.value !== 'all' && item.status !== filterStatus.value) {
            return false;
        }

        // Filter by Bin Location
        if (filterBinLocation.value && item.binLocation !== filterBinLocation.value) {
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
            const binMatch = (item.binLocation || '').toLowerCase().includes(query);
            const keywordMatch = Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(query));
            if (!titleMatch && !idMatch && !binMatch && !keywordMatch) return false;
        }
        
        return true;
    });
});

const cartGroups = computed(() => {
    return cartItems.value.reduce((groups, item) => {
        const loc = item.purchaseLocation || 'Unknown Location';
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

const openPreview = (item) => {
    previewItem.value = item;
};

// Bulk Selection State
const selectedItems = ref([]);
const bulkStatusTarget = ref('');
const bulkLocationTarget = ref('');
const processingBulkLoc = ref(false);

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
    } catch (e) {
        alert("Failed to apply bulk update: " + e.message);
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
        const promises = idsToUpdate.map(id => updateInventoryItem(id, { binLocation: targetLoc }));
        await Promise.all(promises);
        
        // Optimistically update local state
        inventoryItems.value.forEach(item => {
            if (idsToUpdate.includes(item.$id)) {
                item.binLocation = targetLoc;
            }
        });
        
        // Reset selection
        selectedItems.value = [];
        bulkLocationTarget.value = '';
    } catch (e) {
        alert("Failed to apply bulk location update: " + e.message);
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
        alert('Checkout failed: ' + e.message);
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
    } catch (e) {
        alert('Save failed: ' + e.message);
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
        alert("Camera Error: " + e.message);
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
    if(!confirm('Delete item?')) return;
    processingId.value = id;
    try {
        await deleteInventoryItem(id);
        // Realtime should handle removal from list, but manual optimistic update supported by useInventory too
    } catch(e) {
        alert('Delete failed');
    } finally {
        processingId.value = false;
    }
};



const showImport = ref(false); // CSV Modal



</script>
