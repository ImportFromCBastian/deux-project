import { View } from '@components/Themed'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function ModalScreen() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <View>
        <View lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <StatusBar />
      </View>
    </>
  )
}
