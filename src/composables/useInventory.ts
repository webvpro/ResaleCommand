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
    const hasMore = ref(true);
    const PAGE_SIZE = 100;
    
    /**
     * Fetch items (Initial or Load More)
     */
    const fetchInventory = async (teamId: string, loadMore = false) => {
        currentTeamId = teamId;
        loading.value = true;
        error.value = null;
        
        try {
            const currentCount = loadMore ? inventoryItems.value.length : 0;
            // console.log(`[Inventory] Fetching offset ${currentCount}, limit ${PAGE_SIZE}`);

            const queries = [
                Query.orderDesc('$createdAt'),
                Query.orderDesc('$id'), // Secondary sort to prevent duplicates on identical timestamps
                Query.limit(PAGE_SIZE),
                Query.offset(currentCount)
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

            if (loadMore) {
                // Deduplicate (Safety net)
                const existingIds = new Set(inventoryItems.value.map(i => i.$id));
                const newItems = response.documents.filter(i => !existingIds.has(i.$id));
                
                if (newItems.length === 0 && response.documents.length > 0) {
                     console.warn("Pagination warning: Received only duplicate items. Reached end?");
                     hasMore.value = false;
                }

                inventoryItems.value = [...inventoryItems.value, ...newItems];
            } else {
                inventoryItems.value = response.documents;
                initRealtime();
            }
            
            // Robust End-of-List Check
            if (inventoryItems.value.length >= totalItems.value) {
                hasMore.value = false;
            } else {
                hasMore.value = true;
            }

        } catch (e: any) {
            console.error("Failed to fetch inventory:", e);
            error.value = e.message;
        } finally {
            loading.value = false;
        }
    };
    
    const loadNextPage = () => {
        if (currentTeamId === null || loading.value || !hasMore.value) return;
        fetchInventory(currentTeamId, true);
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
