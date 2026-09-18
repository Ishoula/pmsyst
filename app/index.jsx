import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import logo from '../assets/images/logo.png'

const Index = () => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Image div */}
      <View style={styles.imageDiv}>
        <Image source={logo} style={styles.image} />
      </View>

      {/* Content */}
      <View style={styles.mainContent}>
        <View style={styles.content}>
          <Text style={[styles.contentText, { fontWeight: 'bold', textAlign: 'center' }]}>
            Smart Poultry
          </Text>
          <Text style={[styles.contentText, { fontSize: 16 }]}>
            Manage Your Poultry Farm with ease
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonDiv}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={{ padding: 10 }}>OR</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
    alignItems: 'center',
  },
  imageDiv: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  mainContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    padding: 20,
    backgroundColor: Colors.light.topBackground,
  },
  contentText: {
    fontSize: 24,
    fontFamily: 'Roboto',
    color: Colors.light.text,
  },
  buttonDiv: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.light.success,
    padding: 10,
    borderRadius: 10,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})