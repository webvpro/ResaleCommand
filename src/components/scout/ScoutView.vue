<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-base-100 overflow-hidden relative">
    
    <!-- ERROR TOAST -->
    <div v-if="error" class="toast toast-top toast-center z-[100]">
        <div class="alert alert-error shadow-lg">
            <span>{{ error }}</span>
            <button class="btn btn-xs btn-ghost" @click="error = null">✕</button>
        </div>
    </div>
    <!-- SUCCESS TOAST -->
    <div v-if="successMessage" class="toast toast-top toast-center z-[100]">
        <div class="alert alert-success shadow-lg text-white">
            <span>{{ successMessage }}</span>
        </div>
    </div>

    <!-- MAIN SCROLLABLE AREA -->
    <div class="flex-1 overflow-y-auto w-full bg-base-100 p-4 md:p-6 space-y-6 pb-32">
        
        <!-- HEADER -->
        <div class="text-center space-y-1">
            <h1 class="text-3xl font-bold text-primary">Resale Scout</h1>
            <p class="text-sm opacity-60">AI-Powered Item Identification & Valuation</p>
        </div>

        <!-- 1. INPUT SECTION -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-4">
                
                <!-- TABS -->
                <div class="tabs tabs-boxed justify-center mb-4 bg-base-200">
                    <a class="tab" :class="{ 'tab-active': mode === 'speed' }" @click="mode = 'speed'">⚡ Speed Scout</a>
                    <a class="tab" :class="{ 'tab-active': mode === 'precision' }" @click="mode = 'precision'">🔍 Precision</a>
                </div>

                <!-- IMAGE INPUTS -->
                <div class="form-control w-full">
                    <label class="label pt-0"><span class="label-text opacity-70">Capture or Upload Item(s)</span></label>
                    <div class="flex gap-2">
                        <button @click="startCamera" class="btn btn-outline gap-2 flex-1">
                            📷 Add Photo
                        </button>
                        <div class="join flex-1">
                            <button class="btn btn-primary join-item" @click="$refs.fileInput.click()">Choose Files</button>
                            <div class="btn btn-outline join-item no-animation cursor-default flex-1 opacity-70 text-xs font-normal overflow-hidden text-ellipsis whitespace-nowrap block pt-3">
                                {{ imageFiles.length > 0 ? `${imageFiles.length} files` : 'No file chosen' }}
                            </div>
                        </div>
                        <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple class="hidden" />
                    </div>
                </div>

                <!-- THUMBNAILS -->
                <div v-if="images.length > 0" class="flex gap-2 mt-4 overflow-x-auto pb-2">
                    <div v-for="(img, index) in images" :key="index" class="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-base-300 group">
                        <img :src="img" class="w-full h-full object-cover" />
                        <button @click="removeImage(index)" class="btn btn-circle btn-xs btn-error absolute top-1 right-1 opacity-90">✕</button>
                    </div>
                </div>

                <!-- ADDITIONAL DETAILS -->
                <div class="form-control mt-4">
                    <label class="label pt-0"><span class="label-text opacity-70">Additional Details (Optional) Size, Brand, Defects, etc.</span></label>
                    <textarea v-model="userNotes" class="textarea textarea-bordered h-24 text-sm" placeholder="e.g. Size Large, Nike tag from 2015, small tear on sleeve..."></textarea>
                </div>

                <!-- ANALYZE BUTTON -->
                <button @click="analyzeImage" class="btn btn-primary w-full mt-4 shadow-lg text-lg normal-case" :disabled="loading || images.length === 0">
                    <span v-if="loading" class="loading loading-spinner"></span>
                    <span v-else>✨ Analyze with Gemini</span>
                </button>
            </div>
        </div>

        <!-- 2. SHARED DETAILS SECTION (Only if results or manual entry) -->
        <div v-if="result || images.length > 0" class="card bg-base-100 shadow-sm border border-base-200">
             <div class="card-body p-4">
                <h3 class="font-bold text-lg">Details for All Items</h3>
                
                <div class="form-control w-full">
                    <label class="label"><span class="label-text opacity-70">Paid Price ($)</span></label>
                    <input v-model="paidPrice" type="number" step="0.01" class="input input-bordered w-full" placeholder="0.00" />
                </div>

                <div class="form-control w-full">
                    <label class="label"><span class="label-text opacity-70">Purchase Location / URL</span></label>
                    <div class="join w-full">
                        <input v-model="purchaseLocation" type="text" class="input input-bordered join-item w-full" placeholder="e.g. Goodwill, Garage Sale" />
                        <button class="btn btn-outline btn-square join-item">📍</button>
                    </div>
                </div>
                
                 <div class="form-control w-full">
                    <label class="label"><span class="label-text opacity-70">Cart / Bin Location</span></label>
                    <input v-model="binLocation" type="text" class="input input-bordered w-full" placeholder="e.g. Front Cart, Blue Bin" />
                </div>

                <div class="form-control w-full">
                    <label class="label"><span class="label-text opacity-70">Receipt Photo (Optional)</span></label>
                    <div class="join w-full">
                         <button class="btn btn-outline join-item" @click="$refs.receiptInput.click()">Choose File</button>
                         <input type="text" readonly class="input input-bordered join-item w-full text-xs opacity-70" :value="receiptFile ? receiptFile.name : 'No file chosen'" />
                    </div>
                    <input type="file" ref="receiptInput" @change="handleReceiptUpload" accept="image/*" class="hidden" />
                </div>
             </div>
        </div>

        <!-- 3. RESULTS (ITEM CARDS) -->
        <div v-if="result" class="space-y-6">
            <div v-for="(item, index) in (result.items || [])" :key="index" class="card bg-base-100 shadow-lg border-t-4 border-t-primary">
                <div class="card-body p-4 md:p-6">
                    
                    <!-- Header -->
                    <div class="flex justify-between items-start gap-4">
                        <h2 class="text-xl font-bold text-primary">{{ item.identity || 'Unidentified Item' }}</h2>
                        <div class="badge badge-neutral">#{{ index + 1 }}</div>
                    </div>

                    <!-- Pricing Grid -->
                    <div class="grid grid-cols-3 gap-2 text-center mt-2">
                        <div class="bg-base-200 rounded p-2 flex flex-col">
                            <span class="text-[10px] uppercase font-bold opacity-50">NEW/MINT</span>
                            <span class="text-success font-bold text-sm md:text-base">{{ item.price_breakdown?.mint || '-' }}</span>
                        </div>
                        <div class="bg-primary/10 rounded p-2 flex flex-col border border-primary/20">
                            <span class="text-[10px] uppercase font-bold opacity-50 text-primary">USED/FAIR</span>
                            <span class="text-primary font-bold text-lg md:text-xl">{{ item.price_breakdown?.fair || '-' }}</span>
                        </div>
                        <div class="bg-base-200 rounded p-2 flex flex-col">
                            <span class="text-[10px] uppercase font-bold opacity-50">POOR</span>
                            <span class="text-warning font-bold text-sm md:text-base">{{ item.price_breakdown?.poor || '-' }}</span>
                        </div>
                    </div>

                    <!-- Quick Max Buy -->
                    <div class="bg-black text-white p-3 rounded-lg flex justify-between items-center mt-2 shadow-md">
                        <span class="font-bold text-sm">Quick Max Buy (Est)</span>
                        <span class="font-bold text-success text-lg">~${{ calculateMaxBuy(item.price_breakdown?.fair) }}</span>
                    </div>

                    <!-- Comparables Dropdown -->
                    <div class="collapse collapse-arrow bg-base-200 rounded-box mt-4">
                        <input type="checkbox" /> 
                        <div class="collapse-title font-bold text-sm">
                             View Market Comparables
                        </div>
                        <div class="collapse-content"> 
                            <table class="table table-xs w-full">
                                <thead>
                                    <tr><th>Item</th><th>Price</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(comp, i) in (item.comparables || [])" :key="i">
                                        <td>{{ comp.name }}</td>
                                        <td class="font-mono font-bold">{{ comp.price }}</td>
                                    </tr>
                                    <tr v-if="!item.comparables?.length">
                                        <td colspan="2" class="text-center opacity-50 italic">No comparables found</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Editable Fields -->
                    <div class="form-control mt-4">
                        <label class="label"><span class="label-text font-bold opacity-70">Suggested Title</span></label>
                        <div class="relative">
                            <input v-model="item.title" type="text" class="input input-bordered w-full font-bold text-sm pr-8" />
                            <span class="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">📋</span>
                        </div>
                    </div>

                    <div class="mt-4">
                        <label class="label pt-0"><span class="label-text font-bold opacity-70">Keywords</span></label>
                        <div class="flex flex-wrap gap-1">
                            <span v-for="kw in (item.keywords || [])" :key="kw" class="badge badge-outline bg-base-100 text-xs">{{ kw }}</span>
                            <span v-if="!item.keywords?.length" class="text-xs opacity-50 italic">No keywords generated</span>
                        </div>
                    </div>

                    <div class="form-control mt-4">
                         <label class="label"><span class="label-text font-bold opacity-70">Condition Notes</span></label>
                         <p class="text-xs opacity-70 mb-2 border-l-2 border-base-300 pl-2 italic">
                            {{ item.condition_notes || 'No notes generated.' }}
                         </p>
                    </div>

                    <!-- SAVE BUTTON -->
                    <button @click="handleSaveItem(item, index)" 
                            class="btn btn-outline btn-primary w-full mt-6"
                            :disabled="item.saving || item.saved">
                        <span v-if="item.saving" class="loading loading-spinner"></span>
                        {{ item.saved ? '✅ Saved to Cart' : 'Save Item' }}
                    </button>

                </div>
            </div>
        </div>

    </div>

    <!-- CAMERA MODAL (Full Screen Overlay) -->
    <dialog ref="cameraModal" class="modal">
        <div class="modal-box p-0 bg-black w-full h-full max-h-none rounded-none max-w-none flex flex-col">
            <video ref="videoPreview" autoplay playsinline class="w-full h-full object-cover flex-1"></video>
            
            <div class="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 pb-safe z-50">
                <button @click="stopCamera" class="btn btn-circle btn-ghost text-white bg-black/30 backdrop-blur-md">✕</button>
                <button @click="capturePhoto" class="btn btn-circle btn-primary h-20 w-20 border-4 border-white shadow-xl transform active:scale-95 transition-all">
                    <span class="sr-only">Capture</span>
                </button>
                <button @click="switchCamera" class="btn btn-circle btn-ghost text-white bg-black/30 backdrop-blur-md">
                   🔄
                </button>
            </div>
        </div>
    </dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { useCart } from '../../composables/useCart';
