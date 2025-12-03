import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
// Import Vitest test utilities 
import { beforeEach, describe, it, expect } from 'vitest';
// Correct path: test/unit → src/route
import favouriteRoutes, { favouriteLists } from '../src/routes/auto/favourites.route.js';

const app = express();
app.use(bodyParser.json());
app.use('/api/favourites', favouriteRoutes);

// Reset storage before each test
beforeEach(() => {
  favouriteLists.length = 0;
});

// Helper: Create test list
const createTestList = async (
  userid = "user1",
  list_name = "My Favourites",
  visibility = "public"
) => {
  return request(app)
    .post('/api/favourites')
    .send({ userid, list_name, visibility });
};

// Test suites
describe('Favourite List API', () => {
  describe('POST /api/favourites', () => {
    it('should create list successfully (201)', async () => {
      const res = await createTestList();
      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(1);
    });

    it('should return 400 if missing params', async () => {
      const res = await request(app).post('/api/favourites').send({ userid: "user1" });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if invalid visibility', async () => {
      const res = await request(app)
        .post('/api/favourites')
        .send({ userid: "user1", list_name: "Test", visibility: "invalid" });
      expect(res.statusCode).toBe(400);
    });

    it('should return 409 if duplicate list name', async () => {
      await createTestList("user1", "Duplicate");
      const res = await createTestList("user1", "Duplicate");
      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/favourites', () => {
    it('should get user lists (200)', async () => {
      await createTestList("user1", "List 1");
      await createTestList("user1", "List 2");
      const res = await request(app).get('/api/favourites?userid=user1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should return 404 if no lists', async () => {
      const res = await request(app).get('/api/favourites?userid=user2');
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 without userid', async () => {
      const res = await request(app).get('/api/favourites');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/favourites/:listId', () => {
    it('should get list by ID (200)', async () => {
      const createRes = await createTestList();
      const res = await request(app).get(`/api/favourites/${createRes.body.id}`);
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 if invalid listId', async () => {
      const res = await request(app).get('/api/favourites/abc');
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if list not found', async () => {
      const res = await request(app).get('/api/favourites/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/favourites/:listId/items', () => {
    it('should add movieid (200)', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1" });
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(1);
    });

    it('should add showid (200)', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ showid: "s1" });
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 with both ids', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1", showid: "s1" });
      expect(res.statusCode).toBe(400);
    });

    it('should return 409 if item exists', async () => {
      const createRes = await createTestList();
      await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1" });
      const res = await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1" });
      expect(res.statusCode).toBe(409);
    });
  });

  describe('DELETE /api/favourites/:listId/items', () => {
    it('should remove movieid (204)', async () => {
      const createRes = await createTestList();
      await request(app)
        .post(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1" });
      const res = await request(app)
        .delete(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m1" });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 if item not found', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .delete(`/api/favourites/${createRes.body.id}/items`)
        .send({ movieid: "m2" });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/favourites/:listId/visibility', () => {
    it('should update visibility (200)', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .patch(`/api/favourites/${createRes.body.id}/visibility`)
        .send({ visibility: "private" });
      expect(res.statusCode).toBe(200);
      expect(res.body.visibility).toBe("private");
    });

    it('should return 400 if invalid visibility', async () => {
      const createRes = await createTestList();
      const res = await request(app)
        .patch(`/api/favourites/${createRes.body.id}/visibility`)
        .send({ visibility: "invalid" });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/favourites/:listId', () => {
    it('should soft delete list (204)', async () => {
      const createRes = await createTestList();
      const res = await request(app).delete(`/api/favourites/${createRes.body.id}`);
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 if already deleted', async () => {
      const createRes = await createTestList();
      await request(app).delete(`/api/favourites/${createRes.body.id}`);
      const res = await request(app).delete(`/api/favourites/${createRes.body.id}`);
      expect(res.statusCode).toBe(404);
    });
  });
});