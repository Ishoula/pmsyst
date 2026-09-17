import { router } from 'expo-router'
import { Text, TouchableOpacity } from 'react-native'
import { useAuth } from '../context/AuthContext'

export const SignOutButton = () => {
  const { signOut } = useAuth()
  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/(auth)/login')
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign out</Text>
    </TouchableOpacity>
  )
}