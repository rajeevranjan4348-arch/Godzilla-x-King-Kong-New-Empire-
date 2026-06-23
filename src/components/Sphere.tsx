import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// Mock irisService for now
const irisService = {
  analyser: null as AnalyserNode | null
};

const CustomParticleSphere = ({ count = 5000 }) => {
  const mesh = useRef<THREE.Points>(null)
  const dataArray = useMemo(() => new Uint8Array(128), [])
  
  const { positions, originalPositions, spreadFactors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const orig = new Float32Array(count * 3)
    const spread = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = Math.random() * 2 - 1
      const vector = new THREE.Vector3(x, y, z)
      vector.normalize().multiplyScalar(2)
      pos[i * 3] = vector.x
      pos[i * 3 + 1] = vector.y
      pos[i * 3 + 2] = vector.z
      orig[i * 3] = vector.x
      orig[i * 3 + 1] = vector.y
      orig[i * 3 + 2] = vector.z
      spread[i] = Math.random()
    }
    return { positions: pos, originalPositions: orig, spreadFactors: spread }
  }, [count])

  const baseColor = useMemo(() => new THREE.Color('#33db12'), [])
  const targetColor = useMemo(() => new THREE.Color('#FFFFFF'), [])

  useFrame((state, delta) => {
    if (!state.clock.running || !mesh.current) return
    mesh.current.rotation.y += delta * 0.05
    mesh.current.rotation.z += delta * 0.05
    
    let volume = 0
    if (irisService.analyser) {
      irisService.analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      volume = avg / 128
    }
    
    ;(mesh.current.material as THREE.PointsMaterial).color.copy(baseColor).lerp(targetColor, volume)
    
    const currentPos = mesh.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2
      const expansion = 1 + volume * spreadFactors[i] * 0.40
      currentPos[ix] = originalPositions[ix] * expansion
      currentPos[iy] = originalPositions[iy] * expansion
      currentPos[iz] = originalPositions[iz] * expansion
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh} position={[0, 0.05, 0]}>
      <bufferGeometry>
        <bufferAttribute
          name="position"
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00F0FF"
        size={0.011}
        transparent={true}
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const Sphere = () => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3.4] }}>
        <ambientLight intensity={0.6} />
        <CustomParticleSphere />
      </Canvas>
    </div>
  )
}

export default Sphere
