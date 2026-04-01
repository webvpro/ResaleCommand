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


## ItemDrawer Input UI Refactor
The user wants to refine the layout of the bottom portion of the `ItemDrawer` to be more spacious and intuitive.

1.  **DaisyUI Status Steps**: Instead of a standard `<select>` dropdown for the Item Status (Acquired, Placed, Sold), implement a visual stepper using DaisyUI's `steps` component to clearly show progression. This should have clickable steps that update the `editForm.status`.
2.  **TagInput Full Rows**: The "Sales Channels" and "Keywords" inputs currently share a flex column below the status dropdown. They will be given full width so they stack cleanly.
3.  **Decoupled Tag Input Field**: In `TagInput.vue`, the text input field `<input>` is currently embedded *inside* the flex container holding the active tag badges. This gives it a constrained look. We will separate the input into its own distinct UI element visually positioned below the badge list.
4.  **Graceful Degration on Auth Errors**: The console shows Appwrite 401 Unauthorized errors when fetching the tags collection in `TagInput.vue`. We need to handle this by silently catching the exception and proceeding with purely local additions, or fixing the database permissions if possible.
