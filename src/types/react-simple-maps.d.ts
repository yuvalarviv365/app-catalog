declare module "react-simple-maps" {
  import type { ReactNode, CSSProperties, MouseEvent } from "react"

  export interface GeographyRecord {
    rsmKey: string
    id?: string
    [key: string]: unknown
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: CSSProperties
    children?: ReactNode
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    onMoveStart?: (data: { coordinates: [number, number]; zoom: number }) => void
    onMove?: (data: { x: number; y: number; zoom: number; dragging: MouseEvent }) => void
    onMoveEnd?: (data: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: GeographyRecord[] }) => ReactNode
  }
  export function Geographies(props: GeographiesProps): JSX.Element

  export interface GeographyProps {
    geography: GeographyRecord
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
  }
  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
    onMouseEnter?: (e: MouseEvent<SVGGElement>) => void
    onMouseMove?: (e: MouseEvent<SVGGElement>) => void
    onMouseLeave?: (e: MouseEvent<SVGGElement>) => void
    onClick?: (e: MouseEvent<SVGGElement>) => void
  }
  export function Marker(props: MarkerProps): JSX.Element
}
