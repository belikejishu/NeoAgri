/**
 * Converts degrees to radians
 */
const toRad = (value) => {
  return (value * Math.PI) / 180;
};

/**
 * Converts radians to degrees
 */
const toDeg = (value) => {
  return (value * 180) / Math.PI;
};

/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * @param {number} lat1 - Latitude of start point
 * @param {number} lon1 - Longitude of start point
 * @param {number} lat2 - Latitude of end point
 * @param {number} lon2 - Longitude of end point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculates the initial bearing from a start point to an end point.
 * @param {number} lat1 - Latitude of start point
 * @param {number} lon1 - Longitude of start point
 * @param {number} lat2 - Latitude of end point
 * @param {number} lon2 - Longitude of end point
 * @returns {number} Bearing in degrees from North (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let theta = Math.atan2(y, x);
  let bearing = (toDeg(theta) + 360) % 360;

  return bearing;
};

/**
 * Helper to get a human-readable direction from a bearing angle in Hindi/Marathi contexts
 * @param {number} bearing - Bearing in degrees (0-360)
 * @returns {string} Direction string
 */
export const getDirectionText = (bearing) => {
  if (bearing >= 337.5 || bearing < 22.5) return "उत्तर"; // North
  if (bearing >= 22.5 && bearing < 67.5) return "उत्तर-पूर्व"; // North-East
  if (bearing >= 67.5 && bearing < 112.5) return "पूर्व"; // East
  if (bearing >= 112.5 && bearing < 157.5) return "दक्षिण-पूर्व"; // South-East
  if (bearing >= 157.5 && bearing < 202.5) return "दक्षिण"; // South
  if (bearing >= 202.5 && bearing < 247.5) return "दक्षिण-पश्चिम"; // South-West
  if (bearing >= 247.5 && bearing < 292.5) return "पश्चिम"; // West
  if (bearing >= 292.5 && bearing < 337.5) return "उत्तर-पश्चिम"; // North-West
  return "आगे"; // Straight ahead as fallback
};
