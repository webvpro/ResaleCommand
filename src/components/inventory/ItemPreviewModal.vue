<template>
    <dialog ref="previewModal" class="modal modal-bottom sm:modal-middle">
        <!-- Close overlay -->
        <form method="dialog" class="modal-backdrop">
            <button @click="close">close</button>
        </form>
        
        <div v-if="item" class="modal-box w-11/12 max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-base-100 shadow-2xl relative">
            
            <!-- Sticky Header -->
            <div class="navbar bg-base-200 border-b border-base-300 min-h-12 sticky top-0 z-20 px-4">
                <div class="flex-1">
                    <div class="badge badge-lg font-bold uppercase truncate" :class="statusBadgeClass">
                        {{ statusText }}
                    </div>
                    <span v-if="item.salesChannel && item.salesChannel.length > 0" class="ml-2 text-xs opacity-70 flex gap-1 items-center">
                        <span v-for="chan in item.salesChannel" :key="chan" class="badge badge-sm badge-outline">{{ chan }}</span>
                    </span>
                </div>
                <div class="flex-none gap-2">
                    <button class="btn btn-sm btn-primary" @click="editItem">
                        ✏️ Edit Item
                    </button>
                    <button class="btn btn-sm btn-circle btn-ghost" @click="close">✕</button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto w-full flex flex-col lg:flex-row">
                
                <!-- Left Column: Media -->
                <div class="w-full lg:w-5/12 bg-base-300 border-r border-base-300 flex flex-col relative shrink-0">
                    <!-- Main Image Area -->
                    <div class="w-full aspect-square relative bg-black/5 flex items-center justify-center overflow-hidden">
                        <img v-if="mainImage" :src="mainImage" class="w-full h-full object-contain" />
                        <div v-else class="text-6xl opacity-20">📦</div>
                        
                        <!-- Tags Overlay -->
                        <div class="absolute bottom-2 left-2 flex flex-wrap gap-1 z-10 pointer-events-none">
                             <span v-for="tag in (item.keywords || [])" :key="tag" class="badge badge-sm bg-base-100/80 backdrop-blur shadow-sm border-none">{{ tag }}</span>
                        </div>
                    </div>
                    
                    <!-- Thumbnail Gallery -->
                    <div class="p-2 flex gap-2 overflow-x-auto bg-base-200 border-t border-base-300" v-if="gallery.length > 1">
                        <button v-for="(img, i) in gallery" :key="i" 
                                @click="selectedIndex = i"
                                class="w-16 h-16 shrink-0 rounded border-2 overflow-hidden transition-all"
                                :class="selectedIndex === i ? 'border-primary shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'">
                            <img :src="img" class="w-full h-full object-cover" />
                        </button>
                    </div>
                    
                    <!-- Pricing Summary Box under images on Desktop -->
                    <div class="p-6 bg-base-200 flex-1 flex flex-col justify-end hidden lg:flex border-t border-base-300">
                         <div class="bg-base-100 rounded-xl p-4 shadow-sm border border-base-300">
                             <div class="flex justify-between items-end mb-2">
                                <span class="text-xs uppercase font-bold opacity-60">Estimated Resale Value</span>
                                <span class="text-2xl font-black text-success tracking-tight">{{ formatCurrency(estValue) }}</span>
                             </div>
                             <div class="flex justify-between items-end pb-3 border-b border-base-200 mb-3">
                                <span class="text-xs uppercase font-bold opacity-60">Cost / Paid</span>
                                <span class="text-lg font-bold opacity-80 font-mono">{{ formatCurrency(paidValue) }}</span>
                             </div>
                             <div class="flex justify-between items-center text-xs opacity-60 font-mono">
                                 <span>Max Buy Target:</span>
                                 <span>{{ formatCurrency(props.item.maxBuyPrice) }}</span>
                             </div>
                         </div>
                    </div>
                </div>

                <!-- Right Column: Details -->
                <div class="w-full lg:w-7/12 p-6 md:p-8 space-y-6 bg-base-100">
                    
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold leading-tight mb-2">{{ title }}</h1>
                        <div class="flex items-center gap-4 text-sm opacity-60 font-mono">
                            <span v-if="locationText" class="flex gap-1 items-center">📍 {{ locationText }}</span>
                            <span v-if="item.$id">ID: {{ item.$id.slice(-6) }}</span>
                        </div>
                    </div>

                    <!-- Mobile Pricing Box (Hidden on Desktop) -->
                    <div class="lg:hidden bg-base-200 rounded-xl p-4 shadow-sm border border-base-300">
                        <div class="flex justify-between items-end mb-2">
                            <span class="text-xs uppercase font-bold opacity-60">Est. Resale</span>
                            <span class="text-xl font-black text-success">{{ formatCurrency(estValue) }}</span>
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-xs uppercase font-bold opacity-60">Cost</span>
                            <span class="text-base font-bold opacity-80 font-mono">{{ formatCurrency(paidValue) }}</span>
                        </div>
                    </div>

                    <!-- Condition Notes -->
                    <div v-if="item.conditionNotes" class="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
                        <h3 class="font-bold text-warning-content text-sm uppercase mb-1">Condition Notes</h3>
                        <p class="whitespace-pre-wrap text-sm leading-relaxed text-warning-content/80">{{ item.conditionNotes }}</p>
                    </div>

                    <!-- Description / Scout Report -->
                    <div v-if="item.description" class="prose prose-sm max-w-none prose-headings:font-bold prose-headings:mt-4 prose-a:text-primary pb-8">
                        <div class="divider text-xs uppercase opacity-50 font-bold tracking-widest mt-0">Full Details</div>
                        <div v-html="renderedDescription" class="whitespace-pre-wrap"></div>
                    </div>
                    <div v-else class="text-center py-12 opacity-40">
                        <p class="italic text-lg">No additional description available.</p>
                    </div>

                </div>
            </div>
        </div>
    </dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps({
    item: { type: Object, default: null } // The item to preview. If null, modal is fully hidden.
});

