<template>
    <div class="space-y-12">
        <!-- SHOPPING CART SECTION -->
        <div v-if="cartItems.length > 0" class="space-y-8">
            <h2 class="text-2xl font-bold flex items-center gap-2">🛒 Active Shopping Cart <span class="badge badge-primary">{{ cartItems.length }}</span></h2>

            <div v-for="(groupItems, location) in cartGroups" :key="location" class="bg-base-200 p-6 rounded-2xl border-2 border-base-300 relative">
                <div class="absolute -top-3 left-6 px-2 bg-base-200 text-sm font-bold opacity-70 border border-base-300 rounded">
                    📍 {{ location }} ({{ groupItems.length }})
                </div>
            
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    <div v-for="item in groupItems" :key="item.$id" class="card bg-base-100 shadow-sm border-2 border-primary/20 hover:border-primary transition-colors">
                        <div class="card-body p-4">
                            <div class="flex gap-4">
                                <div class="w-16 h-16 bg-base-300 rounded-lg shrink-0 overflow-hidden relative">
                                    <img v-if="getImageUrl(item)" :src="getImageUrl(item)" class="w-full h-full object-cover" />
                                    <div v-else class="flex items-center justify-center w-full h-full text-2xl">📦</div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold truncate">{{ item.title }}</h3>
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
        <div>
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">In Inventory</h2>
                <div class="flex gap-2 items-center">
                    <button class="btn btn-sm btn-primary gap-2" @click="openAdd">
                        ➕ Add New
                    </button>
                    <button class="btn btn-sm btn-outline gap-2" @click="showImport = true">
                        📥 Import CSV
                    </button>
                    <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                    <span class="badge badge-lg">{{ filteredInventory.length }} / {{ totalItems }} Items</span>
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
            
            <div v-else class="grid grid-cols-2 min-[450px]:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                <div v-for="item in filteredInventory" :key="item.$id" class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary transition-colors group text-xs">
                    <figure class="aspect-square bg-base-200 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                        <img v-if="getImageUrl(item)" :src="getImageUrl(item)" :alt="item.title" class="w-full h-full object-cover" />
                        <div v-else class="flex items-center justify-center w-full h-full text-xl grayscale opacity-50">📦</div>
                        
                        <div class="absolute top-0 right-0 p-1 badge rounded-none rounded-bl-lg badge-xs gap-1 font-bold" 
                            :class="{
                                'badge-warning': item.status === 'draft',
                                'badge-info': item.status === 'need_to_list',
                                'badge-success': item.status === 'listed',
                                'badge-neutral': item.status === 'sold'
                            }">
                            {{ item.status ? item.status.replace(/_/g, ' ') : 'Draft' }}
                        </div>
                    </figure>
                    <div class="card-body p-2 gap-0.5">
                        <h2 class="font-bold text-[11px] leading-tight line-clamp-2 h-[2.2em]">
                            {{ item.title || item.itemName || "Untitled" }}
                        </h2>
                        
                        <div v-if="item.binLocation" class="text-[9px] opacity-60 truncate">📍 {{ item.binLocation }}</div>
                        
                        <div class="flex justify-between items-end mt-1">
                            <div class="flex flex-col">
                                <span class="text-[9px] uppercase opacity-50 font-bold">Est Range</span>
                                <span class="text-[10px] font-bold text-success font-mono">
                                    {{ formatCurrency(item.estLow || getNoteValue(item.conditionNotes, 'Est. Low', true)) }} - 
                                    {{ formatCurrency(item.estHigh || getNoteValue(item.conditionNotes, 'Est. High', true)) }}
                                </span>
                            </div>
                            <div class="flex flex-col text-right">
                                <span class="text-[9px] uppercase opacity-50 font-bold">Paid</span>
                                <span class="text-[10px] font-mono opacity-80">
                                    {{ formatCurrency(item.paidPrice || item.purchasePrice || getNoteValue(item.conditionNotes, 'Paid', true)) }}
                                </span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center mt-1 pt-1 border-t border-base-200">
                            <button class="btn btn-sm btn-square btn-ghost" @click="openEdit(item)">✏️</button> 
                            <button class="btn btn-xs btn-ghost text-error btn-square h-6 min-h-0 w-6" @click="confirmDelete(item.$id)" :disabled="processingId === item.$id">
                                <span v-if="processingId === item.$id" class="loading loading-spinner loading-xs"></span>
                                <span v-else>🗑️</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LOAD MORE BTN -->
            <div v-if="hasMore" class="flex justify-center mt-8">
                <button class="btn btn-outline" @click="loadMore" :disabled="loading">
                    <span v-if="loading" class="loading loading-spinner"></span>
                    Load More Items
                </button>
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
                    <p class="text-xs opacity-70 mb-4">Item moved to "Need to List".</p>
                    <div class="divider">AI Description</div>
                    <textarea class="textarea textarea-bordered w-full h-48 font-mono text-xs" readonly :value="generatedDescription || 'Generating...'" ></textarea>
                    <div class="modal-action">
                         <button class="btn btn-primary w-full" @click="closeCheckout">Done</button>
                    </div>
                </div>
            </div>
        </dialog>

        <!-- ----------------------------------------------------------- -->
        <!-- EDIT DRAWER -->
        <!-- ----------------------------------------------------------- -->
        <div v-if="isEditDrawerOpen" class="relative z-50">
            <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeEditDrawer"></div>
            <div class="fixed inset-y-0 right-0 w-full md:w-[480px] bg-base-100 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
                <!-- Header -->
                <div class="p-4 border-b border-base-200 flex justify-between items-center bg-base-100 sticky top-0 z-10">
                    <h3 class="font-bold text-lg">{{ activeItem ? 'Edit Item' : 'Add New Item' }}</h3>
                    <button class="btn btn-sm btn-circle btn-ghost" @click="closeEditDrawer">✕</button>
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
                                <input type="number" step="0.01" v-model="editForm.paidPrice" class="grow" placeholder="0.00" />
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
                            <button class="btn btn-primary join-item" @click="fetchImagesFromUrl" :disabled="!editForm.purchaseLocation">
                                Fetch 🖼️
                            </button>
                        </div>
                    </div>
                    
                    <!-- Scout Result Display (Scout View Mirror) -->
                     <div v-if="scoutResult" class="bg-base-200 rounded-xl p-4 border border-base-300 shadow-inner mt-4">
                        <div class="flex justify-between items-start mb-2">
                             <h4 class="font-bold text-sm uppercase opacity-70">Scout Report</h4>
                             <button class="btn btn-xs btn-ghost" @click="scoutResult = null">✕</button>
                        </div>
                        
                        <!-- New Multi-Item Layout -->
                        <div v-if="Array.isArray(scoutResult)" class="space-y-4">
                            <div class="alert alert-info py-2 px-3 text-xs shadow-sm">
                                <span>📦 AI Identified {{ scoutResult.length }} Items in this Lot</span>
                            </div>
                            
                            <div v-for="(item, idx) in scoutResult" :key="idx" class="collapse collapse-arrow bg-base-100 border border-base-200 rounded-box">
                                <input type="checkbox" /> 
                                <div class="collapse-title text-sm font-medium pr-8 flex justify-between items-center py-2 min-h-0">
                                    <span class="truncate">{{ idx + 1 }}. {{ item.title || item.identity }}</span>
                                    <span class="badge badge-sm badge-ghost ml-2 whitespace-nowrap" v-if="item.price_breakdown?.fair">
                                        {{ formatPriceOnly(item.price_breakdown.fair) }}
                                    </span>
                                </div>
                                <div class="collapse-content text-xs space-y-2">
                                     <div v-if="item.red_flags?.length" class="text-warning">🚩 {{ item.red_flags.join(', ') }}</div>
                                     <div v-if="item.condition_notes">📝 {{ item.condition_notes }}</div>
                                     <div class="grid grid-cols-2 gap-2 mt-1 opacity-70">
                                         <div>Mint: {{ formatPriceRange(item.price_breakdown?.mint) }}</div>
                                         <div>Poor: {{ formatPriceRange(item.price_breakdown?.poor) }}</div>
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
                                <img :src="`/api/proxy-image?url=${encodeURIComponent(scoutResult.image)}`" class="h-32 object-contain rounded-lg shadow-md border border-base-300" alt="AI Found Item" />
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
                            <option value="draft">Draft</option>
                            <option value="in_cart">In Cart</option>
                            <option value="need_to_list">Need to List</option>
                            <option value="listed">Listed</option>
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
                    <div role="tablist" class="tabs tabs-boxed mb-2">
                        <a role="tab" class="tab" :class="{ 'tab-active': descTab === 'edit' }" @click="descTab = 'edit'">Edit</a>
                        <a role="tab" class="tab" :class="{ 'tab-active': descTab === 'preview' }" @click="descTab = 'preview'">Preview</a>
                    </div>

                    <div v-if="descTab === 'edit'" class="form-control w-full">
                        <textarea v-model="editForm.description" class="textarea textarea-bordered h-64 font-mono text-xs leading-normal" placeholder="Product description..."></textarea>
                    </div>
                    <div v-else class="w-full h-64 overflow-y-auto border border-base-300 rounded-lg p-4 bg-base-100 prose prose-sm" v-html="renderMarkdown(editForm.description)"></div>

                    <div class="h-12"></div>
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-base-200 bg-base-100 flex justify-end gap-2 shrink-0">
                    <button class="btn btn-ghost" @click="closeEditDrawer">Cancel</button>
                    <button class="btn btn-primary" @click="saveEdit" :disabled="processing">
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

        <!-- Bulk Import Modal -->
        <BulkImport v-if="showImport" @close="showImport = false" @complete="showImport = false" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useInventory } from '../../composables/useInventory';
