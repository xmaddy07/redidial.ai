import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Alert } from '../../../utils/alert';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import SettingHeader from '../../../component/settingHeader';
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero';
import Input from '../../../component/input';
import Button from '../../../component/button';
import Icon from 'react-native-vector-icons/Feather';
import getStyles from './styles';
import { useSelector } from 'react-redux';
import api from '../../../api';
import { useTheme } from '../../../hooks/useTheme';

function IvrMessageField({ label, value, onChangeText, placeholder, styles, colors }) {
  return (
    <View style={styles.ivrFieldGroup}>
      <Text style={styles.ivrFieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        style={styles.ivrMessageInput}
        multiline
        scrollEnabled={false}
        blurOnSubmit={false}
        textAlignVertical="top"
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

const CALL_OPTIONS = [
  {
    id: 1,
    label: 'Receive calls in web app',
    subtitle: 'Answer incoming calls directly in the dashboard',
    icon: 'monitor',
  },
  {
    id: 2,
    label: 'IVR with dynamic messages',
    subtitle: 'Play custom greetings and prompts to callers',
    icon: 'message-circle',
  },
  {
    id: 3,
    label: 'IVR with call forwarding',
    subtitle: 'Route callers to teams using keypad digits',
    icon: 'phone-forwarded',
  },
];

function OptionRow({ option, selected, onPress, styles, colors, isLast }) {
  const isSelected = selected === option.id;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        !isLast && styles.optionDivider,
        isSelected && styles.optionRowSelected,
        pressed && !isSelected && styles.optionRowPressed,
      ]}
    >
      <View
        style={[
          styles.optionIconWrap,
          isSelected && styles.optionIconWrapSelected,
        ]}
      >
        <Icon
          name={option.icon}
          size={18}
          color={isSelected ? colors.primary : colors.gray}
        />
      </View>
      <View style={styles.optionTexts}>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
        {isSelected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

export default function IVRSetup({ navigation }) {
  const { colors, themeMode } = useTheme();
  const { styleOptions } = useScreenLayout();
  const isDark = themeMode === 'dark';
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions]);

  const token = useSelector(state => state.auth.token);
  const [selected, setSelected] = useState(1);
  const [ivrMessage, setIvrMessage] = useState('');
  const [offHoursOnly, setOffHoursOnly] = useState(false);
  const [rules, setRules] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('+12345678910');
  const [channelId, setChannelId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const applyConfigFromItem = item => {
    if (!item) return;
    const cfg = item.ivrConfiguration || {};
    const cfgType = cfg.config_type || cfg.configType || 'webapp';
    const nextSelected =
      cfgType === 'webapp'
        ? 1
        : cfgType === 'dynamic_messages' || cfgType === 'ivr-message'
        ? 2
        : cfgType === 'dynamic_forwarding' ||
          cfgType === 'ivr-forwarding' ||
          cfgType === 'ivr-forward'
        ? 3
        : 1;
    setSelected(nextSelected);
    setIvrMessage(cfg.ivr_message || cfg.ivrMessage || '');
    setOffHoursOnly(
      Boolean(
        cfg.off_hours_only ??
          cfg.offHoursOnly ??
          cfg.ivr_enabled ??
          cfg.ivrEnabled ??
          false,
      ),
    );
    setPhoneNumber(
      item?.channel?.phone_number ||
        item?.channel?.phoneNumber ||
        '+12345678910',
    );
    setChannelId(item?.channel?.id ?? null);

    const apiRules = Array.isArray(item.ivrForwardingRules)
      ? item.ivrForwardingRules
      : Array.isArray(item.forwardingRules)
      ? item.forwardingRules
      : [];
    const mappedRules = apiRules.map((r, idx) => ({
      id: r?.id ?? Date.now() + idx,
      digit: r?.digit ?? idx + 1,
      description: r?.description || '',
      number: r?.number || r?.forward_to_number || r?.forwardToNumber || '',
    }));
    setRules(mappedRules);
  };

  const canSave = useMemo(() => {
    if (selected === 2) return ivrMessage.trim().length > 0;
    if (selected === 3)
      return (
        ivrMessage.trim().length > 0 &&
        (rules.length === 0 ||
          rules.every(r => r.description.trim() && r.number.trim()))
      );
    return true;
  }, [selected, ivrMessage, rules]);

  const addRule = () => {
    const nextDigit = (rules[rules.length - 1]?.digit || 0) + 1;
    setRules(prev => [
      ...prev,
      { id: Date.now(), digit: nextDigit, description: '', number: '' },
    ]);
  };

  const removeRule = id => setRules(prev => prev.filter(r => r.id !== id));

  const updateRule = (id, patch) =>
    setRules(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const onSave = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      const configType =
        selected === 1
          ? 'webapp'
          : selected === 2
          ? 'ivr-message'
          : 'ivr-forward';
      const forwardingRules =
        selected === 3
          ? rules.map(r => ({
              ...(r.id ? { id: r.id } : {}),
              ...(r.ivr_configuration_id
                ? { ivr_configuration_id: r.ivr_configuration_id }
                : {}),
              digit: String(r.digit),
              description: r.description,
              number: r.number,
            }))
          : [];

      const payload = {
        configType,
        ivrMessage: ivrMessage || '',
        ivrEnabled: selected !== 1,
        offHoursOnly,
        forwardingRules,
        channelId,
      };

      await api.configureChannel({ token, payload });
      try {
        const data = await api.getChannelConfiguration(token);
        const item = Array.isArray(data) ? data[0] : null;
        applyConfigFromItem(item);
      } catch (_) {}
      Alert.alert('Success', 'Channel configuration saved successfully.');
    } catch (e) {
      const msg = e?.message || 'Failed to save configuration';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const loadConfig = async () => {
      try {
        const data = await api.getChannelConfiguration(token);
        if (isCancelled) return;
        const item = Array.isArray(data) ? data[0] : null;
        if (!item) return;

        applyConfigFromItem(item);
      } catch (e) {
        // ignore load errors
      }
    };
    if (token) loadConfig();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const renderForwardingRule = rule => (
    <View key={rule.id} style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={styles.ruleTitleRow}>
          <View style={styles.digitBadge}>
            <Text style={styles.digitBadgeText}>{rule.digit}</Text>
          </View>
          <Text style={styles.ruleTitle}>Digit configuration</Text>
        </View>
        {rules.length > 1 && (
          <Pressable
            onPress={() => removeRule(rule.id)}
            style={({ pressed }) => [
              styles.removeBtn,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <Icon name="x" size={16} color={colors.gray} />
          </Pressable>
        )}
      </View>
      <Input
        heading={'Description *'}
        val={rule.description}
        onchan={t => updateRule(rule.id, { description: t })}
        plac={'e.g. Sales Team, Support'}
        wid={'100%'}
        hig={'6%'}
        btm={'1%'}
        brderclr={colors.border}
      />
      <Input
        heading={'Forward to Number *'}
        val={rule.number}
        onchan={t => updateRule(rule.id, { number: t })}
        plac={'+1 (555) 123-4567'}
        wid={'100%'}
        hig={'6%'}
        btm={'0%'}
        brderclr={colors.border}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title={'IVR Setup'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="phone-call"
          title="Voice Menu Setup"
          subtitle="Configure how incoming calls are answered, routed, and forwarded to your team."
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: CALL_OPTIONS.length, label: 'Call modes' },
            { value: rules.length, label: 'Forwarding rules' },
          ]}
        />

        <Text style={styles.sectionLabel}>Channel</Text>
        <View style={styles.phoneCard}>
          <View style={styles.phoneIconWrap}>
            <Icon name="phone" size={18} color={colors.white} />
          </View>
          <View style={styles.phoneInfo}>
            <Text style={styles.phoneLabel}>Phone number</Text>
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Call handling</Text>
          <Text style={styles.sectionQuestion}>
            How would you like to handle incoming calls?
          </Text>
          <View style={styles.optionsCard}>
            {CALL_OPTIONS.map((option, index) => (
              <OptionRow
                key={option.id}
                option={option}
                selected={selected}
                onPress={() => setSelected(option.id)}
                styles={styles}
                colors={colors}
                isLast={index === CALL_OPTIONS.length - 1}
              />
            ))}
          </View>
        </View>

        {selected === 2 && (
          <View style={styles.configCard}>
            <View style={styles.configCardHeader}>
              <View style={styles.configCardIcon}>
                <Icon name="message-square" size={16} color={colors.primary} />
              </View>
              <Text style={styles.configCardTitle}>IVR message</Text>
            </View>
            <IvrMessageField
              label="IVR Messages *"
              value={ivrMessage}
              onChangeText={setIvrMessage}
              placeholder="Type your greeting message here…"
              styles={styles}
              colors={colors}
            />
            <View style={styles.switchRow}>
              <Switch
                value={offHoursOnly}
                onValueChange={setOffHoursOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={styles.switchTexts}>
                <Text style={styles.switchLabel}>
                  Enable IVR during off-hours only
                </Text>
                <Text style={styles.switchHint}>
                  When enabled, the IVR activates only outside your business
                  hours.
                </Text>
              </View>
            </View>
          </View>
        )}

        {selected === 3 && (
          <View>
            <View style={styles.configCard}>
              <View style={styles.configCardHeader}>
                <View style={styles.configCardIcon}>
                  <Icon name="mic" size={16} color={colors.primary} />
                </View>
                <Text style={styles.configCardTitle}>Greeting message</Text>
              </View>
              <IvrMessageField
                label="IVR Message *"
                value={ivrMessage}
                onChangeText={setIvrMessage}
                placeholder="Type your menu prompt here…"
                styles={styles}
                colors={colors}
              />
            </View>

            <View style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}>Forwarding rules</Text>
              <Pressable onPress={addRule} style={styles.addBtnPressable}>
                <View style={styles.addBtn}>
                  <Icon name="plus" size={14} color={colors.white} />
                  <Text style={styles.addBtnText}>Add Rule</Text>
                </View>
              </Pressable>
            </View>

            {rules.length === 0 ? (
              <View style={styles.emptyRules}>
                <View style={styles.emptyRulesIcon}>
                  <Icon name="git-branch" size={22} color={colors.gray} />
                </View>
                <Text style={styles.emptyRulesTitle}>No rules yet</Text>
                <Text style={styles.emptyRulesHint}>
                  Add forwarding rules so callers can reach the right team by
                  pressing a digit.
                </Text>
              </View>
            ) : (
              rules.map(renderForwardingRule)
            )}
          </View>
        )}

        <View style={styles.saveWrap}>
          <Button
            text="Save Configuration"
            mov={onSave}
            loading={isSaving}
            wid="100"
            higt="6"
            btom="0"
            top="0"
            gradientColors={[colors.primary, colors.accent]}
            textclr={colors.white}
            disabled={!canSave}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
