export interface Coords {
    lat: number;
    lng: number;
}
export declare function haversineDistance(a: Coords, b: Coords): number;
