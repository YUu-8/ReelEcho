import express from 'express';
import {
  createFavouriteList,
  getFavouriteListsByUser,
  getFavouriteListById,
  addItemToFavouriteList,
  removeItemFromFavouriteList,
  updateListVisibility,
  softDeleteFavouriteList,
  updateFavouriteList
} from '../../controllers/favourite.controller.js';

const router = express.Router();
//TP7: Favourites Routes
router.post('/', createFavouriteList);               
router.get('/', getFavouriteListsByUser);           
router.get('/:listId', getFavouriteListById);        
router.put('/:listId', updateFavouriteList);         
router.delete('/:listId', softDeleteFavouriteList);  


router.post('/:listId/items', addItemToFavouriteList);       
router.delete('/:listId/items', removeItemFromFavouriteList); 
router.patch('/:listId/visibility', updateListVisibility);   

export default router;