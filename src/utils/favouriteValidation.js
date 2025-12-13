/**
 * Validate favourite list creation parameters
 * @param {Object} data - Request body data
 * @returns {boolean} - Returns true if parameters are valid, false otherwise
 */
export function isValidListData(data) {
  if (!data) return false;
  if (!data.userid || typeof data.userid !== 'string') return false;
  if (!data.list_name || typeof data.list_name !== 'string') return false;
  if (!['public', 'private'].includes(data.visibility)) return false;
  return true;
}

/**
 * Validate list item parameters (either movieid OR showid must be provided, not both)
 * @param {Object} data - Request body data
 * @returns {boolean} - Returns true if parameters are valid, false otherwise
 */
export function isValidListItem(data) {
  if (!data) return false;
  const hasMovieId = !!data.movieid && typeof data.movieid === 'string';
  const hasShowId = !!data.showid && typeof data.showid === 'string';
  return (hasMovieId || hasShowId) && !(hasMovieId && hasShowId);
}