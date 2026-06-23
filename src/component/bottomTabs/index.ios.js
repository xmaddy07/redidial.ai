import React, { useMemo, useState } from 'react'
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable'
import { useSelector } from 'react-redux'
import Dashboard from '../../screens/main/dashboard'
import Leads from '../../screens/main/leades'
import ThreadsList from '../../screens/main/chat'
import TeamMessages from '../../screens/main/teamMessages'
import Settings from '../../screens/main/setting'
import { useDebouncedOrgPreferencesRefetch } from '../../hooks/useOrgPreferencesSync'
import { useTeamChatTabBadge } from '../../hooks/useTeamChatGlobalNotify'
import { useTheme } from '../../hooks/useTheme'
import { fonts } from '../../constant'
import {
  getMainTabIosSymbols,
  getMainTabLabels,
  screenOptionsFor,
} from './tabConfig'

const Tab = createNativeBottomTabNavigator()

export { TAB_BAR_CLEARANCE } from './constants'

export default function MainTabs() {
  const token = useSelector((state) => state.auth.token)
  const refetchOnScreenFocus = useDebouncedOrgPreferencesRefetch(token)
  const screenListeners = { focus: refetchOnScreenFocus }
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'

  const tabSymbols = useMemo(() => getMainTabIosSymbols(), [])
  const tabLabels = useMemo(() => getMainTabLabels(), [])
  const [teamUnread, setTeamUnread] = useState(0)
  useTeamChatTabBadge(setTeamUnread)
  const optionsFor = useMemo(
    () => screenOptionsFor(tabSymbols, tabLabels),
    [tabSymbols, tabLabels],
  )

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.gray : colors.gray,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.medium,
          letterSpacing: 0.25,
        },
        tabBarBlurEffect: isDark
          ? 'systemChromeMaterialDark'
          : 'systemUltraThinMaterialLight',
        tabBarStyle: {
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.08)',
        },
        tabBarControllerMode: 'tabBar',
        tabBarMinimizeBehavior: 'onScrollDown',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={optionsFor('Dashboard')}
        listeners={screenListeners}
      />
      <Tab.Screen
        name="Leads"
        component={Leads}
        options={optionsFor('Leads')}
        listeners={screenListeners}
      />
      <Tab.Screen
        name="Chat"
        component={ThreadsList}
        options={optionsFor('Chat')}
        listeners={screenListeners}
      />
      <Tab.Screen
        name="TeamMessages"
        component={TeamMessages}
        options={{
          ...optionsFor('TeamMessages'),
          tabBarBadge: teamUnread > 0 ? (teamUnread > 9 ? '9+' : teamUnread) : undefined,
        }}
        listeners={screenListeners}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={optionsFor('Settings')}
        listeners={screenListeners}
      />
    </Tab.Navigator>
  )
}
