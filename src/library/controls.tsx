import { useEffect, useState, type RefObject } from 'react'
import { Button, Label, ToggleButton, ToggleButtonGroup } from 'react-aria-components'
import { useChartConfig } from './ChartProvider'
import { useWidgetContext } from './ChartWidget'
import type { Icon, TimeRange } from './types'

export function FullscreenControl({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const { messages, icons } = useChartConfig()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === targetRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [targetRef])

  async function toggleFullscreen() {
    const target = targetRef.current
    if (!target) return setFailure(messages.errors.missingFullscreenTarget)
    try {
      setFailure(null)
      if (document.fullscreenElement) await document.exitFullscreen()
      else {
        await target.requestFullscreen()
      }
    } catch (error) {
      setFailure(error instanceof Error ? error.message : messages.errors.fullscreenFailed)
    }
  }

  const IconComponent = icons.fullscreen
  return <span className="control-with-error"><Button className="icon-button" aria-label={isFullscreen ? messages.controls.exitFullscreen : messages.controls.fullscreen} onPress={toggleFullscreen}><IconComponent aria-hidden="true" /></Button>{failure ? <span className="control-error" role="alert">{failure}</span> : null}</span>
}

export function DataTableControl() {
  const { messages, icons } = useChartConfig()
  const { tableVisible, setTableVisible } = useWidgetContext()
  const IconComponent = icons.table
  return <ToggleButton className="control-button" isSelected={tableVisible} onChange={setTableVisible} aria-label={tableVisible ? messages.controls.hideTable : messages.controls.showTable}><IconComponent aria-hidden="true" /> <span>{tableVisible ? messages.controls.hideTable : messages.controls.showTable}</span></ToggleButton>
}

export function TimeRangeControl({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  const { messages } = useChartConfig()
  return <div className="range-control"><Label>{messages.controls.range}</Label><ToggleButtonGroup aria-label={messages.controls.range} className="range-options" selectionMode="single" disallowEmptySelection selectedKeys={[value]} onSelectionChange={(keys) => { const [next] = keys; if (next) onChange(next as TimeRange) }}>{(['1M', '3M', '6M', 'All'] as const).map((range) => <ToggleButton key={range} id={range} className="range-option">{messages.ranges[range]}</ToggleButton>)}</ToggleButtonGroup></div>
}

export function ToggleControl({ label, icon: IconComponent, isSelected, onChange }: { label: string; icon: Icon; isSelected: boolean; onChange: (selected: boolean) => void }) {
  return <ToggleButton className="control-button" isSelected={isSelected} onChange={onChange}><IconComponent aria-hidden="true" /> <span>{label}</span></ToggleButton>
}
