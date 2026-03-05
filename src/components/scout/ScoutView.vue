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
        <div v-if="activeCart" class="navbar bg-base-200 min-h-12 border-b border-base-300 px-4 sticky top-0 z-30">
            <div class="flex-1 text-sm">
                <span class="opacity-70 mr-2">🛒 Active Cart:</span>
                <span class="font-bold">{{ activeCart.source }}</span>
            </div>
            <div class="flex-none text-sm">
                <span class="badge badge-neutral mr-2">{{ cartItems ? cartItems.length : 0 }} Items</span>
                <a href="/cart" class="link link-primary no-underline font-bold">View Cart &rarr;</a>
            </div>
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
        <div class="modal-box p-0 bg-black w-full h-full max-h-none rounded-none max-w-none flex flex-col relative">
            <video ref="videoPreview" autoplay playsinline class="w-full h-full object-cover flex-1"></video>
            
            <!-- OVERLAYS -->
            <div class="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-start z-20">
                 <div class="badge badge-lg overflow-hidden transition-all" :class="images.length >= 5 ? 'badge-error' : 'badge-neutral'">
                    {{ images.length }} / 5 Photos
                 </div>
                 <button @click="closeCamera" class="btn btn-sm btn-circle btn-ghost text-white bg-black/20 backdrop-blur">✕</button>
            </div>

            <!-- IN-CAMERA TERMINALS -->
             <div v-if="images.length > 0" class="absolute left-0 right-0 bottom-32 z-20 px-4">
                 <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                     <div v-for="(img, idx) in images" :key="idx" class="relative w-16 h-16 shrink-0 rounded border-2 border-white/50 overflow-hidden shadow-lg animate-fade-in-up">
                         <img :src="img" class="w-full h-full object-cover" />
                     </div>
                 </div>
             </div>

            <div class="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 pb-safe z-50">
                <!-- Done Button (Left) -->
                <button v-if="images.length > 0" @click="closeCamera" class="btn btn-neutral rounded-full px-6 bg-white/20 backdrop-blur border-white/30 text-white min-w-[80px]">
                    Done
                </button>
                <div v-else class="w-[80px]"></div> <!-- Spacer -->

                <!-- Capture Button (Center) -->
                <button @click="capturePhoto" 
                    class="btn btn-circle h-20 w-20 border-4 shadow-xl transform active:scale-95 transition-all"
                    :class="images.length >= 5 ? 'btn-disabled border-gray-500 opacity-50' : 'btn-primary border-white'"
                >
                    <span class="sr-only">Capture</span>
                    <div class="w-16 h-16 rounded-full bg-white" :class="{'scale-90': capturing}"></div>
                </button>

                <!-- Switch Camera (Right) -->
                <button @click="switchCamera" class="btn btn-circle btn-ghost text-white bg-black/30 backdrop-blur-md w-[80px]">
                   <span class="text-2xl">🔄</span>
                </button>
            </div>
        </div>
    </dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { useCart } from '../../composables/useCart';
import { storage, databases, ID } from '../../lib/appwrite'; // Modified this line

// APPWRITE
const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID; // Added this line
const ITEMS_COL = import.meta.env.PUBLIC_APPWRITE_ITEMS_COL; // Added this line
const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// -- COMPOSABLES --
const { isAuthenticated, currentTeam, user } = useAuth();
const { 
    activeCart, addItemToCart, startCart, checkActiveCart, cartItems
} = useCart();

// -- LIFECYCLE --
onMounted(async () => {
    // Check for Re-Scout
    const urlParams = new URLSearchParams(window.location.search);
    const rescoutId = urlParams.get('rescout');
    
    if (rescoutId && databases) {
        console.log('[ScoutView] Re-scouting item:', rescoutId);
        analyzing.value = true;
        try {
            const itemDoc = await databases.getDocument(DB_ID, ITEMS_COL, rescoutId);
            if (itemDoc.rawAnalysis) {
                const analysis = JSON.parse(itemDoc.rawAnalysis);
                // Hydrate the view
                result.value = { items: [analysis] };
                console.log('[ScoutView] Hydrated analysis:', analysis);
                
                // Pre-fill inputs
                if(analysis.condition_notes) userNotes.value = analysis.condition_notes;
                
                // If it was already saved, we might want to know that, but user said "re run if need"
                // So we just show the result.
            } else {
                console.warn('[ScoutView] Item found but no rawAnalysis:', itemDoc);
                alert("This item was saved before the 'Re-Scout' feature was added. Cannot reload analysis.");
            }
        } catch (e) {
            console.error('[ScoutView] Failed to load re-scout item:', e);
            alert("Failed to load item for re-scouting.");
        } finally {
            analyzing.value = false;
        }
    }
});