import { updateInventoryItem, deleteInventoryItem } from '../../lib/inventory';
import { marked } from 'marked';
import BulkImport from './BulkImport.vue';
import { useAuth } from '../../composables/useAuth';

// Environment Variables
const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const BUCKET = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

// Use Composable
const { inventoryItems, totalItems, loading, error, fetchInventory, hasMore, loadNextPage } = useInventory();
const loadMore = loadNextPage; // Alias for template
const { currentTeam } = useAuth();
const currentTeamId = computed(() => currentTeam.value?.$id); 

// Lifecycle
const cartItems = computed(() => inventoryItems.value.filter(i => i.status === 'in_cart'));
const filteredInventory = computed(() => inventoryItems.value.filter(i => i.status !== 'in_cart'));

const cartGroups = computed(() => {
    return cartItems.value.reduce((groups, item) => {
        const loc = item.purchaseLocation || 'Unknown Location';
        if (!groups[loc]) groups[loc] = [];
        groups[loc].push(item);
        return groups;
    }, {});
});

// Computed: Dynamic Total Range for Lot
const scoutTotalRange = computed(() => {
    if (!scoutResult.value || !Array.isArray(scoutResult.value)) return null;
    
    let totalLow = 0;
    let totalHigh = 0;
    
    scoutResult.value.forEach(item => {
        let raw = item.price_breakdown?.fair || item.price_breakdown?.mint;
        let low = 0, high = 0;
        
        if (typeof raw === 'object') {
                low = parseFloat((raw.low || raw.min || raw.mint || 0).toString().replace(/,/g, ''));
                high = parseFloat((raw.high || raw.max || raw.fair || low).toString().replace(/,/g, ''));
        } else { 
                const s = String(raw || '0').replace(/[$,]/g, '').trim(); 
                // Robust regex for hyphens, dashes, 'to', unicode minus
                const range = s.match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
                
                if (range) {
                    low = parseFloat(range[1]) || 0;
                    high = parseFloat(range[2]) || 0;
                } else {
                    // Match the FIRST valid number only
                    const single = s.match(/(\d+(?:\.\d+)?)/);
                    if(single) { 
                        low = parseFloat(single[1]) || 0; 
                        high = low; 
                    }
                }
        }
        
        // Sanity Check Logic
        const mintPrice = parsePrice(item.price_breakdown?.mint);
        if (mintPrice > 0 && low > mintPrice * 2) {
            low = mintPrice / 2;
            high = mintPrice;
        }
        if (high < low) high = low;

        totalLow += low;
        totalHigh += high;
    });
    
    return { 
        low: totalLow, 
        high: totalHigh, 
        formatted: totalLow === totalHigh 
            ? `$${totalLow.toFixed(2)}` 
            : `$${totalLow.toFixed(2)} - $${totalHigh.toFixed(2)}`
    };
});

