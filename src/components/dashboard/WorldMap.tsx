"use client"

import { useState, useRef } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps"
import Link from "next/link"

const MARKET_COORDS: Record<string, [number, number]> = {
  AD: [1.5, 42.5], AE: [54.0, 24.0], AF: [65.0, 33.0], AG: [-61.8, 17.1],
  AL: [20.0, 41.0], AM: [45.0, 40.0], AO: [18.5, -12.5], AR: [-58.4, -34.6],
  AT: [16.4, 48.2], AU: [151.2, -33.9], AZ: [47.6, 40.4],
  BA: [17.8, 44.0], BB: [-59.6, 13.2], BD: [90.4, 23.7], BE: [4.4, 50.8],
  BF: [-1.5, 12.4], BG: [23.3, 42.7], BH: [50.6, 26.2], BI: [29.9, -3.4],
  BJ: [2.3, 9.3], BN: [114.9, 4.9], BO: [-65.1, -16.5], BR: [-47.9, -15.8],
  BS: [-77.4, 25.0], BT: [90.4, 27.5], BW: [25.9, -22.3], BY: [27.6, 53.9],
  BZ: [-88.8, 17.3],
  CA: [-75.7, 45.4], CD: [24.0, -4.3], CF: [20.9, 6.6], CG: [15.3, -4.3],
  CH: [8.5, 47.4], CI: [-5.6, 7.5], CL: [-70.7, -33.5], CM: [12.4, 3.9],
  CN: [104.2, 35.9], CO: [-74.1, 4.7], CR: [-84.1, 9.7], CU: [-79.5, 22.0],
  CV: [-24.0, 16.0], CY: [33.4, 35.2], CZ: [14.5, 50.1],
  DE: [13.4, 52.5], DJ: [43.1, 11.6], DK: [12.6, 55.7], DM: [-61.4, 15.4],
  DO: [-69.9, 18.7], DZ: [3.1, 28.0],
  EC: [-78.5, -1.8], EE: [24.7, 59.4], EG: [30.8, 26.8], ER: [39.5, 15.2],
  ES: [-3.7, 40.4], ET: [40.5, 9.1],
  FI: [25.0, 60.2], FJ: [178.1, -18.1], FR: [2.3, 48.8],
  GA: [11.6, -0.8], GB: [-0.1, 51.5], GD: [-61.7, 12.1], GE: [44.0, 42.3],
  GH: [-0.2, 5.6], GM: [-15.3, 13.4], GN: [-11.8, 11.0], GQ: [10.3, 1.7],
  GR: [23.7, 37.9], GT: [-90.2, 15.8], GW: [-15.2, 11.8], GY: [-59.0, 5.0],
  HN: [-86.2, 15.2], HR: [16.0, 45.8], HT: [-72.3, 19.0], HU: [19.1, 47.5],
  ID: [113.9, -0.8], IE: [-6.3, 53.3], IL: [35.0, 31.5], IN: [79.1, 20.6],
  IQ: [44.4, 33.2], IR: [53.7, 32.4], IS: [-19.0, 65.0], IT: [12.5, 41.9],
  JM: [-77.3, 18.1], JO: [36.2, 30.6], JP: [139.7, 35.7],
  KE: [36.8, -1.3], KG: [74.8, 41.2], KH: [105.0, 12.6], KI: [173.0, 1.4],
  KM: [43.4, -11.6], KN: [-62.7, 17.3], KP: [127.5, 40.0], KR: [127.8, 36.4],
  KW: [47.5, 29.5], KZ: [66.9, 48.0],
  LA: [103.0, 18.0], LB: [35.5, 33.9], LC: [-60.9, 13.9], LI: [9.5, 47.1],
  LK: [80.7, 7.9], LR: [-9.4, 6.4], LS: [28.3, -29.6], LT: [25.3, 54.7],
  LU: [6.1, 49.6], LV: [24.1, 56.9], LY: [17.2, 26.3],
  MA: [-7.1, 31.8], MC: [7.4, 43.7], MD: [28.5, 47.0], ME: [19.4, 42.7],
  MG: [46.9, -19.0], MH: [171.2, 7.1], MK: [21.7, 41.6], ML: [-1.8, 12.7],
  MM: [96.7, 21.9], MN: [103.8, 46.9], MR: [-11.7, 18.1], MT: [14.5, 35.9],
  MU: [57.6, -20.3], MV: [73.5, 3.2], MW: [34.3, -13.3], MX: [-99.1, 19.4],
  MY: [109.7, 4.2], MZ: [35.5, -18.7],
  NA: [18.5, -22.0], NE: [8.1, 17.6], NG: [7.5, 9.1], NI: [-85.0, 12.9],
  NL: [4.9, 52.4], NO: [10.7, 59.9], NP: [84.1, 28.4], NR: [166.9, -0.5],
  NZ: [174.9, -40.9],
  OM: [57.0, 21.5],
  PA: [-79.5, 9.0], PE: [-77.0, -12.0], PG: [143.9, -6.3], PH: [121.8, 12.9],
  PK: [69.4, 30.4], PL: [21.0, 52.2], PT: [-9.1, 38.7], PW: [134.6, 7.5],
  PY: [-58.4, -23.4],
  QA: [51.2, 25.4],
  RO: [26.1, 44.4], RS: [21.0, 44.0], RU: [105.3, 61.5], RW: [29.9, -2.0],
  SA: [44.5, 24.0], SB: [160.2, -9.6], SC: [55.5, -4.7], SD: [30.2, 15.6],
  SE: [18.1, 59.3], SG: [103.8, 1.3], SI: [14.5, 46.1], SK: [17.1, 48.1],
  SL: [-11.8, 8.5], SM: [12.5, 43.9], SN: [-14.5, 14.5], SO: [46.2, 5.2],
  SR: [-56.0, 4.0], SS: [31.3, 6.9], ST: [6.6, 0.2], SV: [-88.9, 13.8],
  SY: [38.3, 35.0], SZ: [31.5, -26.5],
  TD: [18.7, 15.5], TG: [1.2, 8.6], TH: [100.5, 15.9], TJ: [71.3, 38.9],
  TL: [125.7, -8.9], TM: [59.6, 39.0], TN: [9.5, 34.0], TO: [-175.2, -21.2],
  TR: [35.2, 39.1], TT: [-61.2, 10.7], TV: [177.1, -7.1], TZ: [35.7, -6.4],
  UA: [31.2, 49.4], UG: [32.3, 1.4], US: [-95.7, 37.1], UY: [-56.2, -32.5],
  UZ: [63.9, 41.4],
  VA: [12.5, 41.9], VC: [-61.2, 13.3], VE: [-66.6, 8.0], VN: [108.3, 14.1],
  VU: [166.9, -15.4],
  WS: [-172.1, -13.8],
  YE: [47.6, 16.3],
  ZA: [24.7, -28.5], ZM: [28.3, -13.1], ZW: [30.0, -20.0],
}