// -- STATE --
const successMessage = ref<string | null>(null);
const error = ref<string | null>(null);
const mode = ref<'speed' | 'precision'>('speed');
const loading = ref(false);
const analyzing = ref(false); // Added for re-scout feature
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
const initCartCheck = async () => {
   if (user.value) {
        console.log('[ScoutView] User present, checking cart:', user.value.$id);
        await checkActiveCart(user.value.$id);
        console.log('[ScoutView] checkActiveCart complete. ActiveCart:', activeCart.value);
        if (activeCart.value) {
            purchaseLocation.value = activeCart.value.source || '';
        }
    }
};

onMounted(async () => {
    console.log('[ScoutView] onMounted');
    await initCartCheck();
});

// Watch for user to load if not ready on mount
watch(user, async (newUser) => {
    if (newUser) {
        console.log('[ScoutView] User loaded via watch, checking cart...');
        await initCartCheck();
    }
});

// -- CAMERA LOGIC --
const capturing = ref(false);

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

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraModal.value?.close();
}

function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    closeCamera();
    setTimeout(startCamera, 300); // Small delay to allow modal to stay open logic
}

function capturePhoto() {
    if (!stream || !videoPreview.value) return;
    if (images.value.length >= 5) return;

    capturing.value = true;
    setTimeout(() => capturing.value = false, 150);
    
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
        ctx.scale(currentFacingMode === 'user' ? -1 : 1, 1); // Mirror if front cam
        if (currentFacingMode === 'user') ctx.translate(-width, 0);
        
        ctx.drawImage(video as unknown as CanvasImageSource, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        images.value.push(dataUrl);
        
        canvas.toBlob(blob => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                imageFiles.value.push(file);
            }
        }, 'image/jpeg', 0.8);
    }
    // Don't close camera!
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
    console.log('[ScoutView] handleSaveItem callled for item:', item.identity);
    
    if (!user.value) {
        alert("Please login first.");
        return;
    }
    
    // Auto-select first team if currentTeam is stuck (Common issue on fresh load)
    if (!currentTeam.value && user.value.prefs?.teamId) {
        // We could try to switch, but for now just warn
        console.warn('[ScoutView] User has prefs.teamId but currentTeam is null');
    }

    if (!currentTeam.value) {
        // Fallback: Check useAuth teams list and pick one
        const { teams, switchTeam } = useAuth();
        if (teams.value && teams.value.length > 0) {
            console.log('[ScoutView] Auto-switching to first team:', teams.value[0].name);
            await switchTeam(teams.value[0]);
        } else {
            error.value = "Active Team Missing. Resale Command requires an active organization to save data.";
            alert("No active organization found. Please create one in the dashboard or navbar.");
            return;
        }
    }

    item.saving = true;
    try {
        // 1. Upload Images
        let galleryIds: string[] = [];
        if (imageFiles.value.length > 0 && BUCKET_ID) {
             console.log('[ScoutView] Uploading images...', imageFiles.value.length);
             const uploads = await Promise.all(imageFiles.value.map(file => 
                 storage.createFile(BUCKET_ID, ID.unique(), file)
             ));
             galleryIds = uploads.map(u => u.$id);
             console.log('[ScoutView] Images uploaded:', galleryIds);
        }
        
        // 2. Upload Receipt if present
        let receiptId: string | null = null;
        if (receiptFile.value && BUCKET_ID) {
             console.log('[ScoutView] Uploading receipt...');
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
            
            status: 'scouted',
            
            // Temporary storage for images/receipts until schema is perfect
            galleryImageIds: galleryIds,
            // imageId removed as it causes schema error
        };

        // Note Hack for Receipt
        if(receiptId) {
             itemPayload.conditionNotes += `\n[RECEIPT: ${receiptId}]`;
        }
        
        // Also note Location/Bin if needed as extra metadata (since cart handles location too)
        if(binLocation.value) {
            itemPayload.conditionNotes = `[BIN: ${binLocation.value}]\n` + itemPayload.conditionNotes;
        }

        // Save Full Analysis for Re-Scout
        try {
            itemPayload.rawAnalysis = JSON.stringify(item); 
        } catch (e) {
            console.error('[ScoutView] Failed to stringify analysis:', e);
        }

        // 4. Ensure Cart
        console.log('[ScoutView] Checking activeCart:', activeCart.value);
        if (!activeCart.value) {
             console.log('[ScoutView] No active cart, starting new one...');
             await startCart(purchaseLocation.value || "Quick Trip", currentTeam.value.$id, user.value.$id);
             console.log('[ScoutView] New cart started:', activeCart.value);
        }

        // 5. Save Item
        console.log('[ScoutView] Adding item to cart...', itemPayload);
        await addItemToCart(itemPayload);
        console.log('[ScoutView] Item added to cart successfully');
        
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
        console.error('[ScoutView] Save Failed:', e);
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
