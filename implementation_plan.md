# AI Product Description Generation

## Goal
Automatically generate an eBay-style product description in Markdown format when an item is purchased (moved to "need_to_list" status), using the item's photos and the Google Gemini API.

## Proposed Changes

### Database Schema
#### [MODIFY] [update-schema.mjs](file:///c:/Users/15034/Projects/ResaleCommand/scripts/update-schema.mjs)
- Add `marketDescription` (string, 5000 chars) attribute to the `items` collection.

### Backend
#### [NEW] [src/pages/api/generate-description.ts](file:///c:/Users/15034/Projects/ResaleCommand/src/pages/api/generate-description.ts)
- Create an API endpoint actions:
    - Receive `itemId`.
    - Fetch item data to get image IDs (Main + Gallery).
    - Download images from Appwrite Storage.
    - Initialize Gemini model (`gemini-1.5-flash` or similar).
    - Send prompt + images to Gemini.
    - Receive generated Markdown description.
    - Update item's `marketDescription` field in Appwrite.
    - Return success status.

### Frontend
#### [MODIFY] [InventoryList.astro](file:///c:/Users/15034/Projects/ResaleCommand/src/components/InventoryList.astro)
- Update the `checkout_confirm` event listener.
- After successfully updating the status to `need_to_list`, call the new `generate-description` API.
- Ideally, show a "Generating description..." toast or indicator (optional, but good UX), since this might take a few seconds. The user can continue, it can happen in background.

## Verification Plan
### Automated Tests
- None planned for this integration.
33: 
34: ### 2. Edit Modal Enhancements
35: #### [MODIFY] [InventoryList.astro](file:///c:/Users/15034/Projects/ResaleCommand/src/components/InventoryList.astro)
36: - Add `data-description` attribute to edit buttons.
37: - Add Description field to Edit Modal with Tabs: [Edit] | [Preview].
38: - Use `marked` library (via CDN) to render Markdown in the Preview tab.
39: - Apply `prose` styling (with manual fallback) to the preview container.
40:
41: ### Automatic Tests

### Manual Verification
1. Add an item to the cart.
2. Open "Confirm Purchase" modal.
3. Take/Add receipt photo (optional) and confirm.
4. Verify in Appwrite Console (or UI if I add a display) that `marketDescription` is populated with a markdown string.
