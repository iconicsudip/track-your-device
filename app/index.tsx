import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, Text, FlatList, View, Platform, PermissionsAndroid, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import * as Location from 'expo-location';
import * as DeviceInfo from 'expo-device';
import { useNavigation } from '@react-navigation/native';

export const manager = new BleManager();

const App = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const [isScanning,setIsScanning] = useState<boolean>(false);

    const handleScan = async () => {
        const permission = await requestPermissions();
        setIsScanning(true);
        if (permission) {
            if(connectedDevice?.id){
                disconnectFromDevice(connectedDevice)
            }
            manager.startDeviceScan(null, null, (error, device) => {
                if (error) {
                    console.error(error);
                    setIsScanning(false);
                    return;
                }

                if (device) {
                    setDevices((prevDevices) => {
                        if (!prevDevices.some(d => d.id === device.id)) {
                            return [...prevDevices, device];
                            // if(device.name) {
                            // }
                        }
                        return prevDevices;
                    });
                    // manager.stopDeviceScan()
                    setIsScanning(false);
                }
            });
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            setTimeout(async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    return false;
                }
                // Check the Android version
                if (DeviceInfo.osVersion && parseInt(DeviceInfo.osVersion, 10) >= 12) {
                    const fineLocation = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                    );
                    const coarseLocation = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
                    );
                    const bluetoothScan = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
                    );
                    const bluetoothConnect = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
                    );
    
                    if (
                        fineLocation !== PermissionsAndroid.RESULTS.GRANTED ||
                        coarseLocation !== PermissionsAndroid.RESULTS.GRANTED ||
                        bluetoothScan !== PermissionsAndroid.RESULTS.GRANTED ||
                        bluetoothConnect !== PermissionsAndroid.RESULTS.GRANTED
                    ) {
                        Alert.alert('Permission Error', 'All required permissions were not granted.');
                        return false;
                    }
                }
                return true;
                
            }, 2000);
        }
        return true;
    };

    const connectToDevice = async (device: Device) => {
        try {
            const connectedDevice = await manager.connectToDevice(device.id);
            setConnectedDevice(connectedDevice);
        } catch (error:any) {
            console.error('Failed to connect:', error);
            Alert.alert('Connection Error', error.message);
        }
    };

    const disconnectFromDevice = async (device: Device) => {
        try {
            await manager.cancelDeviceConnection(device.id);
            setConnectedDevice(null);
        } catch (error:any) {
            console.error('Failed to disconnect:', error);
            Alert.alert('Connection Error', error.message);
        }
    };

    const onRefresh = useCallback(() => {
        if(connectedDevice?.id){
            console.log(connectedDevice)
            disconnectFromDevice(connectedDevice)
        }
        setRefreshing(true);
        setDevices([]);  // Clear the device list
        handleScan();    // Start a new scan
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    const handleDevicePress = (device: Device) => {
        if (connectedDevice?.id === device.id) {
            navigation.navigate('Device', { device });
        } else {
            Alert.alert('Not Connected', 'Please connect to the device first.');
        }
    };

    useEffect(() => {
        requestPermissions();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>BLE Scanner</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
                <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            {isScanning ? (
                <Text style={styles.scanningText}>Scanning devices... please wait</Text>
            ) : (
                <FlatList
                    data={devices}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleDevicePress(item)}>
                            <View style={styles.deviceContainer}>
                                <Text style={styles.deviceText}>Name: {item.name ? item.name : 'N/A'}</Text>
                                <Text style={styles.deviceText}>ID: {item.id}</Text>
                                <Text style={styles.deviceText}>Status: {connectedDevice?.id === item.id ? 'Connected' : 'Disconnected'}</Text>
                                {connectedDevice?.id === item.id ? (
                                    <TouchableOpacity style={styles.disconnectButton} onPress={() => disconnectFromDevice(item)}>
                                        <Text style={styles.buttonText}>Disconnect</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.connectButton} onPress={() => connectToDevice(item)}>
                                        <Text style={styles.buttonText}>Connect</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        marginTop: 40,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    scanButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    deviceContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 5,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
    },
    deviceText: {
        fontSize: 16,
        marginBottom: 5,
    },
    connectButton: {
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    disconnectButton: {
        backgroundColor: '#dc3545',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    scanningText: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        color: '#007AFF',
    },
});

export default App;
