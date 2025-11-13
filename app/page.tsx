"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Material = {
  name: string
  cost: number
  strength: number
  color: string
  type: "steel" | "concrete" | "wood" | "cable"
}

const MATERIALS: Material[] = [
  { name: "فولاد", cost: 500, strength: 10, color: "#718096", type: "steel" },
  { name: "بتن", cost: 300, strength: 7, color: "#A0AEC0", type: "concrete" },
  { name: "چوب", cost: 150, strength: 4, color: "#D69E2E", type: "wood" },
  { name: "کابل", cost: 400, strength: 8, color: "#4A5568", type: "cable" },
]

type Vehicle = {
  name: string
  emoji: string
  requiredStrength: number
  speed: number
}

const VEHICLES: Vehicle[] = [
  { name: "دوچرخه", emoji: "🚲", requiredStrength: 15, speed: 4000 },
  { name: "موتورسیکلت", emoji: "🏍️", requiredStrength: 25, speed: 3500 },
  { name: "ماشین", emoji: "🚗", requiredStrength: 40, speed: 3200 },
  { name: "خاور", emoji: "🚐", requiredStrength: 60, speed: 3500 },
  { name: "کامیون", emoji: "🚚", requiredStrength: 80, speed: 3800 },
  { name: "اتوبوس", emoji: "🚌", requiredStrength: 100, speed: 4000 },
  { name: "تریلی", emoji: "🚛", requiredStrength: 130, speed: 4500 },
  { name: "تریلی سنگین", emoji: "🚛", requiredStrength: 160, speed: 5000 },
]

