import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { View } from 'react-native'
export const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        paddingTop: insets.top,
        flex: 1,
        backgroundColor: Colors.light.background,
      }}
    >
      {children}
    </View>
  )
}