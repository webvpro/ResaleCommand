<template>
    <div class="relative z-50">
        <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeDrawer"></div>
        <div class="fixed inset-y-0 right-0 w-full md:w-[480px] bg-base-100 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            <!-- Header -->
            <div class="p-4 border-b border-base-200 flex justify-between items-center bg-base-100 flex-none sticky top-0 z-20">
                <h3 class="font-bold text-lg">{{ item ? 'Edit Item' : 'Add New Item' }}</h3>
                <button class="btn btn-sm btn-circle btn-ghost" @click="closeDrawer">✕</button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                 <div class="form-control w-full">
                    <label class="label"><span class="label-text font-bold">Item Title</span></label>
                    <input type="text" v-model="editForm.title" class="input input-bordered w-full font-bold" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                     <div class="form-control w-full">
                        <label class="label"><span class="label-text">Paid Price</span></label>
                        <label class="input input-bordered flex items-center gap-2">
                            <span class="opacity-50">$</span>
                            <input type="number" step="0.01" v-model="editForm.cost" class="grow" placeholder="0.00" />
                        </label>
                    </div>
                     <div class="form-control w-full">
                        <label class="label"><span class="label-text">List Price</span></label>
                         <label class="input input-bordered flex items-center gap-2">
                            <span class="opacity-50">$</span>
                            <input type="number" step="0.01" v-model="editForm.resalePrice" class="grow" placeholder="0.00" />
                        </label>
                    </div>
                </div>

                <!-- AI Estimates Row -->
                <div class="grid grid-cols-2 gap-4">
                     <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs uppercase font-bold text-success">Est. Low</span></label>
                        <label class="input input-bordered input-sm flex items-center gap-2">
                            <span class="opacity-50">$</span>
                            <input type="number" step="0.01" v-model="editForm.estLow" class="grow font-mono" placeholder="0.00" />
                        </label>
                    </div>
                     <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs uppercase font-bold text-success">Est. High</span></label>
                         <label class="input input-bordered input-sm flex items-center gap-2">
                            <span class="opacity-50">$</span>
                            <input type="number" step="0.01" v-model="editForm.estHigh" class="grow font-mono" placeholder="0.00" />
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                     <div class="form-control w-full">
                        <label class="label"><span class="label-text">Bin Location</span></label>
                        <input type="text" v-model="editForm.binLocation" class="input input-bordered w-full" />
                    </div>
                    
                    <!-- Order ID (Editable) -->
                    <div class="form-control w-full">
                        <label class="label"><span class="label-text">Order #</span></label>
                         <div class="join w-full">
                            <input type="text" v-model="editForm.orderId" class="input input-bordered join-item w-full" placeholder="Order ID" />
                            <a v-if="editForm.orderId && editForm.orderId.length > 5" :href="`https://shopgoodwill.com/shopgoodwill/order/${editForm.orderId}`" target="_blank" class="btn btn-neutral join-item">🔗</a>
                         </div>
                    </div>
                </div>

                <!-- Item Link (Source) & AI Analysis -->
                <div class="form-control w-full">
                    <label class="label"><span class="label-text">Item Link (for Image Fetch)</span></label>
                    <div class="join w-full">
                        <input type="text" v-model="editForm.purchaseLocation" class="input input-bordered join-item w-full font-mono text-sm" placeholder="https://shopgoodwill.com/item/..." />
                        <button class="btn btn-primary join-item" @click="fetchImagesFromUrl" :disabled="!editForm.purchaseLocation || fetchingImages">
                            <span v-if="fetchingImages" class="loading loading-spinner loading-xs"></span>
                            <span v-else>Fetch 🖼️</span>
                        </button>
                    </div>
                </div>
                
                <!-- Scout Result Display (Scout View Mirror) -->
                 <div v-if="scoutResult" class="bg-base-200 rounded-xl p-4 border border-base-300 shadow-inner mt-4">
                    <div class="flex justify-between items-start mb-2">
                         <h4 class="font-bold text-sm uppercase opacity-70">Scout Report</h4>
                         <div class="flex gap-2">
                             <button v-if="scoutMdText" class="btn btn-xs btn-outline btn-secondary" @click="openMdModal">
                                 📄 View MD Report
                             </button>
                             <button class="btn btn-xs btn-ghost" @click="scoutResult = null">✕</button>
                         </div>
                    </div>
                    
                    <!-- New Multi-Item Layout -->
                    <div v-if="Array.isArray(scoutResult)" class="space-y-4">
                        <div class="alert alert-info py-2 px-3 text-xs shadow-sm">
                            <span>📦 AI Identified {{ scoutResult.length }} Items in this Lot</span>
                        </div>
                        
                        <div v-for="(resultItem, idx) in scoutResult" :key="idx" class="collapse collapse-arrow bg-base-100 border border-base-200 rounded-box">
                            <input type="checkbox" /> 
                            <div class="collapse-title text-sm font-medium pr-8 flex justify-between items-center py-2 min-h-0">
                                <span class="truncate">{{ idx + 1 }}. {{ resultItem.title || resultItem.identity }}</span>
                                <span class="badge badge-sm badge-ghost ml-2 whitespace-nowrap" v-if="resultItem.price_breakdown?.fair">
                                    {{ formatPriceOnly(resultItem.price_breakdown.fair) }}
                                </span>
                            </div>
                            <div class="collapse-content text-xs space-y-2">
                                 <div v-if="resultItem.red_flags?.length" class="text-warning">🚩 {{ resultItem.red_flags.join(', ') }}</div>
                                 <div v-if="resultItem.condition_notes">📝 {{ resultItem.condition_notes }}</div>
                                 <div class="grid grid-cols-2 gap-2 mt-1 opacity-70">
                                     <div>Mint: {{ formatPriceRange(resultItem.price_breakdown?.mint) }}</div>
                                     <div>Poor: {{ formatPriceRange(resultItem.price_breakdown?.poor) }}</div>
                                 </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2 border-t border-base-300 font-bold">
                            <span>Total Estimate (Fair):</span>
                            <span class="text-success text-lg" v-if="scoutTotalRange">
                                 {{ scoutTotalRange.formatted }}
                            </span>
                        </div>
                    </div>

                    <!-- Old Single Item Layout (Fallback) -->
                    <div v-else>
                        <!-- AI Found Image Thumbnail -->
                        <div v-if="scoutResult.image" class="mb-3 flex justify-center">
                            <img :src="proxify(scoutResult.image)" class="h-32 object-contain rounded-lg shadow-md border border-base-300" alt="AI Found Item" />
                        </div>

                        <!-- Red Flags -->
                        <div v-if="scoutResult.red_flags && scoutResult.red_flags.length > 0" class="alert alert-warning shadow-sm mb-2 p-2 text-xs">
                            <span class="font-bold">🚩 Flags:</span> {{ scoutResult.red_flags.join(', ') }}
                        </div>
                        
                        <!-- Valuation -->
                        <div v-if="scoutResult.price_breakdown" class="grid grid-cols-3 gap-2 mb-3">
                            <div class="flex flex-col items-center bg-base-100 p-2 rounded border border-base-200">
                                <span class="text-[10px] uppercase font-bold text-success">Mint</span>
                                <span class="font-mono font-bold">{{ formatPriceRange(scoutResult.price_breakdown.mint) }}</span>
                            </div>
                            <div class="flex flex-col items-center bg-base-100 p-2 rounded border border-primary">
                                <span class="text-[10px] uppercase font-bold text-primary">Fair</span>
                                <span class="font-mono font-bold">{{ formatPriceRange(scoutResult.price_breakdown.fair) }}</span>
                            </div>
                            <div class="flex flex-col items-center bg-base-100 p-2 rounded border border-base-200">
                                <span class="text-[10px] uppercase font-bold text-error">Poor</span>
                                <span class="font-mono font-bold">{{ formatPriceRange(scoutResult.price_breakdown.poor) }}</span>
                            </div>
                        </div>

                        <!-- Comparables -->
                        <div v-if="scoutResult.comparables && scoutResult.comparables.length > 0" class="space-y-1">
                            <div class="text-[10px] font-bold uppercase opacity-50">Comps</div>
                            <div v-for="(comp, cIdx) in scoutResult.comparables" :key="cIdx" class="flex justify-between items-center text-xs bg-base-100 p-1.5 rounded border border-base-200">
                                <span class="truncate pr-2">{{ comp.name }}</span>
                                <span class="font-mono font-bold">{{ comp.price }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Scout Button (Photo OR Link) -->
                <div v-if="editMainPhotoPreview || editForm.purchaseLocation" class="form-control w-full mt-4">
                     <button class="btn btn-secondary w-full gap-2 shadow-sm" @click="analyzeExistingItem" :disabled="analyzing">
                        <span v-if="analyzing" class="loading loading-spinner loading-xs"></span>
                        <span v-else>
                            <span v-if="scoutResult">🔄 Update Scout Report</span>
                            <span v-else>✨ Analyze {{ editMainPhotoPreview ? 'Main Photo' : 'Item Link' }} with AI</span>
                        </span>
                    </button>
                </div>

                <!-- Fetched Images Preview -->
                <div v-if="fetchedImages.length > 0" class="border border-base-300 rounded-lg p-4 bg-base-200">
                    <label class="label pt-0"><span class="label-text font-bold">Detected Images (Click to Add)</span></label>
                    <div class="flex gap-2 overflow-x-auto pb-2 min-h-[5rem]">
                        <div v-for="(imgItem, idx) in fetchedImages" :key="idx" 
                             class="relative w-20 h-20 shrink-0 group cursor-pointer hover:ring-2 ring-primary rounded-lg overflow-hidden transition-all" 
                             @click="selectFetchedImage(imgItem.url || imgItem)">
                            <img :src="proxify(imgItem.url || imgItem)" class="w-full h-full object-cover" />
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                Add
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end mt-1">
                         <button class="btn btn-xs btn-ghost text-error" @click="fetchedImages = []">Clear</button>
                    </div>
                </div>

                <div class="form-control w-full">
                    <label class="label"><span class="label-text">Status</span></label>
                    <select v-model="editForm.status" class="select select-bordered">
                        <option value="scouted">Scouted</option>
                        <option value="acquired">Acquired</option>
                        <option value="processing">Processing</option>
                        <option value="need_to_list">Need to List</option>
                        <option value="listed">Listed</option>
                        <option value="at_location">At Location</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                <!-- PHOTOS -->
                <div class="divider">Photos</div>
                
                <!-- Main Photo Field -->
                <div class="form-control w-full">
                    <label class="label"><span class="label-text font-bold">Main Photo</span></label>
                    <div class="flex gap-4 items-center">
                        <div class="w-24 h-24 rounded-lg overflow-hidden border border-base-300 bg-base-200 relative shrink-0">
                            <img v-if="editMainPhotoPreview" :src="proxify(editMainPhotoPreview)" class="w-full h-full object-cover" />
                            <div v-else class="flex items-center justify-center text-2xl opacity-50 w-full h-full">📦</div>
                        </div>
                        <div class="flex flex-col gap-2">
                             <input type="file" @change="handleFileSelect($event, 'main')" accept="image/*" class="file-input file-input-sm file-input-bordered w-full max-w-xs" />
                        </div>
                    </div>
                </div>

                <!-- Gallery -->
                <div class="form-control w-full">
                    <label class="label"><span class="label-text font-bold">Gallery</span></label>
                    
                     <!-- Gallery Previews (Existing + New) -->
                    <div class="flex gap-2 overflow-x-auto pb-2 min-h-[5rem]">
                        <!-- Existing -->
                        <div v-for="id in editForm.existingGalleryIds" :key="id" class="relative w-16 h-16 shrink-0 group">
                            <img :src="getAssetUrl(id)" class="w-full h-full object-cover rounded border border-base-300" />
                            <button @click="removeGalleryItem(id, true)" class="btn btn-xs btn-circle btn-error absolute -top-1 -right-1 w-4 h-4 min-h-0 text-[10px] flex items-center justify-center">✕</button>
                        </div>
                        <!-- New -->
                        <div v-for="(file, idx) in editGalleryBuffer" :key="idx" class="relative w-16 h-16 shrink-0 group">
                            <img :src="getObjectUrl(file)" class="w-full h-full object-cover rounded border border-base-300" />
                            <button @click="removeGalleryItem(idx, false)" class="btn btn-xs btn-circle btn-error absolute -top-1 -right-1 w-4 h-4 min-h-0 text-[10px] flex items-center justify-center">✕</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mt-2">
                         <input type="file" ref="galleryInput" multiple accept="image/*" class="hidden" @change="handleFileSelect($event, 'gallery')" />
                         <button @click="$refs.galleryInput.click()" class="btn btn-outline border-dashed">
                            📁 Upload Files
                         </button>
                         <button @click="startCamera('gallery')" class="btn btn-outline border-dashed">
                            📸 Camera
                         </button>
                    </div>
                </div>

                <!-- Description -->
                <div class="divider">Description</div>
                <div class="flex justify-between items-center mb-2">
                    <div role="tablist" class="tabs tabs-boxed">
                        <a role="tab" class="tab" :class="{ 'tab-active': descTab === 'edit' }" @click="descTab = 'edit'">Edit</a>
                        <a role="tab" class="tab" :class="{ 'tab-active': descTab === 'preview' }" @click="descTab = 'preview'">Preview</a>
                    </div>
                    <button class="btn btn-sm btn-secondary btn-outline" @click="generateDescription" :disabled="generatingDescription || !item">
                        <span v-if="generatingDescription" class="loading loading-spinner loading-xs"></span>
                        ✨ AI Generate
                    </button>
                </div>

                <div v-if="descTab === 'edit'" class="form-control w-full">
                    <textarea v-model="editForm.description" class="textarea textarea-bordered h-64 font-mono text-xs leading-normal" placeholder="Product description..."></textarea>
                </div>
                <div v-else class="w-full h-64 overflow-y-auto border border-base-300 rounded-lg p-4 bg-base-100 prose prose-sm" v-html="renderMarkdown(editForm.description)"></div>

                <div class="h-12"></div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-base-200 flexjustify-end bg-base-100 flex z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] gap-2 shrink-0">
                <button class="btn btn-ghost" @click="closeDrawer">Cancel</button>
                <button class="btn btn-primary flex-1" @click="saveEdit" :disabled="processing">
                    <span v-if="processing" class="loading loading-spinner"></span>
                    Save Changes
                </button>
            </div>
        </div>
         <!-- Camera Modal Overlay -->
         <dialog ref="cameraModal" class="modal">
            <div class="modal-box p-0 bg-black w-full max-w-2xl h-[500px] flex flex-col">
                 <video ref="cameraVideoDialog" class="w-full h-full object-cover flex-1" autoplay playsinline></video>
                 <div class="bg-black/80 p-6 flex justify-center gap-8 items-center shrink-0">
                     <button @click="stopCamera" class="btn btn-circle btn-ghost text-white bg-white/20">✕</button>
                     <button @click="capturePhoto(cameraContext)" class="btn btn-circle btn-primary btn-lg border-4 border-white w-20 h-20"></button>
                     <button @click="flipCamera" class="btn btn-circle btn-ghost text-white bg-white/20">🔄</button>
                </div>
            </div>
        </dialog>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';

