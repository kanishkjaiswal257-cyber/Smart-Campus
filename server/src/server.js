import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Smart Campus API listening on port ${port}`)
})
