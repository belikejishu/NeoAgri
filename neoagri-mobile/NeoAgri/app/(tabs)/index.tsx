import { Platform, StyleSheet, TouchableOpacity, View, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.greeting}>नमस्ते (Hello),</ThemedText>
            <ThemedText style={styles.title}>NeoAgri किसान</ThemedText>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person-circle" size={44} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Weather / Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="partly-sunny" size={28} color="#f1c40f" />
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoTitle}>मौसम अनुकूल है</ThemedText>
              <ThemedText style={styles.infoSubtitle}>फसल निरीक्षण के लिए सही समय</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Main Services */}
      <View style={styles.body}>
        <ThemedText style={styles.sectionTitle}>मुख्य सेवाएं (Services)</ThemedText>
        
        <View style={styles.gridRow}>
          {/* Card 1 */}
          <Link href="/live-scan" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f8f5' }]}>
                <Ionicons name="leaf" size={28} color="#27ae60" />
              </View>
              <ThemedText style={styles.cardTitle}>लाइव स्कैन</ThemedText>
              <ThemedText style={styles.cardDesc}>कैमरे से बीमारी की जांच करें</ThemedText>
            </TouchableOpacity>
          </Link>

          {/* Card 2 */}
          <Link href="/navigate" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#eaf2f8' }]}>
                <Ionicons name="navigate" size={28} color="#2980b9" />
              </View>
              <ThemedText style={styles.cardTitle}>ड्रोन नेविगेशन</ThemedText>
              <ThemedText style={styles.cardDesc}>बीमार पौधे तक सही रास्ता खोजें</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.gridRow}>
          {/* Card 3 */}
          <View style={styles.cardOpacity}>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef9e7' }]}>
                <Ionicons name="document-text" size={28} color="#f39c12" />
              </View>
              <ThemedText style={styles.cardTitle}>रिपोर्ट्स</ThemedText>
              <ThemedText style={styles.cardDesc}>पिछली जांच का रिकॉर्ड</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Card 4 */}
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#f9ebea' }]}>
                <Ionicons name="settings" size={28} color="#e67e22" />
              </View>
              <ThemedText style={styles.cardTitle}>लॉगिन / सेटिंग्स</ThemedText>
              <ThemedText style={styles.cardDesc}>अकाउंट प्रबंधित करें</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Sync Status */}
        <ThemedText style={[styles.sectionTitle, { marginTop: 10 }]}>सिस्टम स्थिति (Status)</ThemedText>
        <View style={styles.statusCard}>
          <Ionicons name="bluetooth" size={24} color="#3498db" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statusTitle}>ड्रोन कनेक्टिविटी</ThemedText>
            <ThemedText style={styles.statusDesc}>ऑफ़लाइन सिंक स्टैंडबाय पर है</ThemedText>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    backgroundColor: '#27ae60',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#e8f8f5',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 2,
  },
  profileBtn: {
    padding: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSubtitle: {
    color: '#e8f8f5',
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    width: (width - 55) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardOpacity: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusDesc: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  }
});
