'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function WebGLScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5.5

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    // ── Fibonacci sphere — white → Stellar teal ───────────────────────────
    const COUNT  = 1400
    const RADIUS = 2.4
    const positions = new Float32Array(COUNT * 3)
    const colors    = new Float32Array(COUNT * 3)
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    // Stellar teal: #05A2C2 → r=0.02 g=0.635 b=0.76
    // White:        #FFFFFF → r=1.0  g=1.0   b=1.0
    for (let i = 0; i < COUNT; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio
      const phi   = Math.acos(1 - (2 * (i + 0.5)) / COUNT)

      positions[i * 3]     = RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = RADIUS * Math.cos(phi)

      // t=0 (top) → white, t=1 (bottom) → teal
      const t = (positions[i * 3 + 1] + RADIUS) / (2 * RADIUS)
      colors[i * 3]     = 1.0  * (1 - t) + 0.02  * t  // R
      colors[i * 3 + 1] = 1.0  * (1 - t) + 0.635 * t  // G
      colors[i * 3 + 2] = 1.0  * (1 - t) + 0.76  * t  // B
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.034,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    })

    const sphere = new THREE.Points(geo, mat)
    scene.add(sphere)

    // ── Subtle inner glow ─────────────────────────────────────────────────
    const glowGeo = new THREE.SphereGeometry(2.0, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x05A2C2,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(glowGeo, glowMat))

    // ── Orbit ring ────────────────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.9, 0.003, 6, 180)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x05A2C2,
      transparent: true,
      opacity: 0.1,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.6
    scene.add(ring)

    // ── Mouse parallax ────────────────────────────────────────────────────
    const mouse  = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.5
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation ─────────────────────────────────────────────────────────
    let animId: number
    let t = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.004

      target.x += (mouse.x - target.x) * 0.04
      target.y += (mouse.y - target.y) * 0.04

      sphere.rotation.y = t * 0.16 + target.x
      sphere.rotation.x = target.y * 0.45 + Math.sin(t * 0.12) * 0.05

      ring.rotation.z = t * 0.07
      ring.rotation.y = t * 0.03

      const scale = 1 + Math.sin(t * 0.38) * 0.016
      sphere.scale.setScalar(scale)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose(); mat.dispose(); glowGeo.dispose(); glowMat.dispose()
      ringGeo.dispose(); ringMat.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  )
}