// State
const processingId = ref(null); // deleting/updating ID
const processing = ref(false); // general loading state
const activeItem = ref(null);

// Checkout State
const checkoutModal = ref(null);
const checkoutPrice = ref('');
const checkoutReceiptFile = ref(null);
const checkoutReceiptPreview = ref(null);
const checkoutSuccess = ref(false);
const generatedDescription = ref('');

// Edit Drawer State
const isEditDrawerOpen = ref(false);
const descTab = ref('edit');
const editForm = ref({
    title: '', paidPrice: '', resalePrice: '', binLocation: '', purchaseLocation: '', status: 'draft', description: '', existingGalleryIds: []
});
const editMainFile = ref(null);
const editMainPhotoPreview = ref(null);
const editGalleryBuffer = ref([]); // Array of File objects
const scoutResult = ref(null); // Stores the raw AI output for display

// Camera State
const cameraVideo = ref(null);
const cameraVideoDialog = ref(null);
const cameraModal = ref(null);
const isCameraOpen = ref(false);
const cameraStream = ref(null);
const cameraFacing = ref('environment');
const cameraContext = ref('checkout'); // 'checkout' or 'gallery'

// Lifecycle
onMounted(async () => {
    console.log("InventoryManager Mounted - Version with Image Fetcher");
    // Determine Team ID if relevant (defaults to user/tenant scope)
    await fetchInventory(''); 
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
    return id ? getAssetUrl(id) : null;
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
            status: 'need_to_list',
            paidPrice: checkoutPrice.value,
            receiptFile: checkoutReceiptFile.value
        });
        
        // Success UI
        checkoutSuccess.value = true;

        // Trigger AI Gen
        const res = await fetch('/api/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: activeItem.value.$id })
        });
        const data = await res.json();
        if(data.success && data.description) {
            generatedDescription.value = data.description;
            if(data.warning) generatedDescription.value += `\n\n⚠️ ${data.warning}`;
        } else {
            generatedDescription.value = "Failed to generate: " + (data.error || "Unknown");
        }
    } catch (e) {
        alert('Checkout failed: ' + e.message);
    } finally {
        processing.value = false;
    }
};

