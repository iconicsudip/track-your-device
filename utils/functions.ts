// Function to calculate distance from RSSI
export function calculateDistance(rssi:number, rssiRef = -40, pathLossExponent = 2) {
    return Math.pow(10, (rssiRef - rssi) / (10 * pathLossExponent));
}

// Convert distance to a range of possible latitude and longitude
export function calculatePossibleLocations(lat:number, lng:number, distance:number) {
    const latChangePerMeter = 1 / 110540;
    const lngChangePerMeter = 1 / (111320 * Math.cos(lat * (Math.PI / 180)));

    const possibleLocations = [];

    for (let angle = 0; angle < 360; angle += 1) {
        const angleRad = angle * (Math.PI / 180);
        const deltaX = distance * Math.cos(angleRad);
        const deltaY = distance * Math.sin(angleRad);

        const possibleLat = lat + deltaY * latChangePerMeter;
        const possibleLng = lng + deltaX * lngChangePerMeter;

        possibleLocations.push([possibleLat, possibleLng]);
    }

    return possibleLocations;
}


// Function to calculate a single estimated position
export function estimatePosition(lat: number, lng: number, distance: number, angle:number) {
    const latChangePerMeter = 1 / 110540;
    const lngChangePerMeter = 1 / (111320 * Math.cos(lat * (Math.PI / 180)));

    const angleRad = angle * (Math.PI / 180); // Convert angle to radians

    const deltaX = distance * Math.cos(angleRad);
    const deltaY = distance * Math.sin(angleRad);
    const estimatedLat = lat + deltaY * latChangePerMeter;
    const estimatedLng = lng + deltaX * lngChangePerMeter;

    return [estimatedLat, estimatedLng];
}
export function estimateMultiplePositions(lat:number, lng:number, distance:number, numPositions = 8) {
    const positions = [];
    const latChangePerMeter = 1 / 110540;
    const lngChangePerMeter = 1 / (111320 * Math.cos(lat * (Math.PI / 180)));

    for (let i = 0; i < numPositions; i++) {
        const angle = (360 / numPositions) * i; // Dividing 360 degrees into equal parts
        const angleRad = angle * (Math.PI / 180);

        const deltaX = distance * Math.cos(angleRad);
        const deltaY = distance * Math.sin(angleRad);

        const estimatedLat = lat + deltaY * latChangePerMeter;
        const estimatedLng = lng + deltaX * lngChangePerMeter;
        
        positions.push([estimatedLat.toFixed(7), estimatedLng.toFixed(7)]);
    }

    return positions;
}


