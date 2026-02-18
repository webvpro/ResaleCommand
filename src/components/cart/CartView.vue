<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-base-100 overflow-hidden relative">
      
      <!-- ERROR TOAST -->
      <div v-if="error" class="toast toast-top toast-center z-100">
          <div class="alert alert-error shadow-lg">
              <span>{{ error }}</span>
              <button class="btn btn-xs btn-ghost" @click="error = null">✕</button>
          </div>
      </div>

      <div v-if="loading" class="flex justify-center flex-1 items-center">
          <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="!activeCart" class="hero bg-base-200 flex-1">
          <div class="hero-content text-center">
              <div class="max-w-md">
                  <h1 class="text-5xl font-bold">🛒 Resale Cart</h1>
                  <p class="py-6">No active shopping trip found. Start scouting to build your cart!</p>
                  <a href="/scout" class="btn btn-primary">Start Scouting</a>
              </div>
          </div>
      </div>

      <div v-else class="flex flex-col h-full"> 
          <!-- HEADER -->
          <div class="navbar bg-base-100 shadow-md z-10 px-4">
              <div class="flex-1">
                  <h2 class="text-xl font-bold truncate">Current Trip: {{ activeCart.source }}</h2>
                  <div class="badge badge-accent ml-2">{{ cartItems.length }} Items</div>
              </div>
              <div class="flex-none">
                  <div class="text-right text-xs opacity-70">
                      <div>Total Est: <span class="text-success font-bold">${{ cartTotalResale.toFixed(0) }}</span></div>
                      <div>Spent: <span class="text-warning font-bold">${{ totalSpend.toFixed(2) }}</span></div>
                  </div>
              </div>
          </div>

          <!-- MAIN SCROLLABLE CONTENT -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
              
              <!-- ITEMS LIST -->
              <div class="space-y-4">
                  <div v-for="item in cartItems" :key="item.$id" class="card card-side bg-base-100 shadow-sm border border-base-200 compact">
                      <figure class="w-24 h-24 bg-base-300 relative">
                           <img v-if="item.galleryImageIds && item.galleryImageIds.length > 0" :src="getImageUrl(item.galleryImageIds[0])" class="w-full h-full object-cover" />
                           <div v-else class="flex items-center justify-center w-full h-full text-2xl opacity-20">📦</div>
                      </figure>
                      <div class="card-body p-4">
                          <div class="flex justify-between items-start">
                              <h3 class="card-title text-sm line-clamp-2 flex-1 mr-2">{{ item.title || item.identity }}</h3>
                              
                              <!-- Actions Menu -->
                              <div class="dropdown dropdown-end">
                                  <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">⋮</label>
                                  <ul tabindex="0" class="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-200">
                                      <li><a @click="openEditModal(item)">✏️ Edit</a></li>
                                      <li><a :href="`/scout?rescout=${item.$id}`">🔍 Open in Scout</a></li>
                                      <li><a @click="handleDeleteItem(item.$id)" class="text-error">🗑️ Delete</a></li>
                                  </ul>
                              </div>
                          </div>
                          
                          <div class="flex justify-between items-center text-xs mt-2 gap-2">
                              <span class="badge badge-ghost badge-sm shrink-0">Paid: ${{ item.paidPrice }}</span>
                              
                              <!-- Profit Meter -->
                              <div class="flex-1 bg-base-200 h-6 rounded-full overflow-hidden relative flex items-center">
                                  <!-- Meter Bar -->
                                  <div :class="[getProfitColor(item), getProfitWidth(item)]" class="h-full transition-all duration-500"></div>
                                  
                              <!-- Text Overlay -->
                                  <div class="absolute inset-0 flex justify-between items-center px-3 font-bold z-10 text-[10px] text-black">
                                      <span class="opacity-70 uppercase tracking-wider">{{ item.condition || 'Mix' }}</span>
                                      <span>Est: ${{ item.resalePrice }} <span v-if="getROI(item) !== null" class="ml-1 opacity-80">({{ getROI(item) }}%)</span></span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

               <!-- EDIT SIDE PANEL -->
              <div v-if="editingItem" class="fixed inset-0 z-50 flex justify-end transition-opacity duration-300">
                  <!-- Backdrop -->
                  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeEdit"></div>
                  
                  <!-- Panel -->
                  <div class="relative w-full max-w-lg md:max-w-xl bg-base-100 h-full shadow-2xl flex flex-col border-l border-base-200 anim-slide-in z-50">
                      
                      <!-- Header -->
                      <div class="flex justify-between items-center p-4 border-b border-base-200 bg-base-100 flex-none sticky top-0 z-20">
                          <h3 class="font-bold text-lg">Edit Item</h3>
                          <button @click="closeEdit" class="btn btn-sm btn-circle btn-ghost">✕</button>
                      </div>

                      <!-- Scrollable Content -->
                      <div class="flex-1 overflow-y-auto p-6 space-y-6">
                          
                          <!-- Title -->
                          <div class="form-control w-full">
                              <label class="label"><span class="label-text font-bold">Item Title</span></label>
                              <input type="text" v-model="editingItem.title" class="input input-bordered w-full font-bold" />
                          </div>

                          <!-- Prices -->
                          <div class="grid grid-cols-2 gap-4">
                               <div class="form-control w-full">
                                  <label class="label"><span class="label-text">Paid Price</span></label>
                                  <label class="input input-bordered flex items-center gap-2">
                                      <span class="opacity-50">$</span>
                                      <input type="number" step="0.01" v-model.number="editingItem.paidPrice" class="grow" placeholder="0.00" />
                                  </label>
                              </div>
                               <div class="form-control w-full">
                                  <label class="label"><span class="label-text">List Price</span></label>
                                   <label class="input input-bordered flex items-center gap-2">
                                      <span class="opacity-50">$</span>
                                      <input type="number" step="0.01" v-model.number="editingItem.resalePrice" class="grow" placeholder="0.00" />
                                  </label>
                              </div>
                          </div>

                          <!-- Item Link -->
                          <div class="form-control w-full">
                              <label class="label"><span class="label-text">Item Link (for Image Fetch)</span></label>
                              <div class="join w-full">
                                  <input type="text" v-model="editingItem.url" class="input input-bordered join-item w-full font-mono text-sm" placeholder="https://..." />
                                  <a v-if="editingItem.url" :href="editingItem.url" target="_blank" class="btn btn-square join-item">🔗</a>
                              </div>
                          </div>

                          <!-- Photos Section -->
                          <div class="form-control">
                              <label class="label"><span class="label-text font-bold">Photos</span></label>
                              
                              <!-- Main Photo -->
                              <div class="flex gap-4 items-center mb-2">
                                  <div class="w-24 h-24 rounded-lg overflow-hidden border border-base-300 bg-base-200 relative shrink-0">
                                      <img v-if="editMainPhotoPreview" :src="editMainPhotoPreview" class="w-full h-full object-cover" />
                                      <img v-else-if="editingItem.imageId" :src="getImageUrl(editingItem.imageId)" class="w-full h-full object-cover" />
                                      <img v-else-if="editingItem.galleryImageIds?.length" :src="getImageUrl(editingItem.galleryImageIds[0])" class="w-full h-full object-cover" />
                                      <div v-else class="flex items-center justify-center text-2xl opacity-50 w-full h-full">📦</div>
                                  </div>
                                  <div class="flex flex-col gap-2 flex-1">
                                       <span class="text-xs font-bold opacity-70">Main Photo</span>
                                       <input type="file" @change="handleFileSelect($event, 'main')" accept="image/*" class="file-input file-input-sm file-input-bordered w-full" />
                                  </div>
                              </div>

                              <!-- Gallery -->
                              <div class="flex gap-2 overflow-x-auto pb-2 min-h-20 bg-base-200/50 p-2 rounded-lg">
                                    <div v-for="id in editForm.existingGalleryIds" :key="id" class="relative w-16 h-16 shrink-0 group">
                                        <img :src="getImageUrl(id)" class="w-full h-full object-cover rounded border border-base-300" />
                                        <button @click="removeGalleryItem(id, true)" class="btn btn-xs btn-circle btn-error absolute -top-1 -right-1 w-4 h-4 min-h-0 text-[10px] flex items-center justify-center">✕</button>
                                    </div>
                                    <div v-for="(file, idx) in editGalleryBuffer" :key="idx" class="relative w-16 h-16 shrink-0 group">
                                        <img :src="getObjectUrl(file)" class="w-full h-full object-cover rounded border border-base-300" />
                                        <button @click="removeGalleryItem(idx, false)" class="btn btn-xs btn-circle btn-error absolute -top-1 -right-1 w-4 h-4 min-h-0 text-[10px] flex items-center justify-center">✕</button>
                                    </div>
                                    <div class="w-16 h-16 shrink-0 border-2 border-dashed border-base-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-base-100" @click="triggerGalleryInput">
                                        <span class="text-xl">📷</span>
                                        <span class="text-[9px] font-bold">Add</span>
                                    </div>
                                    <input type="file" ref="galleryInput" multiple accept="image/*" class="hidden" @change="handleFileSelect($event, 'gallery')" />
                              </div>
                          </div>

                          <!-- Scout Result Card -->
                          <div v-if="scoutResult" class="bg-base-200 rounded-xl p-4 border border-base-300 shadow-inner mt-4">
                            <div class="flex justify-between items-start mb-2">
                                 <h4 class="font-bold text-sm uppercase opacity-70">Scout Report</h4>
                                 <div  v-if="scoutResult[0].red_flags && scoutResult[0].red_flags.length > 0" class="badge badge-warning gap-1">
                                    🚩 {{ scoutResult[0].red_flags.length }} Flags
                                 </div>
                            </div>
                            
                            <!-- Report Content -->
                            <div class="space-y-3">
                                <!-- Red Flags Detail -->
                                <div v-if="scoutResult[0].red_flags && scoutResult[0].red_flags.length > 0" class="text-xs text-warning-content bg-warning/10 p-2 rounded">
                                    {{ scoutResult[0].red_flags.join(', ') }}
                                </div>
                                
                                <!-- Valuation Grid -->
                                <div v-if="scoutResult[0].price_breakdown" class="grid grid-cols-3 gap-2">
                                    <div @click="editingItem.condition = 'New/Mint'" class="flex flex-col items-center bg-base-100 p-2 rounded border cursor-pointer hover:border-success transition-all" :class="editingItem.condition === 'New/Mint' ? 'border-success ring-1 ring-success' : 'border-base-200'">
                                        <span class="text-[10px] uppercase font-bold text-success">Mint</span>
                                        <span class="font-mono font-bold">{{ formatPriceOnly(scoutResult[0].price_breakdown.mint) }}</span>
                                    </div>
                                    <div @click="editingItem.condition = 'Used/Fair'" class="flex flex-col items-center bg-base-100 p-2 rounded border cursor-pointer hover:border-primary transition-all" :class="(editingItem.condition === 'Used/Fair' || !editingItem.condition) ? 'border-primary ring-1 ring-primary' : 'border-base-200'">
                                        <span class="text-[10px] uppercase font-bold text-primary">Fair</span>
                                        <span class="font-mono font-bold">{{ formatPriceOnly(scoutResult[0].price_breakdown.fair) }}</span>
                                    </div>
                                    <div @click="editingItem.condition = 'Poor'" class="flex flex-col items-center bg-base-100 p-2 rounded border cursor-pointer hover:border-error transition-all" :class="editingItem.condition === 'Poor' ? 'border-error ring-1 ring-error' : 'border-base-200'">
                                        <span class="text-[10px] uppercase font-bold text-error">Poor</span>
                                        <span class="font-mono font-bold">{{ formatPriceOnly(scoutResult[0].price_breakdown.poor) }}</span>
                                    </div>
                                </div>
    
                                <!-- Comparables -->
                                <div v-if="scoutResult[0].comparables && scoutResult[0].comparables.length > 0" class="collapse collapse-arrow bg-base-100 border border-base-200 rounded-box">
                                    <input type="checkbox" /> 
                                    <div class="collapse-title text-xs font-bold flex justify-between py-2 min-h-0">
                                         <span>Market Comps ({{ scoutResult[0].comparables.length }})</span>
                                    </div>
                                    <div class="collapse-content px-2">
                                        <div class="space-y-1 pt-1">
                                            <div v-for="(comp, cIdx) in scoutResult[0].comparables" :key="cIdx" class="flex justify-between items-center text-[11px] p-1 border-b border-base-100 last:border-0">
                                                <a :href="comp.link" target="_blank" class="truncate pr-2 max-w-[200px] hover:text-primary hover:underline">{{ comp.name }}</a>
                                                <span class="font-mono font-bold">{{ comp.price }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status -->
                        <div class="form-control w-full mt-4">
                            <label class="label"><span class="label-text font-bold">Item Status</span></label>
                            <select v-model="editingItem.status" class="select select-bordered w-full">
                                <option value="active">Active (In Cart)</option>
                                <option value="purchased">Purchased</option>
                                <option value="listed">Listed</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>
    
                        <!-- Actions -->
                        <div class="form-control w-full mt-4">
                             <button class="btn btn-secondary w-full gap-2 shadow-sm" @click="runScout" :disabled="analyzing">
                                <span v-if="analyzing" class="loading loading-spinner loading-xs"></span>
                                <span v-else>
                                    <span v-if="scoutResult">🔄 Update Scout Report</span>
                                    <span v-else>✨ Run Scout Analysis</span>
                                </span>
                            </button>
                        </div>
                      </div>

                      <!-- Footer (Fixed/Sticky) -->
                      <div class="p-4 border-t border-base-200 bg-base-100 flex-none z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                          <button @click.prevent="saveEdit" class="btn btn-primary w-full btn-lg shadow-lg">Save Changes</button>
                      </div>
                  </div>
              </div>

              <!-- EXPENSES SECTION -->
              <div class="divider text-xs opacity-50 uppercase">Expenses</div>
              <div class="collapse collapse-arrow bg-base-100 border border-base-200 rounded-box">
                  <input type="checkbox" /> 
                  <div class="collapse-title font-medium text-sm">
                      Misc Expenses ({{ cartExpenses.length }}) - ${{ expensesCost.toFixed(2) }}
                  </div>
                  <div class="collapse-content space-y-2"> 
                       <ul class="menu bg-base-200 w-full rounded-box">
                          <li v-for="exp in cartExpenses" :key="exp.$id">
                              <a class="flex justify-between">
                                  <span>{{ exp.note || 'Expense' }}</span>
                                  <span class="font-bold">${{ exp.amount }}</span>
                              </a>
                          </li>
                       </ul>
                       <div class="join w-full mt-2">
                          <input v-model="newExpenseNote" class="input input-bordered input-sm join-item w-full" placeholder="Note (e.g. Lunch)" />
                          <input v-model.number="newExpenseAmount" class="input input-bordered input-sm join-item w-20" type="number" placeholder="$" />
                          <button @click="handleAddExpense" class="btn btn-sm btn-neutral join-item" :disabled="!newExpenseAmount">Add</button>
                       </div>
                  </div>
              </div>

          </div>

          <!-- FOOTER ACTIONS -->
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-base-100 via-base-100 to-transparent pt-8">
              <button @click="handleFinishCart" class="btn btn-primary w-full shadow-lg text-lg">
                  ✅ Complete Trip (${{ totalSpend.toFixed(2) }})
              </button>
              <div class="text-center mt-2">
                  <button @click="startNew" class="btn btn-link btn-xs text-error no-underline">Abort / Start New</button>
              </div>
          </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { storage, databases, ID } from '../../lib/appwrite';
import { useCart, type CartItem } from '../../composables/useCart';
import { useAuth } from '../../composables/useAuth';

const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

const { user } = useAuth();
const { 
  activeCart, cartItems, cartExpenses, loading, 
  checkActiveCart, addExpense, finishCart, leaveCart,
  deleteItem, updateItem
} = useCart();

const newExpenseNote = ref('');
const newExpenseAmount = ref<number | ''>(''); 

// -- EDIT STATE --
const editingItem = ref<CartItem | null>(null);

function openEditModal(item: CartItem) {
    editingItem.value = { ...item }; 
    
    // Parse rawAnalysis for Scout Report
    scoutResult.value = null;
    if (item.rawAnalysis) {
        try {
            const parsed = JSON.parse(item.rawAnalysis);
            // Ensure array structure (legacy or new format)
            if (Array.isArray(parsed)) {
                scoutResult.value = parsed;
            } else if (parsed.items && Array.isArray(parsed.items)) {
                scoutResult.value = parsed.items;
            } else {
                scoutResult.value = [parsed];
            }
        } catch (e) {
            console.error('Failed to parse rawAnalysis', e);
        }
    }
    
    // Initialize Gallery State
    editMainPhotoPreview.value = null;
    editMainFile.value = null;
    editGalleryBuffer.value = [];
    editForm.value.existingGalleryIds = [...item.galleryImageIds];
}

function closeEdit() {
    editingItem.value = null;
    scoutResult.value = null;
}

// -- SCOUT REPORT HELPERS --
const scoutResult = ref<any>(null);
const analyzing = ref(false);

const scoutTotalRange = computed(() => {
    if (!scoutResult.value || !Array.isArray(scoutResult.value)) return null;
    // ... logic maintained ...
    // Simplified return here as it was just helper logic
    return null; // Not strictly used in new UI, we use formatPriceOnly
});

function formatPriceRange(val: any) {
    if (!val) return '-';
    if (typeof val === 'object' && val !== null) {
        const low = val.low ?? val.Low ?? val.min ?? val.Min;
        const high = val.high ?? val.High ?? val.max ?? val.Max;
        if (low !== undefined && high !== undefined) return `$${low} - $${high}`;
        return JSON.stringify(val).replace(/[{}"]/g, '').replace(/,/g, ', ');
    }
    return val;
}

function formatPriceOnly(val: any) {
    if (!val) return '';
    const s = formatPriceRange(val);
    return String(s).split(/[a-z(]/i)[0].trim(); // Simple parser
}

async function saveEdit() {
    if (!editingItem.value) return;
    
    try {
        // Upload new images logic
        let newGalleryIds: string[] = [];
        if (editGalleryBuffer.value.length > 0 && BUCKET_ID) {
              const uploads = await Promise.all(editGalleryBuffer.value.map(file => 
                  storage.createFile(BUCKET_ID, ID.unique(), file)
              ));
              newGalleryIds = uploads.map(u => u.$id);
        }
        
        const finalGalleryIds = [...editForm.value.existingGalleryIds, ...newGalleryIds];
        
        let newMainId = editingItem.value.imageId;
        if (editMainFile.value && BUCKET_ID) {
             const up = await storage.createFile(BUCKET_ID, ID.unique(), editMainFile.value);
             newMainId = up.$id;
        }

        await updateItem(editingItem.value.$id, {
            title: editingItem.value.title,
            paidPrice: editingItem.value.paidPrice,
            resalePrice: editingItem.value.resalePrice,
            condition: editingItem.value.condition, 
            conditionNotes: editingItem.value.conditionNotes,
            galleryImageIds: finalGalleryIds,
            imageId: newMainId,
            url: editingItem.value.url,
            status: editingItem.value.status
        });
        closeEdit();
    } catch (e: any) {
        alert("Failed to update item: " + e.message);
    }
}

// -- PHOTOS LOGIC --
const editMainPhotoPreview = ref<string | null>(null);
const editMainFile = ref<File | null>(null);
const editGalleryBuffer = ref<File[]>([]);
const editForm = ref<{ existingGalleryIds: string[] }>({ existingGalleryIds: [] });
const galleryInput = ref<HTMLInputElement | null>(null);

function triggerGalleryInput() {
    galleryInput.value?.click();
}

function handleFileSelect(e: Event, type: 'main' | 'gallery') {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (type === 'main') {
        const file = input.files[0];
        editMainFile.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) editMainPhotoPreview.value = e.target.result as string;
        };
        reader.readAsDataURL(file);
    } else {
        Array.from(input.files).forEach(file => {
            editGalleryBuffer.value.push(file);
        });
    }
}

function removeGalleryItem(idOrIdx: string | number, isExisting: boolean) {
    if (isExisting) {
        editForm.value.existingGalleryIds = editForm.value.existingGalleryIds.filter(id => id !== idOrIdx);
    } else {
        editGalleryBuffer.value.splice(idOrIdx as number, 1);
    }
}

const getAssetUrl = (id: string) => {
    if (!id || !BUCKET_ID) return '';
    try {
        return storage.getFilePreview(BUCKET_ID, id, 200, 200).toString();
    } catch (e) {
        return '';
    }
};
const getObjectUrl = (file: File) => URL.createObjectURL(file);

// -- SCOUT ANALYSIS LOGIC --
async function runScout() {
    if (!editingItem.value) return;
    
    // Gather images (Base64)
    const images: string[] = [];
    
    // 1. Main Photo (if new)
    if (editMainPhotoPreview.value && editMainPhotoPreview.value.startsWith('data:')) {
        images.push(editMainPhotoPreview.value);
    }
    
    // 2. Gallery Buffer (New files)
    if (editGalleryBuffer.value.length > 0) {
        for (const file of editGalleryBuffer.value) {
            const b64 = await fileToBase64(file);
            if (b64) images.push(b64);
        }
    }
    
    analyzing.value = true;
    scoutResult.value = null; // Clear previous
    
    try {
        const payload = JSON.stringify({ 
            images: images,
            notes: editingItem.value.conditionNotes || '',
            url: editingItem.value.url // Include URL for fetching
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
            scoutResult.value = [data];
        } else if (data.items) {
             scoutResult.value = data.items;
        } else {
             scoutResult.value = Array.isArray(data) ? data : [data];
        }
        
        // Auto-populate
        if (scoutResult.value && scoutResult.value.length > 0) {
            const first = scoutResult.value[0];
            if (!editingItem.value.title) editingItem.value.title = first.identity || first.title;
            if (!editingItem.value.conditionNotes) editingItem.value.conditionNotes = first.condition_notes;
            
            if (!editingItem.value.resalePrice && first.price_breakdown?.fair) {
                 editingItem.value.resalePrice = parsePrice(first.price_breakdown.fair);
            }
        }

    } catch (e: any) {
        alert("Scout Analysis Failed: " + e.message);
    } finally {
        analyzing.value = false;
    }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function parsePrice(priceStr: any) {
    if (!priceStr) return 0;
    const s = String(priceStr);
    const matches = s.match(/[0-9.]+/g);
    if (!matches || !matches.length) return 0;
    if (matches.length >= 2) {
         return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2; 
    }
    return parseFloat(matches[0]);
}

// -- INIT --
const error = ref<string | null>(null);

const initCartCheck = async () => {
    if(user.value) {
        try {
            await checkActiveCart(user.value.$id);
        } catch (e: any) {
            error.value = e.message;
        }
    }
};

onMounted(async () => {
    await initCartCheck();
});

watch(user, async (newUser) => {
    if (newUser) {
        await initCartCheck();
    }
});

// -- COMPUTED --
const cartTotalResale = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.resalePrice || 0), 0);
});