const emit = defineEmits(['close', 'edit']);

const previewModal = ref(null);
const selectedIndex = ref(0);

const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const BUCKET = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// Watch for item changes to open modal and reset gallery
watch(() => props.item, (newItem) => {
    if (newItem) {
        selectedIndex.value = 0;
        previewModal.value?.showModal();
    } else {
        previewModal.value?.close();
    }
});

const close = () => {
    previewModal.value?.close();
    emit('close');
};

const editItem = () => {
    close();
    emit('edit', props.item);
};

// --- COMPUTED CONTENT ---
const title = computed(() => props.item?.title || props.item?.identity || props.item?.itemName || "Untitled Item");
const locationText = computed(() => props.item?.binLocation || props.item?.purchaseLocation || '');

const statusText = computed(() => {
    const s = props.item?.status || 'Active';
    return s.replace(/_/g, ' ');
});

const statusBadgeClass = computed(() => {
    const s = props.item?.status;
    if (s === 'received' || s === 'scouted') return 'badge-info';
    if (s === 'acquired') return 'badge-secondary';
    if (s === 'placed') return 'badge-success';
    if (s === 'sold') return 'badge-neutral';
    return 'badge-ghost';
});

const renderedDescription = computed(() => {
    if (!props.item?.description) return '';
    return marked.parse(props.item.description);
});

// --- PRICING ---
const getNoteValue = (notes, key, isCurrency = false) => {
    if (!notes) return null;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedKey}[:\\s]*([^\\n\\r]+)`, 'i');
    const match = notes.match(regex);
    if (match) {
        let val = match[1].trim();
        if (isCurrency) val = val.replace('$', '').trim();
        return val;
    }
    return null;
};

const parsePriceObj = (p) => {
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

const estValue = computed(() => {
    if (!props.item) return 0;
    if (props.item.resalePrice) return props.item.resalePrice;
    if (props.item.estHigh) return parsePriceObj(props.item.estHigh);
    return getNoteValue(props.item.conditionNotes, 'Est. High', true) || 0;
});

const paidValue = computed(() => {
    if (!props.item) return 0;
    return props.item.cost || props.item.purchasePrice || getNoteValue(props.item.conditionNotes, 'Paid', true) || 0;
});

const formatCurrency = (val) => {
    if(!val || parseFloat(val) === 0) return '-';
    const num = parseFloat(val.toString().replace('$',''));
    return isNaN(num) ? val : '$' + num.toFixed(2);
};

// --- IMAGES ---
const proxify = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('/api/proxy-image')) return url;
    if (url.includes('/storage/buckets/')) return url;
    if (url.startsWith('http')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return url;
};

const getAssetUrl = (id) => `${ENDPOINT}/storage/buckets/${BUCKET}/files/${id}/view?project=${PROJECT}`;

const gallery = computed(() => {
    if (!props.item) return [];
    
    // Check old array
    if (props.item.galleryImageIds && props.item.galleryImageIds.length > 0) {
        return props.item.galleryImageIds.map(id => {
            if (id.startsWith('http')) return proxify(id);
            return getAssetUrl(id);
        });
    }
    
    // Check single image
    if (props.item.imageId) {
        const id = props.item.imageId;
        return [id.startsWith('http') ? proxify(id) : getAssetUrl(id)];
    }
    
    return [];
});

const mainImage = computed(() => {
    if (gallery.value.length === 0) return null;
    if (selectedIndex.value >= gallery.value.length) return gallery.value[0];
    return gallery.value[selectedIndex.value];
});

</script>
