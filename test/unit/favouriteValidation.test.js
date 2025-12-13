import { describe, it, expect } from 'vitest';
import { isValidListData, isValidListItem } from '../../src/utils/favouriteValidation.js';

describe('Favourite List Parameter Validation Utility Functions', () => {
  describe('isValidListData', () => {
    it('returns true for valid parameters', () => {
      const data = { userid: 'user1', list_name: 'My Favorites', visibility: 'public' };
      expect(isValidListData(data)).toBe(true);
    });

    it('returns false when userid is missing', () => {
      const data = { list_name: 'My Favorites', visibility: 'public' };
      expect(isValidListData(data)).toBe(false);
    });

    it('returns false for invalid visibility value', () => {
      const data = { userid: 'user1', list_name: 'My Favorites', visibility: 'invalid' };
      expect(isValidListData(data)).toBe(false);
    });
  });

  describe('isValidListItem', () => {
    it('returns true when only movieid is provided', () => {
      const data = { movieid: 'm1' };
      expect(isValidListItem(data)).toBe(true);
    });

    it('returns true when only showid is provided', () => {
      const data = { showid: 's1' };
      expect(isValidListItem(data)).toBe(true);
    });

    it('returns false when both movieid and showid are provided', () => {
      const data = { movieid: 'm1', showid: 's1' };
      expect(isValidListItem(data)).toBe(false);
    });

    it('returns false when neither movieid nor showid are provided', () => {
      const data = {};
      expect(isValidListItem(data)).toBe(false);
    });
  });
});