// ISO 3166-1 numeric code → continent
const CONTINENT: Record<string, string> = {
  // Europe
  "008":"eu","020":"eu","040":"eu","056":"eu","070":"eu","100":"eu","191":"eu",
  "196":"eu","203":"eu","208":"eu","233":"eu","246":"eu","250":"eu","276":"eu",
  "300":"eu","336":"eu","348":"eu","352":"eu","372":"eu","380":"eu","428":"eu",
  "438":"eu","440":"eu","442":"eu","470":"eu","492":"eu","498":"eu","499":"eu",
  "528":"eu","578":"eu","616":"eu","620":"eu","642":"eu","643":"eu","674":"eu",
  "688":"eu","703":"eu","705":"eu","724":"eu","752":"eu","756":"eu","804":"eu",
  "807":"eu","826":"eu",
  // Asia
  "004":"as","031":"as","050":"as","051":"as","064":"as","096":"as","104":"as",
  "116":"as","144":"as","156":"as","268":"as","356":"as","360":"as","364":"as",
  "368":"as","376":"as","392":"as","398":"as","400":"as","408":"as","410":"as",
  "414":"as","417":"as","418":"as","422":"as","458":"as","462":"as","496":"as",
  "512":"as","524":"as","586":"as","608":"as","626":"as","634":"as","682":"as",
  "702":"as","760":"as","762":"as","764":"as","784":"as","792":"as","795":"as",
  "860":"as","887":"as",
  // Africa
  "012":"af","024":"af","072":"af","108":"af","120":"af","132":"af","140":"af",
  "148":"af","174":"af","178":"af","180":"af","204":"af","226":"af","231":"af",
  "232":"af","266":"af","270":"af","288":"af","324":"af","384":"af","404":"af",
  "426":"af","430":"af","434":"af","450":"af","454":"af","466":"af","478":"af",
  "480":"af","504":"af","508":"af","516":"af","562":"af","566":"af","624":"af",
  "638":"af","646":"af","678":"af","686":"af","694":"af","706":"af","710":"af",
  "716":"af","728":"af","729":"af","748":"af","768":"af","788":"af","800":"af",
  "834":"af","894":"af",
  // North America
  "028":"na","044":"na","052":"na","084":"na","124":"na","188":"na","192":"na",
  "212":"na","214":"na","222":"na","308":"na","320":"na","332":"na","340":"na",
  "388":"na","484":"na","558":"na","591":"na","659":"na","662":"na","670":"na",
  "780":"na","840":"na",
  // South America
  "032":"sa","068":"sa","076":"sa","152":"sa","170":"sa","218":"sa","328":"sa",
  "600":"sa","604":"sa","740":"sa","858":"sa","862":"sa",
  // Oceania
  "036":"oc","090":"oc","242":"oc","296":"oc","520":"oc","540":"oc","548":"oc",
  "554":"oc","583":"oc","584":"oc","585":"oc","598":"oc","776":"oc","798":"oc","882":"oc",
}

