# Inventory Status Workflow Plan

We are analyzing how physical items move through your process to ensure the ResaleCommand system matches your workflow perfectly. Let's document each step an item takes from the moment you acquire it to the moment it leaves your possession.

## Current System Statuses

Currently, the database (`DATA_STRUCTURE.md`) defines the following statuses:

1. `draft` - Initial entry, missing info
2. `in_cart` - Scouted/adding to cart (maybe not physically acquired yet)
3. `need_to_list` - Ready to be listed on a marketplace
4. `listed` - Active on a marketplace
5. `sold` - Pending shipment or completed

## Your Actual Workflow

Based on common reseller practices (thrift stores, bins, arbitrage, etc.), items flow through these stages:

**Stage 1: Sourcing / Scouting**

- Scanning items in-store, checking comps.
- Item is considered "scouted" but maybe not purchased yet.

**Stage 2: Acquisition / The "Death Pile"**

- Item is purchased and brought home.
- It sits in unlisted inventory waiting to be processed.

**Stage 3: Processing & Prep**

- Cleaning, testing, measuring.
- Photographing the item.

**Stage 4: Listing & Placement**

- Writing the description, determining final price.
- Posting the item to online marketplaces (eBay, Poshmark, etc.).
- OR placing the item for sale in a physical retail space (booth, case).

**Stage 5: Storage / Display**

- Item is assigned a physical location (e.g., Bin A4, or Booth #12).

**Stage 6: Sale & Fulfillment**

- Item sells online (needs packing/shipping) or sells at the physical location (mark as sold).

## Proposed Status Mapping

Here is how we map those physical stages to the `status` field in the database:

| Physical Stage           | System Status (`status`) | Notes                                                                                     |
| :----------------------- | :----------------------- | :---------------------------------------------------------------------------------------- |
| Sourcing / Scouting      | `scouted`                | Replaces `in_cart`. Item is being evaluated, perhaps sitting in a physical shopping cart. |
| Acquisition / Death Pile | `acquired`               | Item is bought and owned, but no work has been done on it yet.                            |
| Processing & Prep        | `processing`             | Item is actively being cleaned, tested, or photographed.                                  |
| Ready to List/Place      | `need_to_list`           | Photos and details are done, ready for online listing or physical placement.              |
| Listed Online            | `listed`                 | Active on an online marketplace.                                                          |
| Placed in Booth/Case     | `at_location`            | **NEW STATUS**. Item is actively for sale at a physical retail space.                     |
| Sale & Fulfillment       | `sold`                   | Item is sold and pending shipment or already shipped/purchased by a customer.             |

---

**Next Steps:**
Update the database schema documentation and the application code to support these new statuses (`scouted`, `acquired`, `processing`, `need_to_list`, `listed`, `at_location`, `sold`).
