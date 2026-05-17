import { performOcr } from '@bear-block/vision-camera-ocr'
import { Button, StyleSheet, Text, View } from 'react-native'
import {
  Camera,
  useCameraDevice,
  useCameraPermission, // 1. Importamos el hook
  useFrameProcessor,
} from 'react-native-vision-camera'

export function DisplayCamera() {
  // 2. Inicializamos los permisos
  const { hasPermission, requestPermission } = useCameraPermission()

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const result = performOcr(frame)
    if (result?.text) {
      console.log('Detected text:', result.text)
    }
  }, [])

  const device = useCameraDevice('back')

  // Si no hay cámara en el celular (raro, pero posible)
  if (!device) return <Text>No se encontró la cámara</Text>

  // 3. Si AÚN NO tenemos permiso, mostramos un botón para pedirlo
  if (!hasPermission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          Necesitamos acceso a la cámara para escanear textos.
        </Text>
        <Button title="Otorgar Permiso" onPress={requestPermission} />
      </View>
    )
  }

  // 4. Si YA tenemos permiso, mostramos la cámara
  return (
    <Camera
      style={StyleSheet.absoluteFill} // IMPORTANTE: Sin estilo, la cámara mide 0x0 y no se ve
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  )
}