type Point = { x: number; y: number }
type Beam = { start: Point; end: Point; material: Material }

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [budget, setBudget] = useState(50000)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0])
  const [beams, setBeams] = useState<Beam[]>([])
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [testResult, setTestResult] = useState("")
  const [carPosition, setCarPosition] = useState(-1)
  const [isTesting, setIsTesting] = useState(false)
  const [bridgeFailed, setBridgeFailed] = useState(false)
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0)
  const [bridgeImages, setBridgeImages] = useState<{ [key: string]: HTMLImageElement }>({})

  const points: Point[] = [
    { x: 50, y: 250 },
    { x: 150, y: 200 },
    { x: 250, y: 180 },
    { x: 350, y: 180 },
    { x: 450, y: 200 },
    { x: 550, y: 250 },
  ]

  useEffect(() => {
    const loadImages = () => {
      const images: { [key: string]: HTMLImageElement } = {}
      const imageUrls = {
        steel: "/realistic-steel-truss-bridge-over-river.jpg",
        concrete: "/realistic-concrete-arch-bridge-over-river.jpg",
        wood: "/realistic-wooden-covered-bridge-over-river.jpg",
        cable: "/realistic-cable-stayed-bridge-over-river.jpg",
      }

      Object.entries(imageUrls).forEach(([key, url]) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          images[key] = img
          setBridgeImages((prev) => ({ ...prev, [key]: img }))
        }
        img.src = url
      })
    }

    loadImages()
  }, [])

  useEffect(() => {
    drawCanvas()
  }, [beams, selectedPoint, carPosition, bridgeFailed, bridgeImages])

  const getCurrentVehicle = () => {
    return VEHICLES[Math.min(currentVehicleIndex, VEHICLES.length - 1)]
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 250)
    skyGradient.addColorStop(0, "#5B9BD5")
    skyGradient.addColorStop(1, "#90C5E8")
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, canvas.width, 250)

    // River
    const riverGradient = ctx.createLinearGradient(0, 250, 0, 350)
    riverGradient.addColorStop(0, "#1E5F8C")
    riverGradient.addColorStop(0.5, "#164863")
    riverGradient.addColorStop(1, "#0B2F4A")
    ctx.fillStyle = riverGradient
    ctx.fillRect(0, 250, canvas.width, 100)

    // River waves
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.lineWidth = 1.5
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      for (let x = 0; x < canvas.width; x += 15) {
        const y = 265 + i * 18 + Math.sin((x + Date.now() / 800) / 25) * 4
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Ground
    ctx.fillStyle = "#3A4D2F"
    ctx.fillRect(0, 250, 80, 100)
    ctx.fillRect(520, 250, 80, 100)

    // Trees
    const drawTree = (x: number) => {
      ctx.fillStyle = "#5D4037"
      ctx.fillRect(x - 5, 220, 10, 30)
      ctx.fillStyle = "#2E7D32"
      ctx.beginPath()
      ctx.arc(x, 215, 20, 0, Math.PI * 2)
      ctx.fill()
    }

    drawTree(25)
    drawTree(575)

    beams.forEach((beam) => {
      const bridgeImg = bridgeImages[beam.material.type]
      if (bridgeImg && bridgeImg.complete) {
        const startX = Math.min(beam.start.x, beam.end.x)
        const endX = Math.max(beam.start.x, beam.end.x)
        const startY = Math.min(beam.start.y, beam.end.y)
        const endY = Math.max(beam.start.y, beam.end.y)

        const beamWidth = endX - startX
        const beamHeight = Math.max(endY - startY, 60)

        const totalBridgeWidth = 500
        const segmentStartRatio = (startX - 50) / totalBridgeWidth
        const segmentWidthRatio = beamWidth / totalBridgeWidth

        const sourceX = segmentStartRatio * bridgeImg.width
        const sourceWidth = segmentWidthRatio * bridgeImg.width
        const sourceY = bridgeImg.height * 0.3
        const sourceHeight = bridgeImg.height * 0.4

        ctx.save()
        ctx.globalAlpha = 0.85
        try {
          ctx.drawImage(
            bridgeImg,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            startX,
            startY - 30,
            beamWidth,
            beamHeight,
          )
        } catch (e) {
          // Silently fail if image not ready
        }
        ctx.restore()
      }
    })

    // Draw beams
    beams.forEach((beam) => {
      ctx.strokeStyle = beam.material.color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(beam.start.x, beam.start.y)
      ctx.lineTo(beam.end.x, beam.end.y)
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // Draw connection points
    points.forEach((point) => {
      ctx.fillStyle = selectedPoint?.x === point.x && selectedPoint?.y === point.y ? "#2563EB" : "#0F172A"
      ctx.strokeStyle = "#475569"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })

    if (selectedPoint) {
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(selectedPoint.x, selectedPoint.y, 13, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw vehicle
    if (carPosition >= 0 && carPosition <= 1) {
      const vehicle = getCurrentVehicle()
      const x = 50 + carPosition * 500
      let y = 250

      if (!bridgeFailed && beams.length > 0) {
        y = getYPositionOnBridge(x)
      } else if (bridgeFailed) {
        y = 250 + (carPosition - 0.5) * 300
      }

      ctx.font = "40px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(vehicle.emoji, x, y - 10)

      if (bridgeFailed) {
        ctx.fillStyle = "rgba(255, 100, 0, 0.6)"
        ctx.beginPath()
        ctx.arc(x, y - 35, 12, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const getYPositionOnBridge = (x: number): number => {
    let closestY = 250

    points.forEach((point) => {
      if (Math.abs(point.x - x) < 50) {
        closestY = Math.min(closestY, point.y)
      }
    })

    beams.forEach((beam) => {
      const t = (x - beam.start.x) / (beam.end.x - beam.start.x)
      if (t >= 0 && t <= 1) {
        const y = beam.start.y + t * (beam.end.y - beam.start.y)
        closestY = Math.min(closestY, y - 18)
      }
    })

    return closestY
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isTesting) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const clickedPoint = points.find((p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 25)

    if (clickedPoint) {
      if (!selectedPoint) {
        setSelectedPoint(clickedPoint)
      } else {
        if (selectedPoint.x !== clickedPoint.x || selectedPoint.y !== clickedPoint.y) {
          const cost = selectedMaterial.cost
          if (budget >= cost) {
            const newBeam = { start: selectedPoint, end: clickedPoint, material: selectedMaterial }
            setBeams([...beams, newBeam])
            setBudget(budget - cost)
            setTestResult("")
          } else {
            setTestResult("بودجه کافی نیست!")
          }
        }
        setSelectedPoint(null)
      }
    }
  }

  const testBridge = () => {
    if (beams.length === 0) {
      setTestResult("ابتدا پل را بسازید!")
      return
    }

    const totalStrength = beams.reduce((sum, beam) => sum + beam.material.strength, 0)
    const vehicle = getCurrentVehicle()
    const minRequired = vehicle.requiredStrength

    setIsTesting(true)
    setCarPosition(0)
    setBridgeFailed(totalStrength < minRequired)

    const animationDuration = vehicle.speed
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      if (totalStrength < minRequired && progress > 0.5) {
        setCarPosition(0.5 + (progress - 0.5) * 1.5)
      } else {
        setCarPosition(progress)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsTesting(false)
        setCarPosition(-1)

        if (totalStrength >= minRequired) {
          const earnedScore = Math.floor((totalStrength / beams.length) * 100)
          setScore(score + earnedScore)
          setTestResult(`موفق! ${vehicle.name} با موفقیت از پل عبور کرد. امتیاز: +${earnedScore}`)
          if (currentVehicleIndex < VEHICLES.length - 1) {
            setCurrentVehicleIndex(currentVehicleIndex + 1)
          }
        } else {
          setTestResult(`ناموفق! پل فروریخت. قدرت مورد نیاز: ${minRequired} | قدرت پل: ${totalStrength}`)
        }
        setBridgeFailed(false)
      }
    }

    requestAnimationFrame(animate)
  }

  const resetBridge = () => {
    setBeams([])
    setSelectedPoint(null)
    setTestResult("")
    setBudget(50000)
    setCarPosition(-1)
    setIsTesting(false)
    setBridgeFailed(false)
    setCurrentVehicleIndex(0)
  }

  const nextLevel = () => {
    setLevel(level + 1)
    resetBridge()
    setBudget(50000 + level * 10000)
  }

  const currentVehicle = getCurrentVehicle()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
            پل‌ساز مهندسی
          </h1>
          <p className="text-slate-400 text-lg">شبیه‌ساز طراحی و تحلیل سازه‌های پل</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-5 bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700">
            <div className="text-center">
              <div className="text-sm text-blue-300 font-medium mb-1">مرحله</div>
              <div className="text-4xl font-bold text-white">{level}</div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-emerald-950 to-emerald-900 border-emerald-700">
            <div className="text-center">
              <div className="text-sm text-emerald-300 font-medium mb-1">بودجه</div>
              <div className="text-3xl font-bold text-white">${budget.toLocaleString()}</div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700">
            <div className="text-center">
              <div className="text-sm text-purple-300 font-medium mb-1">امتیاز</div>
              <div className="text-4xl font-bold text-white">{score}</div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700">
            <div className="text-center">
              <div className="text-sm text-orange-300 font-medium mb-1">وسیله نقلیه</div>
              <div className="text-3xl mb-1">{currentVehicle.emoji}</div>
              <div className="text-sm text-orange-200">{currentVehicle.name}</div>
              <div className="text-xs text-orange-400 mt-1">بار: {currentVehicle.requiredStrength}</div>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-slate-900/80 border-slate-700 mb-4">
          <h2 className="text-xl font-bold text-white mb-4">انتخاب مصالح</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MATERIALS.map((material) => (
              <button
                key={material.name}
                onClick={() => setSelectedMaterial(material)}
                disabled={isTesting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMaterial.name === material.name
                    ? "border-cyan-400 bg-cyan-950/50"
                    : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                } disabled:opacity-50`}
              >
                <div className="text-white font-bold mb-2">{material.name}</div>
                <div className="text-sm text-slate-300">هزینه: ${material.cost}</div>
                <div className="text-sm text-slate-300">قدرت: {material.strength}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/80 border-slate-700 mb-4">
          <h2 className="text-xl font-bold text-white mb-4">محیط ساخت پل</h2>
          <canvas
            ref={canvasRef}
            width={600}
            height={350}
            onClick={handleCanvasClick}
            className="w-full border-2 border-slate-700 rounded-lg cursor-crosshair bg-slate-950"
          />
          <div className="mt-4 flex gap-3 flex-wrap">
            <Button
              onClick={testBridge}
              disabled={isTesting || beams.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50"
            >
              {isTesting ? `در حال تست...` : `آزمایش با ${currentVehicle.name}`}
            </Button>
            <Button
              onClick={resetBridge}
              disabled={isTesting}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 bg-transparent"
            >
              شروع مجدد
            </Button>
            <Button
              onClick={nextLevel}
              disabled={isTesting}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              مرحله بعد
            </Button>
          </div>
          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg font-semibold ${
                testResult.includes("موفق")
                  ? "bg-green-950 text-green-200 border-2 border-green-600"
                  : "bg-red-950 text-red-200 border-2 border-red-600"
              }`}
            >
              {testResult}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-700">
          <h3 className="font-bold text-white mb-3">راهنما</h3>
          <div className="grid md:grid-cols-2 gap-4 text-slate-300 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">مراحل ساخت:</h4>
              <ul className="space-y-1">
                <li>مصالح را انتخاب کنید</li>
                <li>نقاط را به هم وصل کنید</li>
                <li>آزمایش بار انجام دهید</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">پیشرفت:</h4>
              <div className="space-y-1 text-xs">
                {VEHICLES.map((v, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${idx === currentVehicleIndex ? "text-green-400 font-bold" : idx < currentVehicleIndex ? "text-green-600" : "text-slate-500"}`}
                  >
                    <span>{v.emoji}</span>
                    <span>{v.name}</span>
                    <span>({v.requiredStrength})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
