import './style.css'
import { Example } from './example.ts'

const example = new Example('Hello from Example class!')

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>${example.name}</h1>
  </div>
`