import { storage, ID } from '../../lib/appwrite';

const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// -- COMPOSABLES --
const { isAuthenticated, currentTeam, user } = useAuth();
const { 
    activeCart, addItemToCart, startCart, checkActiveCart
} = useCart();

// -- STATE --
const successMessage = ref<string | null>(null);
const error = ref<string | null>(null);
const mode = ref<'speed' | 'precision'>('speed');
const loading = ref(false);
const images = ref<string[]>([]);
const imageFiles = ref<File[]>([]); 
const receiptFile = ref<File | null>(null);
const userNotes = ref('');

// Shared Inputs
const paidPrice = ref('');
const purchaseLocation = ref('');
const binLocation = ref('');

const result = ref<any>(null);

// Camera
const cameraModal = ref<HTMLDialogElement | null>(null);
const videoPreview = ref<HTMLVideoElement | null>(null);
let stream: MediaStream | null = null;
let currentFacingMode = 'environment';

// -- INIT --
onMounted(async () => {
    if (user.value) {
        await checkActiveCart(user.value.$id);
        if (activeCart.value) {
            purchaseLocation.value = activeCart.value.source || '';
        }
    }
});

// -- CAMERA LOGIC --
async function startCamera() {
    try {
        cameraModal.value?.showModal();
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode } 
        });
        if (videoPreview.value) {
            videoPreview.value.srcObject = stream;
        }
    } catch (err: any) {
        console.error("Camera Error:", err);
        alert("Could not access camera: " + err.message);
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraModal.value?.close();
}

