import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  Button,
  Label,
  ToggleButton,
  ToggleButtonGroup,
  type Selection,
} from 'react-aria-components'
import { useChartConfiguration } from './provider.js'
import type { ApertureIcon } from './types.js'
import { ChartWidget, useChartWidget } from './widget.js'

export interface ChartToolbarProps {
  readonly targetRef: RefObject<HTMLElement | null>
  /** Show the exact-value toggle. This does not change table visibility. */
  readonly dataTableControl?: 'hidden' | 'visible'
}

export function ChartToolbar({ targetRef, dataTableControl = 'hidden' }: ChartToolbarProps) {
  if (dataTableControl !== 'hidden' && dataTableControl !== 'visible') {
    throw new RangeError('ChartToolbar dataTableControl must be "hidden" or "visible".')
  }
  return (
    <ChartWidget.Controls className="aperture-toolbar">
      {dataTableControl === 'visible' ? <DataTableControl /> : null}
      <FullscreenControl targetRef={targetRef} />
    </ChartWidget.Controls>
  )
}

export function DataTableControl() {
  const { messages, icons } = useChartConfiguration()
  const { tableId, tableAvailable, tableVisible, setTableVisible } = useChartWidget()
  const Icon = icons.table
  const selected = tableAvailable && tableVisible
  return (
    <ToggleButton
      className="aperture-control aperture-icon-control"
      isSelected={selected}
      isDisabled={!tableAvailable}
      onChange={setTableVisible}
      aria-label={selected ? messages.controls.hideTable : messages.controls.showTable}
      aria-controls={tableAvailable ? tableId : undefined}
    >
      <Icon aria-hidden="true" />
    </ToggleButton>
  )
}

export interface TimeRangeOption<TValue extends string> {
  readonly value: TValue
  readonly label: string
}

export interface TimeRangeControlProps<TValue extends string> {
  readonly value: TValue
  readonly options: readonly [TimeRangeOption<TValue>, ...TimeRangeOption<TValue>[]]
  readonly onChange: (value: TValue) => void
  readonly label?: string
}

export function TimeRangeControl<TValue extends string>({
  value,
  options,
  onChange,
  label,
}: TimeRangeControlProps<TValue>) {
  const { messages, icons } = useChartConfiguration()
  const Icon = icons.calendar
  const resolvedLabel = label ?? messages.controls.timeRange

  function change(selection: Selection) {
    if (selection === 'all') return
    const next = [...selection][0]
    const option = options.find((candidate) => candidate.value === next)
    if (option) onChange(option.value)
  }

  return (
    <div className="aperture-range-control">
      <Label><Icon aria-hidden="true" />{resolvedLabel}</Label>
      <ToggleButtonGroup
        className="aperture-toggle-group"
        aria-label={resolvedLabel}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={change}
      >
        {options.map((option) => (
          <ToggleButton className="aperture-toggle-option" key={option.value} id={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}

export interface ToggleControlProps {
  readonly label: string
  readonly icon?: ApertureIcon
  readonly isSelected: boolean
  readonly onChange: (selected: boolean) => void
}

export function ToggleControl({ label, icon: Icon, isSelected, onChange }: ToggleControlProps) {
  return (
    <ToggleButton className="aperture-control" isSelected={isSelected} onChange={onChange}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span>{label}</span>
    </ToggleButton>
  )
}

export interface FullscreenControlProps {
  readonly targetRef: RefObject<HTMLElement | null>
}

export function FullscreenControl({ targetRef }: FullscreenControlProps) {
  const { messages, icons } = useChartConfiguration()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let wasFullscreen = false
    function update() {
      const active = document.fullscreenElement === targetRef.current
      setIsFullscreen(active)
      if (wasFullscreen && !active) buttonRef.current?.focus({ preventScroll: true })
      wasFullscreen = active
    }
    update()
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [targetRef])

  async function toggle() {
    const target = targetRef.current
    if (!target) {
      setFailure(messages.errors.missingFullscreenTarget)
      return
    }
    try {
      setFailure(null)
      if (document.fullscreenElement) await document.exitFullscreen()
      else await target.requestFullscreen()
    } catch (error: unknown) {
      setFailure(error instanceof Error ? error.message : messages.errors.fullscreenFailed)
    }
  }

  const Icon = isFullscreen ? icons.collapse : icons.expand
  const label = isFullscreen
    ? messages.controls.exitFullscreen
    : messages.controls.enterFullscreen

  return (
    <span className="aperture-control-status">
      <Button ref={buttonRef} className="aperture-control aperture-icon-control" aria-label={label} onPress={toggle}>
        <Icon aria-hidden="true" />
      </Button>
      {failure ? <span role="alert" className="aperture-control-error">{failure}</span> : null}
    </span>
  )
}
