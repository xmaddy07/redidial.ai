import React, { useMemo, useState } from 'react';
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
import { resetPassword } from '../../../api';
import { AuthAmbientLayer, authEntering } from '../shared/authAnimations';
import { loginBrand } from '../login/styles';

const CreatePassword = ({ navigation }) => {
  const { colors } = useTheme();
  const brand = useMemo(() => loginBrand(colors), [colors]);
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, styleOptions), [colors, styleOptions]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const validationSchema = Yup.object().shape({
    password: Yup.string().required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleResetPassword = async (values) => {
    try {
      setLoading(true);
      setError('');
      await resetPassword({ password: values.password });
      setResetDone(true);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          {resetDone ? (
            <View style={styles.content}>
              <Animated.View entering={authEntering.title}>
                <Text style={styles.title}>Reset done</Text>
                <Text style={styles.subtitle}>Your password has been reset successfully</Text>
              </Animated.View>

              <Animated.View entering={authEntering.button} style={styles.buttonWrap}>
                <Button
                  text="Continue"
                  top="3"
                  btom="0"
                  wid="100%"
                  higt="6.5"
                  mov={() => navigation.navigate('login')}
                />
              </Animated.View>
            </View>
          ) : (
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={validationSchema}
              onSubmit={handleResetPassword}
            >
              {({ values, errors, touched, handleChange, handleSubmit }) => (
                <View style={styles.content}>
                  <Animated.View entering={authEntering.title}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                      Your new password must be different from your previous password
                    </Text>
                  </Animated.View>

                  <Animated.View entering={authEntering.card}>
                  <Input
                    heading="New Password"
                    val={values.password}
                    onchan={handleChange('password')}
                    plac="Enter Password"
                    btm="0.5"
                    isImg="yes"
                    autoCapitalize="none"
                    brderclr={errors.password ? colors.danger : colors.orange}
                    wid="100%"
                  />
                  {touched.password && errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}

                  <Input
                    heading="Confirm Password"
                    val={values.confirmPassword}
                    onchan={handleChange('confirmPassword')}
                    plac="Re-enter Password"
                    btm="0.5"
                    isImg="yes"
                    autoCapitalize="none"
                    brderclr={errors.confirmPassword ? colors.danger : colors.orange}
                    wid="100%"
                  />
                  {touched.confirmPassword && errors.confirmPassword ? (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  ) : null}

                  {error ? (
                    <Animated.View entering={authEntering.fade}>
                      <Text style={styles.apiError}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  <Animated.View entering={authEntering.button} style={styles.buttonWrap}>
                    <Button
                      text="Reset Password"
                      top="3"
                      btom="0"
                      wid="100%"
                      higt="6.5"
                      mov={handleSubmit}
                      loading={loading}
                    />
                  </Animated.View>

                  <Animated.View entering={authEntering.footer}>
                    <View style={styles.footerCenter}>
                      <TouchableOpacity onPress={() => navigation.navigate('login')} activeOpacity={0.7}>
                        <Text style={styles.signInLink}>Back to Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                  </Animated.View>
                </View>
              )}
            </Formik>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default CreatePassword;