//---------------------------------------------------------
// EDIT DRAWER LOGIC
//---------------------------------------------------------

/* ADD NEW ITEM LOGIC */
const openAdd = () => {
    activeItem.value = null; // null = Create Mode
    editForm.value = {
        title: '', 
        paidPrice: '', 
        resalePrice: '', 
        estLow: '',
        estHigh: '',
        binLocation: '', 
        purchaseLocation: '', 
        orderId: '',
        status: 'draft', 
        description: '', 
        existingGalleryIds: []
    };
    
    // Reset buffers
    editMainFile.value = null;
    editMainPhotoPreview.value = null;
    editGalleryBuffer.value = [];
    fetchedImages.value = [];
    fetchingImages.value = false;
    scoutResult.value = null;
    
    isEditDrawerOpen.value = true;
};

const openEdit = (item) => {
    activeItem.value = item;
    editForm.value = {
        title: item.title,
        paidPrice: item.paidPrice || item.purchasePrice || getNoteValue(item.conditionNotes, 'Paid', true) || '',
        resalePrice: item.resalePrice || item.priceFair || getNoteValue(item.conditionNotes, 'Resale', true) || '',
        estLow: item.estLow || getNoteValue(item.conditionNotes, 'Est. Low', true) || '',
        estHigh: item.estHigh || getNoteValue(item.conditionNotes, 'Est. High', true) || '',
        binLocation: item.binLocation || getNoteValue(item.conditionNotes, 'Bin') || '',
        purchaseLocation: item.purchaseLocation || getNoteValue(item.conditionNotes, 'Location') || '',
        orderId: item.orderId || getNoteValue(item.conditionNotes, 'Order #') || getNoteValue(item.conditionNotes, 'Imported from Order #') || '',
        status: item.status || 'draft',
        description: item.marketDescription || item.description || '', // Fallback
        existingGalleryIds: item.galleryImageIds || []
    };
    
    // Main Photo
    const existingUrl = getImageUrl(item);
    if (existingUrl) {
        editMainPhotoPreview.value = existingUrl;
    } else {
        editMainPhotoPreview.value = null;
    }
    
    // Reset buffers
    editMainFile.value = null;
    editGalleryBuffer.value = [];
    fetchedImages.value = []; // Clear previous fetches
    fetchingImages.value = false;
    scoutResult.value = null; // Reset Scout Data
    
    // Parse Scout Data if exists
    // Parse Scout Data if exists
    if (item.conditionNotes) {
        // Try file-based first (New System)
        const fileMatch = item.conditionNotes.match(/\[SCOUT_REPORT_ID: ([^\]]+)\]/);
        if (fileMatch) {
            const fileId = fileMatch[1].trim();
            // Fetch the JSON file content
            // Assuming getAssetUrl returns .../view?... we want .../download?... for raw file
            const downloadUrl = getAssetUrl(fileId).replace('/view', '/download');
            fetch(downloadUrl)
                .then(res => {
                    if(!res.ok) throw new Error("Failed to fetch report");
                    return res.json();
                })
                .then(data => { scoutResult.value = data; })
                .catch(e => console.warn("Failed to load Scout Report file", e));
        } else {
            // Check Lite Fallback (Plan B)
            const liteMatch = item.conditionNotes.match(/\[SCOUT_DATA_LITE: ([^\]]+)\]/);
            if (liteMatch) {
                try {
                     const jsonStr = atob(liteMatch[1]);
                     scoutResult.value = JSON.parse(jsonStr);
                } catch(e) {
                     console.warn("Failed to parse Lite Scout Data", e);
                }
            } else {
                // Check Legacy Base64 (Plan C)
                const match = item.conditionNotes.match(/\[SCOUT_DATA: ([^\]]+)\]/);
                if (match) {
                    try {
                    // Determine if we need to use atob or buffer (client side atob is safe)
                    const jsonStr = atob(match[1]);
                    scoutResult.value = JSON.parse(jsonStr);
                    } catch (e) {
                        console.warn("Failed to parse saved Scout Data", e);
                    }
                }
            }
        }
    }
    
    isEditDrawerOpen.value = true;
};