onMounted(() => {
    document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
    document.body.style.overflow = '';
});

const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const BUCKET = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

const props = defineProps({
    item: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['close', 'save']);

const descTab = ref('edit');
const processing = ref(false);
const editForm = ref({
    title: '', cost: '', resalePrice: '', estLow: '', estHigh: '',
    binLocation: '', purchaseLocation: '', orderId: '', status: 'scouted',
    description: '', existingGalleryIds: []
});

const editMainFile = ref(null);
const editMainPhotoPreview = ref(null);
const editGalleryBuffer = ref([]);
const scoutResult = ref(null);
const scoutMdText = ref(null);
const fetchedImages = ref([]);
const fetchingImages = ref(false);
const analyzing = ref(false);
const generatingDescription = ref(false);

const openMdModal = () => {
    if (scoutMdText.value) {
        document.dispatchEvent(new CustomEvent('show-md-modal', {
            detail: {
                text: scoutMdText.value,
                title: `${editForm.value.title || 'Scout Report'}`
            }
        }));
    }
};

const cameraVideoDialog = ref(null);
const cameraModal = ref(null);
const isCameraOpen = ref(false);
const cameraStream = ref(null);
const cameraFacing = ref('environment');
const cameraContext = ref('gallery');
const galleryInput = ref(null);

const getAssetUrl = (id) => {
    if (!id || !BUCKET) return '';
    try {
        return `${ENDPOINT}/storage/buckets/${BUCKET}/files/${id}/view?project=${PROJECT}`;
    } catch (e) { return ''; }
};

const getObjectUrl = (file) => URL.createObjectURL(file);
const renderMarkdown = (text) => marked(text || '');

const proxify = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('/api/proxy-image')) return url;
    if (url.includes('/storage/buckets/')) return url;
    if (url.startsWith('http')) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// Global Helpers for Price Parsing
