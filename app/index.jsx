import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Switch, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated
} from 'react-native';
import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
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

// IP Input component to isolate the issue
const IpInputSection = ({ ipAddress, setIpAddress, saveIpAddress, isDarkMode }) => {
  return (
    <View style={styles.ipInputContainer}>
      <TextInput
        style={[styles.ipInput, { 
          backgroundColor: isDarkMode ? '#333333' : '#ffffff',
          color: isDarkMode ? '#e0e0e0' : '#333333',
          borderColor: isDarkMode ? '#444444' : '#dddddd'
        }]}
        placeholder="Enter IP Address"
        placeholderTextColor={isDarkMode ? "#aaa" : "#999"}
        value={ipAddress}
        onChangeText={setIpAddress}
        keyboardType="decimal-pad"
        autoFocus
      />
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={saveIpAddress}
      >
        <Feather name="check" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Light button component
const LightButton = ({ lightOn, lightNumber, onPress, disabled, isDarkMode }) => {
  return (
    <TouchableOpacity 
      style={[styles.lightButton, lightOn === 1 && styles.lightButtonOn]}
      onPress={onPress}
      disabled={disabled}
    >
      <FontAwesome 
        name="lightbulb-o" 
        size={24} 
        color={lightOn === 1 ? '#f5dd4b' : '#888'} 
      />
      <Text style={[styles.lightText, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
        {lightNumber}
      </Text>
    </TouchableOpacity>
  );
};

export default function BlinkyApp() {
  const [internetEnabled, setInternetEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [showIpInput, setShowIpInput] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [savedIpAddress, setSavedIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Light states
  const [internetLights, setInternetLights] = useState({
    one: 0,
    two: 0,
    three: 0,
    blinky: 0
  });
  
  const [wifiLights, setWifiLights] = useState({
    one: 0,
    two: 0,
    three: 0,
    blinky: 0
  });

  // Animation value for brightness effect
  const brightness = useRef(new Animated.Value(0)).current;

  // Load initial state from Firebase
  useEffect(() => {
    const internetRef = ref(database, 'internet');
    onValue(internetRef, (snapshot) => {
      const data = snapshot.val() || { enabled: 0, one: 0, two: 0, three: 0, blinky: 0 };
      setInternetEnabled(data.enabled === 1);
      setInternetLights({
        one: data.one || 0,
        two: data.two || 0,
        three: data.three || 0,
        blinky: data.blinky || 0
      });
    });

    const wifiRef = ref(database, 'wifi');
    onValue(wifiRef, (snapshot) => {
      const data = snapshot.val() || { enabled: 0, one: 0, two: 0, three: 0, blinky: 0 };
      setWifiEnabled(data.enabled === 1);
      setWifiLights({
        one: data.one || 0,
        two: data.two || 0,
        three: data.three || 0,
        blinky: data.blinky || 0
      });
    });
  }, []);

  // Update brightness animation when lights change
  useEffect(() => {
    const anyLightOn = 
      internetEnabled && (internetLights.one === 1 || internetLights.two === 1 || internetLights.three === 1 || internetLights.blinky === 1) ||
      wifiEnabled && (wifiLights.one === 1 || wifiLights.two === 1 || wifiLights.three === 1 || wifiLights.blinky === 1);
    
    Animated.timing(brightness, {
      toValue: anyLightOn ? 1 : 0,
      duration: 500,
      useNativeDriver: false
    }).start();

    // Update dark mode based on lights
    setIsDarkMode(!anyLightOn);
  }, [internetEnabled, wifiEnabled, internetLights, wifiLights]);

  const toggleInternet = async () => {
    try {
      setIsLoading(true);
      const newState = !internetEnabled;
      
      // If turning on internet, turn off WiFi
      if (newState && wifiEnabled) {
        await set(ref(database, 'wifi'), {
          enabled: 0,
          one: 0,
          two: 0,
          three: 0,
          blinky: 0
        });
        setWifiEnabled(false);
        setWifiLights({ one: 0, two: 0, three: 0, blinky: 0 });
      }
      
      // Update internet state
      await set(ref(database, 'internet/enabled'), newState ? 1 : 0);
      
      // If turning off internet, turn off all lights
      if (!newState) {
        await set(ref(database, 'internet'), {
          enabled: 0,
          one: 0,
          two: 0,
          three: 0,
          blinky: 0
        });
        setInternetLights({ one: 0, two: 0, three: 0, blinky: 0 });
      }
      
      setInternetEnabled(newState);
    } catch (error) {
      console.error("Error updating Firebase:", error);
      Alert.alert("Error", "Failed to update light state");
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
      
      // If turning on WiFi, turn off Internet
      if (newState && internetEnabled) {
        await set(ref(database, 'internet'), {
          enabled: 0,
          one: 0,
          two: 0,
          three: 0,
          blinky: 0
        });
        setInternetEnabled(false);
        setInternetLights({ one: 0, two: 0, three: 0, blinky: 0 });
      }
      
      // Update WiFi state in Firebase
      await set(ref(database, 'wifi/enabled'), newState ? 1 : 0);
      
      // If turning off WiFi, turn off all lights
      if (!newState) {
        await set(ref(database, 'wifi'), {
          enabled: 0,
          one: 0,
          two: 0,
          three: 0,
          blinky: 0
        });
        setWifiLights({ one: 0, two: 0, three: 0, blinky: 0 });
        
        // Also send requests to turn off all lights
        await Promise.all([
          fetch(`http://${savedIpAddress}:3000/one/0`),
          fetch(`http://${savedIpAddress}:3000/two/0`),
          fetch(`http://${savedIpAddress}:3000/three/0`),
          fetch(`http://${savedIpAddress}:3000/blinky/0`)
        ]);
      }
      
      setWifiEnabled(newState);
    } catch (error) {
      console.error("Error sending HTTP request:", error);
      Alert.alert("Error", "Failed to send request to the IP address");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInternetLight = async (light) => {
    if (!internetEnabled) return;
    
    try {
      setIsLoading(true);
      const currentState = internetLights[light];
      const newState = currentState === 1 ? 0 : 1;
      
      // Update Firebase
      await set(ref(database, `internet/${light}`), newState);
      
      // Update local state
      setInternetLights(prev => ({
        ...prev,
        [light]: newState
      }));
    } catch (error) {
      console.error("Error updating Firebase:", error);
      Alert.alert("Error", "Failed to update light state");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWifiLight = async (light) => {
    if (!wifiEnabled || !savedIpAddress) return;
    
    try {
      setIsLoading(true);
      const currentState = wifiLights[light];
      const newState = currentState === 1 ? 0 : 1;
      
      // Update Firebase
      await set(ref(database, `wifi/${light}`), newState);
      
      // Send HTTP request
      const response = await fetch(`http://${savedIpAddress}:3000/${light}/${newState}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setWifiLights(prev => ({
        ...prev,
        [light]: newState
      }));
    } catch (error) {
      console.error("Error sending HTTP request:", error);
      Alert.alert("Error", "Failed to send request to the IP address");
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

  // Background color based on brightness
  const containerStyle = {
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f7'
  };
  
  const headerStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#3498db'
  };
  
  const headerTextStyle = {
    color: isDarkMode ? '#e0e0e0' : '#ffffff'
  };
  
  const settingContainerStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff'
  };
  
  const settingTextStyle = {
    color: isDarkMode ? '#e0e0e0' : '#333333'
  };
  
  const savedIpContainerStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#e8f5fe'
  };
  
  const savedIpTextStyle = {
    color: isDarkMode ? '#e0e0e0' : '#333333'
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBar barStyle={isDarkMode ? "dark-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, headerStyle]}>
          <Text style={[styles.headerText, headerTextStyle]}>Blinky</Text>
        </View>
        
        <View style={styles.content}>
          {/* Internet Toggle */}
          <View style={[styles.settingContainer, settingContainerStyle]}>
            <View style={styles.settingLabel}>
              <Text style={[styles.settingText, settingTextStyle]}>Internet</Text>
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
          
          {/* Internet Lights (shown when Internet is enabled) */}
          {internetEnabled && (
            <View style={[styles.lightsContainer, settingContainerStyle]}>
              <LightButton 
                lightOn={internetLights.one}
                lightNumber="1"
                onPress={() => toggleInternetLight('one')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={internetLights.two}
                lightNumber="2"
                onPress={() => toggleInternetLight('two')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={internetLights.three}
                lightNumber="3"
                onPress={() => toggleInternetLight('three')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={internetLights.blinky}
                lightNumber="Blink"
                onPress={() => toggleInternetLight('blinky')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          
          {/* WiFi Toggle with Expandable Input */}
          <View style={[styles.settingContainer, settingContainerStyle]}>
            <View style={styles.settingLabel}>
              <Text style={[styles.settingText, settingTextStyle]}>WiFi</Text>
              <TouchableOpacity onPress={toggleIpInput} style={styles.arrowButton}>
                <AntDesign 
                  name={showIpInput ? "up" : "down"} 
                  size={20} 
                  color={isDarkMode ? "#aaa" : "#555"} 
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
          
          {/* WiFi Lights (shown when WiFi is enabled) */}
          {wifiEnabled && (
            <View style={[styles.lightsContainer, settingContainerStyle]}>
              <LightButton 
                lightOn={wifiLights.one}
                lightNumber="1"
                onPress={() => toggleWifiLight('one')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={wifiLights.two}
                lightNumber="2"
                onPress={() => toggleWifiLight('two')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={wifiLights.three}
                lightNumber="3"
                onPress={() => toggleWifiLight('three')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
              
              <LightButton 
                lightOn={wifiLights.blinky}
                lightNumber="Blink"
                onPress={() => toggleWifiLight('blinky')}
                disabled={isLoading}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          
          {/* IP Address Input (Expandable) */}
          {showIpInput && (
            <IpInputSection 
              ipAddress={ipAddress}
              setIpAddress={setIpAddress}
              saveIpAddress={saveIpAddress}
              isDarkMode={isDarkMode}
            />
          )}
          
          {/* Display saved IP if available */}
          {savedIpAddress ? (
            <View style={[styles.savedIpContainer, savedIpContainerStyle]}>
              <Text style={[styles.savedIpText, savedIpTextStyle]}>
                Saved IP: {savedIpAddress}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1a1a1a',
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
    color: '#e0e0e0',
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
    backgroundColor: '#2a2a2a',
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
    color: '#e0e0e0',
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
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444444',
    color: '#e0e0e0'
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
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  savedIpText: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  lightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lightButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    width: '22%',
  },
  lightButtonOn: {
    backgroundColor: 'rgba(245, 221, 75, 0.2)',
    borderColor: '#f5dd4b',
  },
  lightText: {
    marginTop: 8,
    fontSize: 16,
    color: '#e0e0e0',
  },
});