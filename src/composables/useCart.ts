import { ref, computed } from 'vue';
import { client, databases, storage, ID, Query } from '../lib/appwrite';
import type { Models } from 'appwrite';

export interface CartExpense extends Models.Document {
    amount: number;
    note: string;
    receiptImageId: string | null;
    date: string;
    cartId: string;
    tenantId: string;
}

// -- Shared State --
const activeCart = ref<Models.Document | null>(null);
const cartItems = ref<Models.Document[]>([]);
const cartExpenses = ref<CartExpense[]>([]); // NEW: Expenses list
const loading = ref(false);
const error = ref<string | null>(null);

// Config
const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID;
const CARTS_COL = 'carts'; 
const ITEMS_COL = import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID; // 'items'
const EXPENSES_COL = 'expenses'; // New collection for line-item costs
const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID; // 'item_images' (or use a 'receipts' bucket if preferred)

let unsubscribe: (() => void) | null = null;

export function useCart() {

    const cartTotalItems = computed(() => cartItems.value.length);
    
    // Sum of all recorded expenses
    const cartTotalCost = computed(() => {
        return cartExpenses.value.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    });

    const hasActiveCart = computed(() => !!activeCart.value);

    // -- Actions --

    const startCart = async (source: string, teamId: string, userId: string) => {
        loading.value = true;
        try {
            const cart = await databases.createDocument(
                DB_ID,
                CARTS_COL,
                ID.unique(),
                {
                    source,
                    tenantId: teamId,
                    buyerId: userId,
                    date: new Date().toISOString(),
                    status: 'active',
                    itemCount: 0
                }
            );
            setActiveCart(cart);
        } catch (e: any) {
            console.error('Failed to start cart:', e);
            error.value = e.message;
            throw e; // Propagate error to caller
        } finally {
            loading.value = false;
        }
    };

    const setActiveCart = (cart: Models.Document) => {
        activeCart.value = cart;
        cartItems.value = []; 
        cartExpenses.value = []; // Reset
        
        if (unsubscribe) unsubscribe();

        unsubscribe = client.subscribe(
            `databases.${DB_ID}.collections.${CARTS_COL}.documents.${cart.$id}`,
            (response) => {
                if (response.events.includes('databases.*.documents.*.update')) {
                    activeCart.value = response.payload as Models.Document;
                }
            }
        );

        fetchCartItems(cart.$id);
        fetchExpenses(cart.$id); // Load expenses too
    };

    const fetchCartItems = async (cartId: string) => {
        try {
            const result = await databases.listDocuments(
                DB_ID,
                ITEMS_COL,
                [Query.equal('cartId', cartId)]
            );
            cartItems.value = result.documents;
        } catch (e) {
            console.error('Failed to fetch cart items', e);
        }
    };

    // NEW: Fetch Expenses
    const fetchExpenses = async (cartId: string) => {
        try {
            const result = await databases.listDocuments(
                DB_ID,
                EXPENSES_COL,
                [Query.equal('cartId', cartId)]
            );
            cartExpenses.value = result.documents as unknown as CartExpense[];
        } catch (e) {
            // Expenses collection might not exist yet, ignore silently for now
            console.warn('Could not fetch expenses (Collection might be missing)');
        }
    };

    const addItemToCart = async (itemData: any) => {
        if (!activeCart.value) return;
        try {
            const newItem = await databases.createDocument(
                DB_ID,
                ITEMS_COL,
                ID.unique(),
                {
                    ...itemData,
                    cartId: activeCart.value.$id,
                    tenantId: activeCart.value.tenantId,
                }
            );
            cartItems.value.push(newItem);
            await databases.updateDocument(DB_ID, CARTS_COL, activeCart.value.$id, {
                itemCount: cartItems.value.length
            });
        } catch (e: any) {
            error.value = e.message;
            throw e;
        }
    };

    // NEW: Add Expense Line Item
    const addExpense = async (amount: number, note: string, receiptFile?: File) => {
        if (!activeCart.value) return;
        loading.value = true;
        try {
            let receiptImageId = null;
            if (receiptFile) {
                // Upload to Storage
                const upload = await storage.createFile(BUCKET_ID, ID.unique(), receiptFile);
                receiptImageId = upload.$id;
            }

            const expense = await databases.createDocument(
                DB_ID,
                EXPENSES_COL,
                ID.unique(),
                {
                    cartId: activeCart.value.$id,
                    tenantId: activeCart.value.tenantId,
                    amount: amount, // Float
                    note: note,
                    receiptImageId: receiptImageId,
                    date: new Date().toISOString()
                }
            );

            cartExpenses.value.push(expense as unknown as CartExpense);

            // Update Total on Cart Object for fast access
            await databases.updateDocument(DB_ID, CARTS_COL, activeCart.value.$id, {
                totalCost: cartTotalCost.value
            });

        } catch (e: any) {
            console.error("Add Expense Failed", e);
            throw new Error(`Failed to add expense: ${e.message}`);
        } finally {
            loading.value = false;
        }
    };

    // NEW: Finish Cart
    const finishCart = async () => {
        if (!activeCart.value) return;
        loading.value = true;
        try {
            await databases.updateDocument(DB_ID, CARTS_COL, activeCart.value.$id, {
                status: 'completed',
                completedAt: new Date().toISOString()
            });
            leaveCart();
        } catch (e: any) {
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    };
    
    const checkActiveCart = async (userId: string) => {
         loading.value = true;
         try {
             const result = await databases.listDocuments(
                 DB_ID,
                 CARTS_COL,
                 [
                     Query.equal('buyerId', userId),
                     Query.equal('status', 'active'),
                     Query.orderDesc('$createdAt'),
                     Query.limit(1)
                 ]
             );
             if (result.documents.length > 0) setActiveCart(result.documents[0]);
         } catch (e) {
             console.log("No active cart found");
         } finally {
             loading.value = false;
         }
    };
    
    const leaveCart = () => {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
        activeCart.value = null;
        cartItems.value = [];
        cartExpenses.value = [];
    };

    return {
        activeCart,
        cartItems,
        cartExpenses,
        loading,
        error,
        cartTotalItems,
        cartTotalCost,
        hasActiveCart,
        startCart,
        addItemToCart,
        addExpense,
        finishCart,
        checkActiveCart,
        leaveCart
    };
}
