import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Switch, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyDAlmuJ6W_B3jM5AeRGEWlgL_E7j_tLxSA",
    authDomain: "networktochattingapp.firebaseapp.com",
    databaseURL: "https://networktochattingapp-default-rtdb.firebaseio.com",
    projectId: "networktochattingapp",
    storageBucket: "networktochattingapp.firebasestorage.app",
    messagingSenderId: "499438247946",
    appId: "1:499438247946:web:1279247a98d02a4a8b7ff3",
    measurementId: "G-Z0K6TC1R08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function BlinkyApp() {
  const [internetEnabled, setInternetEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [showIpInput, setShowIpInput] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [savedIpAddress, setSavedIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load initial state from Firebase
  useEffect(() => {
    const lightsRef = ref(database, 'lights/state');
    onValue(lightsRef, (snapshot) => {
      const data = snapshot.val();
      setInternetEnabled(data === 1);
    });
  }, []);

  const toggleInternet = async () => {
    try {
      setIsLoading(true);
      const newState = !internetEnabled;
      setInternetEnabled(newState);
      
      // Update Firebase
      await set(ref(database, 'lights/state'), newState ? 1 : 0);
    } catch (error) {
      console.error("Error updating Firebase:", error);
      Alert.alert("Error", "Failed to update light state");
      setInternetEnabled(!newState); // Revert the state if there's an error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWifi = async () => {
    if (!savedIpAddress) {
      Alert.alert("Error", "Please set an IP address first");
      return;
    }

    try {
      setIsLoading(true);
      const newState = !wifiEnabled;
      setWifiEnabled(newState);
      
      // Send HTTP request to the IP address
      const endpoint = newState ? '/on' : '/off';
      const response = await fetch(`http://${savedIpAddress}:3000${endpoint}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending HTTP request:", error);
      Alert.alert("Error", "Failed to send request to the IP address");
      setWifiEnabled(!newState); // Revert the state if there's an error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIpInput = () => setShowIpInput(previousState => !previousState);
  
  const saveIpAddress = () => {
    if (!ipAddress) {
      Alert.alert("Error", "Please enter a valid IP address");
      return;
    }
    setSavedIpAddress(ipAddress);
    setShowIpInput(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Blinky</Text>
      </View>
      
      <View style={styles.content}>
        {/* Internet Toggle */}
        <View style={styles.settingContainer}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>Internet</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={internetEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleInternet}
            value={internetEnabled}
            style={styles.switch}
            disabled={isLoading}
          />
        </View>
        
        {/* WiFi Toggle with Expandable Input */}
        <View style={styles.settingContainer}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>WiFi</Text>
            <TouchableOpacity onPress={toggleIpInput} style={styles.arrowButton}>
              <AntDesign 
                name={showIpInput ? "up" : "down"} 
                size={20} 
                color="#555" 
              />
            </TouchableOpacity>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={wifiEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleWifi}
            value={wifiEnabled}
            style={styles.switch}
            disabled={isLoading || !savedIpAddress}
          />
        </View>
        
        {/* IP Address Input (Expandable) */}
        {showIpInput && (
          <View style={styles.ipInputContainer}>
            <TextInput
              style={styles.ipInput}
              placeholder="Enter IP Address"
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveIpAddress}
            >
              <Feather name="check" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Display saved IP if available */}
        {savedIpAddress ? (
          <View style={styles.savedIpContainer}>
            <Text style={styles.savedIpText}>Saved IP: {savedIpAddress}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  arrowButton: {
    marginLeft: 10,
    padding: 5,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  ipInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ipInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedIpContainer: {
    backgroundColor: '#e8f5fe',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  savedIpText: {
    fontSize: 16,
    color: '#333',
  },
});