const closeEditDrawer = () => {
    isEditDrawerOpen.value = false;
    stopCamera();
};

const removeGalleryItem = (idOrIdx, isExisting) => {
    if (isExisting) {
        editForm.value.existingGalleryIds = editForm.value.existingGalleryIds.filter(id => id !== idOrIdx);
    } else {
        editGalleryBuffer.value.splice(idOrIdx, 1);
    }
};

const saveEdit = async () => {
    // if (!activeItem.value) return; // Removed check to allow creation
    processing.value = true;
    try {
        if (activeItem.value) {
            // UPDATE EXISTING
            await updateInventoryItem(activeItem.value.$id, {
                ...editForm.value,
                imageFile: editMainFile.value,
                galleryFiles: editGalleryBuffer.value,
                scoutData: scoutResult.value // Save AI Data
            });
        } else {
            // CREATE NEW
             await saveItemToInventory(
                { title: editForm.value.title || 'Untitled Item', identity: editForm.value.title, condition_notes: '' }, 
                editMainFile.value,
                {
                    ...editForm.value,
                    galleryFiles: editGalleryBuffer.value,
                    scoutData: scoutResult.value
                },
                currentTeamId.value // Pass team ID
            );
        }

        await fetchInventory(''); // Refresh list to show updates
        closeEditDrawer();
    } catch (e) {
        alert('Save failed: ' + e.message);
    } finally {
        processing.value = false;
    }
};

//---------------------------------------------------------
// CAMERA & FILE LOGIC (Shared)
//---------------------------------------------------------
const handleFileSelect = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'receipt') {
        processFile(files[0], (file, url) => {
            checkoutReceiptFile.value = file;
            checkoutReceiptPreview.value = url;
        });
    } else if (type === 'main') {
        processFile(files[0], (file, url) => {
            editMainFile.value = file;
            editMainPhotoPreview.value = url;
        });
    } else if (type === 'gallery') {
        Array.from(files).forEach(f => {
             // Just push to buffer, preview handled by v-for on buffer
             editGalleryBuffer.value.push(f);
        });
    }
};

const analyzing = ref(false);