const parsePrice = (p) => {
    if (!p) return 0;
    if (typeof p === 'number') return p;
    if (typeof p === 'object') {
        const l = parseFloat((p.low || p.min || p.mint || 0).toString().replace(/,/g, ''));
        const h = parseFloat((p.high || p.max || p.fair || l).toString().replace(/,/g, ''));
        return (l + h) / 2;
    }
    const s = String(p).replace(/[$,]/g, '').trim(); 
    const range = s.match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
    if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    const single = s.match(/(\d+(?:\.\d+)?)/);
    return single ? parseFloat(single[1]) : 0;
};

const getRationalPrice = (itemData) => {
    const fair = parsePrice(itemData.price_breakdown?.fair);
    const mint = parsePrice(itemData.price_breakdown?.mint);
    const poor = parsePrice(itemData.price_breakdown?.poor);
    if (mint > 0 && fair > mint * 1.5) {
        return (mint + (poor || 0)) / 2;
    }
    return fair || mint || 0;
};

function formatPriceRange(val) {
    if (!val) return '-';
    if (typeof val === 'string' && val.trim().startsWith('{')) {
        try { val = JSON.parse(val); } catch (e) { }
    }
    if (typeof val === 'object' && val !== null) {
        const low = val.low ?? val.Low ?? val.min ?? val.Min ?? val.low_price ?? val.start;
        const high = val.high ?? val.High ?? val.max ?? val.Max ?? val.high_price ?? val.end;
        if (low !== undefined && high !== undefined) return `$${low} - $${high}`;
        if (low !== undefined) return `$${low}+`;
        return JSON.stringify(val).replace(/[{}"]/g, '').replace(/,/g, ', ');
    }
    return val;
}

function formatPriceOnly(val) {
    if (!val) return '';
    const s = formatPriceRange(val);
    return String(s).split(/[a-z(]/i)[0].trim();
}

const scoutTotalRange = computed(() => {
    if (!scoutResult.value || !Array.isArray(scoutResult.value)) return null;
    let totalLow = 0, totalHigh = 0;
    scoutResult.value.forEach(resItem => {
        let raw = resItem.price_breakdown?.fair || resItem.price_breakdown?.mint;
        let low = 0, high = 0;
        if (typeof raw === 'object') {
                low = parseFloat((raw.low || raw.min || raw.mint || 0).toString().replace(/,/g, ''));
                high = parseFloat((raw.high || raw.max || raw.fair || low).toString().replace(/,/g, ''));
        } else { 
                const s = String(raw || '0').replace(/[$,]/g, '').trim(); 
                const range = s.match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
                if (range) {
                    low = parseFloat(range[1]) || 0;
                    high = parseFloat(range[2]) || 0;
                } else {
                    const single = s.match(/(\d+(?:\.\d+)?)/);
                    if(single) { low = parseFloat(single[1]) || 0; high = low; }
                }
        }
        const mintPrice = parsePrice(resItem.price_breakdown?.mint);
        if (mintPrice > 0 && low > mintPrice * 2) { low = mintPrice / 2; high = mintPrice; }
        if (high < low) high = low;
        totalLow += low;
        totalHigh += high;
    });
    return { 
        low: totalLow, high: totalHigh, 
        formatted: totalLow === totalHigh ? `$${totalLow.toFixed(2)}` : `$${totalLow.toFixed(2)} - $${totalHigh.toFixed(2)}`
    };
});

const getNoteValue = (notes, key, isCurrency = false) => {
    if (!notes) return null;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use [ \t]* instead of \s* to prevent matching across newlines.
    const regex = new RegExp(`${escapedKey}:[ \\t]*([^\\n\\r]+)`, 'i');
    const match = notes.match(regex);
    if (match) {
        let val = match[1].trim();
        if (isCurrency) val = val.replace('$', '').trim();
        return val;
    }
    return null;
};

const getImageUrl = (itemData) => {
    let id = itemData.imageId;
    if (!id && itemData.galleryImageIds?.length > 0) id = itemData.galleryImageIds[0];
    if (!id && itemData.conditionNotes) {
         const match = itemData.conditionNotes.match(/\[MAIN IMAGE ID: ([^\]]+)\]/);
         if (match) id = match[1].split(',')[0].trim();
    }
    
    return id ? getAssetUrl(id) : null;
};

const initForm = () => {
    if (props.item) {
        const i = props.item;
        editForm.value = {
            title: i.title,
            cost: i.cost || i.purchasePrice || getNoteValue(i.conditionNotes, 'Paid', true) || '',
            resalePrice: i.resalePrice || i.priceFair || getNoteValue(i.conditionNotes, 'Resale', true) || '',
            estLow: i.estLow || getNoteValue(i.conditionNotes, 'Est. Low', true) || '',
            estHigh: i.estHigh || getNoteValue(i.conditionNotes, 'Est. High', true) || '',
            binLocation: i.binLocation || getNoteValue(i.conditionNotes, 'Bin') || '',
            purchaseLocation: i.purchaseLocation || getNoteValue(i.conditionNotes, 'Location') || '',
            orderId: i.orderId || getNoteValue(i.conditionNotes, 'Order #') || getNoteValue(i.conditionNotes, 'Imported from Order #') || '',
            status: i.status || 'scouted',
            description: i.marketDescription || i.description || i.rawAnalysis || '', 
            existingGalleryIds: i.galleryImageIds || []
        };
        const existingUrl = getImageUrl(i);
        editMainPhotoPreview.value = existingUrl || null;
        
        scoutResult.value = null;
        scoutMdText.value = null;
        showScoutMd.value = false;

        if (i.conditionNotes) {
            const mdMatch = i.conditionNotes.match(/\[SCOUT_REPORT_MD: ([^\]]+)\]/);
            if (mdMatch) {
                const downloadUrl = getAssetUrl(mdMatch[1].trim()).replace('/view', '/download');
                fetch(downloadUrl).then(res => res.text()).then(txt => { scoutMdText.value = txt; }).catch(() => {});
            }

            const fileMatch = i.conditionNotes.match(/\[SCOUT_REPORT_ID: ([^\]]+)\]/);
            if (fileMatch) {
                const downloadUrl = getAssetUrl(fileMatch[1].trim()).replace('/view', '/download');
                fetch(downloadUrl).then(res => res.json()).then(data => { scoutResult.value = data; }).catch(() => {});
            } else {
                const liteMatch = i.conditionNotes.match(/\[SCOUT_DATA_LITE: ([^\]]+)\]/);
                if (liteMatch) {
                    try { scoutResult.value = JSON.parse(atob(liteMatch[1])); } catch(e) {}
                } else {
                    const match = i.conditionNotes.match(/\[SCOUT_DATA: ([^\]]+)\]/);
                    if (match) {
                        try { scoutResult.value = JSON.parse(atob(match[1])); } catch (e) {}
                    }
                }
            }
        } else if (i.rawAnalysis) {
            try {
                const parsed = JSON.parse(i.rawAnalysis);
                scoutResult.value = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);
            } catch (e) {}
        }
    } else {
        editForm.value = {
            title: '', cost: '', resalePrice: '', estLow: '', estHigh: '',
            binLocation: '', purchaseLocation: '', orderId: '', status: 'scouted', description: '', existingGalleryIds: []
        };
        editMainPhotoPreview.value = null;
        scoutResult.value = null;
        scoutMdText.value = null;
    }
    
    editMainFile.value = null;
    editGalleryBuffer.value = [];
    fetchedImages.value = [];
    fetchingImages.value = false;
};

