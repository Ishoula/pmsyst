import { Stack } from 'expo-router'
import {SafeScreen} from '../components/SafeScreen'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AuthProvider } from '../context/AuthContext'
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_400Regular,
    RobotoBold: Roboto_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null // or a loader component
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeScreen>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeScreen>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </AuthProvider>
  )
}