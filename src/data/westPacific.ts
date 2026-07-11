export const WP_BOUNDS = {
  west: 100,
  east: 180,
  south: 0,
  north: 50,
};

export function isInWestPacific(lng: number, lat: number): boolean {
  return (
    lng >= WP_BOUNDS.west &&
    lng <= WP_BOUNDS.east &&
    lat >= WP_BOUNDS.south &&
    lat <= WP_BOUNDS.north &&
    !(lng > 125 && lat > 50)
  );
}
