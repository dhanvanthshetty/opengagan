import { getTasks } from 'node-cron'
import type { ScheduledTask } from 'node-cron'
import type { Server as SocketIOServer } from 'socket.io'

const scheduled: ScheduledTask[] = []

async function destroyScheduledTasks(): Promise<void> {
  await Promise.all(scheduled.map((task) => task.destroy()))
  scheduled.length = 0
}

describe('node-cron v4 job registration', () => {
  beforeAll(() => {
    // config/env.ts validates this at import time.
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/opengagan-test'
    process.env.NODE_ENV = 'test'
  })

  afterAll(destroyScheduledTasks)

  test('each job registers a started ScheduledTask with the v4 lifecycle API', async () => {
    const [
      { startMonthlyUDAN },
      { startPollFIRMS },
      { startPollOpenSky },
      { startPollWeather },
      { startRefreshAirports },
      { startScrapeAMSS },
    ] = await Promise.all([
      import('../src/jobs/monthlyUDAN'),
      import('../src/jobs/pollFIRMS'),
      import('../src/jobs/pollOpenSky'),
      import('../src/jobs/pollWeather'),
      import('../src/jobs/refreshAirports'),
      import('../src/jobs/scrapeAMSS'),
    ])

    const registrations: Array<[string, ScheduledTask]> = [
      ['monthly-udan', startMonthlyUDAN()],
      ['poll-firms', startPollFIRMS()],
      ['poll-opensky', startPollOpenSky({} as SocketIOServer)],
      ['poll-weather', startPollWeather()],
      ['refresh-airports', startRefreshAirports()],
      ['scrape-amss', startScrapeAMSS()],
    ]
    scheduled.push(...registrations.map(([, task]) => task))

    for (const [name, task] of registrations) {
      // v4 starts schedule() tasks immediately and returns the ScheduledTask.
      expect(task.name).toBe(name)
      expect(task.getStatus()).toBe('idle')
      expect(task.getNextRun()).toBeInstanceOf(Date)
      expect(typeof task.getStatus).toBe('function')
      expect(typeof task.execute).toBe('function')
      expect(getTasks().get(task.id)).toBe(task)
    }

    await destroyScheduledTasks()
    expect(getTasks().size).toBe(0)
  })
})
