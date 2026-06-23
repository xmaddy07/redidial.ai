import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Keyboard, Platform } from 'react-native'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { wp, hp } from '../../../theme/layout'
import Header from '../../../component/header'
import { getStyles, getChartHeight } from './styles'
import { getDashboardPalette } from './dashboardColors'
import Icon from 'react-native-vector-icons/Feather'
import { images } from '../../../constant'
import { useSelector } from 'react-redux'
import { getDashboardStats } from '../../../api'
import LoadingView from '../../../component/LoadingView'
import LeadsDualAxisChart from '../../../component/LeadsDualAxisChart'
import { normalizeLeadsChartData, DEFAULT_LEADS_CHART } from '../../../utils/chartAxisUtils'
import { getSocket } from '../../../services'
import { useTheme } from '../../../hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'
import moment from 'moment'

const getStatusStyle = (status, colors) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('ACTIVE')) {
    return { bg: `${colors.success}33`, text: colors.success };
  }
  if (s.includes('BLOCK')) {
    return { bg: colors.inputBg, text: colors.gray };
  }
  return { bg: `${colors.primary}1A`, text: colors.primary };
};

const formatDateTime = (value) => {
  if (!value || value === '-') return '—';
  const m = moment(value);
  return m.isValid() ? m.format('MMM DD, YYYY • hh:mm A') : '—';
};

const formatVin = (vin) => {
  if (!vin) return 'VIN: —';
  const v = String(vin);
  return `VIN: ...${v.slice(-6)}`;
};

