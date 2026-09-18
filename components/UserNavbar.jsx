import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { SignOutButton } from './SignOutButton';

export default function Navbar() {
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    {
      title: 'Home',
      icon: 'grid-outline',
      href: '/(tabs)/home',
    },
    {
      title: 'Batches',
      icon: 'egg-outline',
      href: '/(tabs)/batch',
    },
    {
      title: 'Tasks',
      icon: 'checkbox-outline',
      href: '/(tabs)/tasks',
    },
    {
      title: 'Orders',
      icon: 'cart-outline',
      href: '/(tabs)/orders',
    },
    {
      title: 'Growth Logs',
      icon: 'trending-up-outline',
      href: '/(tabs)/growthLog',
    },
    {
      title: 'Breeds',
      icon: 'paw-outline',
      href: '/(tabs)/breeds',
    },
    {
      title: 'Chats',
      icon: 'chatbubble-outline',
      href: '/(tabs)/chats',
    },
  ];

  const MenuDrawer = () => (
    <Modal
      visible={menuVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Navigation</Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.menuScroll}>
            {menuItems.map((item, index) => (
              <Link key={index} href={item.href} asChild>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => setMenuVisible(false)}
                >
                  <Ionicons name={item.icon} size={20} color={Colors.light.success} />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <View style={{ backgroundColor: Colors.light.topBackground, width:'100%' }}>
        <View style={styles.topBar}>
          {/* Left: Menu + App Name */}
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
              <Ionicons name="menu-outline" size={24} color={Colors.light.icon} />
            </TouchableOpacity>
            <Text style={styles.title}>Smart Poultry</Text>
          </View>

          {/* Right: Actions (Notification + Sign Out) */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionIcon}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color={Colors.light.icon}
              />
            </TouchableOpacity>

            <SignOutButton />
          </View>
        </View>
      </View>
      
      <MenuDrawer />
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.topBackground,
    height: 60,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.success,
    fontFamily: 'Roboto',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 60,
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});