const CONTINENT_FILL: Record<string, string> = {
  eu: "#6b7fa8",   // muted blue    — Europe
  as: "#5a8f75",   // muted green   — Asia
  af: "#a8834a",   // muted amber   — Africa
  na: "#7a6fa8",   // muted violet  — North America
  sa: "#4a8a96",   // muted teal    — South America
  oc: "#956b8a",   // muted mauve   — Oceania
}
const CONTINENT_STROKE: Record<string, string> = {
  eu: "#8a9dc4",
  as: "#74aa90",
  af: "#c4a06a",
  na: "#9a8fc4",
  sa: "#6aaab8",
  oc: "#b48aaa",
}
const DEFAULT_FILL   = "#cbd5e1"
const DEFAULT_STROKE = "#94a3b8"

function geoFill(id: string)   { return CONTINENT_FILL[CONTINENT[id]]   ?? DEFAULT_FILL }
function geoStroke(id: string) { return CONTINENT_STROKE[CONTINENT[id]] ?? DEFAULT_STROKE }

const STATUS_COLORS = {
  HEALTHY: "#22c55e",
  DEGRADED: "#f59e0b",
  OUTAGE: "#ef4444",
  MAINTENANCE: "#3b82f6",
  UNKNOWN: "#6b7280",
} as const


const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"


export interface MarketPin {
  marketCode: string
  marketName: string
  apps: Array<{
    appId: string
    appName: string
    appSlug: string
    appIconUrl: string | null
    status: string
  }>
  worstStatus: string
}

interface TooltipState {
  pin: MarketPin
  x: number
  y: number
}

interface WorldMapProps {
  pins: MarketPin[]
}

