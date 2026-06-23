import React, { useMemo } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { images } from '../../../constant';
import Button from '../../../component/button';
import getStyles from './styles';
import { useTheme } from '../../../hooks/useTheme';

import { useScreenLayout } from '../../../hooks/useScreenLayout';

const RoleSelect = ({ navigation }) => {
  const { colors } = useTheme();
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, styleOptions), [colors, styleOptions]);

  return (
    <ImageBackground source={images.role} style={styles.background} resizeMode="cover">
      <View style={styles.content}>
        <View style={styles.titleBlock}>
        <Text style={styles.title}>Select Role</Text>
        <Text style={styles.title2}>Choose your role</Text>
        </View>
        <Button
          text={'Customer'}
          top={'4'}
          btom={'2'}
          gradientColors={[colors.primary, colors.accent]}
          mov={() => navigation.navigate('customerLogin', { role: 'customer' })}
        />

        <Button
          text={'Admin'}
          top={'2'}
          btom={'2'}
          gradientColors={["#F97316", "#FFB573"]}
          mov={() => navigation.navigate('adminLogin', { role: 'admin' })}
        />
      </View>
    </ImageBackground>
  );
};

export default RoleSelect;
