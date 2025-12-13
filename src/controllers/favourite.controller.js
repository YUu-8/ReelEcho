import mongoose from "mongoose";
import FavouriteList from "../models/favourite.model.js";

// 1. Create favourite list (POST /api/favourites)
export async function createFavouriteList(req, res, next) {
  try {
    const { userid, list_name, visibility } = req.body;

    // Validate required fields
    if (!userid || !list_name || !visibility) {
      return res.status(400).json({ error: "Missing required parameters (userid/list_name/visibility)" });
    }

    // Create list (model index prevents duplicate names for the same user)
    const newList = await FavouriteList.create({ userid, list_name, visibility });
    res.status(201).json(newList);
  } catch (err) {
    // Catch index conflict (duplicate list name)
    if (err.code === 11000) {
      return res.status(409).json({ error: "A favourite list with this name already exists for this user" });
    }
    next(err); // Pass other errors to global error handler
  }
}

// 2. Get all lists by user ID (GET /api/favourites)
export async function getFavouriteListsByUser(req, res, next) {
  try {
    const { userid } = req.query;
    if (!userid) {
      return res.status(400).json({ error: "Missing query parameter 'userid'" });
    }

    // Query non-deleted lists
    const lists = await FavouriteList.find({ userid, isDeleted: false });
    if (lists.length === 0) {
      return res.status(404).json({ error: "No favourite lists found for this user" });
    }

    res.status(200).json(lists);
  } catch (err) {
    next(err);
  }
}

// 3. Get single list by list ID (GET /api/favourites/:listId)
export async function getFavouriteListById(req, res, next) {
  try {
    const { listId } = req.params;

    // Validate listId format
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }

    const list = await FavouriteList.findOne({ _id: listId, isDeleted: false });
    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

// 4. Add item to favourite list (POST /api/favourites/:listId/items)
export async function addItemToFavouriteList(req, res, next) {
  try {
    const { listId } = req.params;
    const { movieid, showid } = req.body;

    // Validate parameters
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }
    if (!movieid && !showid) {
      return res.status(400).json({ error: "Must provide either movieid or showid (one only)" });
    }
    if (movieid && showid) {
      return res.status(400).json({ error: "Cannot provide both movieid and showid" });
    }

    // Find list and add item (prevent duplicates)
    const list = await FavouriteList.findOne({ _id: listId, isDeleted: false });
    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Check for duplicate item
    const itemKey = movieid ? "movieid" : "showid";
    const isDuplicate = list.items.some(item => item[itemKey] === (movieid || showid));
    if (isDuplicate) {
      return res.status(409).json({ error: `This ${itemKey} is already in the favourite list` });
    }

    // Add item and update timestamp
    list.items.push({ [itemKey]: movieid || showid });
    await list.save();

    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

// 5. Remove item from favourite list (DELETE /api/favourites/:listId/items)
export async function removeItemFromFavouriteList(req, res, next) {
  try {
    const { listId } = req.params;
    const { movieid, showid } = req.body;

    // Validate parameters
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }
    if (!movieid && !showid) {
      return res.status(400).json({ error: "Must provide either movieid or showid (one only)" });
    }
    if (movieid && showid) {
      return res.status(400).json({ error: "Cannot provide both movieid and showid" });
    }

    // Find list and remove item
    const list = await FavouriteList.findOne({ _id: listId, isDeleted: false });
    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    const itemKey = movieid ? "movieid" : "showid";
    const initialLength = list.items.length;
    list.items = list.items.filter(item => item[itemKey] !== (movieid || showid));

    // Verify item existed
    if (list.items.length === initialLength) {
      return res.status(404).json({ error: `This ${itemKey} is not in the favourite list` });
    }

    await list.save();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// 6. Update list visibility (PATCH /api/favourites/:listId/visibility)
export async function updateListVisibility(req, res, next) {
  try {
    const { listId } = req.params;
    const { visibility } = req.body;

    // Validate parameters
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "Visibility must be either 'public' or 'private'" });
    }

    // Update visibility
    const list = await FavouriteList.findOneAndUpdate(
      { _id: listId, isDeleted: false },
      { visibility, updatedAt: new Date() },
      { new: true } // Return updated document
    );

    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

// 7. Soft delete favourite list (DELETE /api/favourites/:listId)
export async function softDeleteFavouriteList(req, res, next) {
  try {
    const { listId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }

    const list = await FavouriteList.findOneAndUpdate(
      { _id: listId, isDeleted: false },
      { isDeleted: true, updatedAt: new Date() }
    );

    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// 8. Update list name/visibility (PUT /api/favourites/:listId) - Missing endpoint from Lab6
export async function updateFavouriteList(req, res, next) {
  try {
    const { listId } = req.params;
    const { list_name, visibility } = req.body;

    // Validate parameters
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID format" });
    }
    if (!list_name && !visibility) {
      return res.status(400).json({ error: "At least one update field is required (list_name/visibility)" });
    }
    if (visibility && !["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "Visibility must be either 'public' or 'private'" });
    }

    // Build update data
    const updateData = {};
    if (list_name) updateData.list_name = list_name;
    if (visibility) updateData.visibility = visibility;
    updateData.updatedAt = new Date();

    // Update list (prevent duplicate name conflict)
    const list = await FavouriteList.findOne({ _id: listId, isDeleted: false });
    if (!list) {
      return res.status(404).json({ error: "Favourite list does not exist or has been deleted" });
    }

    // Check for duplicate name if updating list name
    if (list_name && list.list_name !== list_name) {
      const isDuplicate = await FavouriteList.exists({
        userid: list.userid,
        list_name,
        isDeleted: false
      });
      if (isDuplicate) {
        return res.status(409).json({ error: "A favourite list with this name already exists for this user" });
      }
    }

    const updatedList = await FavouriteList.findByIdAndUpdate(
      listId,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedList);
  } catch (err) {
    next(err);
  }
}