watch(() => props.item, initForm, { immediate: true });

const closeDrawer = () => {
    stopCamera();
    emit('close');
};

const generateDescription = async () => {
    generatingDescription.value = true;
    try {
        const idToUpdate = props.item ? props.item.$id : null;
        
        if (idToUpdate) {
             const res = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: idToUpdate })
            });
            const data = await res.json();
            if(data.success && data.description) {
                editForm.value.description = data.description;
                if(data.warning) alert(`Warning: ${data.warning}`);
            } else {
                alert("Failed to generate: " + (data.error || "Unknown"));
            }
        } else {
            alert('Please save the item first before generating a description.');
        }
        
    } catch (e) {
        alert('Description generation failed: ' + e.message);
    } finally {
        generatingDescription.value = false;
    }
};

const saveEdit = async () => {
    processing.value = true;
    try {
        const payload = {
            ...editForm.value,
            imageFile: editMainFile.value,
            galleryFiles: editGalleryBuffer.value,
            scoutData: scoutResult.value
        };
        emit('save', payload);
    } catch (e) {
        alert('Save failed: ' + e.message);
    } finally {
        processing.value = false;
    }
};

const removeGalleryItem = (idOrIdx, isExisting) => {
    if (isExisting) {
        editForm.value.existingGalleryIds = editForm.value.existingGalleryIds.filter(id => id !== idOrIdx);
    } else {
        editGalleryBuffer.value.splice(idOrIdx, 1);
    }
};

