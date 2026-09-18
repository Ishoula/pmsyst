import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
const Navbar = () => {
  return (
    <View>
        <View style={styles.topBar}>
        <Text style={styles.topBarText}>Smart Poultry</Text>
      </View>
    </View>
  )
}

export default Navbar

const styles= StyleSheet.create({
   topBar: {
       backgroundColor: Colors.light.topBackground,
       width: '100%',
       height: 50,
       justifyContent: 'center'
     },
     topBarText: {
       textAlign: 'center',
       fontSize: 24,
       fontWeight: 'bold',
       fontFamily: 'Roboto',
       color: Colors.light.success
     }, 
})