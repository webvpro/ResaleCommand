# Implementation Plan: Bulk Lots & Quantity System

## 1. Goal
Support advanced inventory operations for buying bulk mystery boxes (mixed items) or large lots of identical items (e.g., 50 Lego Minifigs). Provide a structured way to split items out while retaining accurate unit cost and total lot ROI tracking.

## 2. Proposed Changes

### A. Database Schema Updates (`items` and `items_dev` collections)
- **`parentLotId` (String, Optional)**: To link an extracted child item back to its original parent box/lot.
- **`quantity` (Integer, Default 1)**: To track identical bulk items without creating 50 separate documents.
- **`isLot` (Boolean, Default false)**: Optional flag to explicitly mark a parent container as a Lot. (Alternative: We can just use the presence of children as the indicator).

### B. The "Mixed Lot" System (Parent/Child)
- **Workflow:** You buy a mixed box of RPG books for $100. You create one item "Mixed RPG Box" with a cost of $100.
- **Extracting:** In the `ItemDrawer`, we add an "Extract Item from Lot" tool.
- **Cost Distribution Modal:** When extracting, the user specifies:
  - Title of the child item.
  - Cost to allocate to the child item (deducted from the parent's "Remaining Cost Basis" pool).
- **Lot Reconciliation Dashboard:** When viewing a parent lot, a new tab ("Lot Dashboard") will query all child items (`parentLotId == parent.$id`). It displays:
  - Original Lot Cost.
  - Cost Allocated to Children so far.
  - Realized Revenue (sum of sold children).
  - Lot ROI (Are we profitable on this box yet?).

### C. The "Quantity" System (Identical Items)
- **Workflow:** You buy 50 identical Lego Minifigs for $20. You create one item "Lego Minifigs" with `Cost: 20` and `Quantity: 50`.
- **Unit Cost:** The system computes `Unit Cost = Total Cost / Quantity` ($0.40/each).
- **Selling:** In the `ItemDrawer` (or via Bulk Actions), add a "Sell One" button. This creates a Sold child item (cost: $0.40) and decrements the parent lot's quantity to 49.

### D. UI/UX Additions
- **`ItemDrawer.vue`**: Add the `quantity` input. Add the "Extract from Lot" / "Sell One" buttons. Add the Lot Reconciliation tab for parent items.
- **`InventoryManager.vue`**: Display `quantity` if > 1 on the item card. Ensure quantity calculations don't break existing ROI math.
- **`ItemCard.vue`**: Show a small batch icon or "x50" badge if `quantity > 1`.

## 3. Implementation Steps
1. Run an Appwrite Node.js script (`scripts/add-lot-fields.mjs`) to append `parentLotId` and `quantity` to the database schema safely.
2. Update the frontend `saveItemToInventory` logic to accept and persist `quantity` and `parentLotId`.
3. Build the UI components in `ItemDrawer.vue` (Lot extraction modals and the Lot Reconciliation tab).
4. Update `ItemCard.vue` and `DashboardMetrics.vue` to respect the `quantity` multiplier when calculating totals, if applicable.