export default function Dashboard() {
  const navigation = useNavigation();
  const { layout, styleOptions, insets } = useScreenLayout({ tabBarAware: true });
  const { isCompact, isNarrow } = layout;
  const { colors, themeMode } = useTheme();
  const palette = useMemo(() => getDashboardPalette(colors, themeMode), [colors, themeMode]);
  const styles = useMemo(
    () => getStyles(colors, themeMode, {
      ...styleOptions,
      palette,
    }),
    [colors, themeMode, styleOptions, palette],
  );
  const chartHeight = getChartHeight(isCompact);

  const token = useSelector(state => state.auth.token)
  const [recentData, setRecentData] = useState([])
  const [kpiData, setKpiData] = useState([]);
  const [chartData, setChartData] = useState(DEFAULT_LEADS_CHART);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(null);
  const [, setConnected] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event) => {
      const height = event?.endCoordinates?.height ?? Keyboard.metrics?.()?.height ?? 0;
      const androidBuffer = Platform.OS === 'android' ? Math.max(8, insets.bottom) : 0;
      const lift = Platform.OS === 'ios'
        ? Math.max(height - insets.bottom, 0)
        : height + androidBuffer;
      setKeyboardInset(lift);
    };

    const handleHide = () => setKeyboardInset(0);

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    const s = getSocket();
    if (!s) {
      setConnected(false);
      return undefined;
    }
    setConnected(!!s.connected);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (e) => console.log('socket connect_error', e?.message || e);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats(token);
        if (isCancelled) return;

        const mappedKpis = (data?.statisticData || []).slice(0, 4).map((item, index) => {
          const grow = Number(item?.growShrink ?? 0);
          const isUp = grow >= 0;
          const changeText = `${isUp ? '+' : ''}${grow.toFixed(1)}%`;
          return {
            id: index + 1,
            title: String(item?.label ?? 'Leads'),
            value: String(item?.value ?? '0'),
            change: changeText,
            trend: isUp ? 'up' : 'down',
          };
        });
        setKpiData(mappedKpis);

        const leads = data?.leadsData || {};
        setChartData(normalizeLeadsChartData(leads));

        setRecentData(
          (Array.isArray(data?.recentLeadsData) ? data.recentLeadsData : []).map((item, index) => ({
            ...item,
            id: item?.id ?? item?._id ?? index,
            created_at:
              item?.created_at
              ?? item?.createdAt
              ?? item?.updated_at
              ?? item?.updatedAt
              ?? '',
          })),
        );
      } catch (error) {
        console.warn('Failed to fetch dashboard stats:', error?.message || error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => { isCancelled = true };
  }, [token]);

  const renderKpiCard = (item, index) => {
    const content = (
      <>
        <View style={styles.kpiCardTopRow}>
          <Text style={styles.kpiCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.kpiIconCircle}>
            <Icon
              name={item.trend === 'up' ? 'arrow-up-right' : 'arrow-down-right'}
              size={isCompact ? 11 : 13}
              color={palette.kpiText}
            />
          </View>
        </View>
        <View style={styles.kpiCardBottomRow}>
          <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {item.value}
          </Text>
          <Text style={styles.kpiChange} numberOfLines={1}>{item.change}</Text>
        </View>
      </>
    );

    return (
      <View key={item.id} style={styles.kpiCardWrap}>
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.kpiCardGradient}
        >
          <View style={styles.kpiCardInner}>{content}</View>
        </LinearGradient>
      </View>
    );
  };

  const filteredRecentData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recentData;
    return recentData.filter((item) => {
      const searchable = [
        item?.customer_name,
        item?.customer_email,
        item?.vehicle_vin,
        item?.status,
        item?.created_at,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [recentData, searchQuery]);

  const handleSearch = () => {
    setIsSearchOpen((prev) => {
      if (prev) {
        setSearchQuery('');
        Keyboard.dismiss();
      }
      return !prev;
    });
  };

  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      keyboardInset > 0 && { paddingBottom: keyboardInset + hp(2) },
    ],
    [styles.scrollContent, keyboardInset],
  );

  const openLeadDetail = useCallback((item) => {
    if (!item?.id) return;
    const leadCopy = JSON.parse(JSON.stringify(item));
    navigation.navigate('leadsDetail', { lead: leadCopy, id: leadCopy.id });
  }, [navigation]);

  const renderRecentItem = (item) => {
    const statusStyle = getStatusStyle(item.status, colors);
    const statusLabel = String(item.status || 'Pending')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const createdAt = formatDateTime(item.created_at);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.listItem}
        onPress={() => openLeadDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {String(item.customer_name || '')?.split(' ')?.map(p => p?.[0])?.slice(0, 2)?.join('')?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.itemCenter}>
          <Text style={styles.itemName} numberOfLines={1}>{item.customer_name}</Text>
          <View style={styles.itemMetaRow}>
            <Icon name="mail" size={wp(3.2)} color={colors.gray} style={styles.metaIcon} />
            <Text style={styles.itemMeta} numberOfLines={1}>{item.customer_email}</Text>
          </View>
          <View style={styles.itemMetaRow}>
            <Image
              source={images.car}
              resizeMode="contain"
              style={styles.metaIconImage}
            />
            <Text style={styles.itemMeta} numberOfLines={1}>{formatVin(item?.vehicle_vin)}</Text>
          </View>
          <View style={styles.itemMetaRow}>
            <Icon name="clock" size={wp(3.2)} color={colors.gray} style={styles.metaIcon} />
            <Text style={styles.itemMeta} numberOfLines={1}>{createdAt}</Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]} numberOfLines={2}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Dashboard" search searchOnRight onPressSearch={handleSearch} />

      {isSearchOpen && (
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.gray} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recent leads"
            placeholderTextColor={colors.gray}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Icon name="x" size={16} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        <View style={styles.kpiGrid}>
          {loading ? (
            <LoadingView skeleton="kpi" style={styles.loadingWrap} />
          ) : (
            kpiData.map((item, index) => renderKpiCard(item, index))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.chartCardHeader}>
            <View style={styles.chartCardHeaderLeft}>
              <Text style={styles.cardTitle}>Total Leads Data</Text>
              <Text style={styles.cardSubtitle}>Last 7 days</Text>
            </View>
            <View style={styles.chartLegendRow}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.chartNewColor }]} />
                <Text style={styles.legendLabel}>New Leads</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.chartTotalColor }]} />
                <Text style={styles.legendLabel}>Total Leads</Text>
              </View>
            </View>
          </View>
          <View
            style={styles.chartPlaceholder}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              setChartWidth(width);
            }}
          >
            {loading ? (
              <LoadingView skeleton="chart" chartHeight={chartHeight} />
            ) : chartWidth ? (
              <LeadsDualAxisChart
                categories={chartData.categories}
                newLeads={chartData.newLeads}
                totalLeads={chartData.totalLeads}
                width={chartWidth}
                height={chartHeight}
                colors={colors}
                themeMode={themeMode}
                newLeadsColor={palette.chartNewColor}
                totalLeadsColor={palette.chartTotalColor}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity
              style={styles.viewAllLink}
              onPress={() => navigation.navigate('Leads')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <LoadingView skeleton="recent" skeletonCount={4} />
          ) : filteredRecentData.length > 0 ? (
            filteredRecentData.map(renderRecentItem)
          ) : (
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'No matching leads' : 'No recent leads'}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
