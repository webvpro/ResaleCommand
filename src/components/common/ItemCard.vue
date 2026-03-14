<template>
    <div class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary transition-colors group relative cursor-pointer"
         :class="containerClass"
         @click="$emit('click-card', item)">
        
        <!-- Slot for absolute positioning (Checkbox, badges, etc.) -->
        <slot name="absolute-top-left"></slot>

        <!-- Image Area -->
        <figure class="bg-base-200 relative overflow-hidden group-hover:opacity-90 transition-opacity" :class="imageClass">
            <img v-if="imageUrl" :src="imageUrl" :alt="title" class="w-full h-full object-cover" />
            <div v-else class="flex flex-col items-center justify-center w-full h-full opacity-30 bg-base-300 p-2 text-4xl">
                📦
            </div>
            
            <!-- Status Badge -->
            <div class="absolute top-0 right-0 p-1 badge rounded-none rounded-bl-lg gap-1 font-bold z-10" :class="statusBadgeClass">
                {{ statusText }}
            </div>
            
            <slot name="image-overlay"></slot>
        </figure>

        <!-- Body Area -->
        <div class="card-body p-3 gap-1">
            <h2 class="font-bold leading-tight line-clamp-2" :class="titleClass">
                {{ title }}
            </h2>
            
            <!-- Subtitle/Location Slot -->
            <div v-if="locationText" class="text-xs opacity-60 truncate">📍 {{ locationText }}</div>
            
            <!-- Tags/Sales Channels -->
            <div v-if="tags && tags.length > 0" class="flex gap-1 flex-wrap mt-1">
                <span v-for="tag in tags" :key="tag" class="badge badge-[10px] badge-outline opacity-70 px-1 py-0">{{ tag }}</span>
            </div>
            
            <!-- Pricing Grid -->
            <div class="flex justify-between items-end mt-2 pt-2 border-t border-base-200">
                <div class="flex flex-col">
                    <span class="text-[10px] uppercase opacity-50 font-bold">Est Value</span>
                    <span class="text-sm font-bold text-success font-mono leading-none">
                        {{ formatCurrency(estValue) }}
                    </span>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[10px] uppercase opacity-50 font-bold">Paid</span>
                    <span class="text-xs font-mono opacity-80 leading-none">
                        {{ formatCurrency(paidValue) }}
                    </span>
                </div>
            </div>

            <!-- Footer Actions Slot (e.g., Quick Add, Delete) -->
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    item: { type: Object, required: true },
    compact: { type: Boolean, default: false } // Makes it look like the small inventory cards
});

defineEmits(['click-card']);

const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const BUCKET = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// --- COMPUTED STYLES ---
const containerClass = computed(() => props.compact ? 'text-xs min-[450px]:max-w-[180px]' : 'text-sm');
const imageClass = computed(() => props.compact ? 'aspect-square' : 'aspect-square md:aspect-[4/3] h-48 md:h-auto');
const titleClass = computed(() => props.compact ? 'text-xs h-[2.5em]' : 'text-base h-[3em]');

// --- COMPUTED DATA ---
const title = computed(() => props.item.title || props.item.identity || props.item.itemName || "Untitled Item");
const locationText = computed(() => props.item.binLocation || props.item.purchaseLocation || '');
const tags = computed(() => props.item.salesChannel || []);

const statusText = computed(() => {
    const s = props.item.status || 'received';
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

const statusBadgeClass = computed(() => {
    const s = props.item.status;
    if (s === 'received' || s === 'scouted') return 'badge-info badge-sm';
    if (s === 'acquired') return 'badge-secondary badge-sm';
    if (s === 'placed') return 'badge-success badge-sm';
    if (s === 'sold') return 'badge-neutral badge-sm';
    return 'badge-ghost badge-sm';
});

// --- PRICE PARSING ---
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
    // Try explicit resalePrice
    if (props.item.resalePrice) return props.item.resalePrice;
    
    // Try range properties
    if (props.item.estHigh) return parsePriceObj(props.item.estHigh);
    
    // Try breakdown
    if (props.item.price_breakdown?.fair) return parsePriceObj(props.item.price_breakdown.fair);
    
    // Try note parsing
    return getNoteValue(props.item.conditionNotes, 'Est. High', true) || 0;
});

const paidValue = computed(() => {
    return props.item.cost || props.item.purchasePrice || getNoteValue(props.item.conditionNotes, 'Paid', true) || 0;
});

const formatCurrency = (val) => {
    if(!val || parseFloat(val) === 0) return '-';
    const num = parseFloat(val.toString().replace('$',''));
    return isNaN(num) ? val : '$' + num.toFixed(2);
};

// --- IMAGE HELPERS ---
const imageUrl = computed(() => {
    const item = props.item;
    let id = item.imageId;
    if (!id && item.galleryImageIds?.length > 0) id = item.galleryImageIds[0];
    
    if (!id && item.conditionNotes) {
         const match = item.conditionNotes.match(/\[MAIN IMAGE ID: ([^\]]+)\]/);
         if (match) id = match[1].split(',')[0].trim();
    }
    
    if (!id) return null;
    
    // If it's a full http URL, proxy it if needed, or just return it if it's already an appwrite standard url
    if (id.startsWith('http')) {
        if (id.includes('/api/proxy-image') || id.includes('/storage/buckets/')) return id;
        return `/api/proxy-image?url=${encodeURIComponent(id)}`;
    }
    
    return `${ENDPOINT}/storage/buckets/${BUCKET}/files/${id}/view?project=${PROJECT}`;
});
</script>
