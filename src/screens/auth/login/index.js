import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { images } from '../../../constant';
import Input from '../../../component/input';
import Button from '../../../component/button';
import getLoginStyles, { loginBrand, loginDarkUi } from './styles';
import { AuthAmbientLayer, authEntering } from '../shared/authAnimations';
import { useTheme } from '../../../hooks/useTheme';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { setUser, setToken, setRole } from '../../../redux/authSlice';
import { login } from '../../../api';

const REMEMBER_ME_KEY = '@redidial/remember_me';
const REMEMBERED_EMAIL_KEY = '@redidial/remembered_email';

const RememberCheckbox = ({ checked, onPress, styles }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={styles.rememberTouchable}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel="Remember me"
  >
    <View style={[styles.checkboxOuter, checked && styles.checkboxOuterChecked]}>
      {checked ? <View style={styles.checkboxInner} /> : null}
    </View>
    <Text style={styles.rememberText}>Remember me</Text>
  </TouchableOpacity>
);

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const brand = useMemo(() => loginBrand(colors), [colors]);
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getLoginStyles(styleOptions), [styleOptions]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [remembered, email] = await AsyncStorage.multiGet([
          REMEMBER_ME_KEY,
          REMEMBERED_EMAIL_KEY,
        ]);
        const isRemembered = remembered[1] === 'true';
        const savedEmail = email[1] || '';
        if (isRemembered && savedEmail) {
          setRememberMe(true);
          setInitialEmail(savedEmail);
        }
      } catch (err) {
        console.warn('Failed to load remembered login:', err?.message || err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(5, 'Min 6 characters').required('Password is required'),
  });

  const persistRememberMe = async (email, shouldRemember) => {
    if (shouldRemember) {
      await AsyncStorage.multiSet([
        [REMEMBER_ME_KEY, 'true'],
        [REMEMBERED_EMAIL_KEY, email],
      ]);
      return;
    }
    await AsyncStorage.multiRemove([REMEMBER_ME_KEY, REMEMBERED_EMAIL_KEY]);
  };

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setError('');
      const response = await login(values);
      await persistRememberMe(values.email, rememberMe);
      dispatch(setUser(response.user));
      dispatch(setToken(response.access_token));
      const resolvedRole =
        response.user?.role ||
        response.user?.userRole ||
        response.user?.user_role ||
        response.user?.authority ||
        response.user?.Authority ||
        response.role ||
        null;
      if (resolvedRole) {
        dispatch(setRole(resolvedRole));
      }
    } catch (err) {
      console.log('Login error:', JSON.stringify(err) || err);
      setError(err?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <ImageBackground source={images.authBg} style={styles.background}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={images.authBg} style={styles.background}>
      <StatusBar barStyle="light-content" />
      <AuthAmbientLayer brand={brand} styles={styles} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Animated.View entering={authEntering.header} style={styles.header}>
          <LinearGradient
            colors={[`${brand.primary}40`, 'transparent']}
            style={styles.logoGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollGrow}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Formik
            initialValues={{ email: initialEmail, password: '' }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={(values) => {
              handleLogin(values);
            }}
          >
            {({ values, errors, touched, handleChange, handleSubmit }) => (
              <View style={styles.content}>
                <Animated.View
                  entering={authEntering.title}
                  style={styles.titleBlock}
                >
                  <Text style={styles.title}>Sign In</Text>
                  <Text style={styles.subtitle}>Sign in to access dashboard.</Text>
                  <LinearGradient
                    colors={[brand.primary, brand.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                  />
                </Animated.View>

                <Animated.View
                  entering={authEntering.card}
                  style={styles.formCard}
                >
                  <LinearGradient
                    colors={[`${brand.primary}59`, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardShine}
                  />

                  <View style={styles.formFields}>
                  <Input
                    heading="Email Address"
                    width="100%"
                    val={values.email}
                    onchan={handleChange('email')}
                    plac="Enter Email Address"
                    top="0"
                    btm="0.5"
                    hig="6.5%"
                    wid="100%"
                    autoCapitalize="none"
                    brderclr={errors.email ? brand.danger : loginDarkUi.inputBorder}
                    bgclr={loginDarkUi.inputBg}
                    headingclr={loginDarkUi.label}
                    textclr={loginDarkUi.inputText}
                    placeholderclr={loginDarkUi.placeholder}
                    animatedFocus
                  />
                  {touched.email && errors.email ? (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  ) : null}

                  <Input
                    heading="Password"
                    width="100%"
                    val={values.password}
                    onchan={handleChange('password')}
                    plac="Enter Password"
                    btm="0.5"
                    isImg="yes"
                    autoCapitalize="none"
                    brderclr={errors.password ? brand.danger : loginDarkUi.inputBorder}
                    bgclr={loginDarkUi.inputBg}
                    headingclr={loginDarkUi.label}
                    textclr={loginDarkUi.inputText}
                    placeholderclr={loginDarkUi.placeholder}
                    wid="100%"
                    animatedFocus
                  />

                  {touched.password && errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}

                  <View style={styles.rememberRow}>
                    <RememberCheckbox
                      checked={rememberMe}
                      onPress={() => setRememberMe((prev) => !prev)}
                      styles={styles}
                    />
                    <TouchableOpacity
                      onPress={() => navigation.navigate('forgot')}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.forgotLink}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  {error ? (
                    <Animated.View entering={authEntering.fade}>
                      <Text style={styles.apiError}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  <Animated.View
                    entering={authEntering.button}
                    style={styles.buttonWrap}
                  >
                    <Button
                      text="Sign In"
                      top="3"
                      btom="0"
                      width="100%"
                      wid="100%"
                      higt="6.5"
                      mov={handleSubmit}
                      gradientColors={[brand.primary, brand.accent]}
                      loading={loading}
                    />
                  </Animated.View>
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

export default Login;
