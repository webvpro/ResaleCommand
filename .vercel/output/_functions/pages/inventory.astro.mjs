import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, r as renderTemplate, n as renderScript, k as renderComponent } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { d as databases, $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
import 'clsx';
import { Query } from 'appwrite';
export { renderers } from '../renderers.mjs';

const DB_ID = "resale_db";
const COLLECTION_ID = "items";
async function getInventoryItems(teamId) {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTION_ID,
      [
        Query.orderDesc("$createdAt"),
        ...teamId ? [Query.equal("teamId", teamId)] : []
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
}

const $$Astro = createAstro("https://example.com");
const $$InventoryList = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$InventoryList;
  const allItems = await getInventoryItems();
  const cartItems = allItems.filter((i) => i.status === "in_cart");
  const cartGroups = cartItems.reduce((groups, item) => {
    const loc = item.purchaseLocation || "Unknown Location";
    if (!groups[loc]) groups[loc] = [];
    groups[loc].push(item);
    return groups;
  }, {});
  const inventoryItems = allItems.filter((i) => i.status !== "in_cart");
  return renderTemplate`${maybeRenderHead()}<div class="space-y-12"> <!-- SHOPPING CART SECTION --> ${cartItems.length > 0 && renderTemplate`<div class="space-y-8"> <h2 class="text-2xl font-bold flex items-center gap-2">🛒 Active Shopping Cart <span class="badge badge-primary">${cartItems.length}</span></h2> ${Object.entries(cartGroups).map(([location, groupItems]) => renderTemplate`<div class="bg-base-200 p-6 rounded-2xl border-2 border-base-300 relative"> <div class="absolute -top-3 left-6 px-2 bg-base-200 text-sm font-bold opacity-70 border border-base-300 rounded">
📍 ${location} (${groupItems.length})
</div> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2"> ${groupItems.map((item) => renderTemplate`<div class="card bg-base-100 shadow-sm border-2 border-primary/20 hover:border-primary transition-colors"> <div class="card-body p-4"> <div class="flex gap-4"> <div class="w-16 h-16 bg-base-300 rounded-lg shrink-0 overflow-hidden"> ${item.imageId ? renderTemplate`<img${addAttribute(`${"https://sfo.cloud.appwrite.io/v1"}/storage/buckets/${"item_images"}/files/${item.imageId}/view?project=${"69714b35003a8adab6bb"}`, "src")} class="w-full h-full object-cover">` : "📦"} </div> <div class="flex-1 min-w-0"> <h3 class="font-bold truncate">${item.title}</h3> <div class="text-xs opacity-70 mt-1">
Max Buy: <span class="font-bold text-success">$${item.maxBuyPrice}</span> </div> ${item.binLocation && renderTemplate`<div class="badge badge-xs badge-outline mt-1">${item.binLocation}</div>`} </div> </div> <div class="card-actions justify-end mt-2"> <button class="btn btn-sm btn-ghost text-error delete-btn"${addAttribute(item.$id, "data-id")}>✕</button> <button class="btn btn-sm btn-primary purchase-btn"${addAttribute(item.$id, "data-id")}${addAttribute(item.title, "data-title")}>
Purchase 💸
</button> </div> </div> </div>`)} </div> </div>`)} </div>`} <!-- MAIN INVENTORY SECTION --> <div> <div class="flex justify-between items-center mb-6"> <h2 class="text-2xl font-bold">In Inventory</h2> <span class="badge badge-lg">${inventoryItems.length} Items</span> </div> ${inventoryItems.length === 0 ? renderTemplate`<div class="text-center py-12 bg-base-200 rounded-xl border-dashed border-2 border-base-300"> <p class="text-lg opacity-60 mb-4">No items in inventory.</p> </div>` : renderTemplate`<div class="grid grid-cols-2 min-[450px]:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3"> ${inventoryItems.map((item) => renderTemplate`<div class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary transition-colors group text-xs"> <figure class="aspect-square bg-base-200 relative overflow-hidden group-hover:opacity-90 transition-opacity"> ${item.imageId ? renderTemplate`<img${addAttribute(`${"https://sfo.cloud.appwrite.io/v1"}/storage/buckets/${"item_images"}/files/${item.imageId}/view?project=${"69714b35003a8adab6bb"}`, "src")}${addAttribute(item.title, "alt")} class="w-full h-full object-cover">` : renderTemplate`<div class="flex items-center justify-center w-full h-full text-xl grayscale opacity-50">📦</div>`} <div${addAttribute(`absolute top-0 right-0 p-1 badge rounded-none rounded-bl-lg badge-xs gap-1 font-bold ${item.status === "draft" ? "badge-warning" : item.status === "need_to_list" ? "badge-info" : item.status === "listed" ? "badge-success" : item.status === "sold" ? "badge-neutral" : ""}`, "class")}> ${item.status ? item.status.replace(/_/g, " ") : "Draft"} </div> </figure> <div class="card-body p-2 gap-0.5"> <h2 class="font-bold text-[11px] leading-tight line-clamp-2 h-[2.2em]"> ${item.title || "Untitled"} </h2> ${item.binLocation && renderTemplate`<div class="text-[9px] opacity-60 truncate">📍 ${item.binLocation}</div>`} <div class="flex justify-between items-end mt-1"> <div class="flex flex-col"> <span class="text-[9px] uppercase opacity-50 font-bold">Est</span> <span class="text-xs font-bold text-success"> ${item.priceFair ? item.priceFair.startsWith("$") ? item.priceFair : "$" + item.priceFair : "-"} </span> </div> <div class="flex flex-col text-right"> <span class="text-[9px] uppercase opacity-50 font-bold">Paid</span> <span class="text-[10px] font-mono opacity-80">
$${item.purchasePrice || "0"} </span> </div> </div> <div class="flex justify-between items-center mt-1 pt-1 border-t border-base-200"> <button class="btn btn-sm btn-square btn-ghost edit-btn"${addAttribute(item.$id, "data-id")}${addAttribute(item.title, "data-title")}${addAttribute(item.purchasePrice, "data-price")}${addAttribute(item.binLocation, "data-bin")}${addAttribute(item.status, "data-status")}${addAttribute(item.imageId, "data-img")}${addAttribute(JSON.stringify(item.galleryImageIds || []), "data-gallery")}${addAttribute(item.marketDescription, "data-description")}>
✏️
</button> <button class="btn btn-xs btn-ghost text-error delete-btn btn-square h-6 min-h-0 w-6"${addAttribute(item.$id, "data-id")} aria-label="Delete">
🗑️
</button> </div> </div> </div>`)} </div>`} </div> <!-- CHECKOUT MODAL --> <dialog id="checkout_modal" class="modal"> <div class="modal-box"> <!-- Form State --> <div id="checkout_form_wrapper"> <h3 class="font-bold text-lg mb-4">Confirm Purchase</h3> <p>Purchasing: <span id="checkout_item_title" class="font-bold"></span></p> <div class="form-control w-full mt-4"> <label class="label"><span class="label-text">Verify Price Paid</span></label> <input type="number" id="checkout_price" class="input input-bordered" placeholder="0.00"> </div> <div class="divider">Receipt</div> <div class="flex flex-col gap-2"> <button id="checkout_camera_btn" class="btn btn-outline gap-2">
📷 Take Receipt Photo
</button> <input type="file" id="checkout_file" accept="image/*" class="file-input file-input-bordered w-full"> <div id="checkout_preview" class="hidden w-full h-32 bg-base-200 rounded-lg mt-2 overflow-hidden"> <img id="checkout_preview_img" class="w-full h-full object-cover"> </div> <!-- Hidden Video Element for Camera --> <video id="checkout_video" class="hidden w-full h-48 bg-black rounded-lg mt-2" autoplay playsinline></video> <button id="checkout_capture_btn" class="hidden btn btn-success w-full mt-2">Capture</button> </div> <div class="modal-action"> <form method="dialog"> <button class="btn btn-ghost" id="checkout_cancel">Cancel</button> </form> <button id="checkout_confirm" class="btn btn-primary">Confirm Purchase</button> </div> </div> <!-- Result State --> <div id="checkout_result_wrapper" class="hidden"> <h3 class="font-bold text-lg text-success mb-4">✅ Purchase Confirmed!</h3> <p class="text-xs opacity-70 mb-4">The item has been moved to "Need to List".</p> <div class="divider">AI Description</div> <div class="form-control w-full"> <label class="label"> <span class="label-text">Generated via Gemini</span> </label> <textarea id="generated_description" class="textarea textarea-bordered w-full h-64 font-mono text-xs" readonly placeholder="Generating description..."></textarea> </div> <div class="modal-action"> <button id="checkout_close_final" class="btn btn-primary w-full">Done</button> </div> </div> </div> </dialog> <!-- EDIT MODAL --> <dialog id="edit_modal" class="modal"> <div class="modal-box"> <h3 class="font-bold text-lg mb-4">Edit Item</h3> <div class="form-control w-full"> <label class="label"><span class="label-text">Title</span></label> <input type="text" id="edit_title" class="input input-bordered w-full"> </div> <div class="flex gap-4 mt-4"> <div class="form-control w-full"> <label class="label"><span class="label-text">Paid Price</span></label> <input type="number" step="0.01" id="edit_price" class="input input-bordered w-full"> </div> <div class="form-control w-full"> <label class="label"><span class="label-text">Bin Location</span></label> <input type="text" id="edit_bin" class="input input-bordered w-full"> </div> </div> <div class="form-control w-full mt-4"> <label class="label"><span class="label-text">Status</span></label> <select id="edit_status" class="select select-bordered"> <option value="in_cart">In Cart</option> <option value="need_to_list">Need to List</option> <option value="listed">Listed</option> <option value="sold">Sold</option> </select> </div> <div class="divider">Description</div> <!-- Description Tabs --> <div class="tabs tabs-boxed mb-2"> <a class="tab tab-active" id="tab_edit_desc">Edit</a> <a class="tab" id="tab_preview_desc">Preview</a> </div> <!-- Edit Mode --> <div id="desc_edit_mode" class="form-control w-full"> <textarea id="edit_description" class="textarea textarea-bordered h-48 font-mono text-xs" placeholder="Product description..."></textarea> </div> <!-- Preview Mode --> <div id="desc_preview_mode" class="hidden w-full h-48 overflow-y-auto border border-base-300 rounded-lg p-4 bg-base-100"> <!-- Prose content will be injected here --> <article id="desc_preview_content" class="prose prose-sm prose-invert max-w-none"></article> </div> <div class="divider">Photos</div> <div class="form-control w-full mb-4"> <label class="label"><span class="label-text text-xs">Main Photo</span></label> <div id="edit_main_img_container" class="w-24 h-24 rounded-lg overflow-hidden border border-base-300 bg-base-200 relative"> <img id="edit_main_img" class="w-full h-full object-cover hidden"> <div id="edit_main_img_placeholder" class="absolute inset-0 flex items-center justify-center text-2xl opacity-50">📦</div> </div> </div> <div class="grid grid-cols-1 gap-4"> <div class="form-control w-full"> <label class="label"><span class="label-text text-xs">Gallery Photos</span></label> <!-- Existing Gallery --> <div id="existing_gallery_container" class="mb-2 hidden"> <p class="text-[10px] uppercase opacity-50 mb-1">Current</p> <div id="existing_gallery_previews" class="flex gap-2 overflow-x-auto pb-2"></div> </div> <!-- Custom File Picker --> <div class="grid grid-cols-2 gap-2"> <div id="gallery_upload_area" class="border-2 border-dashed border-base-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors bg-base-100 flex flex-col items-center justify-center gap-2"> <input type="file" id="edit_gallery_imgs" multiple accept="image/*" class="hidden"> <span class="text-2xl">📁</span> <div class="flex flex-col"> <span class="text-xs font-bold text-primary">Upload</span> <span class="text-[9px] opacity-60">Select Files</span> </div> </div> <div id="gallery_camera_btn" class="border-2 border-dashed border-base-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors bg-base-100 flex flex-col items-center justify-center gap-2"> <span class="text-2xl">📸</span> <div class="flex flex-col"> <span class="text-xs font-bold text-primary">Camera</span> <span class="text-[9px] opacity-60">Take Photos</span> </div> </div> </div> <!-- Preview List --> <div id="gallery_previews" class="flex gap-2 mt-2 overflow-x-auto py-2 min-h-[4rem]"></div> </div> <div class="form-control w-full"> <label class="label"><span class="label-text text-xs">Receipt Photo</span></label> <input type="file" id="edit_receipt_img" accept="image/*" class="file-input file-input-sm file-input-bordered w-full"> </div> </div> <div class="modal-action"> <form method="dialog"> <button class="btn btn-ghost">Cancel</button> </form> <button id="edit_save" class="btn btn-primary">Save Changes</button> </div> </div> </dialog> <!-- CAMERA MODAL --> <dialog id="camera_modal" class="modal"> <div class="modal-box p-0 bg-black w-full h-full max-h-full max-w-full rounded-none md:rounded-xl md:h-auto md:max-w-2xl"> <div class="relative w-full h-full flex flex-col"> <video id="edit_camera_video" autoplay playsinline class="w-full h-full object-cover flex-1"></video> <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-8 items-center"> <button id="close_camera_btn" class="btn btn-circle btn-ghost text-white bg-white/20 backdrop-blur-md">
✕
</button> <button id="capture_camera_btn" class="btn btn-circle btn-primary btn-lg border-4 border-white transform active:scale-95 transition-transform w-20 h-20"> <span class="sr-only">Capture</span> </button> <button id="flip_camera_btn" class="btn btn-circle btn-ghost text-white bg-white/20 backdrop-blur-md">
🔄
</button> <!-- Captured Count Indicator --> <div id="camera_capture_count" class="absolute top-[-40px] right-6 badge badge-lg badge-success font-bold hidden">
+1
</div> </div> </div> </div> </dialog> <!-- CAMERA MODAL --> <dialog id="camera_modal" class="modal"> <div class="modal-box p-0 bg-black w-full h-full max-h-full max-w-full rounded-none md:rounded-xl md:h-auto md:max-w-2xl"> <div class="relative w-full h-full flex flex-col"> <video id="edit_camera_video" autoplay playsinline class="w-full h-full object-cover flex-1"></video> <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-8 items-center"> <button id="close_camera_btn" class="btn btn-circle btn-ghost text-white bg-white/20 backdrop-blur-md">
✕
</button> <button id="capture_camera_btn" class="btn btn-circle btn-primary btn-lg border-4 border-white transform active:scale-95 transition-transform w-20 h-20"> <span class="sr-only">Capture</span> </button> <button id="flip_camera_btn" class="btn btn-circle btn-ghost text-white bg-white/20 backdrop-blur-md">
🔄
</button> <!-- Captured Count Indicator --> <div id="camera_capture_count" class="absolute top-[-40px] right-6 badge badge-lg badge-success font-bold hidden">
+1
</div> </div> </div> </div> </dialog> </div> ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/components/InventoryList.astro?astro&type=script&index=0&lang.ts")}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/InventoryList.astro", void 0);

const $$Inventory = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Inventory | Resale Command" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto px-4 py-8"> <div class="flex justify-between items-center mb-8"> <h1 class="text-3xl font-bold">Inventory</h1> <a href="/" class="btn btn-primary gap-2">
+ Add New
</a> </div> ${renderComponent($$result2, "InventoryList", $$InventoryList, {})} </div> ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/inventory.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/inventory.astro";
const $$url = "/inventory";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Inventory,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