const itemsCost = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.paidPrice || 0), 0);
});

const expensesCost = computed(() => {
    return cartExpenses.value.reduce((sum, exp) => sum + (exp.amount || 0), 0);
});

const totalSpend = computed(() => itemsCost.value + expensesCost.value);

// -- HELPER FUNCTIONS --
function getROI(item: CartItem): number | null {
    if (item.paidPrice === undefined || item.paidPrice === null) return null;
    if (item.paidPrice === 0) return 999; 
    if (!item.resalePrice) return 0;
    const profit = item.resalePrice - item.paidPrice;
    return Math.round((profit / item.paidPrice) * 100);
}

function getProfitColor(item: CartItem): string {
    if (item.resalePrice === undefined || item.resalePrice === null) return 'bg-base-300';
    const paid = item.paidPrice || 0;
    if (item.resalePrice > paid) return 'bg-info'; 
    return 'bg-error'; 
}

function getProfitWidth(item: CartItem): string {
    const roi = getROI(item);
    if (roi === null || roi <= 0) return 'w-full'; 
    if (roi < 100) return 'w-1/4';
    if (roi <= 200) return 'w-1/2';
    if (roi <= 500) return 'w-3/4';
    return 'w-full';
}

// -- ACTIONS --
function getImageUrl(imageId: string) {
    if (!imageId || !BUCKET_ID) return '';
    return storage.getFilePreview(BUCKET_ID, imageId, 200, 200).toString();
}

async function handleDeleteItem(itemId: string) {
    if (confirm("Are you sure you want to remove this item?")) {
        try {
            await deleteItem(itemId);
        } catch (e: any) {
            alert("Failed to delete item: " + e.message);
        }
    }
}

async function handleAddExpense() {
    if (!newExpenseAmount.value) return;
    try {
        await addExpense(
            Number(newExpenseAmount.value), 
            newExpenseNote.value || 'Misc Expense'
        );
        newExpenseAmount.value = '';
        newExpenseNote.value = '';
    } catch (e: any) {
        alert("Failed to add expense: " + e.message);
    }
}

async function handleFinishCart() {
    if (confirm("Are you sure you are done shopping?")) {
        await finishCart();
        window.location.href = '/dashboard';
    }
}
function startNew() {
     if(confirm("Start new cart? Current one will be abandoned.")) {
         leaveCart();
         window.location.href = '/scout';
     }
}
</script>
