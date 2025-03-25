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

// Firebase configuration
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

// IP Input Component
const IpInputSection = ({ ipAddress, setIpAddress, saveIpAddress, isDarkMode }) => {
  return (
    <View style={styles.ipInputContainer}>
      <TextInput
        style={[styles.ipInput, { 
          backgroundColor: isDarkMode ? '#333333' : '#ffffff',
          color: isDarkMode ? '#e0e0e0' : '#333333',
          borderColor: isDarkMode ? '#444444' : '#dddddd'
        }]}
        placeholder="Enter IP Address (e.g., 192.168.1.100)"
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

// Light Button Component
const LightButton = ({ lightOn, lightNumber, onPress, disabled, isDarkMode }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.lightButton, 
        lightOn === 1 && styles.lightButtonOn,
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <FontAwesome 
        name="lightbulb-o" 
        size={24} 
        color={lightOn === 1 ? '#f5dd4b' : disabled ? '#555' : '#888'} 
      />
      <Text style={[
        styles.lightText, 
        { color: isDarkMode ? (disabled ? '#666' : '#e0e0e0') : (disabled ? '#aaa' : '#333333') }
      ]}>
        {lightNumber}
      </Text>
    </TouchableOpacity>
  );
};

// Main App Component
export default function BlinkyApp() {
  const [internetEnabled, setInternetEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [showIpInput, setShowIpInput] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [savedIpAddress, setSavedIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [internetStatus, setInternetStatus] = useState('Internet connection unavailable');
  const [wifiStatus, setWifiStatus] = useState('Network connection unavailable');
  
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

  const brightness = useRef(new Animated.Value(0)).current;

  // Network status checker
  const checkNetworkStatus = async (type, ip = null) => {
    try {
      const startTime = Date.now();
      const response = ip 
        ? await fetch(`http://${ip}`, { timeout: 5000 })
        : await fetch('https://www.google.com', { timeout: 5000 });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        if (responseTime > 2000) {
          return 'Network performance degraded';
        }
        return type === 'wifi' ? 'IP connection established successfully' : 'Internet connection active';
      }
    } catch (error) {
      return type === 'wifi' ? 'Network connection unavailable' : 'Internet connection unavailable';
    }
  };

  // Load initial states and check network
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

    // Check network status periodically
    const interval = setInterval(async () => {
      const internetStat = await checkNetworkStatus('internet');
      const wifiStat = savedIpAddress ? await checkNetworkStatus('wifi', savedIpAddress) : 'Network connection unavailable';
      setInternetStatus(internetStat);
      setWifiStatus(wifiStat);
    }, 5000);

    return () => clearInterval(interval);
  }, [savedIpAddress]);

  // Update theme based on light states
  useEffect(() => {
    const anyLightOn = 
      internetEnabled && (internetLights.one === 1 || internetLights.two === 1 || internetLights.three === 1 || internetLights.blinky === 1) ||
      wifiEnabled && (wifiLights.one === 1 || wifiLights.two === 1 || wifiLights.three === 1 || wifiLights.blinky === 1);
    
    Animated.timing(brightness, {
      toValue: anyLightOn ? 1 : 0,
      duration: 500,
      useNativeDriver: false
    }).start();

    setIsDarkMode(!anyLightOn);
  }, [internetEnabled, wifiEnabled, internetLights, wifiLights]);

  // IP Validation
  const validateIpAddress = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Save and validate IP address
  const saveIpAddress = async () => {
    if (!ipAddress) {
      Alert.alert("Error", "Please enter an IP address");
      return;
    }

    if (!validateIpAddress(ipAddress)) {
      Alert.alert("Error", "Please enter a valid IP address (e.g., 192.168.1.100)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://${ipAddress}`, {
        timeout: 5000
      });
      
      if (response.ok) {
        setSavedIpAddress(ipAddress);
        setShowIpInput(false);
        setWifiStatus('IP connection established successfully');
        Alert.alert("Success", "IP address verified and saved successfully");
      } else {
        setWifiStatus('Network connection unavailable');
        Alert.alert("Error", "Failed to connect to the IP address");
      }
    } catch (error) {
      let errorMessage = "Unable to connect to the IP address";
      if (error

.code === 'ECONNREFUSED') {
        errorMessage = "Connection refused. Check if the server is running.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Connection timed out. Check the IP address and network.";
      }
      setWifiStatus('Network connection unavailable');
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Internet
  const toggleInternet = async () => {
    try {
      setIsLoading(true);
      const newState = !internetEnabled;
      
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
      
      await set(ref(database, 'internet/enabled'), newState ? 1 : 0);
      
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
      const status = await checkNetworkStatus('internet');
      setInternetStatus(status);
    } catch (error) {
      console.error("Error updating Firebase:", error);
      setInternetStatus('Internet connection unavailable');
      Alert.alert("Error", "Failed to update internet state");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle WiFi
  const toggleWifi = async () => {
    if (!savedIpAddress) {
      Alert.alert("Error", "Please set a valid IP address first");
      return;
    }

    try {
      setIsLoading(true);
      const newState = !wifiEnabled;
      
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
      
      await set(ref(database, 'wifi/enabled'), newState ? 1 : 0);
      
      if (!newState) {
        await set(ref(database, 'wifi'), {
          enabled: 0,
          one: 0,
          two: 0,
          three: 0,
          blinky: 0
        });
        setWifiLights({ one: 0, two: 0, three: 0, blinky: 0 });
        
        await Promise.all([
          fetch(`http://${savedIpAddress}/off/1`),
          fetch(`http://${savedIpAddress}/off/2`),
          fetch(`http://${savedIpAddress}/off/3`),
          fetch(`http://${savedIpAddress}/off/blinkyy`)
        ]);
      }
      
      setWifiEnabled(newState);
      const status = await checkNetworkStatus('wifi', savedIpAddress);
      setWifiStatus(status);
    } catch (error) {
      console.error("Error toggling WiFi:", error);
      setWifiStatus('Network connection unavailable');
      Alert.alert("Error", "Failed to toggle WiFi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Internet Light
  const toggleInternetLight = async (light) => {
    if (!internetEnabled) return;
    
    try {
      setIsLoading(true);
      const currentState = internetLights[light];
      const newState = currentState === 1 ? 0 : 1;
      const updatedLights = { ...internetLights };
      
      if (light === 'blinky' && newState === 1) {
        updatedLights.one = 0;
        updatedLights.two = 0;
        updatedLights.three = 0;
        updatedLights.blinky = 1;
        
        await set(ref(database, 'internet'), {
          enabled: 1,
          one: 0,
          two: 0,
          three: 0,
          blinky: 1
        });
      } else if (light !== 'blinky' && newState === 1 && internetLights.blinky === 1) {
        updatedLights.blinky = 0;
        updatedLights[light] = 1;
        
        await set(ref(database, 'internet/blinkyy'), 0);
        await set(ref(database, `internet/${light}`), 1);
      } else {
        updatedLights[light] = newState;
        await set(ref(database, `internet/${light}`), newState);
      }
      
      setInternetLights(updatedLights);
      const status = await checkNetworkStatus('internet');
      setInternetStatus(status);
    } catch (error) {
      console.error("Error toggling internet light:", error);
      setInternetStatus('Internet connection unavailable');
      Alert.alert("Error", "Failed to toggle light");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle WiFi Light
  const toggleWifiLight = async (light) => {
    if (!wifiEnabled || !savedIpAddress) return;
    
    try {
      setIsLoading(true);
      const currentState = wifiLights[light];
      const newState = currentState === 1 ? 0 : 1;
      const updatedLights = { ...wifiLights };
      
      const lightMap = {
        'one': '1',
        'two': '2',
        'three': '3',
        'blinky': 'blink'
      };
      const serverLight = lightMap[light] || light;
      
      if (light === 'blinky' && newState === 1) {
        updatedLights.one = 0;
        updatedLights.two = 0;
        updatedLights.three = 0;
        updatedLights.blinky = 1;
        
        await set(ref(database, 'wifi'), {
          enabled: 1,
          one: 0,
          two: 0,
          three: 0,
          blinky: 1
        });
        
        await Promise.all([
          fetch(`http://${savedIpAddress}/off/1`),
          fetch(`http://${savedIpAddress}/off/2`),
          fetch(`http://${savedIpAddress}/off/3`),
          fetch(`http://${savedIpAddress}/on/blinky`)
        ]);

        setTimeout(async () => {
          await fetch(`http://${savedIpAddress}/off/blinky`);
          updatedLights.blinky = 0;
          await set(ref(database, 'wifi/blinky'), 0);
          setWifiLights(updatedLights);
        }, 6000);
      } else if (light !== 'blinky' && newState === 1 && wifiLights.blinky === 1) {
        updatedLights.blinky = 0;
        updatedLights[light] = 1;
        
        await set(ref(database, 'wifi/blinky'), 0);
        await set(ref(database, `wifi/${light}`), 1);
        
        await fetch(`http://${savedIpAddress}/off/blinky`);
        await fetch(`http://${savedIpAddress}/on/${serverLight}`);
      } else {
        updatedLights[light] = newState;
        
        await set(ref(database, `wifi/${light}`), newState);
        
        await fetch(`http://${savedIpAddress}/${newState === 1 ? 'on' : 'off'}/${serverLight}`);
      }
      
      setWifiLights(updatedLights);
      const status = await checkNetworkStatus('wifi', savedIpAddress);
      setWifiStatus(status);
    } catch (error) {
      console.error("Error toggling WiFi light:", error);
      setWifiStatus('Network connection unavailable');
      Alert.alert("Error", "Failed to toggle light: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIpInput = () => setShowIpInput(previousState => !previousState);

  // Dynamic styles
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

  const statusStyle = {
    color: internetStatus === 'Internet connection active' || internetStatus === 'IP connection established successfully' 
      ? '#2ecc71' 
      : internetStatus === 'Network performance degraded' 
      ? '#f1c40f' 
      : '#e74c3c'
  };

  // Render
  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBar barStyle={isDarkMode ? "dark-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, headerStyle]}>
          <Text style={[styles.headerText, headerTextStyle]}>Blinky</Text>
        </View>
        
        <View style={styles.content}>
          {/* Internet Section */}
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
          
          {internetEnabled && (
            <View style={[styles.lightsContainer, settingContainerStyle]}>
              <LightButton 
                lightOn={internetLights.one}
                lightNumber="1"
                onPress={() => toggleInternetLight('one')}
                disabled={isLoading || internetLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={internetLights.two}
                lightNumber="2"
                onPress={() => toggleInternetLight('two')}
                disabled={isLoading || internetLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={internetLights.three}
                lightNumber="3"
                onPress={() => toggleInternetLight('three')}
                disabled={isLoading || internetLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={internetLights.blinky}
                lightNumber="Blink"
                onPress={() => toggleInternetLight('blinky')}
                disabled={isLoading || internetLights.one === 1 || internetLights.two === 1 || internetLights.three === 1}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          
          {/* WiFi Section */}
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
          
          {wifiEnabled && (
            <View style={[styles.lightsContainer, settingContainerStyle]}>
              <LightButton 
                lightOn={wifiLights.one}
                lightNumber="1"
                onPress={() => toggleWifiLight('one')}
                disabled={isLoading || wifiLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={wifiLights.two}
                lightNumber="2"
                onPress={() => toggleWifiLight('two')}
                disabled={isLoading || wifiLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={wifiLights.three}
                lightNumber="3"
                onPress={() => toggleWifiLight('three')}
                disabled={isLoading || wifiLights.blinky === 1}
                isDarkMode={isDarkMode}
              />
              <LightButton 
                lightOn={wifiLights.blinky}
                lightNumber="Blink"
                onPress={() => toggleWifiLight('blinky')}
                disabled={isLoading || wifiLights.one === 1 || wifiLights.two === 1 || wifiLights.three === 1}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          
          {/* IP Input Section */}
          {showIpInput && (
            <IpInputSection 
              ipAddress={ipAddress}
              setIpAddress={setIpAddress}
              saveIpAddress={saveIpAddress}
              isDarkMode={isDarkMode}
            />
          )}
          
          {savedIpAddress ? (
            <View style={[styles.savedIpContainer, savedIpContainerStyle]}>
              <Text style={[styles.savedIpText, savedIpTextStyle]}>
                Saved IP: {savedIpAddress}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Network Status Footer */}
        <View style={[styles.statusContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0' }]}>
          <Text style={[styles.statusText, statusStyle]}>
            Internet: {internetStatus}
          </Text>
          <Text style={[styles.statusText, { 
            color: wifiStatus === 'IP connection established successfully' ? '#2ecc71' : 
                   wifiStatus === 'Network performance degraded' ? '#f1c40f' : '#e74c3c' 
          }]}>
            WiFi: {wifiStatus}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Styles
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
  disabledButton: {
    opacity: 0.5,
    borderColor: '#555',
  },
  lightText: {
    marginTop: 8,
    fontSize: 16,
    color: '#e0e0e0',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statusText: {
    fontSize: 12,
    marginVertical: 2,
  },
});