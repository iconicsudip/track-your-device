import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useRoute } from '@react-navigation/native';
import { calculateDistance, estimateMultiplePositions, estimatePosition } from '@/utils/functions';

export default function Device() {
    const route = useRoute()
    const { device } = route.params;
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [deviceLocation,setDeviceLocation] = useState<{
        latitude: string,
        longitude:string
    } | null> (null)
    const [loading, setLoading] = useState(true);

    const getRssi = async ()=>{
        const {rssi} = await device.readRSSI()
        return rssi
    }

    useEffect(() => {
        let locationSubscription: { remove: any; };

        const startLocationTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Error', 'Location permission is required to track location.');
                setLoading(false);
                return;
            }
            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000, // 5 seconds
                    mayShowUserSettingsDialog: true,
                },
                async (newLocation) => {
                    const currentRssi = await getRssi()
                    const distance = calculateDistance(currentRssi);
                    const lat = newLocation.coords.latitude;
                    const lng = newLocation.coords.longitude
                    const possiblePositions = estimateMultiplePositions(lat, lng, distance);
                    // Select a random position from the possible ones
                    const randomIndex = Math.floor(Math.random() * possiblePositions.length);
                    const [estimatedLat, estimatedLng] = possiblePositions[randomIndex];
                    setDeviceLocation({
                        latitude:estimatedLat,
                        longitude:estimatedLng
                    })
                    setLocation(newLocation.coords);
                    setLoading(false);
                }
            );
            
        };

        startLocationTracking();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Device Details</Text>
            </View>
            <View style={styles.detailsContainer}>
                <Text style={styles.deviceText}>Name: <Text style={styles.deviceValue}>{device.name ? device.name : 'N/A'}</Text></Text>
                <Text style={styles.deviceText}>ID: <Text style={styles.deviceValue}>{device.id}</Text></Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : location && deviceLocation? (
                    <>
                        <Text style={styles.deviceText}>Phone's Latitude: <Text style={styles.deviceValue}>{location.latitude}</Text></Text>
                        <Text style={styles.deviceText}>Phone's Longitude: <Text style={styles.deviceValue}>{location.longitude}</Text></Text>
                        <Text style={styles.deviceText}>Device's Latitude: <Text style={styles.deviceValue}>{deviceLocation.latitude}</Text></Text>
                        <Text style={styles.deviceText}>Device's Longitude: <Text style={styles.deviceValue}>{deviceLocation.longitude}</Text></Text>
                    </>
                ) : (
                    <Text style={styles.deviceText}>Tracking location...</Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginTop: 40,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    detailsContainer: {
        flex: 1,
        // justifyContent: 'center',
    },
    deviceText: {
        fontSize: 18,
        marginBottom: 10,
        color: '#333',
    },
    deviceValue: {
        fontWeight: 'bold',
        color: '#007AFF',
    },
});