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
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                  <ItemCard 
                      v-for="item in cartItems" 
                      :key="item.$id" 
                      :item="item" 
                      :compact="true"
                      @click-card="openPreview(item)">

                      <template #absolute-top-left>
                           <!-- Actions Menu Override -->
                            <div class="dropdown dropdown-bottom absolute top-2 right-2 z-20" @click.stop>
                                <label tabindex="0" class="btn btn-ghost btn-sm btn-circle bg-base-100/80 backdrop-blur shadow-sm cursor-pointer">⋮</label>
                                <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-200">
                                    <li><a @click="openEditModal(item)">✏️ Edit</a></li>
                                    <li><a :href="`/scout?rescout=${item.$id}`">🔍 Open in Scout</a></li>
                                    <li><a @click="handleDeleteItem(item.$id)" class="text-error">🗑️ Delete</a></li>
                                </ul>
                            </div>
                      </template>
                      
                      <template #image-overlay>
                          <!-- Profit Meter Bar overlaid on bottom of image -->
                          <div class="absolute bottom-0 left-0 right-0 h-6 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center">
                              <div :class="[getProfitColor(item), getProfitWidth(item)]" class="h-full transition-all duration-500 opacity-90"></div>
                              <div class="absolute inset-0 flex justify-between items-center px-2 font-bold z-10 text-[9px] text-white pointer-events-none">
                                  <span class="opacity-90 uppercase tracking-wider">{{ item.condition || 'Mix' }}</span>
                                  <span><span v-if="getROI(item) !== null" class="ml-1 opacity-90">ROI: {{ getROI(item) }}%</span></span>
                              </div>
                          </div>
                      </template>
                  </ItemCard>
              </div>

               <!-- EDIT SIDE PANEL -->
              <ItemDrawer v-if="editingItem" :item="editingItem" @close="closeEdit" @save="saveEdit" />
              
              <!-- FULLSCREEN PREVIEW -->
              <ItemPreviewModal :item="previewItem || undefined" @close="previewItem = null" @edit="openEditModal" />

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
import ItemDrawer from '../common/ItemDrawer.vue';
import { updateInventoryItem } from '../../lib/inventory';
import ItemCard from '../common/ItemCard.vue';
import ItemPreviewModal from '../inventory/ItemPreviewModal.vue';

const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

const { user } = useAuth();
const { 
  activeCart, cartItems, cartExpenses, loading, 
  checkActiveCart, addExpense, finishCart, leaveCart,
  deleteItem, updateItem
} = useCart();

const newExpenseNote = ref('');
const newExpenseAmount = ref<number | ''>(''); 

// -- EDIT/PREVIEW STATE --
const editingItem = ref<CartItem | null>(null);
const previewItem = ref<CartItem | null>(null);

function openPreview(item: CartItem) {
    previewItem.value = item;
}

function openEditModal(item: CartItem) {
    editingItem.value = { ...item }; 
}

function closeEdit() {
    editingItem.value = null;
}

async function saveEdit(payload: any) {
    if (!editingItem.value) return;
    try {
        await updateInventoryItem(editingItem.value.$id, payload);
        
        // Optimistically update the cartItems array with new values
        const idx = cartItems.value.findIndex(i => i.$id === editingItem.value?.$id);
        if (idx !== -1) {
             Object.assign(cartItems.value[idx], payload);
        }
        
        closeEdit();
    } catch (e: any) {
        alert("Failed to update item: " + e.message);
    }
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
    return cartItems.value.reduce((sum, item) => sum + (item.cost || 0), 0);
});

const expensesCost = computed(() => {
    return cartExpenses.value.reduce((sum, exp) => sum + (exp.amount || 0), 0);
});

const totalSpend = computed(() => itemsCost.value + expensesCost.value);

// -- HELPER FUNCTIONS --
function getROI(item: CartItem): number | null {
    if (item.cost === undefined || item.cost === null) return null;
    if (item.cost === 0) return 999; 
    if (!item.resalePrice) return 0;
    const profit = item.resalePrice - item.cost;
    return Math.round((profit / item.cost) * 100);
}

function getProfitColor(item: CartItem): string {
    if (item.resalePrice === undefined || item.resalePrice === null) return 'bg-base-300';
    const paid = item.cost || 0;
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
        try {
            await finishCart();
            window.location.href = '/dashboard';
        } catch (e: any) {
            alert("Checkout failed: " + e.message);
        }
    }
}

function startNew() {
     if(confirm("Start new cart? Current one will be abandoned.")) {
         leaveCart();
         window.location.href = '/scout';
     }
}
</script>
