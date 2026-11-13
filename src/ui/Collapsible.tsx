import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Button, Stack} from '@sanity/ui'
import {useId, useState} from 'react'

/**
 * A heading that folds its content away.
 *
 * Not `<details>`: Sanity UI's `Text` lays itself out as a block, so a summary
 * holding a title and a count stacks them on separate lines under the marker.
 *
 * @internal
 */
export function Collapsible(props: {
  label: string
  defaultOpen?: boolean
  fontSize?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  const id = useId()

  return (
    <Stack>
      <Button
        aria-controls={id}
        aria-expanded={open}
        fontSize={props.fontSize ?? 1}
        icon={open ? ChevronDownIcon : ChevronRightIcon}
        justify="flex-start"
        mode="bleed"
        onClick={() => setOpen(!open)}
        padding={2}
        text={props.label}
      />
      <div hidden={!open} id={id}>
        {open && props.children}
      </div>
    </Stack>
  )
}
