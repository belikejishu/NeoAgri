import React, { useState, useEffect, useRef } from 'react';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { calculateDistance, calculateBearing, getDirectionText } from '../utils/haversine';
import { getAllMarkers } from './db/schema';
import { syncLatestDroneSession } from './db/offlineSync';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function NavigationScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [location, setLocation] = useState(null);
  const [nearestMarker, setNearestMarker] = useState(null);
  const [distance, setDistance] = useState(null);
  const [direction, setDirection] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [markersList, setMarkersList] = useState([]);
  const [heading, setHeading] = useState(0);
  const [targetBearing, setTargetBearing] = useState(0);
  const locationSubscription = useRef(null);
  const magnetoSubscription = useRef(null);
  const lastSpokenRef = useRef(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (magnetoSubscription.current) {
        magnetoSubscription.current.remove();
      }
    };
  }, []);

  const fetchAndShowMarkers = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission to access location was denied");
      return;
    }

    Speech.speak('डेटा खोजा जा रहा है।', { language: 'hi-IN' });
    
    await syncLatestDroneSession();
    const markers = await getAllMarkers();

    if (markers.length === 0) {
      Speech.speak('खेत में कोई बीमारी नहीं मिली।', { language: 'hi-IN' });
      Alert.alert("No disease markers found in database. Did the backend fetch fail? Please check your terminal for logs.");
      return;
    }

    let currentLoc = null;
    try {
       currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    } catch(e) {
       console.log("Location fetch failed", e);
    }

    let processedMarkers = markers.map(m => {
       const mLat = Number(m.latitude ?? m.lat);
       const mLng = Number(m.longitude ?? m.lng);
       let dist = Infinity;
       if (currentLoc && !Number.isNaN(mLat) && !Number.isNaN(mLng)) {
          dist = calculateDistance(currentLoc.coords.latitude, currentLoc.coords.longitude, mLat, mLng);
       }
       return { ...m, _dist: dist === Infinity ? '?' : Math.round(dist), mLat, mLng };
    }).filter(m => !Number.isNaN(m.mLat));

    processedMarkers.sort((a,b) => {
       if (a._dist === '?') return 1;
       if (b._dist === '?') return -1;
       return a._dist - b._dist;
    });
    
    setMarkersList(processedMarkers);
    setIsSelecting(true);
  };

  const startNavigation = async (selectedMarker) => {
    if (!hasPermission) await requestPermission();
    setNearestMarker(selectedMarker);
    setIsSelecting(false);
    setIsNavigating(true);
    Speech.speak('मार्गदर्शन शुरू हो रहा है।', { language: 'hi-IN' });

    magnetoSubscription.current = Magnetometer.addListener((data) => {
      let currentHeading = Math.atan2(data.y, data.x) * (180 / Math.PI);
      if (currentHeading < 0) currentHeading += 360;
      setHeading(currentHeading);
    });

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        setLocation(loc.coords);

        const dist = calculateDistance(latitude, longitude, selectedMarker.mLat, selectedMarker.mLng);
        setDistance(Math.round(dist));
        
        const bestBearing = calculateBearing(latitude, longitude, selectedMarker.mLat, selectedMarker.mLng);
        setTargetBearing(bestBearing);
        
        const dirText = getDirectionText(bestBearing);
        setDirection(dirText);

        if (dist < 10) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (dist < 25) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const now = Date.now();
        if (now - lastSpokenRef.current > 10000) {
          if (dist < 5) {
            Speech.speak('आप लक्ष्य पर पहुँच गए हैं। कृपया फसल को स्कैन करें।', { language: 'hi-IN' });
            stopNavigation();
          } else {
            Speech.speak(`${dirText} की ओर ${Math.round(dist)} मीटर चलें।`, { language: 'hi-IN' });
          }
          lastSpokenRef.current = now;
        }
      }
    );
  };

  const stopNavigation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (magnetoSubscription.current) {
      magnetoSubscription.current.remove();
      magnetoSubscription.current = null;
    }
    setIsNavigating(false);
    Speech.stop();
  };

  const pointerAngle = (targetBearing - heading + 360) % 360;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ड्रोन नेविगेशन</Text>
        <View style={{ width: 40 }} />
      </View>

      {isNavigating ? (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {device && <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />}
          
          <View style={[styles.content, { backgroundColor: 'transparent', justifyContent: 'space-between', paddingBottom: 40 }]}>
            {nearestMarker && (
              <>
                <View style={[styles.diseaseBadge, { alignSelf: 'center', marginTop: 20, elevation: 5, shadowColor: '#000', shadowOffset: {height:2, width:0}, shadowOpacity: 0.5, shadowRadius: 4 }]}>
                  <Ionicons name="warning" size={20} color="#fff" />
                  <Text style={styles.diseaseText}>{nearestMarker.disease}</Text>
                </View>

                {/* AR 3D Arrow Container */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                        width: 150, height: 150, 
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: distance < 10 ? 'rgba(231, 76, 60, 0.6)' : 'rgba(255,255,255,0.2)',
                        borderRadius: 100,
                        borderWidth: 4,
                        borderColor: distance < 10 ? '#e74c3c' : 'rgba(255,255,255,0.5)',
                        transform: [{ perspective: 800 }, { rotateX: '50deg' }, { rotateZ: `${pointerAngle}deg` }],
                        shadowColor: '#2ecc71', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10
                    }}>
                      <Ionicons name="navigate" size={100} color={distance < 10 ? "#fff" : "#2ecc71"} style={{ transform: [{ translateY: -15 }] }} />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 30, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 }}>
                      {distance < 5 ? "आप पहुंच गए हैं!" : `${distance} मीटर ${direction} की ओर`}
                    </Text>
                </View>
              </>
            )}

            <TouchableOpacity style={[styles.btn, styles.btnStop, { marginHorizontal: 20, marginBottom: 20 }]} onPress={stopNavigation}>
               <Ionicons name="close-circle" size={24} color="#fff" />
               <Text style={styles.btnText}>नेविगेशन रोकें (Stop)</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isSelecting ? (
        <View style={styles.selectionContent}>
          <Text style={styles.selectionTitle}>बीमारी का स्थान चुनें</Text>
          <Text style={styles.selectionSubtitle}>आप किस पौधे तक जाना चाहते हैं?</Text>
          <ScrollView style={styles.listContainer}>
            {markersList.map((m, idx) => (
              <TouchableOpacity key={m.id || idx} style={styles.markerItem} onPress={() => startNavigation(m)}>
                <View style={[styles.markerIconBox, {backgroundColor: m.disease.includes('Healthy') ? '#e8f8f5' : '#fdedec'}]}>
                  <Ionicons name="medical" size={24} color={m.disease.includes('Healthy') ? '#27ae60' : '#e74c3c'} />
                </View>
                <View style={styles.markerInfo}>
                  <Text style={styles.markerDisease}>{m.disease || 'Unknown'}</Text>
                  <Text style={styles.markerDistance}>दूरी: {m._dist} मीटर</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={() => setIsSelecting(false)}>
             <Text style={styles.btnText}>रद्द करें (Cancel)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.idleContent}>
          <View style={styles.illustrationBox}>
             <Ionicons name="map-outline" size={100} color="#bdc3c7" />
             <Ionicons name="location" size={40} color="#e74c3c" style={{ position: 'absolute', top: '30%', right: '35%' }} />
          </View>
          <Text style={styles.idleTitle}>खेत में बीमारी ढूंढें</Text>
          <Text style={styles.idleSubtitle}>
            ड्रोन द्वारा चिन्हित किए गए बीमार पौधों तक पहुंचने के लिए GPS नेविगेशन चालू करें।
          </Text>

          <TouchableOpacity style={styles.btnStart} onPress={fetchAndShowMarkers}>
             <Text style={styles.btnStartText}>नेविगेशन शुरू करें (Start)</Text>
             <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  activeNavCard: {
    backgroundColor: '#f8f9f9',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flex: 1,
    marginBottom: 20,
  },
  diseaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  diseaseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  radarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle1: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(41, 128, 185, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle2: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(41, 128, 185, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2980b9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  btn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  btnStop: {
    backgroundColor: '#e74c3c',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  idleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  illustrationBox: {
    marginBottom: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  idleSubtitle: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  btnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '100%',
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  
  selectionContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9f9',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  markerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  markerInfo: {
    flex: 1,
  },
  markerDisease: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  markerDistance: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  btnStartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  }
});