const analyzeExistingItem = async () => {
    if (!editMainPhotoPreview.value && !editForm.value.purchaseLocation) {
        alert("Please add a Main Photo or Item Link to analyze.");
        return;
    }
    analyzing.value = true;
    try {
        let base64Image = null;
        
        // Helper: Resize Image to max 1024px
        const resize = (blob) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width;
                    let h = img.height;
                    const max = 1024;
                    if (w > max || h > max) {
                        if (w > h) { h = Math.round(h * (max/w)); w = max; }
                        else { w = Math.round(w * (max/h)); h = max; }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                const reader = new FileReader();
                reader.onload = (e) => img.src = e.target.result;
                reader.readAsDataURL(blob);
            });
        };

        // 1. Get Image Data (if available)
        if (editMainFile.value) {
            base64Image = await resize(editMainFile.value);
        } else if (editMainPhotoPreview.value && editMainPhotoPreview.value.startsWith('data:')) {
            // Convert dataURL to blob to resize, or just accept if small? 
            // Better to resize to be safe.
            const res = await fetch(editMainPhotoPreview.value);
            const blob = await res.blob();
            base64Image = await resize(blob);
        } else if (editMainPhotoPreview.value) {
            // URL Fetch
            const url = editMainPhotoPreview.value;
            // Always try proxy for Appwrite if we suspect CORS issues, or try direct then fallback
            let fetchUrl = url;
            // Force proxy for Appwrite if we are in this block (meaning we need the blob)
            if (url.includes('/storage/buckets/')) {
                 fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            } else if (!url.includes('/api/proxy-image')) {
                 fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            }

            try {
                const res = await fetch(fetchUrl);
                if (res.ok) {
                    const blob = await res.blob();
                    base64Image = await resize(blob);
                }
            } catch (e) {
                console.warn("Image fetch failed, proceeding with just URL context if available", e);
            }
        }

        // 2. Prepare Payload
        // Include URL in notes for context
        // Include Title & URL in notes for context (User requested Title as Prompt)
        let contextNotes = editForm.value.description || '';
        if (editForm.value.title) {
            contextNotes = `Item Title: ${editForm.value.title}\n\n` + contextNotes;
        }
        if (editForm.value.purchaseLocation) {
            contextNotes += `\n\nItem URL: ${editForm.value.purchaseLocation}`;
        }

        const payload = JSON.stringify({ 
            image: base64Image, 
            imageUrl: editMainPhotoPreview.value, // EXPLICITLY SEND URL for Server-Side Fallback
            notes: contextNotes
        });
        
        if(!base64Image) {
             // If no main image, try to fetch from URL automatically?
             // For now, warn user (as per my check above)
             // But user said "if i have a url... scout should use that".
             // Assuming they clicked 'Fetch' first is safer.
        }

        const response = await fetch(`/api/identify-item`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });

        if (!response.ok) throw new Error("Analysis API failed");
        
        const data = await response.json();
        
        // 3. Update Form & Save Result
        // 3. Update Form & Save Result
        if (data.items && data.items.length > 0) {
            
            // MULTI-ITEM HANDLING OR SINGLE
            if (data.items.length > 1) {
                // IT IS A LOT / BUNDLE
                scoutResult.value = data.items;
                
                // Calculate Total Value (Range)
                let totalLow = 0;
                let totalHigh = 0;
                let desc = `**LOT BREAKDOWN (${data.items.length} Items):**\n`;
                
                data.items.forEach((item, idx) => {
                    // Smart Parse Range of FAIR price using robust logic
                    let raw = item.price_breakdown?.fair || item.price_breakdown?.mint;
                    let low = 0, high = 0;
                    
                    if (typeof raw === 'object') {
                         low = parseFloat((raw.low || raw.min || raw.mint || 0).toString().replace(/,/g, ''));
                         high = parseFloat((raw.high || raw.max || raw.fair || low).toString().replace(/,/g, ''));
                    } else { 
                         const s = String(raw || '0').replace(/[$,]/g, '').trim(); 
                         // Robust regex for hyphens, dashes, 'to', unicode minus
                         const range = s.match(/(\d+(?:\.\d+)?)\s*(?:[-–—−]|to)\s*(\d+(?:\.\d+)?)/i);
                         if (range) {
                             low = parseFloat(range[1]) || 0;
                             high = parseFloat(range[2]) || 0;
                         } else {
                             const single = s.match(/(\d+(?:\.\d+)?)/);
                             if(single) { 
                                 low = parseFloat(single[1]) || 0; 
                                 high = low; 
                             }
                         }
                    }
                    
                    // Sanity Check
                    const mintPrice = parsePrice(item.price_breakdown?.mint);
                    if (mintPrice > 0 && low > mintPrice * 2) {
                        low = mintPrice / 2;
                        high = mintPrice;
                    }
                    if (high < low) high = low;

                    totalLow += low;
                    totalHigh += high;
                    
                    const pStr = low === high ? `$${low.toFixed(2)}` : `$${low.toFixed(2)} - $${high.toFixed(2)}`;
                    desc += `\n**${idx+1}. ${item.title || item.identity}** - Est: ${pStr}\n`;
                    if(item.condition_notes) desc += `- Condition: ${item.condition_notes}\n`;
                });
                
                // Store calculated totals on the array object itself for template access
                // scoutResult.value.totalLow = totalLow;  <-- REMOVED (Use Computed)
                // scoutResult.value.totalHigh = totalHigh;
                
                // POPULATE EST FIELDS (User Control)
                if (totalLow > 0) editForm.value.estLow = totalLow.toFixed(2);
                if (totalHigh > 0) editForm.value.estHigh = totalHigh.toFixed(2);
                
                // Update Form Price (if empty) -- DISABLED PER USER REQUEST
                /* 
                if((!editForm.value.resalePrice || parseFloat(editForm.value.resalePrice) === 0)) {
                    editForm.value.resalePrice = totalFair.toFixed(2);
                }
                */

                // Append Breakdown to Description
                if(!editForm.value.description.includes("LOT BREAKDOWN")) {
                     editForm.value.description = (editForm.value.description + "\n\n" + desc).trim();
                }



            } else {
                // SINGLE ITEM
                scoutResult.value = data.items[0];
                const item = scoutResult.value;

                // A. Identity / Title (Only update if empty/untitled, per user request)
                if (!editForm.value.title || editForm.value.title === 'Untitled' || editForm.value.title === 'Untitled Item') {
                    editForm.value.title = item.title || item.identity;
                }

                // B. Populate EST FIELDS (User Control) for Single Item
                if (item.price_breakdown) {
                     const f = item.price_breakdown.fair || item.price_breakdown.mint;
                     // Try to parse range from string "10-20"
                     const s = (f || '').toString().replace(/,/g, '');
                     const parts = s.match(/(\d+\.?\d*)/g);
                     
                     if(parts && parts.length >= 2) {
                         editForm.value.estLow = parseFloat(parts[0]).toFixed(2);
                         editForm.value.estHigh = parseFloat(parts[1]).toFixed(2);
                     } else if(parts && parts.length === 1) {
                         const val = parseFloat(parts[0]);
                         editForm.value.estLow = val.toFixed(2);
                         editForm.value.estHigh = val.toFixed(2);
                     } else {
                         // Fallback to rational price logic
                         const price = getRationalPrice(item);
                         if (price > 0) {
                            editForm.value.estLow = price.toFixed(2);
                            editForm.value.estHigh = price.toFixed(2);
                         }
                     }
                }
    
                // C. Construct Scout Report (Description)
                let report = `\n\n--- 🕵️ SCOUT REPORT ---\n`;
                if(item.condition_notes) report += `**Condition:** ${item.condition_notes}\n`;
                if(item.red_flags && item.red_flags.length > 0) report += `**🚩 Red Flags:** ${item.red_flags.join(', ')}\n`;
                
                if(item.price_breakdown) {
                    report += `**Valuation:** Mint: ${item.price_breakdown.mint}, Fair: ${item.price_breakdown.fair}, Poor: ${item.price_breakdown.poor}\n`;
                }
    
                if(item.comparables && item.comparables.length > 0) {
                     report += `**Comparables:**\n`;
                     item.comparables.forEach(comp => {
                         report += `- ${comp.name} (${comp.price}) [${comp.status}]\n`;
                     });
                }
                
                if(item.keywords && item.keywords.length > 0) {
                    report += `**Keywords:** ${item.keywords.join(', ')}\n`;
                }
    
                // Append to existing description if not already present
                if(!editForm.value.description.includes("SCOUT REPORT")) {
                     editForm.value.description = (editForm.value.description + report).trim();
                }

                // D. Title Mismatch Warning
                const knownTitle = editForm.value.title;
                if (knownTitle && (item.title || item.identity)) {
                     const t1 = knownTitle.toLowerCase();
                     const t2 = (item.title || item.identity).toLowerCase();
                     const kWords = t1.split(/\W+/).filter(w => w.length > 3);
                     const iWords = t2.split(/\W+/).filter(w => w.toLowerCase());
                     
                     const common = kWords.filter(w => iWords.some(iw => iw.includes(w) || w.includes(iw)));
                     
                     if (kWords.length > 0 && common.length === 0) {
                          if(!item.red_flags) item.red_flags = [];
                          item.red_flags.push(`⚠️ Title Mismatch: AI identified "${item.title || item.identity}" vs Known "${knownTitle}"`);
                     }
                }
                
                // E. Handle Fetched Image
                if (item.fetched_image && !editMainPhotoPreview.value) {
                     const fname = `scout_auto_${Date.now()}.jpg`; 
                     const file = await urlToFile(item.fetched_image, fname);
                     if (file) {
                         processFile(file, (f, u) => {
                              editMainFile.value = f;
                              editMainPhotoPreview.value = u;
                         });
                    }
                }
            }
            
            descTab.value = 'edit';
        }

    } catch (e) {
        alert("Analysis Error: " + e.message);
    } finally {
        analyzing.value = false;
    }
};

