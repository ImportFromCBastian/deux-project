import { StyleSheet, Text } from 'react-native'
import {
  Camera,
  type Frame,
  runAsync,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-mlkit'

export function DisplayCamera() {
  const device = useCameraDevice('back')

  // Inicializamos el hook de OCR nativo
  const { textRecognition } = useTextRecognition({
    language: 'LATIN',
  })

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet'

    // runAsync ejecuta el OCR en un hilo de fondo sin trabar el renderizado del video
    runAsync(frame, () => {
      const data = textRecognition(frame)

      // data.text contiene el bloque completo de texto detectado
      if (data?.text) {
        console.log('Texto detectado:', data.text)
        for (const block of data.blocks) {
          console.log('Bloque:', block.bounds, 'Texto:', block.text)
        }
      }
    })
  }, [])

  if (device == null) return <Text>Iniciando cámara...</Text>

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  )
}
