import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

export default function AuthRoutesLayout() {
  const { isSignedIn, initializing } = useAuth()

  if (initializing) return null

  if (isSignedIn) {
    return <Redirect href={'/(tabs)/home'} />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}