const linesCount = useMeno(() => 69, [])
const linesList = useMeno(() => [...new Array(linesCount)], [linesCount])
const lines = linesList.map((_, i) => i)
