import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useSelector } from 'react-redux'
import Dashboard from '../../screens/main/dashboard'
import Leads from '../../screens/main/leades'
import ThreadsList from '../../screens/main/chat'
import TeamMessages from '../../screens/main/teamMessages'
import Settings from '../../screens/main/setting'
import { useDebouncedOrgPreferencesRefetch } from '../../hooks/useOrgPreferencesSync'
import GlassTabBar from './GlassTabBar'
import { TAB_BAR_CLEARANCE } from './constants'

const Tab = createBottomTabNavigator()

export { TAB_BAR_CLEARANCE }

export default function MainTabs() {
  const token = useSelector((state) => state.auth.token)
  const refetchOnScreenFocus = useDebouncedOrgPreferencesRefetch(token)
  const screenListeners = { focus: refetchOnScreenFocus }

  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { paddingBottom: TAB_BAR_CLEARANCE },
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} listeners={screenListeners} />
      <Tab.Screen name="Leads" component={Leads} listeners={screenListeners} />
      <Tab.Screen name="Chat" component={ThreadsList} listeners={screenListeners} />
      <Tab.Screen name="TeamMessages" component={TeamMessages} listeners={screenListeners} />
      <Tab.Screen name="Settings" component={Settings} listeners={screenListeners} />
    </Tab.Navigator>
  )
}
