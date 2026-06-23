import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useOrgPreferencesSync, useDebouncedOrgPreferencesRefetch } from '../hooks/useOrgPreferencesSync';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screens/splash';
import Login from '../screens/auth/login';
import RoleSelect from '../screens/auth/roleSelect';
import SignUp from '../screens/auth/signup';
import Forgot from '../screens/auth/forgot';
import VerifyOtp from '../screens/auth/verifyOtp';
import CreatePassword from '../screens/auth/createPassword';
import Drawer from '../component/drawer';
import AddVehicles from '../screens/main/addVehicles';
import Channel from '../screens/main/channel';
import Users from '../screens/main/users';
import Organization from '../screens/main/organization';
import IVRSetup from '../screens/main/ivrSetup';
import LinkedAccount from '../screens/main/linkedAcount';
import UserProfile from '../screens/main/userProfile';
import Threads from '../screens/main/threads';
import TeamChat from '../screens/main/teamMessages/chat';
import Notifications from '../screens/main/notifications';
import Info from '../screens/main/info';
import { useSelector } from 'react-redux';
import LeadsDetail from '../screens/main/leadsDetail';
import GlobalDialer from '../component/globalDialer';
import Subscriptions from '../screens/main/subscription';
import Invoices from '../screens/main/invoices';
import TwoFA from '../screens/main/2fa';
import Intimation from '../screens/main/intimation';
import LeadReports from '../screens/main/leadReports';
import { registerFcmTokenWithBackend, setPushAuthToken } from '../services/pushNotifications';
import { useTeamChatGlobalNotify } from '../hooks/useTeamChatGlobalNotify';
import { useNotificationUnreadBootstrap } from '../hooks/useUnreadNotificationCount';

const navigationRef = createNavigationContainerRef();

export { navigationRef };

const HIDE_DIALER_FAB_ROUTES = new Set(['threads', 'teamChat']);

function getActiveRouteName(state) {
  if (!state) return null;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

export default function Routes() {
  const { colors } = useTheme();
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.appBg || colors.dark,
      card: colors.headerBg,
      text: colors.text,
      border: colors.border,
    },
  };

  const [isLoading, setIsLoading] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState(null);
  const Stack = createNativeStackNavigator();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.role);

  useOrgPreferencesSync(user, token);
  const refetchPreferencesOnNav = useDebouncedOrgPreferencesRefetch(token);
  useTeamChatGlobalNotify();
  useNotificationUnreadBootstrap();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || !token) {
      setPushAuthToken(null);
      return;
    }
    setPushAuthToken(token);
    registerFcmTokenWithBackend(token).catch((err) => {
      console.warn('FCM token registration:', err?.message || err);
    });
  }, [user, token]);

  const updateCurrentRoute = () => {
    if (!navigationRef.isReady()) return;
    const rootState = navigationRef.getRootState();
    setCurrentRouteName(getActiveRouteName(rootState));
  };

  const hideDialerFab = HIDE_DIALER_FAB_ROUTES.has(currentRouteName);
  const hideGlobalDialer = isLoading || !user || !token;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      
      onReady={() => {
        updateCurrentRoute();
        if (user && token) refetchPreferencesOnNav();
      }}
      onStateChange={() => {
        updateCurrentRoute();
        if (user && token) refetchPreferencesOnNav();
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false,orientation: 'portrait'}}>
          {isLoading ? (
            <Stack.Screen name="splash" component={Splash} />
          ) : user === null ? (
            <>
              <Stack.Screen name="login" component={Login} />
              <Stack.Screen name="signup" component={SignUp} />
              <Stack.Screen name="forgot" component={Forgot} />
              <Stack.Screen name="verifyOtp" component={VerifyOtp} />
              <Stack.Screen name="createPassword" component={CreatePassword} />
            </>
          ) : (
            <>
              <Stack.Screen name="drawer" component={Drawer} />
              <Stack.Screen name="addVehicles" component={AddVehicles} />
              <Stack.Screen name="channel" component={Channel} />
              <Stack.Screen name="users" component={Users} />
              <Stack.Screen name="organization" component={Organization} />
              <Stack.Screen name="iVRSetup" component={IVRSetup} />
              <Stack.Screen name="subscriptions" component={Subscriptions} />
              <Stack.Screen name="linkedAccount" component={LinkedAccount} />
              <Stack.Screen name="invoices" component={Invoices} />
              <Stack.Screen name="twoFA" component={TwoFA} />
              <Stack.Screen name="intimation" component={Intimation} />
              <Stack.Screen name="leadReports" component={LeadReports} />
              <Stack.Screen name="userProfile" component={UserProfile} />
              <Stack.Screen name="threads" component={Threads} />
              <Stack.Screen name="teamChat" component={TeamChat} />
              <Stack.Screen name="notifications" component={Notifications} />
              <Stack.Screen name="leadsDetail" component={LeadsDetail} />
              <Stack.Screen name="info" component={Info} />
            </>
          )}
        </Stack.Navigator>

        <GlobalDialer hidden={hideGlobalDialer} fabHidden={hideDialerFab} />
      </View>
    </NavigationContainer>
  );
}
