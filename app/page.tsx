'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

async function getIPHash(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    const hash = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(data.ip)
    )
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    const fallback = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const hash = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(fallback)
    )
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

export default function Home() {
  const [voted, setVoted] = useState(false)
  const [results, setResults] = useState({ impeach: 0, ipagtanggol: 0 })
  const [total, setTotal] = useState(0)
  const [voting, setVoting] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchResults() {
    const { count: impeachCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('choice', 'impeach')

    const { count: ipagtanggolCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('choice', 'ipagtanggol')

    const imp = impeachCount ?? 0
    const sav = ipagtanggolCount ?? 0

    setResults({ impeach: imp, ipagtanggol: sav })
    setTotal(imp + sav)
  }

  async function checkIfVoted() {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sara_voted='))

    if (cookie) {
      setVoted(true)
      setMessage('Nakaboto ka na! Salamat sa iyong partisipasyon.')
      await fetchResults()
      setLoading(false)
      return
    }

    try {
      const ipHash = await getIPHash()
      const { data: existingVoter } = await supabase
        .from('voters')
        .select('id')
        .eq('ip_hash', ipHash)
        .maybeSingle()

      if (existingVoter) {
        setVoted(true)
        setMessage('Nakaboto ka na! Salamat sa iyong partisipasyon.')
        await fetchResults()
      }
    } catch {
      // ignore
    }

    setLoading(false)
  }

  useEffect(() => {
    checkIfVoted()
    fetchResults()
  }, [])

  async function handleVote(selectedChoice: string) {
    console.log('voting for:', selectedChoice)
    setVoting(true)
    try {
      const ipHash = await getIPHash()
      console.log('ip hash:', ipHash)

      const { data: existingVoter } = await supabase
        .from('voters')
        .select('id')
        .eq('ip_hash', ipHash)
        .maybeSingle()

      console.log('existing voter:', existingVoter)

      if (existingVoter) {
        setMessage('Nakaboto ka na! Salamat sa iyong partisipasyon.')
        setVoted(true)
        await fetchResults()
        setVoting(false)
        return
      }

      await supabase.from('voters').insert({ ip_hash: ipHash })
      await supabase.from('votes').insert({ choice: selectedChoice, ip_hash: ipHash })

      console.log('vote inserted!')

      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      document.cookie = `sara_voted=${selectedChoice}; expires=${expires.toUTCString()}; path=/`

      setVoted(true)
      setMessage('Salamat sa iyong boto!')
      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchResults()
    } catch (err) {
      console.log('catch error:', err)
      setMessage('May error. Subukan muli.')
    }
    setVoting(false)
  }

  const impeachPct = total > 0 ? Math.round((results.impeach / total) * 100) : 0
  const ipagtanggolPct = total > 0 ? Math.round((results.ipagtanggol / total) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <p>Naglo-load...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', border: '0.5px solid #ddd' }}>

        {/* Top bar */}
        <div style={{ background: '#c0392b', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#fff', color: '#c0392b', fontSize: '10px', fontWeight: '700', padding: '2px 6px', letterSpacing: '1px' }}>LIVE</span>
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>BALITA NGAYON — IMPEACHMENT TRIAL</span>
        </div>

        {/* Ticker */}
        <div style={{ background: '#1a1a1a', color: '#fff', fontSize: '11px', padding: '4px 12px' }}>
          BREAKING: Ipinagpapatuloy ang impeachment trial ni Sara Duterte sa Senado
        </div>

        {/* Video */}
        <video
          src="https://upload.wikimedia.org/wikipedia/commons/c/c2/Vice_President_Sara_Duterte_speech_on_first_anniversary_of_the_arrest_of_former_President_Rodrigo_Duterte.webm"
          controls
          playsInline
          style={{ width: '100%', height: '200px', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />

        {/* Body */}
        <div style={{ padding: '14px' }}>
          <span style={{ background: '#c0392b', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', letterSpacing: '1px', display: 'inline-block', marginBottom: '8px' }}>IMPEACHMENT</span>

          <div style={{ fontSize: '20px', fontWeight: '900', color: '#1a1a1a', lineHeight: 1.2, marginBottom: '6px' }}>
            Dapat Bang I-Impeach si Sara Duterte?
          </div>

          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
            {new Date().toLocaleDateString('fil-PH', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;|&nbsp; Opinyon ng Bayan
          </div>

          <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6, marginBottom: '10px', borderLeft: '3px solid #c0392b', paddingLeft: '8px' }}>
            Si Bise Presidente Sara Duterte ay nakaharap sa impeachment trial dahil sa mga alegasyon ng maling paggamit ng pondo ng gobyerno, pagbabanta sa buhay ng mga opisyal, at paglabag sa Konstitusyon. Kasalukuyang dinidinig ng Senado bilang Impeachment Court.
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid #ddd', margin: '10px 0' }} />

          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: '10px' }}>
            Ano ang iyong opinyon bilang isang Pilipino?
          </div>

          {/* Show buttons if not voted, show results if voted */}
          {!voted ? (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => handleVote('impeach')}
                disabled={voting}
                style={{
                  flex: 1, padding: '12px 8px', border: 'none',
                  background: '#c0392b', color: '#fff',
                  fontSize: '13px', fontWeight: '700',
                  cursor: voting ? 'not-allowed' : 'pointer',
                  opacity: voting ? 0.6 : 1,
                  transition: 'all 0.3s'
                }}
              >
                {voting ? 'Naglo-load...' : 'IPATUPAD ANG IMPEACH'}
              </button>
              <button
                onClick={() => handleVote('ipagtanggol')}
                disabled={voting}
                style={{
                  flex: 1, padding: '12px 8px', border: 'none',
                  background: '#1a6e2e', color: '#fff',
                  fontSize: '13px', fontWeight: '700',
                  cursor: voting ? 'not-allowed' : 'pointer',
                  opacity: voting ? 0.6 : 1,
                  transition: 'all 0.3s'
                }}
              >
                {voting ? 'Naglo-load...' : 'IPAGTANGGOL SI SARA'}
              </button>
            </div>
          ) : (
            <div>
              {/* Already voted message */}
              {message && (
                <div style={{
                  fontSize: '13px', fontWeight: '700',
                  color: '#c0392b', textAlign: 'center',
                  marginBottom: '12px', padding: '8px',
                  border: '1px solid #c0392b',
                  background: '#fff5f5'
                }}>
                  ✅ {message}
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '3px' }}>
                  <span>I-Impeach</span>
                  <span>{results.impeach.toLocaleString()} boto ({impeachPct}%)</span>
                </div>
                <div style={{ height: '8px', background: '#eee' }}>
                  <div style={{ width: `${impeachPct}%`, height: '100%', background: '#c0392b', transition: 'width 0.5s' }} />
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginBottom: '3px' }}>
                  <span>Ipagtanggol</span>
                  <span>{results.ipagtanggol.toLocaleString()} boto ({ipagtanggolPct}%)</span>
                </div>
                <div style={{ height: '8px', background: '#eee' }}>
                  <div style={{ width: `${ipagtanggolPct}%`, height: '100%', background: '#1a6e2e', transition: 'width 0.5s' }} />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '6px' }}>
                Kabuuang Boto: <strong>{total.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#1a1a1a', color: '#aaa', fontSize: '10px', padding: '6px 12px', textAlign: 'center' }}>
          Para sa layuning pang-opinyon lamang. Hindi ito opisyal na boto ng pamahalaan.
        </div>

      </div>
    </div>
  )
}