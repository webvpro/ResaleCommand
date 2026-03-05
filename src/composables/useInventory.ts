import { ref, computed } from 'vue';
import { databases, Query, client } from '../lib/appwrite';
import type { Models } from 'appwrite';

const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID;
const ITEMS_COL_ID = import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID;

// Shared state for the general inventory view
const inventoryItems = ref<Models.Document[]>([]);
const totalItems = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);
let currentTeamId: string | null = null;
let unsubscribe: (() => void) | null = null;

export function useInventory() {
    
    // -- Realtime Subscription --
    const initRealtime = () => {
        if (unsubscribe) return; // Already listening
        
        console.log('[Inventory] Starting Realtime Subscription...');
        unsubscribe = client.subscribe(
            `databases.${DB_ID}.collections.${ITEMS_COL_ID}.documents`,
            (response) => {
                const eventType = response.events[0];
                const item = response.payload as Models.Document;

                // 1. Filter by Tenant (Security/Relevance)
                if (currentTeamId && (item as any).tenantId !== currentTeamId) return;

                // 2. Handle Events
                if (eventType.includes('.create')) {
                    // Check if already exists (prevent duplicates if local optimistic update happened)
                    if (!inventoryItems.value.find(i => i.$id === item.$id)) {
                        inventoryItems.value.unshift(item);
                    }
                    totalItems.value++;
                } else if (eventType.includes('.update')) {
                    const idx = inventoryItems.value.findIndex(i => i.$id === item.$id);
                    if (idx !== -1) {
                        inventoryItems.value[idx] = item;
                    } else {
                        // Moved into view (e.g. status change)? Add to top
                        inventoryItems.value.unshift(item);
                    }
                } else if (eventType.includes('.delete')) {
                    inventoryItems.value = inventoryItems.value.filter(i => i.$id !== item.$id);
                    totalItems.value--;
                }
            }
        );
    };

    // State
    const hasMore = ref(false);
    
    /**
     * Fetch items (all)
     */
    const fetchInventory = async (teamId: string) => {
        currentTeamId = teamId;
        loading.value = true;
        error.value = null;
        
        try {
            // Appwrite limit is max 5000 documents per request
            const queries = [
                Query.orderDesc('$createdAt'),
                Query.orderDesc('$id'), 
                Query.limit(5000)
            ];

            if (teamId) {
                queries.push(Query.equal('teamId', teamId));
            }

            const response = await databases.listDocuments(
                DB_ID,
                ITEMS_COL_ID,
                queries
            );
            
            totalItems.value = response.total;

            inventoryItems.value = response.documents;
            initRealtime();
            
            hasMore.value = false;
        } catch (e: any) {
            console.error("Failed to fetch inventory:", e);
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    };
    
    const loadNextPage = () => {
        // No-op
    };

    /**
     * Add an item to the local list (optimistic update or after creation)
     */
    const addLocalItem = (item: Models.Document) => {
        // Prevent dupes
        if (!inventoryItems.value.find(i => i.$id === item.$id)) {
             inventoryItems.value.unshift(item);
        }
    };

    return {
        inventoryItems,
        totalItems,
        loading,
        error,
        hasMore,
        fetchInventory,
        loadNextPage,
        addLocalItem
    };
}