const processFile = (file, cb) => cb(file, URL.createObjectURL(file));

const handleFileSelect = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (type === 'main') {
        processFile(files[0], (file, url) => {
            editMainFile.value = file;
            editMainPhotoPreview.value = url;
        });
    } else if (type === 'gallery') {
        Array.from(files).forEach(f => editGalleryBuffer.value.push(f));
    }
};

const startCamera = async (context) => {
    cameraContext.value = context;
    try {
        cameraStream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing.value } });
        cameraModal.value.showModal();
        setTimeout(() => { if (cameraVideoDialog.value) cameraVideoDialog.value.srcObject = cameraStream.value; }, 100);
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
    if(cameraModal.value) cameraModal.value.close();
};

const flipCamera = () => {
    cameraFacing.value = cameraFacing.value === 'environment' ? 'user' : 'environment';
    stopCamera();
    startCamera(cameraContext.value);
};

onUnmounted(() => stopCamera());

const capturePhoto = (context) => {
    const videoEl = cameraVideoDialog.value;
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);
    canvas.toBlob(blob => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        editGalleryBuffer.value.push(file);
        const btn = document.activeElement;
        if(btn) btn.classList.add('scale-90');
        setTimeout(() => btn && btn.classList.remove('scale-90'), 100);
    }, 'image/jpeg', 0.8);
};

