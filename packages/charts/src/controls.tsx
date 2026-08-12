import { useEffect, useState, type RefObject } from 'react'
import {
  Button,
  Label,
  ToggleButton,
  ToggleButtonGroup,
  type Selection,
} from 'react-aria-components'
import { useChartConfiguration } from './provider'
import type { ApertureIcon } from './types'
import { useChartWidget } from './widget'

export function DataTableControl() {
  const { messages, icons } = useChartConfiguration()
  const { tableVisible, setTableVisible } = useChartWidget()
  const Icon = icons.table
  return (
    <ToggleButton
      className="aperture-control"
      isSelected={tableVisible}
      onChange={setTableVisible}
      aria-label={tableVisible ? messages.controls.hideTable : messages.controls.showTable}
    >
      <Icon aria-hidden="true" />
      <span>{tableVisible ? messages.controls.hideTable : messages.controls.showTable}</span>
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

  useEffect(() => {
    function update() {
      setIsFullscreen(document.fullscreenElement === targetRef.current)
    }
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
      <Button className="aperture-control aperture-icon-control" aria-label={label} onPress={toggle}>
        <Icon aria-hidden="true" />
      </Button>
      {failure ? <span role="alert" className="aperture-control-error">{failure}</span> : null}
    </span>
  )
}