function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    setTimeout(startCamera, 300); // Small delay to allow modal to stay open logic
}

function capturePhoto() {
    if (!stream || !videoPreview.value) return;
    
    const video = videoPreview.value;
    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 1080;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        images.value.push(dataUrl);
        
        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                imageFiles.value.push(file);
            }
        }, 'image/jpeg', 0.8);
    }
    
    stopCamera();
}

function removeImage(index: number) {
    images.value.splice(index, 1);
    imageFiles.value.splice(index, 1);
    if (images.value.length === 0) result.value = null;
}

// -- FILE UPLOAD --
async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
        for (let i = 0; i < input.files.length; i++) {
             await processFile(input.files[i]);
        }
        input.value = ''; 
    }
}

function handleReceiptUpload(e: Event) {
     const input = e.target as HTMLInputElement;
     if (input.files && input.files[0]) {
         receiptFile.value = input.files[0];
     }
}

async function processFile(file: File) {
    if (images.value.length >= 5) return;
    if (!file.type.startsWith('image/')) return;

    return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                const img = new Image();
                img.onload = () => {
                    // Resize logic for display/API
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1080;
                    let width = img.width;
                    let height = img.height;
                     if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                     const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    images.value.push(dataUrl);
                    imageFiles.value.push(file);
                    resolve();
                };
                img.src = e.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    });
}

