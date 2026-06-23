import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useJarvisStore } from '../../store/useJarvisStore'

interface Node {
  position: THREE.Vector3
  phase: number
}

interface Edge {
  from: number
  to: number
}

function BrainNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const brainActivity = useJarvisStore((s) => s.brainActivity)
  const isThinking = useJarvisStore((s) => s.isThinking)

  const { nodes, edges } = useMemo(() => {
    const nodeCount = 80
    const ns: Node[] = []
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.8 + Math.random() * 0.8
      ns.push({
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.7,
          r * Math.cos(phi),
        ),
        phase: Math.random() * Math.PI * 2,
      })
    }

    const es: Edge[] = []
    for (let i = 0; i < nodeCount; i++) {
      const connections = 1 + Math.floor(Math.random() * 3)
      for (let j = 0; j < connections; j++) {
        const target = Math.floor(Math.random() * nodeCount)
        if (target !== i) es.push({ from: i, to: target })
      }
    }
    return { nodes: ns, edges: es }
  }, [])

  const linePositions = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    edges.forEach((edge, i) => {
      const a = nodes[edge.from].position
      const b = nodes[edge.to].position
      positions[i * 6] = a.x
      positions[i * 6 + 1] = a.y
      positions[i * 6 + 2] = a.z
      positions[i * 6 + 3] = b.x
      positions[i * 6 + 4] = b.y
      positions[i * 6 + 5] = b.z
    })
    return positions
  }, [nodes, edges])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speed = isThinking ? 0.6 : 0.15
    if (groupRef.current) {
      groupRef.current.rotation.y = t * speed
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1
    }
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.15 + brainActivity * 0.45 + Math.sin(t * 2) * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.025 + brainActivity * 0.015, 8, 8]} />
          <meshBasicMaterial
            color={new THREE.Color().lerpColors(
              new THREE.Color('#0066ff'),
              new THREE.Color('#00d4ff'),
              (Math.sin(node.phase + performance.now() * 0.002) + 1) / 2,
            )}
            transparent
            opacity={0.6 + brainActivity * 0.4}
          />
        </mesh>
      ))}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={edges.length * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.03 + brainActivity * 0.04}
          wireframe
        />
      </mesh>
    </group>
  )
}

function PulseRing() {
  const ref = useRef<THREE.Mesh>(null)
  const brainActivity = useJarvisStore((s) => s.brainActivity)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const scale = 1 + Math.sin(t * 1.5) * 0.05 * brainActivity
    ref.current.scale.setScalar(scale)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.08 + brainActivity * 0.12
  })

  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.5, 0.02, 8, 64]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} />
    </mesh>
  )
}

export function NeuralBrain() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
        <pointLight position={[-5, -3, 3]} intensity={0.4} color="#0066ff" />
        <Stars radius={80} depth={40} count={2000} factor={3} saturation={0} fade speed={0.5} />
        <BrainNetwork />
        <PulseRing />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        Neural Core Active
      </div>
    </div>
  )
}
