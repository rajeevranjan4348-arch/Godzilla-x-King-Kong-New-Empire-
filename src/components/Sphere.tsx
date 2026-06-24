import { Canvas, useFrame } from '@react-three/fiber'
import React, { useRef, useMemo, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'

import { irisService } from '../services/Iris-voice-ai'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class LocalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("LocalErrorBoundary caught a Three/Fiber rendering exception:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

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

  const baseColor = useMemo(() => new THREE.Color('#0066ff'), [])
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
    
    if (mesh.current.material && 'color' in mesh.current.material) {
      (mesh.current.material as THREE.PointsMaterial).color.copy(baseColor).lerp(targetColor, volume)
    }
    
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
        color="#0066ff"
        size={0.011}
        transparent={true}
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Highly polished interactive CSS/SVG digital particle fallback
const SolidGlowSphereFallback = () => {
  return (
    <div className="w-full h-full flex items-center justify-center relative min-h-[350px]">
      {/* Centered Glowing Sphere Core */}
      <div className="absolute w-[240px] h-[240px] rounded-full bg-blue-600/10 blur-[60px] animate-pulse" />
      
      {/* Outer Rotating Dotted Circle */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-[220px] h-[220px] rounded-full border border-dashed border-blue-500/30 flex items-center justify-center"
      >
        <div className="w-2 h-2 rounded-full bg-blue-400 absolute -top-1 shadow-[0_0_10px_#0066ff]" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 absolute -bottom-0.5 shadow-[0_0_10px_#0066ff]" />
      </motion.div>

      {/* Middle Interactive Wave Orb */}
      <motion.div
        animate={{ 
          scale: [0.98, 1.05, 0.98],
          rotate: [0, -180, -360]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[170px] h-[170px] rounded-[42%_58%_70%_30%_/_45%_45%_55%_55%] bg-gradient-to-tr from-blue-700/25 to-indigo-500/10 border border-blue-400/40 backdrop-blur-sm shadow-[inset_0_0_30px_rgba(0,102,255,0.2)]"
      />

      {/* Main Glowing Blue Core */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[120px] h-[120px] rounded-full bg-radial from-cyan-400/80 via-blue-600 to-indigo-950 shadow-[0_0_40px_rgba(30,144,255,0.7),_inset_0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center border border-blue-300/30"
      >
        {/* Deep holographic inner shine */}
        <div className="w-[85px] h-[85px] rounded-full bg-radial from-white/20 to-transparent absolute top-1 left-2 filter blur-[2px]" />
      </motion.div>

      {/* Orbiting Satellite Rings */}
      <motion.div
        animate={{ rotateX: 60, rotateY: 30, rotateZ: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute w-[280px] h-[280px] rounded-full border border-blue-400/20 pointer-events-none"
      />
      <motion.div
        animate={{ rotateX: 60, rotateY: -30, rotateZ: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute w-[250px] h-[250px] rounded-full border border-cyan-400/15 pointer-events-none"
      />

      {/* Tiny simulated ambient floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-300/80"
            initial={{
              x: (i - 2.5) * 60 + (Math.random() - 0.5) * 30,
              y: (Math.random() - 0.5) * 160,
              opacity: 0.1
            }}
            animate={{
              y: [(Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160],
              opacity: [0.1, 0.7, 0.1],
              scale: [0.8, 1.3, 0.8]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}

const Sphere = () => {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
      setWebglSupported(support)
    } catch (e) {
      setWebglSupported(false)
    }
  }, [])

  // If support is unknown, show loading state or fallback
  if (webglSupported === null) {
    return <SolidGlowSphereFallback />
  }

  if (!webglSupported) {
    return <SolidGlowSphereFallback />
  }

  return (
    <div className="w-full h-full min-h-[350px]">
      <LocalErrorBoundary fallback={<SolidGlowSphereFallback />}>
        <Canvas camera={{ position: [0, 0, 3.4] }}>
          <ambientLight intensity={0.6} />
          <CustomParticleSphere />
        </Canvas>
      </LocalErrorBoundary>
    </div>
  )
}

export default Sphere
