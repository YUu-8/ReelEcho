import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import FavouriteList from '../../src/models/favourite.model.js';
import { connectToDb } from '../../src/db/mongo.js';

// Connect to database before tests run, close connection after tests complete
beforeAll(async () => {
  await connectToDb();
});

// Clear favourites collection before each test case
beforeEach(async () => {
  await FavouriteList.deleteMany({});
});

describe('Favourite List API Integration Tests', () => {
  // 1. Create list
  it('POST /api/favourites creates a list successfully (201)', async () => {
    const res = await request(app)
      .post('/api/favourites')
      .send({ userid: 'user1', list_name: 'My Movies', visibility: 'public' });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.userid).toBe('user1');
  });

  // 2. Get lists by user ID
  it('GET /api/favourites?userid=xxx returns all user lists (200)', async () => {
    // Create two lists first
    await FavouriteList.create([
      { userid: 'user1', list_name: 'List 1', visibility: 'public' },
      { userid: 'user1', list_name: 'List 2', visibility: 'private' }
    ]);

    const res = await request(app).get('/api/favourites?userid=user1');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // 3. Add item to list
  it('POST /api/favourites/:listId/items adds movieid successfully (200)', async () => {
    // Create list first
    const list = await FavouriteList.create({ userid: 'user1', list_name: 'Test List', visibility: 'public' });
    
    const res = await request(app)
      .post(`/api/favourites/${list._id}/items`)
      .send({ movieid: 'm2024' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].movieid).toBe('m2024');
  });

  // 4. Soft delete list
  it('DELETE /api/favourites/:listId performs soft delete successfully (204)', async () => {
    const list = await FavouriteList.create({ userid: 'user1', list_name: 'List to Delete', visibility: 'public' });
    
    const res = await request(app).delete(`/api/favourites/${list._id}`);
    expect(res.statusCode).toBe(204);

    // Verify list is marked as deleted
    const deletedList = await FavouriteList.findById(list._id);
    expect(deletedList.isDeleted).toBe(true);
  });

  // 5. Update list name and visibility (PUT endpoint)
  it('PUT /api/favourites/:listId updates list successfully (200)', async () => {
    const list = await FavouriteList.create({ userid: 'user1', list_name: 'Old Name', visibility: 'public' });
    
    const res = await request(app)
      .put(`/api/favourites/${list._id}`)
      .send({ list_name: 'New Name', visibility: 'private' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.list_name).toBe('New Name');
    expect(res.body.visibility).toBe('private');
  });
});