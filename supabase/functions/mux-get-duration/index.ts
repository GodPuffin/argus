/**
 * Helper Edge Function to fetch Mux asset duration
 * Called by the SQL cron job to get live stream duration
 */

const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID')!
const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET')!

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  throw new Error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET')
}

interface MuxAssetResponse {
  data: {
    id: string
    duration?: number
    status: string
  }
}

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { asset_id } = await req.json()

    if (!asset_id) {
      return new Response(JSON.stringify({ error: 'asset_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Call Mux API
    const auth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
    const muxResponse = await fetch(
      `https://api.mux.com/video/v1/assets/${asset_id}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!muxResponse.ok) {
      console.error(`Mux API error: ${muxResponse.status} ${muxResponse.statusText}`)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Mux API' }),
        {
          status: muxResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const data: MuxAssetResponse = await muxResponse.json()

    return new Response(
      JSON.stringify({
        asset_id: data.data.id,
        duration: data.data.duration,
        status: data.data.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in mux-get-duration:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

