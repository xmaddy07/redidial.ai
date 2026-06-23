import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ImportSessionList from './list'
import ImportSessionDetail from './detail'
import ImportSessionWizard from './wizard'

const Stack = createNativeStackNavigator()

export default function ImportSession() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ImportSessionList" component={ImportSessionList} />
      <Stack.Screen name="ImportSessionDetail" component={ImportSessionDetail} />
      <Stack.Screen name="ImportSessionWizard" component={ImportSessionWizard} />
    </Stack.Navigator>
  )
}
