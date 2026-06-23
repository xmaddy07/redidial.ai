import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { images } from '../../../constant';
import Input from '../../../component/input';
import Button from '../../../component/button';
import getStyles from './styles';
import { useTheme } from '../../../hooks/useTheme';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import { AuthAmbientLayer, authEntering } from '../shared/authAnimations';
import { loginBrand } from '../login/styles';

const SignUp = ({ navigation }) => {
  const { colors } = useTheme();
  const brand = useMemo(() => loginBrand(colors), [colors]);
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, styleOptions), [colors, styleOptions]);

  const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  });

  return (
    <ImageBackground source={images.authBg} style={styles.background}>
      <StatusBar barStyle="light-content" />
      <AuthAmbientLayer brand={brand} styles={styles} variant="right" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <Animated.View entering={authEntering.header} style={styles.header}>
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollGrow}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Formik
            initialValues={{ username: '', email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={() => {}}
          >
            {({ values, errors, touched, handleChange, handleSubmit }) => (
              <View style={styles.content}>
                <Animated.View entering={authEntering.title}>
                  <Text style={styles.title}>Sign Up</Text>
                  <Text style={styles.subtitle}>Sign up to access account.</Text>
                </Animated.View>

                <Animated.View entering={authEntering.card}>
                <Input
                  heading="User Name"
                  value={values.username}
                  onChangeText={handleChange('username')}
                  placeholder="Enter User Name"
                  top="1"
                  bottom="0.5"
                  height="6.5%"
                  width="100%"
                  autoCapitalize="none"
                  borderColor={errors.username ? colors.danger : colors.orange}
                />
                {touched.username && errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}

                <Input
                  heading="Email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  placeholder="Enter Email Address"
                  bottom="0.5"
                  height="6.5%"
                  width="100%"
                  autoCapitalize="none"
                  borderColor={errors.email ? colors.danger : colors.orange}
                />
                {touched.email && errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}

                <Input
                  heading="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  placeholder="Enter Password"
                  bottom="0.5"
                  secureTextEntry
                  autoCapitalize="none"
                  borderColor={errors.password ? colors.danger : colors.orange}
                  width="100%"
                />
                {touched.password && errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}

                <Button text="Sign Up" marginTop="5" marginBottom="2" onPress={handleSubmit} width="100%" />
                </Animated.View>

                <Animated.View entering={authEntering.footer}>
                  <View style={styles.footerCenter}>
                  <Text style={styles.create}>
                    Already have an account?{' '}
                    <Text onPress={() => navigation.navigate('login')} style={styles.signInLink}>
                      Log In
                    </Text>
                  </Text>
                  </View>
                </Animated.View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default SignUp;
