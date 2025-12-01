import express from 'express';
const router = express.Router();

// In-memory storage (exported for test reset, to be replaced with PostgreSQL later)
export let favouriteLists = [];

/**
 * Create favourite list (POST /api/favourites)
 * Request body: { userid, list_name, visibility }
 * Response: 201 + new list | 400 Bad Request | 409 Conflict (duplicate list name)
 */
router.post('/', (req, res) => {
  try {
    const { userid, list_name, visibility } = req.body;

    // Validate required parameters
    if (!userid || !list_name || !visibility) {
      return res.status(400).json({ error: "Missing required parameters (userid/list_name/visibility)" });
    }

    // Validate visibility value
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "visibility must be either 'public' or 'private'" });
    }

    // Check for duplicate list name (same user, not deleted)
    const isDuplicate = favouriteLists.some(
      list => !list.isDeleted && list.userid === userid && list.list_name === list_name
    );
    if (isDuplicate) {
      return res.status(409).json({ error: "This user already has a favourite list with the same name" });
    }

    // Generate ID (array length + 1, to be replaced with DB auto-increment ID later)
    const newList = {
      id: favouriteLists.length + 1,
      userid,
      list_name,
      visibility,
      items: [], // Store media items: { movieid?: string, showid?: string }
      isDeleted: false, // Soft delete flag
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    favouriteLists.push(newList);
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to create favourite list" });
  }
});

/**
 * Query favourite lists (GET /api/favourites)
 * Scenario 1: Get all non-deleted lists by user ID (query param: ?userid=xxx)
 * Scenario 2: Get single non-deleted list by list ID (path: /api/favourites/:listId)
 * Response: 200 + list data | 400 Bad Request | 404 Not Found
 */
router.get('/', (req, res) => {
  try {
    const { userid } = req.query;

    // Validate userid query param
    if (!userid) {
      return res.status(400).json({ error: "Missing query parameter 'userid'" });
    }

    // Filter non-deleted lists for the user
    const userLists = favouriteLists.filter(
      list => !list.isDeleted && list.userid === userid
    );

    if (userLists.length === 0) {
      return res.status(404).json({ error: "This user has no favourite lists" });
    }

    res.status(200).json(userLists);
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to query favourite lists" });
  }
});

router.get('/:listId', (req, res) => {
  try {
    const listId = parseInt(req.params.listId);

    // Validate listId format
    if (isNaN(listId)) {
      return res.status(400).json({ error: "List ID must be a number" });
    }

    // Find non-deleted list
    const targetList = favouriteLists.find(
      list => !list.isDeleted && list.id === listId
    );

    if (!targetList) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    res.status(200).json(targetList);
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to query favourite list" });
  }
});

/**
 * Add item to list (POST /api/favourites/:listId/items)
 * Request body: { movieid } OR { showid } (one or the other)
 * Response: 200 + updated list | 400 Bad Request | 404 Not Found | 409 Conflict (item exists)
 */
router.post('/:listId/items', (req, res) => {
  try {
    const listId = parseInt(req.params.listId);
    const { movieid, showid } = req.body;

    // Validate listId format
    if (isNaN(listId)) {
      return res.status(400).json({ error: "List ID must be a number" });
    }

    // Validate media ID (one required, not both)
    if (!movieid && !showid) {
      return res.status(400).json({ error: "Must provide either 'movieid' or 'showid' (not both)" });
    }
    if (movieid && showid) {
      return res.status(400).json({ error: "Cannot provide both 'movieid' and 'showid'" });
    }

    // Find non-deleted list
    const targetList = favouriteLists.find(
      list => !list.isDeleted && list.id === listId
    );
    if (!targetList) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Check if item already exists
    const itemKey = movieid ? "movieid" : "showid";
    const itemValue = movieid || showid;
    const isItemExists = targetList.items.some(item => item[itemKey] === itemValue);

    if (isItemExists) {
      return res.status(409).json({ error: `This ${itemKey} is already in the favourite list` });
    }

    // Add item and update timestamp
    targetList.items.push({ [itemKey]: itemValue });
    targetList.updatedAt = new Date().toISOString();

    res.status(200).json(targetList);
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to add item to favourite list" });
  }
});

/**
 * Remove item from list (DELETE /api/favourites/:listId/items)
 * Request body: { movieid } OR { showid } (one or the other)
 * Response: 204 No Content | 400 Bad Request | 404 Not Found (list/item)
 */
router.delete('/:listId/items', (req, res) => {
  try {
    const listId = parseInt(req.params.listId);
    const { movieid, showid } = req.body;

    // Validate listId format
    if (isNaN(listId)) {
      return res.status(400).json({ error: "List ID must be a number" });
    }

    // Validate media ID (one required, not both)
    if (!movieid && !showid) {
      return res.status(400).json({ error: "Must provide either 'movieid' or 'showid' (not both)" });
    }
    if (movieid && showid) {
      return res.status(400).json({ error: "Cannot provide both 'movieid' and 'showid'" });
    }

    // Find non-deleted list
    const targetList = favouriteLists.find(
      list => !list.isDeleted && list.id === listId
    );
    if (!targetList) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Find and remove item
    const itemKey = movieid ? "movieid" : "showid";
    const itemValue = movieid || showid;
    const initialLength = targetList.items.length;

    targetList.items = targetList.items.filter(item => item[itemKey] !== itemValue);

    // Check if item existed
    if (targetList.items.length === initialLength) {
      return res.status(404).json({ error: `This ${itemKey} is not in the favourite list` });
    }

    // Update timestamp
    targetList.updatedAt = new Date().toISOString();

    res.status(204).send(); // 204 has no response body
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to remove item from favourite list" });
  }
});

/**
 * Update list visibility (PATCH /api/favourites/:listId/visibility)
 * Request body: { visibility }
 * Response: 200 + updated list | 400 Bad Request | 404 Not Found
 */
router.patch('/:listId/visibility', (req, res) => {
  try {
    const listId = parseInt(req.params.listId);
    const { visibility } = req.body;

    // Validate listId format
    if (isNaN(listId)) {
      return res.status(400).json({ error: "List ID must be a number" });
    }

    // Validate visibility value
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "visibility must be either 'public' or 'private'" });
    }

    // Find non-deleted list
    const targetList = favouriteLists.find(
      list => !list.isDeleted && list.id === listId
    );
    if (!targetList) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Update visibility and timestamp
    targetList.visibility = visibility;
    targetList.updatedAt = new Date().toISOString();

    res.status(200).json(targetList);
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to update list visibility" });
  }
});

/**
 * Delete list (soft delete) (DELETE /api/favourites/:listId)
 * Response: 204 No Content | 400 Bad Request | 404 Not Found
 */
router.delete('/:listId', (req, res) => {
  try {
    const listId = parseInt(req.params.listId);

    // Validate listId format
    if (isNaN(listId)) {
      return res.status(400).json({ error: "List ID must be a number" });
    }

    // Find non-deleted list
    const targetList = favouriteLists.find(
      list => !list.isDeleted && list.id === listId
    );
    if (!targetList) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Soft delete: mark isDeleted as true
    targetList.isDeleted = true;
    targetList.updatedAt = new Date().toISOString();

    res.status(204).send(); // 204 has no response body
  } catch (err) {
    res.status(500).json({ error: "Server error: Failed to delete favourite list" });
  }
});

export default router;