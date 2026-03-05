import { Client, Databases, Query } from 'node-appwrite';

/*
  Appwrite Function: Process Receipt & Calculate ROI
  Trigger: Event `databases.[DB_ID].collections.[CARTS_ID].documents.*.update`
  
  Environment Variables Required:
  - APPWRITE_API_KEY (Project API Key)
  - APPWRITE_DB_ID
  - APPWRITE_COLLECTION_ITEMS
  - APPWRITE_COLLECTION_EXPENSES
  - APPWRITE_COLLECTION_CARTS
*/

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Or your endpoint
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  const DB_ID = process.env.APPWRITE_DB_ID;
  const ITEMS_COL = process.env.APPWRITE_COLLECTION_ITEMS;
  const EXPENSES_COL = process.env.APPWRITE_COLLECTION_EXPENSES;
  const CARTS_COL = process.env.APPWRITE_COLLECTION_CARTS;

  try {
    // 1. Parse Event Data
    // We expect this to run when a Cart status changes to 'completed'
    // For manual execution (testing), expect JSON body.
    let cartId = '';
    let status = '';
    
    // Handle Event Trigger structure
    if (req.body && typeof req.body === 'string') {
        const payload = JSON.parse(req.body);
        cartId = payload.$id;
        status = payload.status;
    } else if (req.body && req.body.$id) {
         cartId = req.body.$id;
         status = req.body.status;
    }

    if (!cartId) {
        return res.json({ success: false, message: 'No Cart ID found in payload.' });
    }

    if (status !== 'completed') {
        return res.json({ success: true, message: 'Cart not completed. Skipping calculation.' });
    }

    log(`Processing Cart: ${cartId}`);

    // 2. Fetch Expenses (Investment)
    // We need to sum up all expenses linked to this cart
    let allExpenses = [];
    let cursor = null;
    
    do {
        const queries = [
            Query.equal('cartId', cartId),
            Query.limit(100)
        ];
        if (cursor) queries.push(Query.cursorAfter(cursor));

        const response = await db.listDocuments(DB_ID, EXPENSES_COL, queries);
        allExpenses.push(...response.documents);
        
        if (response.documents.length < 100) break;
        cursor = response.documents[response.documents.length - 1].$id;
    } while (true);

    const totalCost = allExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    log(`Total Expenses: $${totalCost}`);


    // 3. Fetch Scanned Items (Revenue Potential)
    // Sum of resalePrice
    let allItems = [];
    cursor = null;
    do {
        const queries = [
            Query.equal('cartId', cartId),
            Query.limit(100)
        ];
        if (cursor) queries.push(Query.cursorAfter(cursor));

        const response = await db.listDocuments(DB_ID, ITEMS_COL, queries);
        allItems.push(...response.documents);

        if (response.documents.length < 100) break;
        cursor = response.documents[response.documents.length - 1].$id;
    } while (true);

    const projectedRevenue = allItems.reduce((sum, item) => sum + (parseFloat(item.resalePrice) || 0), 0);
    log(`Projected Revenue: $${projectedRevenue}`);


    // 4. Calculate ROI Result
    const potentialProfit = projectedRevenue - totalCost;
    const itemCount = allItems.length;


    // 5. Update Cart Document with Finals
    await db.updateDocument(DB_ID, CARTS_COL, cartId, {
        totalCost: totalCost,
        projectedRevenue: projectedRevenue,
        potentialProfit: potentialProfit,
        itemCount: itemCount,
        processedAt: new Date().toISOString()
    });

    log(`Cart ${cartId} updated. Profit: $${potentialProfit}`);

    return res.json({
      success: true,
      data: {
          cartId,
          totalCost,
          projectedRevenue,
          potentialProfit
      }
    });

  } catch (err) {
    error("Function Error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
