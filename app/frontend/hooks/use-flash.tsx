import { router, usePage } from "@inertiajs/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Flash } from "@/types"

const emptyFlash: Flash = { alert: undefined, notice: undefined }

export const useFlash = () => {
  const page = usePage<{ flash?: Flash }>()
  const flash = page.props.flash || emptyFlash
  const [currentFlash, setCurrentFlash] = useState<Flash>(flash)

  useEffect(() => {
    setCurrentFlash(flash)
  }, [flash])

  router.on("start", () => {
    setCurrentFlash(emptyFlash)
  })

  useEffect(() => {
    if (currentFlash?.alert) {
      toast.error(currentFlash.alert)
    }
    if (currentFlash?.notice) {
      toast(currentFlash.notice)
    }
  }, [currentFlash])
}