const fetchImagesFromUrl = async () => {
    const url = editForm.value.purchaseLocation;
    const isId = url && url.match(/^\d+$/);
    if (!url || (!url.startsWith('http') && !isId)) return alert("Please enter a valid URL or Item ID.");
    fetchingImages.value = true;
    fetchedImages.value = [];
    let finalUrl = url;
    const idMatch = url.match(/item\/(\d+)/i) || url.match(/^(\d+)$/);
    if(idMatch) finalUrl = idMatch[1];

    try {
        const res = await fetch('/api/extract-images', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl })
        });
        const data = await res.json();
        if (data.success && data.images.length > 0) {
            fetchedImages.value = data.images;
        } else if (data.success && data.images.length === 0) {
            alert("No images found on that page.");
        }
        if (data.success) {
            if (data.price && (!editForm.value.cost || parseFloat(editForm.value.cost) === 0)) editForm.value.cost = data.price.toString().replace(/[$,]/g, '');
            if (data.title && (!editForm.value.title || editForm.value.title.trim().length < 4)) editForm.value.title = data.title;
        }
    } catch (e) {
        alert("Failed to fetch images: " + e.message);
    } finally {
        fetchingImages.value = false;
    }
};

const urlToFile = async (url, filename) => {
    try {
        const res = await fetch('/api/proxy-image?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error("Image download failed");
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (e) { return null; }
};

const selectFetchedImage = async (url) => {
    const filename = url.split('/').pop().split('?')[0] || "downloaded.jpg";
    const file = await urlToFile(url, filename);
    if (file) {
        if (!editMainFile.value && !editForm.value.imageId && !editMainPhotoPreview.value) {
            processFile(file, (f, u) => { editMainFile.value = f; editMainPhotoPreview.value = u; });
        } else editGalleryBuffer.value.push(file);
    } else alert("Could not download image.");
};

const analyzeExistingItem = async () => {
    if (!editMainPhotoPreview.value && !editForm.value.purchaseLocation) return alert("Please add a Main Photo or Item Link to analyze.");
    analyzing.value = true;
    try {
        let base64Image = null;
        const resize = (blob) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height, max = 1024;
                if (w > max || h > max) { if (w > h) { h = Math.round(h * (max/w)); w = max; } else { w = Math.round(w * (max/h)); h = max; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            const reader = new FileReader(); reader.onload = (e) => img.src = e.target.result; reader.readAsDataURL(blob);
        });

        if (editMainFile.value) base64Image = await resize(editMainFile.value);
        else if (editMainPhotoPreview.value && editMainPhotoPreview.value.startsWith('data:')) {
            const res = await fetch(editMainPhotoPreview.value);
            base64Image = await resize(await res.blob());
        } else if (editMainPhotoPreview.value) {
            let url = editMainPhotoPreview.value;
            if (url.includes('/storage/buckets/') || !url.includes('/api/proxy-image')) url = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            try { const res = await fetch(url); if (res.ok) base64Image = await resize(await res.blob()); } catch (e) { }
        }

        let contextNotes = editForm.value.description || '';
        if (editForm.value.title) contextNotes = `Item Title: ${editForm.value.title}\n\n` + contextNotes;
        if (editForm.value.purchaseLocation) contextNotes += `\n\nItem URL: ${editForm.value.purchaseLocation}`;

        const response = await fetch(`/api/identify-item`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, imageUrl: editMainPhotoPreview.value, notes: contextNotes })
        });
        if (!response.ok) throw new Error("Analysis API failed");
        
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            if (data.items.length > 1) {
                scoutResult.value = data.items;
                let totalLow = 0, totalHigh = 0;
                let desc = `**LOT BREAKDOWN (${data.items.length} Items):**\n`;
                data.items.forEach((item, idx) => {
                    let raw = item.price_breakdown?.fair || item.price_breakdown?.mint, low = 0, high = 0;
                    if (typeof raw === 'object') {
                         low = parseFloat((raw.low || raw.min || raw.mint || 0).toString().replace(/,/g, ''));
                         high = parseFloat((raw.high || raw.max || raw.fair || low).toString().replace(/,/g, ''));
                    } else { 
                         const range = String(raw || '0').replace(/[$,]/g, '').trim().match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
                         if (range) { low = parseFloat(range[1]) || 0; high = parseFloat(range[2]) || 0; }
                         else { const single = String(raw || '0').replace(/[$,]/g, '').trim().match(/(\d+(?:\.\d+)?)/); if(single) { low = parseFloat(single[1]) || 0; high = low; } }
                    }
                    if (high < low) high = low; totalLow += low; totalHigh += high;
                    desc += `\n**${idx+1}. ${item.title || item.identity}** - Est: ${low === high ? `$${low.toFixed(2)}` : `$${low.toFixed(2)} - $${high.toFixed(2)}`}\n`;
                    if(item.condition_notes) desc += `- Condition: ${item.condition_notes}\n`;
                });
                if (totalLow > 0) editForm.value.estLow = totalLow.toFixed(2);
                if (totalHigh > 0) editForm.value.estHigh = totalHigh.toFixed(2);
                if(!editForm.value.description.includes("LOT BREAKDOWN")) editForm.value.description = (editForm.value.description + "\n\n" + desc).trim();
            } else {
                scoutResult.value = data.items[0];
                const item = scoutResult.value;
                if (!editForm.value.title || editForm.value.title === 'Untitled' || editForm.value.title === 'Untitled Item') editForm.value.title = item.title || item.identity;
                if (item.price_breakdown) {
                     const f = item.price_breakdown.fair || item.price_breakdown.mint;
                     const parts = (f || '').toString().replace(/,/g, '').match(/(\d+\.?\d*)/g);
                     if(parts && parts.length >= 2) { editForm.value.estLow = parseFloat(parts[0]).toFixed(2); editForm.value.estHigh = parseFloat(parts[1]).toFixed(2); }
                     else if(parts && parts.length === 1) { const val = parseFloat(parts[0]); editForm.value.estLow = val.toFixed(2); editForm.value.estHigh = val.toFixed(2); }
                     else {
                         const price = getRationalPrice(item);
                         if (price > 0) { editForm.value.estLow = price.toFixed(2); editForm.value.estHigh = price.toFixed(2); }
                     }
                }
                let report = `\n\n--- 🕵️ SCOUT REPORT ---\n`;
                if(item.condition_notes) report += `**Condition:** ${item.condition_notes}\n`;
                if(item.red_flags && item.red_flags.length > 0) report += `**🚩 Red Flags:** ${item.red_flags.join(', ')}\n`;
                if(item.price_breakdown) report += `**Valuation:** Mint: ${item.price_breakdown.mint}, Fair: ${item.price_breakdown.fair}, Poor: ${item.price_breakdown.poor}\n`;
                if(item.comparables && item.comparables.length > 0) { report += `**Comparables:**\n`; item.comparables.forEach(c => report += `- ${c.name} (${c.price}) [${c.status}]\n`); }
                if(item.keywords && item.keywords.length > 0) report += `**Keywords:** ${item.keywords.join(', ')}\n`;
                if(!editForm.value.description.includes("SCOUT REPORT")) editForm.value.description = (editForm.value.description + report).trim();
                if (item.fetched_image && !editMainPhotoPreview.value) {
                     const file = await urlToFile(item.fetched_image, `scout_auto_${Date.now()}.jpg`);
                     if (file) processFile(file, (f, u) => { editMainFile.value = f; editMainPhotoPreview.value = u; });
                }
            }
            descTab.value = 'edit';
        }
    } catch (e) { alert("Analysis Error: " + e.message); } finally { analyzing.value = false; }
};
</script>