const processFile = (file, cb) => {
    cb(file, URL.createObjectURL(file));
};

const startCamera = async (context) => {
    cameraContext.value = context;
    try {
        cameraStream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing.value }
        });
        
        if (context === 'checkout') {
            isCameraOpen.value = true;
            // Wait for next tick/render
            setTimeout(() => {
                if (cameraVideo.value) cameraVideo.value.srcObject = cameraStream.value;
            }, 100);
        } else {
            cameraModal.value.showModal();
            setTimeout(() => {
                if (cameraVideoDialog.value) cameraVideoDialog.value.srcObject = cameraStream.value;
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
    if(cameraModal.value) cameraModal.value.close();
};

const flipCamera = () => {
    cameraFacing.value = cameraFacing.value === 'environment' ? 'user' : 'environment';
    stopCamera();
    startCamera(cameraContext.value);
};

const capturePhoto = (context) => {
    const videoEl = context === 'checkout' ? cameraVideo.value : cameraVideoDialog.value;
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
        } else {
            editGalleryBuffer.value.push(file);
            // Don't stop camera for gallery, might want multiple
            // Visual feedback
            const btn = document.activeElement;
            if(btn) btn.classList.add('scale-90');
            setTimeout(() => btn && btn.classList.remove('scale-90'), 100);
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

//---------------------------------------------------------
// IMAGE FETCHING LOGIC
//---------------------------------------------------------
const fetchingImages = ref(false);
const fetchedImages = ref([]);

const fetchImagesFromUrl = async () => {
    const url = editForm.value.purchaseLocation;
    // Check: Valid URL OR valid ID (number)
    const isId = url && url.match(/^\d+$/);
    if (!url || (!url.startsWith('http') && !isId)) {
        alert("Please enter a valid ShopGoodwill URL or Item ID.");
        return;
    }

    fetchingImages.value = true;
    fetchedImages.value = [];
    
    // Extract ID first if it's a URL
    let finalUrl = url;
    const idMatch = url.match(/item\/(\d+)/i) || url.match(/^(\d+)$/);
    if(idMatch) {
         finalUrl = idMatch[1]; // Send just the ID to be safe
    }

    try {
        const res = await fetch('/api/extract-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl }) // Send ID if possible
        });
        
        const data = await res.json();
        if (data.success && data.images.length > 0) {
            fetchedImages.value = data.images;
        } else if (data.success && data.images.length === 0) {
            alert("No images found on that page.");
        } else {
             // Fallback or error
        }
        
        // Auto-populate Details if available
        if (data.success) {
            // Price
            if (data.price && (!editForm.value.paidPrice || parseFloat(editForm.value.paidPrice) === 0)) {
                // Remove $ and ,
                editForm.value.paidPrice = data.price.toString().replace(/[$,]/g, '');
            }
            // Title
            if (data.title && (!editForm.value.title || editForm.value.title.trim().length < 4)) {
                editForm.value.title = data.title;
            }
        }

    } catch (e) {
        console.error(e);
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
    } catch (e) {
        console.error("Failed to convert URL to file", e);
        return null;
    }
};

const selectFetchedImage = async (url) => {
    const filename = url.split('/').pop().split('?')[0] || "downloaded.jpg";
    const file = await urlToFile(url, filename);
    
    if (file) {
        // Logic: if no main image, set main. Else, add to gallery.
        if (!editMainFile.value && !editForm.value.imageId && !editMainPhotoPreview.value) {
            processFile(file, (f, u) => {
                editMainFile.value = f;
                editMainPhotoPreview.value = u;
            });
        } else {
            editGalleryBuffer.value.push(file);
        }
    } else {
        alert("Could not download image.");
    }
};

</script>
