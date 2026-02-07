import { useState, useCallback } from 'react'

export function useSelection<T>(initialSelected: T[] = []) {
    const [selected, setSelected] = useState<T[]>(initialSelected)

    const toggle = useCallback((item: T) => {
        setSelected(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        )
    }, [])

    const clear = useCallback(() => {
        setSelected([])
    }, [])

    const isSelected = useCallback((item: T) => selected.includes(item), [selected])

    return { selected, toggle, clear, isSelected, setSelected }
}
