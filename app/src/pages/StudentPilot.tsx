import React, { useState } from 'react'
import { useGlobeStore } from '../store/globeStore'
import { ApproachPlateBuilder } from '../components/flow/ApproachPlateBuilder'
import { PageNav } from '../components/layout/PageNav'
import AIRSPACE_CLASSES from '../../../shared/src/data/airspace.json'
import QUIZ_QUESTIONS from '../../../shared/src/data/quiz.json'

interface AirspaceClass {
  id: string
  label: string
  description: string
  altitudeRange: string
  color: string
  icaoCodes?: string[]
  rules: string[]
}

export default function StudentPilot() {
  const [quizIdx, setQuizIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'airspace' | 'builder' | 'quiz'>('airspace')

  const q = QUIZ_QUESTIONS[quizIdx]

  function handleAnswer(answer: string) {
    if (selectedAnswer) return
    setSelectedAnswer(answer)
    if (answer === q.a) setScore((s) => s + 1)
  }

  function nextQuestion() {
    if (quizIdx + 1 >= QUIZ_QUESTIONS.length) {
      setQuizDone(true)
    } else {
      setQuizIdx((i) => i + 1)
      setSelectedAnswer(null)
    }
  }

  function resetQuiz() {
    setQuizIdx(0)
    setSelectedAnswer(null)
    setScore(0)
    setQuizDone(false)
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #2c4060 0%, #223356 30%, #182844 70%, #101e35 100%)', color: '#ECE8D4' }}>
      <PageNav />

      {/* Page title + tabs */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-0">
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#ECE8D4' }}>Student Pilot Mode</h1>
        <p className="text-xs mb-4" style={{ color: 'rgba(236,232,212,0.50)' }}>Indian airspace · ADS-B data · approach procedures</p>
        <div className="flex gap-1">
          {(['airspace', 'builder', 'quiz'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium rounded-t-xl transition-all capitalize"
              style={
                activeTab === tab
                  ? { background: 'rgba(236,232,212,0.93)', color: '#1a2540', boxShadow: '0 -2px 0 #6b7838 inset' }
                  : { color: 'rgba(236,232,212,0.50)', background: 'rgba(236,232,212,0.07)' }
              }
            >
              {tab === 'airspace' ? '✈ Airspace' : tab === 'builder' ? '📐 Procedure Builder' : '🎯 Quiz'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* Airspace Tab */}
        {activeTab === 'airspace' && (
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: 'rgba(236,232,212,0.93)',
              border: '1px solid rgba(26,37,64,0.14)',
              boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
            }}
          >
            <p className="text-sm mb-2" style={{ color: '#2d3d5c' }}>
              India follows ICAO airspace classification. The three main classes you need to know as a student pilot:
            </p>
            {AIRSPACE_CLASSES.map((cls) => (
              <div
                key={cls.id}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: cls.color + '44', background: cls.color + '12' }}
              >
                <div className="flex items-center gap-4 p-5">
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                    style={{ background: cls.color + '22', border: `1.5px solid ${cls.color}66`, color: cls.color }}
                  >
                    {cls.id}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base" style={{ color: '#1a2540' }}>{cls.label}</div>
                    <div className="text-sm mt-0.5" style={{ color: '#2d3d5c' }}>{cls.description}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs" style={{ color: '#6b7838' }}>Altitude</div>
                    <div className="text-sm font-mono" style={{ color: '#1a2540' }}>{cls.altitudeRange}</div>
                  </div>
                </div>
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {cls.rules.map((rule) => (
                    <span
                      key={rule}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: cls.color + '18', color: cls.color, border: `1px solid ${cls.color}44` }}
                    >
                      {rule}
                    </span>
                  ))}
                  {cls.icaoCodes?.map((code) => (
                    <span
                      key={code}
                      className="text-xs px-2.5 py-1 rounded-full font-mono"
                      style={{
                        background: 'rgba(26,37,64,0.08)',
                        color: '#2d3d5c',
                        border: '1px solid rgba(26,37,64,0.15)',
                      }}
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* ADS-B explainer */}
            <div
              className="rounded-2xl p-5 mt-2"
              style={{
                background: 'rgba(26,37,64,0.06)',
                border: '1px solid rgba(26,37,64,0.12)',
              }}
            >
              <h3 className="font-semibold mb-3" style={{ color: '#1a2540' }}>What is ADS-B?</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#2d3d5c' }}>
                Automatic Dependent Surveillance–Broadcast (ADS-B) is how aircraft broadcast their position, altitude,
                speed, and heading. Aircraft transmit this on 1090 MHz every second. Ground stations and other aircraft
                receive it — no radar needed. OpenGagan uses ADS-B feeds to show you every transponder-equipped
                aircraft in real time.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                {[
                  { label: 'ICAO24', desc: 'Unique 24-bit aircraft address (like a MAC address)' },
                  { label: 'Callsign', desc: 'Flight number broadcast by the transponder' },
                  { label: 'Baro Alt', desc: 'Pressure altitude in metres above sea level' },
                  { label: 'Track', desc: 'True heading of travel in degrees (0–360)' },
                ].map(({ label, desc }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(26,37,64,0.07)',
                      border: '1px solid rgba(26,37,64,0.12)',
                    }}
                  >
                    <div className="font-mono text-xs mb-1" style={{ color: '#6b7838' }}>{label}</div>
                    <div className="text-xs" style={{ color: '#2d3d5c' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Procedure Builder Tab */}
        {activeTab === 'builder' && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(236,232,212,0.93)',
              border: '1px solid rgba(26,37,64,0.14)',
              boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
            }}
          >
            <p className="text-sm mb-6" style={{ color: '#2d3d5c' }}>
              An instrument approach procedure follows a fixed sequence of waypoints.
              Connect the fixes below in the correct order to build a valid ILS approach.
            </p>
            <ApproachPlateBuilder />
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'IAF', name: 'Initial Approach Fix', desc: 'Entry point to the approach' },
                { id: 'IF', name: 'Intermediate Fix', desc: 'Alignment segment begins' },
                { id: 'FAF', name: 'Final Approach Fix', desc: 'Final descent begins' },
                { id: 'MAP', name: 'Missed Approach Point', desc: 'Go-around decision point' },
                { id: 'MISSED', name: 'Missed Approach', desc: 'Climb-out procedure' },
              ].map(({ id, name, desc }) => (
                <div
                  key={id}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: 'rgba(26,37,64,0.07)',
                    border: '1px solid rgba(26,37,64,0.14)',
                  }}
                >
                  <div className="font-mono text-sm font-bold" style={{ color: '#6b7838' }}>{id}</div>
                  <div className="text-xs mt-1 font-medium" style={{ color: '#1a2540' }}>{name}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#2d3d5c' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(236,232,212,0.93)',
              border: '1px solid rgba(26,37,64,0.14)',
              boxShadow: '0 8px 32px rgba(26,37,64,0.18)',
            }}
          >
            {quizDone ? (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="text-6xl font-bold mb-2" style={{
                  color: score === QUIZ_QUESTIONS.length ? '#22c55e' : score >= QUIZ_QUESTIONS.length * 0.7 ? '#f59e0b' : '#ef4444'
                }}>
                  {score}/{QUIZ_QUESTIONS.length}
                </div>
                <div className="text-lg font-medium mb-2" style={{ color: '#1a2540' }}>
                  {score === QUIZ_QUESTIONS.length ? 'Perfect score!' :
                   score >= QUIZ_QUESTIONS.length * 0.7 ? 'Good work.' : 'Keep studying.'}
                </div>
                <div className="text-sm mb-8" style={{ color: '#2d3d5c' }}>
                  {score === QUIZ_QUESTIONS.length ? 'You know Indian airspace well.' :
                   score >= QUIZ_QUESTIONS.length * 0.7 ? 'Review the Airspace tab for missed topics.' :
                   'Go through the Airspace tab again before retrying.'}
                </div>
                <button
                  onClick={resetQuiz}
                  className="rounded-xl px-8 py-3 font-medium transition-colors text-white"
                  style={{ background: '#6b7838' }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex-1 rounded-full h-1.5"
                    style={{ background: 'rgba(26,37,64,0.14)' }}
                  >
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(quizIdx / QUIZ_QUESTIONS.length) * 100}%`,
                        background: '#6b7838',
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: '#2d3d5c' }}>{quizIdx + 1}/{QUIZ_QUESTIONS.length}</span>
                </div>

                <p className="font-medium text-base mb-6 leading-relaxed" style={{ color: '#1a2540' }}>{q.q}</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt) => {
                    let bgStyle: React.CSSProperties = {
                      background: 'rgba(26,37,64,0.06)',
                      border: '1px solid rgba(26,37,64,0.14)',
                      color: '#1a2540',
                    }
                    if (selectedAnswer) {
                      if (opt === q.a) bgStyle = { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.40)', color: '#15803d' }
                      else if (opt === selectedAnswer) bgStyle = { background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.35)', color: '#dc2626' }
                      else bgStyle = { background: 'rgba(26,37,64,0.03)', border: '1px solid rgba(26,37,64,0.08)', color: 'rgba(26,37,64,0.40)' }
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="rounded-xl px-4 py-3.5 text-sm text-left transition-all"
                        style={bgStyle}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {selectedAnswer && (
                  <div
                    className="mt-5 pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(26,37,64,0.12)' }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: selectedAnswer === q.a ? '#15803d' : '#dc2626' }}
                    >
                      {selectedAnswer === q.a ? '✓ Correct' : `✗ Answer: ${q.a}`}
                    </span>
                    <button
                      onClick={nextQuestion}
                      className="rounded-lg px-5 py-2 text-sm font-medium transition-colors text-white"
                      style={{ background: '#6b7838' }}
                    >
                      {quizIdx + 1 < QUIZ_QUESTIONS.length ? 'Next →' : 'Results →'}
                    </button>
                  </div>
                )}

                {/* Score tracker */}
                <div className="flex gap-1.5 mt-5 justify-center">
                  {QUIZ_QUESTIONS.slice(0, quizIdx).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'rgba(34,197,94,0.6)' }} />
                  ))}
                  {quizIdx < QUIZ_QUESTIONS.length && (
                    <div className="w-2 h-2 rounded-full" style={{ background: '#6b7838', outline: '2px solid rgba(107,120,56,0.35)', outlineOffset: '1px' }} />
                  )}
                  {QUIZ_QUESTIONS.slice(quizIdx + 1).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'rgba(26,37,64,0.20)' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
