import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function Logo({ size = 32, showText = true, textSize = 18, textColor = '#FFFFFF', style }) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          styles.logoImage,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
        ]}
        resizeMode="cover"
      />
      {showText && (
        <Text style={[styles.brandText, { fontSize: textSize, color: textColor }]}>
          Human<Text style={styles.brandAccent}>OS</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandAccent: {
    color: '#818CF8',
  },
});
