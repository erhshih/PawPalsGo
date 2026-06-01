"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
const EARTH_RADIUS_M = 6371000;
function haversineDistance(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
