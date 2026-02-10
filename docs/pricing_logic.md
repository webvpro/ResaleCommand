                                   # Pricing Logic & Strategy

This document outlines the core algorithms and strategy for pricing inventory items in ResaleCommand. It serves as the source of truth for both manual pricing decisions and future automated AI pricing features.

## 1. Core Markup Strategy
*Defining the baseline target price based on cost.*

## 1. Core Markup Strategy
*Defining the baseline target price based on cost.*

*   **Standard Target:** **3.0x Cost** (Buy for $10, Sell for $30)
*   **Minimum Target:** **2.0x Cost** (Absolute floor for quick flips)
*   **High-Value Target:** **1.5x Cost** (For items >$100 cost, volume over margin)

## 2. Condition Modifiers
*How item condition affects the estimated resale value.*

| Condition | % of Market Value | Notes |
| :--- | :--- | :--- |
| **New / Mint** | 100% | Perfect condition, tags on (if applicable). |
| **Good / Fair** | 70-80% | Minor wear, fully functional. |
| **Poor / For Parts** | 20-40% | Significant damage or non-functional. |

## 3. Minimum Profit Thresholds
*We do not purchase items unless they meet these minimum absolute profit numbers.*

## 3. Minimum Profit Thresholds
*We do not purchase items unless they meet these minimum absolute profit numbers.*

*   **Minimum Profit per Item:** **$15.00**
*   **Minimum Listing Price:** **$25.00** - *Items below this are usually not worth the labor time.*

## 4. Market Data Sources
*Sources used for competitive pricing analysis.*

*   [ ] eBay ("Sold" Listings)
*   [ ] StockX (Sneakers/Streetwear)
*   [ ] Mercari
*   [ ] Poshmark

## 5. Depreciation & Markdown Strategy
*Rules for lowering prices over time.*

*   **30 Days:** -10%
*   **60 Days:** -25%
*   **90 Days:** Clearance / Auction

---
*Last Updated: 2026-02-03*