export function WorldMap({ pins }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [activePin, setActivePin] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)   // tracks live zoom without triggering re-renders
  const containerRef = useRef<HTMLDivElement>(null)

  const MIN_ZOOM = 1
  const MAX_ZOOM = 6

  const activeMarket = pins.find((p) => p.marketCode === activePin) ?? null

  function handleMouseEnter(e: React.MouseEvent, pin: MarketPin) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ pin, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleMouseMove(e: React.MouseEvent, pin: MarketPin) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
  }

  return (
    <div
      className="rounded-xl border border-gray-700 overflow-hidden flex flex-col"
      style={{ background: "#1f2937" }}
    >
      <div className="flex min-h-0" style={{ height: 520 }}>

        {/* Map */}
        <div className="relative flex-1 min-w-0" ref={containerRef}>
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 185 }}
            width={900}
            height={520}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup zoom={zoom} center={[10, 20]} onMoveEnd={({ zoom: z }) => { zoomRef.current = z }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const fill   = geoFill(geo.id ?? "")
                    const stroke = geoStroke(geo.id ?? "")
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={0.4}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: stroke },
                          pressed: { outline: "none" },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {pins.map((pin) => {
                const coords = MARKET_COORDS[pin.marketCode]
                if (!coords) return null
                const color = STATUS_COLORS[pin.worstStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN
                const isActive = activePin === pin.marketCode
                const isHovered = tooltip?.pin.marketCode === pin.marketCode

                return (
                  <Marker
                    key={pin.marketCode}
                    coordinates={coords}
                    onMouseEnter={(e) => handleMouseEnter(e as never, pin)}
                    onMouseMove={(e) => handleMouseMove(e as never, pin)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => setActivePin(isActive ? null : pin.marketCode)}
                  >
                    {/* Glow ring */}
                    {(isHovered || isActive) && (
                      <circle r={15} fill={color} opacity={0.2} />
                    )}
                    {/* Status-coloured filled circle */}
                    <circle
                      r={isActive || isHovered ? 11 : 9}
                      fill={color}
                      stroke="white"
                      strokeWidth={1.5}
                      style={{
                        cursor: "pointer",
                        transition: "r 0.15s ease",
                        filter: isActive ? `drop-shadow(0 1px 4px ${color})` : undefined,
                      }}
                    />
                    {/* 2-letter country code */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isActive || isHovered ? 5.5 : 4.5}
                      fontWeight="700"
                      fill="white"
                      fontFamily="system-ui, sans-serif"
                      style={{ pointerEvents: "none", userSelect: "none", letterSpacing: "0.03em" }}
                    >
                      {pin.marketCode}
                    </text>
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Hover tooltip */}
          {tooltip && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: tooltip.x + 14,
                top: tooltip.y - 10,
                // Flip left if near right edge
                transform: tooltip.x > (containerRef.current?.offsetWidth ?? 700) - 220
                  ? "translateX(-110%)"
                  : undefined,
              }}
            >
              <div className="bg-white/95 backdrop-blur-sm border border-indigo-100 rounded-xl shadow-xl p-3 w-52">
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[tooltip.pin.worstStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN }}
                    >
                      {tooltip.pin.marketCode}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{tooltip.pin.marketName}</p>
                      <p className="text-[10px] text-slate-400">{tooltip.pin.apps.length} app{tooltip.pin.apps.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[tooltip.pin.worstStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN }}
                  />
                </div>

                {/* App list */}
                <div className="flex flex-col gap-1">
                  {tooltip.pin.apps.map((app) => (
                    <div key={app.appId} className="flex items-center gap-2">
                      {/* Icon */}
                      <div className="size-6 rounded-lg overflow-hidden shrink-0 bg-indigo-50 flex items-center justify-center">
                        {app.appIconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.appIconUrl}
                            alt={app.appName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-indigo-400">
                            {app.appName[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-600 truncate flex-1">{app.appName}</span>
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN }}
                      />
                    </div>
                  ))}
                </div>

                {/* Click hint */}
                <p className="text-[9px] text-slate-400 mt-2.5 text-center">Click pin to pin this panel</p>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded-lg border border-gray-600 shadow-sm bg-gray-800/90 backdrop-blur-sm">
            <button
              onClick={() => { const next = Math.min(zoomRef.current + 0.75, MAX_ZOOM); zoomRef.current = next; setZoom(next) }}
              disabled={zoom >= MAX_ZOOM}
              className="flex items-center justify-center w-8 h-8 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light border-b border-gray-600"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => { const next = Math.max(zoomRef.current - 0.75, MIN_ZOOM); zoomRef.current = next; setZoom(next) }}
              disabled={zoom <= MIN_ZOOM}
              className="flex items-center justify-center w-8 h-8 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-light"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {/* Side panel — shown when a pin is clicked */}
        <div className="w-52 shrink-0 border-l border-gray-700 flex flex-col bg-gray-900/60 backdrop-blur-sm">
          {activeMarket ? (
            <div className="flex flex-col h-full">
              <div className="px-4 pt-4 pb-3 border-b border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[activeMarket.worstStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN }}
                    >
                      {activeMarket.marketCode}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-100 leading-tight">{activeMarket.marketName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activeMarket.apps.length} app{activeMarket.apps.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePin(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors text-sm leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
                {activeMarket.apps.map((app) => (
                  <Link
                    key={app.appId}
                    href={`/apps/${app.appSlug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="size-7 rounded-lg overflow-hidden shrink-0 bg-indigo-50 flex items-center justify-center">
                      {app.appIconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={app.appIconUrl}
                          alt={app.appName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-400">
                          {app.appName[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-300 truncate flex-1 group-hover:text-white transition-colors">{app.appName}</span>
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.UNKNOWN }}
                    />
                  </Link>
                ))}
              </div>

              <div className="px-3 py-2.5 border-t border-gray-700">
                <Link
                  href={`/markets/${activeMarket.marketCode}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  View market page →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <div className="size-9 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Hover a pin to preview, click to pin the panel</p>
              <p className="text-xs text-gray-500">{pins.length} active market{pins.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
