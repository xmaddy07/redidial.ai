import React, { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { CodeField, Cursor } from 'react-native-confirmation-code-field';
import { useTheme } from '../../hooks/useTheme';
import { useScreenLayout } from '../../hooks/useScreenLayout';
import { getOtpInputStyles } from './styles';

const OtpInput = ({
  value,
  onChangeText,
  cellCount = 4,
  error,
  touched,
  containerStyle,
  onBlur,
}) => {
  const { colors } = useTheme();
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getOtpInputStyles(colors, styleOptions), [colors, styleOptions]);

  return (
    <View style={containerStyle}>
      <CodeField
        value={value}
        onChangeText={onChangeText}
        cellCount={cellCount}
        rootStyle={styles.root}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.select({ ios: 'one-time-code', default: 'sms-otp' })}
        onBlur={onBlur}
        renderCell={({ index, symbol, isFocused }) => (
          <View key={index} style={styles.cell}>
            <Text style={styles.cellText}>
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          </View>
        )}
      />
      {!!error && touched ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

export default OtpInput;
