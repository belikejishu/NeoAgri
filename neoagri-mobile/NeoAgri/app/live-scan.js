import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission, useCameraFormat } from 'react-native-vision-camera';
import { useDiseaseScan } from '../hooks/useDiseaseScan';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LiveScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } }
  ]);
  const { modelLoaded, lastScanResult, frameProcessor } = useDiseaseScan();

  const [isActive, setIsActive] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={60} color="#7f8c8d" />
        <Text style={styles.errorText}>कैमरा अनुमति की आवश्यकता है (Camera permission required)</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>अनुमति दें (Grant)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>कैमरा नहीं मिला (No camera found)</Text>
      </View>
    );
  }

  if (!modelLoaded) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="sync-outline" size={50} color="#27ae60" style={{marginBottom: 15}} />
        <Text style={styles.loadingText}>AI मॉडल तैयार हो रहा है...</Text>
        <Text style={styles.loadingSub}>Loading Offline Engine</Text>
      </View>
    );
  }

  // Determine styles based on results
  let borderColor = 'rgba(255, 255, 255, 0.6)';
  let isHealthy = false;
  let isDisease = false;

  if (lastScanResult) {
    if (lastScanResult.disease === 'Healthy') {
      borderColor = '#2ecc71';
      isHealthy = true;
    } else {
      borderColor = '#e74c3c';
      isDisease = true;
    }
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        format={format}
        fps={format ? format.minFps : 30}
        pixelFormat="yuv"
      />

      {/* Top Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>लाइव स्कैन</Text>
          <Text style={styles.headerSubtitle}>पत्ती को बॉक्स में रखें</Text>
        </View>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Overlay Scanning Box */}
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.scanBox,
          { borderColor, transform: [{ scale: (lastScanResult ? 1 : pulseAnim) }] }
        ]}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </Animated.View>
      </View>

      {/* Result Bottom Sheet Component */}
      <View style={styles.bottomSheet}>
        {lastScanResult ? (
          <View style={styles.resultCard}>
            <View style={[styles.statusIcon, { backgroundColor: isHealthy ? '#e8f8f5' : '#fdedec' }]}>
              {isHealthy ? (
                <Ionicons name="checkmark-circle" size={36} color="#27ae60" />
              ) : (
                <Ionicons name="warning" size={36} color="#e74c3c" />
              )}
            </View>

            <View style={styles.resultContent}>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.diseaseName}>{lastScanResult.disease}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{(lastScanResult.confidence * 100).toFixed(0)}%</Text>
                </View>
              </View>

              {lastScanResult.rawPredictions && (
                <Text style={styles.rawLog}>
                  Raw: [{lastScanResult.rawPredictions.map(p => p.toFixed(2)).join(', ')}]
                </Text>
              )}

              {isDisease ? (
                <View style={styles.alertContent}>
                  <Text style={[styles.severityText, { color: lastScanResult.severity === 'High' ? '#c0392b' : '#d35400' }]}>
                    ⚠️ गंभीरता (Severity): {lastScanResult.severity}
                  </Text>
                  {lastScanResult.cure && (
                    <View style={styles.cureBox}>
                      <Text style={styles.cureTitle}>सुझाव (Cure):</Text>
                      <Text style={styles.cureText}>{lastScanResult.cure}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.healthyText}>पौधा बिल्कुल स्वस्थ है। (Plant is healthy)</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Ionicons name="scan-circle" size={40} color="#bdc3c7" />
            <Text style={styles.placeholderText}>स्कैनिंग जारी है... (Scanning...)</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingSub: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 260,
    height: 260,
    borderWidth: 2,
    backgroundColor: 'transparent',
    position: 'relative',
    marginTop: -80,
  },
  cornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff' },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  placeholderText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  resultContent: {
    flex: 1,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    paddingRight: 10,
  },
  confidenceBadge: {
    backgroundColor: '#2c3e50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rawLog: {
    fontSize: 9,
    color: '#bdc3c7',
    marginBottom: 8,
  },
  alertContent: {
    marginTop: 5,
  },
  severityText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cureBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  cureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 4,
  },
  cureText: {
    fontSize: 12,
    color: '#34495e',
    lineHeight: 18,
  },
  healthyText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 8,
  }
});
