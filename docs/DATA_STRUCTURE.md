# System Data Structure Documentation

This document outlines the expected CSV structure for bulk imports and the database schema for the Inventory items.

## 1. ShopGoodwill CSV Import Rules

The bulk importer (`CsvImporter.vue`) includes specific logic to handle ShopGoodwill export formats, particularly resolving the ambiguity between "Item Name" and "Item ID" columns.

### strict Column Mapping Logic

The system uses **Content-Aware Mapping** to distinguish columns. It checks the _data_ in the first row to confirm the mapping.

| System Field | Logic & Keywords                                           | Content Validation Rule                                                                                                       |
| :----------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Title**    | `description`, `title`, `item name`, `product`, **`item`** | **MUST be Text.** <br>If a column matches "Item" but contains only numbers (e.g. `251710005`), it is **REJECTED** as a Title. |
| **Item ID**  | `item #`, `item id`, `order #`, `listing id`, **`item`**   | **MUST be Numeric.**<br>If a column matches "Item" but contains text (e.g. "Red Shoes"), it is **REJECTED** as an ID.         |
| **Price**    | `price`, `amount`, `winning bid`, `cost`, `paid`           | -                                                                                                                             |
| **Shipping** | `shipping`, `handling`, `s&h`, `ship`                      | -                                                                                                                             |
| **Order ID** | `order #`, `order number`, `invoice`, `order`              | Defaults to Item ID if not found.                                                                                             |

### Ambiguity Resolution Example

If your CSV has two columns named similarly:

| Column A Header: **"Item"**       | Column B Header: **"Item"**      |
| :-------------------------------- | :------------------------------- |
| Data: `251710005`                 | Data: `Vintage Nike Air Jordans` |
| **Result:** Mapped to **Item ID** | **Result:** Mapped to **Title**  |

### Import Features

- **Smart Fallback:** If no Title column is found, the system automatically selects the **column with the longest average text length** as the Description/Title.
- **ID Scanning:** If no ID column is found, the system scans all columns for a 9-10 digit number (standard ShopGoodwill ID format).
- **Safe Mode:** If database schema mismatches occur, data is saved into `conditionNotes` to prevent loss.

---

## 2. Database Structure (Appwrite)

**Database ID:** `inventory_db` (or from env `PUBLIC_APPWRITE_DB_ID`)
**Collection ID:** `items` (or from env `PUBLIC_APPWRITE_COLLECTION_ID`)

### Core Schema (`items` Collection)

| Attribute Name      | Type   | Size/Format | Required | Description                                                                          |
| :------------------ | :----- | :---------- | :------- | :----------------------------------------------------------------------------------- |
| `title`             | String | 255         | **Yes**  | Item title/headline.                                                                 |
| `status`            | String | 50          | No       | `scouted`, `acquired`, `processing`, `need_to_list`, `listed`, `at_location`, `sold` |
| `conditionNotes`    | String | 1000+       | No       | Condition details. **Also used for "Safe Mode" backup data.**                        |
| `paidPrice`         | Float  | -           | No       | Purchase cost.                                                                       |
| `resalePrice`       | Float  | -           | No       | Target sale price.                                                                   |
| `maxBuyPrice`       | Float  | -           | No       | Max bid limit (for scouting).                                                        |
| `purchaseLocation`  | String | 255         | No       | Source URL (e.g., ShopGoodwill link) or Store Name.                                  |
| `binLocation`       | String | 255         | No       | Physical location (e.g., "Bin A-2").                                                 |
| `marketDescription` | String | 5000        | No       | AI-generated description.                                                            |

### Images & Media

| Attribute Name    | Type     | Description                                     |
| :---------------- | :------- | :---------------------------------------------- |
| `imageId`         | String   | ID of the **Main Photo** in the Storage Bucket. |
| `galleryImageIds` | String[] | Array of IDs for additional photos.             |
| `receiptImageId`  | String   | ID of the purchase receipt image.               |

### Legacy / "Safe Mode" Fields

If attributes like `paidPrice` or `imageId` are missing from the schema, the system automatically appends them to `conditionNotes` in this format:

- `Paid: $19.99`
- `[MAIN IMAGE ID: 65a4b...]`
- `Imported from Order #12345`

### Indexes

- `idx_title`: Key index on `title` (ASC) for searching.
- `idx_purchaseLocation`: Key index on `purchaseLocation` (ASC) for filtering by source.