// -- ANALYSIS --
async function analyzeImage() {
    if (!images.value.length) return;
    loading.value = true;
    error.value = null;
    
    try {
        const payload = JSON.stringify({ 
            images: images.value,
            notes: userNotes.value 
        });

        const response = await fetch(`/api/identify-item`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.details || err.error || 'Server Error');
        }

        const data = await response.json();
        
        if (data && !data.items && (data.identity || data.title)) {
            result.value = { items: [{ ...data }] };
        } else {
            result.value = data;
        }

    } catch (e: any) {
        console.error(e);
        error.value = `Analysis Failed: ${e.message}`;
    } finally {
        loading.value = false;
    }
}

// -- PRICE HELPERS --
function parsePrice(priceStr: string) {
    if (!priceStr) return 0;
    const matches = priceStr.match(/[0-9.]+/g);
    if (!matches || !matches.length) return 0;
    if (matches.length >= 2) {
         return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2; 
    }
    return parseFloat(matches[0]);
}

function calculateMaxBuy(fairPriceStr: string) {
    const fair = parsePrice(fairPriceStr);
    return Math.floor(fair * 0.4); // 40% rule placeholder
}

// -- SAVE ACTION --
async function handleSaveItem(item: any, index: number) {
    if (!user.value || !currentTeam.value) {
        alert("Please login first.");
        return;
    }

    item.saving = true;
    try {
        // 1. Upload Images
        let galleryIds: string[] = [];
        if (imageFiles.value.length > 0 && BUCKET_ID) {
             const uploads = await Promise.all(imageFiles.value.map(file => 
                 storage.createFile(BUCKET_ID, ID.unique(), file)
             ));
             galleryIds = uploads.map(u => u.$id);
        }
        
        // 2. Upload Receipt if present
        let receiptId = null;
        if (receiptFile.value && BUCKET_ID) {
             const up = await storage.createFile(BUCKET_ID, ID.unique(), receiptFile.value);
             receiptId = up.$id;
        }

        // 3. Prepare Payload
        const itemPayload: any = {
            identity: item.identity,
            title: item.title || item.identity,
            keywords: item.keywords || [],
            conditionNotes: (userNotes.value ? `User Note: ${userNotes.value}\n` : '') + (item.condition_notes || ''),
            redFlags: item.red_flags || [],
            
            paidPrice: paidPrice.value ? parseFloat(paidPrice.value) : 0,
            resalePrice: parsePrice(item.price_breakdown?.fair),
            maxBuyPrice: calculateMaxBuy(item.price_breakdown?.fair),
            
            purchaseLocation: purchaseLocation.value,
            binLocation: binLocation.value,
            
            status: 'in_cart',
            
            // Temporary storage for images/receipts until schema is perfect
            galleryImageIds: galleryIds,
            imageId: galleryIds[0] || null,
        };

        // Note Hack for Receipt
        if(receiptId) {
             itemPayload.conditionNotes += `\n[RECEIPT: ${receiptId}]`;
        }
        
        // Also note Location/Bin if needed as extra metadata (since cart handles location too)
        if(binLocation.value) {
            itemPayload.conditionNotes = `[BIN: ${binLocation.value}]\n` + itemPayload.conditionNotes;
        }

        // 4. Ensure Cart
        if (!activeCart.value) {
             await startCart(purchaseLocation.value || "Quick Trip", currentTeam.value.$id, user.value.$id);
        }

        // 5. Save Item
        await addItemToCart(itemPayload);
        
        item.saved = true;
        successMessage.value = `Saved ${item.identity}!`;

        // Reset inputs smoothly
        setTimeout(() => {
            successMessage.value = null;
            // Clear lists for next scan if in speed mode? 
            // Or maybe just clear this item from result list.
            // For now, let user manually decide when to clear all.
        }, 2000);

    } catch (e: any) {
        console.error(e);
        error.value = "Save Failed: " + e.message;
    } finally {
        item.saving = false;
    }
}
</script>

<style scoped>
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
