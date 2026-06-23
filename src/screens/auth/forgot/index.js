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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { images } from '../../../constant';
import Input from '../../../component/input';
import Button from '../../../component/button';
import getForgotStyles, { loginBrand, loginDarkUi } from './styles';
import { AuthAmbientLayer, authEntering } from '../shared/authAnimations';
import { useTheme } from '../../../hooks/useTheme';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import { wp } from '../../../theme/layout';
import { forgotPassword } from '../../../api';

const Forgot = ({ navigation }) => {
  const { colors } = useTheme();
  const brand = useMemo(() => loginBrand(colors), [colors]);
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getForgotStyles(styleOptions), [styleOptions]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
  });

  const handleSubmitEmail = async (values) => {
    try {
      setLoading(true);
      setError('');
      await forgotPassword({ email: values.email });
      setSubmittedEmail(values.email);
      setEmailSent(true);
    } catch (err) {
      setError(err?.message || 'Failed to send recovery email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            initialValues={{ email: submittedEmail }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={handleSubmitEmail}
          >
            {({ values, errors, touched, handleChange, handleSubmit }) => (
              <View style={styles.content}>
                <Animated.View
                  entering={authEntering.title}
                  style={styles.titleBlock}
                >
                  <Text style={styles.title}>
                    {emailSent ? 'Check your email' : 'Forgot your password?'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {emailSent ? (
                      <>
                        We have sent a password recovery instruction to{' '}
                        <Text style={styles.sentEmail}>{submittedEmail}</Text>
                      </>
                    ) : (
                      'Please enter your email address to receive a verification code'
                    )}
                  </Text>
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
                    {emailSent ? (
                      <Animated.View entering={authEntering.fade} style={styles.successBadge}>
                        <Icon name="mail" size={wp(6)} color="#22C55E" />
                      </Animated.View>
                    ) : (
                      <>
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
                      </>
                    )}

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
                        text={emailSent ? 'Resend Email' : 'Send'}
                        top={emailSent ? '0' : '3'}
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

                <Animated.View entering={authEntering.footer}>
                  <View style={styles.footerCenter}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('login')}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.signInLink}>Back to Sign In</Text>
                    </TouchableOpacity>
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

export default Forgot;
