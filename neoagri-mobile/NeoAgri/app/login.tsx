import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { requestOtp, verifyOtp } from './sync_api';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phoneNumber.length >= 10) {
      setLoading(true);
      const res = await requestOtp(`+91${phoneNumber}`);
      setLoading(false);
      if (res.success) {
        setOtpSent(true);
      } else {
        Alert.alert("Error", "Failed to send OTP.");
      }
    }
  };

  const handleVerify = async () => {
    if (otp.length === 4) {
      setLoading(true);
      const res = await verifyOtp(`+91${phoneNumber}`, otp);
      setLoading(false);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert("Error", "Invalid OTP.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#2c3e50" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>लॉगिन करें</Text>
          <Text style={styles.subtitle}>NeoAgri के साथ जुड़ने के लिए अपना नंबर दर्ज करें</Text>
        </View>

        {!otpSent ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="मोबाइल नंबर"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, (phoneNumber.length < 10 || loading) && styles.btnDisabled]}
              onPress={handleSendOtp}
              disabled={phoneNumber.length < 10 || loading}
            >
              <Text style={styles.btnText}>{loading ? "भेजा जा रहा है..." : "OTP भेजें"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.phoneLabel}>+91 {phoneNumber} पर OTP भेजा गया</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="4-अंकीय OTP"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={4}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, (otp.length < 4 || loading) && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={otp.length < 4 || loading}
            >
              <Text style={styles.btnText}>{loading ? "सत्यापन हो रहा है..." : "सत्यापित करें (Verify)"}</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setOtpSent(false)}>
              <Text style={styles.linkText}>नंबर बदलें</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backBtn: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  prefix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  btn: {
    backgroundColor: '#27ae60',
    height: 60,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnDisabled: {
    backgroundColor: '#bdc3c7',
    elevation: 0,
    shadowOpacity: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneLabel: {
    textAlign: 'center',
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 20,
  },
  linkBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 14,
  },
});
