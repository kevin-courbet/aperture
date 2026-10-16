import type { GlobalProvider } from '@ladle/react'
import '@kevin-courbet/aperture/styles.css'
import '../src/catalog.css'

export const Provider: GlobalProvider = ({ children }) => <>{children}</>
