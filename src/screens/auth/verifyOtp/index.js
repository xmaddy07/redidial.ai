import React, { useMemo, useState, useEffect } from 'react';
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
import Button from '../../../component/button';
import getStyles from './styles';
import { useTheme } from '../../../hooks/useTheme';
import OtpInput from '../../../component/otpInput';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import { AuthAmbientLayer, authEntering } from '../shared/authAnimations';
import { loginBrand } from '../login/styles';

const VerifyOtp = ({ navigation }) => {
  const { colors } = useTheme();
  const brand = useMemo(() => loginBrand(colors), [colors]);
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, styleOptions), [colors, styleOptions]);

  const CELL_COUNT = 4;
  const [value, setValue] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (secondsLeft === 0) return undefined;
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [secondsLeft]);

  const handleResend = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(60);
      setValue('');
    }
  };

  const formatTime = (totalSeconds) => String(totalSeconds % 60).padStart(2, '0');

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required('Code is required')
      .matches(/^\d{4}$/, 'Enter 4 digit code'),
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
            initialValues={{ code: '' }}
            validationSchema={validationSchema}
            onSubmit={() => navigation.navigate('createPassword')}
          >
            {({ errors, touched, handleSubmit, setFieldValue, setFieldTouched }) => (
              <View style={styles.content}>
                <Animated.View entering={authEntering.title}>
                  <Text style={styles.title}>Verify Code</Text>
                  <Text style={styles.subtitle}>An authentication code has been sent to your email</Text>
                </Animated.View>

                <Animated.View entering={authEntering.card}>
                <View style={styles.otpWrap}>
                  <OtpInput
                    value={value}
                    onChangeText={(text) => {
                      setValue(text);
                      setFieldValue('code', text);
                    }}
                    onBlur={() => setFieldTouched('code', true)}
                    cellCount={CELL_COUNT}
                    error={errors.code}
                    touched={touched.code}
                  />
                </View>

                <View style={styles.rowBetween}>
                  <Text style={styles.rememberText}>Didn't receive the code?</Text>
                  {secondsLeft > 0 ? (
                    <Text style={styles.rememberText}>Resend in {formatTime(secondsLeft)}</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend}>
                      <Text style={styles.link}>Resend</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Button text="Verify" marginTop="10" marginBottom="2" onPress={handleSubmit} width="100%" />
                </Animated.View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default VerifyOtp;
