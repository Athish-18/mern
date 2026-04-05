export const aiSearch = async (req, res) => {
  try {
    const { query } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query is required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res
        .status(500)
        .json({ message: 'GROQ_API_KEY is not configured on the server.' })
    }

    console.log('[AI Search] Query:', query)

    let filters = {
      searchTerm: '',
      minPrice: null,
      maxPrice: null,
      type: 'all',
      parking: false,
      furnished: false,
      offer: false,
      bedrooms: null,
      bathrooms: null,
    }

    try {
      const groqRes = await fetch(
        `https://api.groq.com/openai/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are a real-estate search assistant. Convert the user query into search filters.

Return ONLY valid JSON in this exact shape:
{
  "searchTerm": "",
  "minPrice": null,
  "maxPrice": null,
  "type": "all",
  "parking": false,
  "furnished": false,
  "offer": false,
  "bedrooms": null,
  "bathrooms": null
}

Rules:
- "searchTerm": Extract ONLY the core location, neighborhood, or city name (e.g., "Whitefield", "BTM", "Electronic City"). Do NOT include descriptive adjectives like "beautiful", "furnished", or "luxury" in this field, as it breaks the exact text search. Leave as empty string "" if no specific location is mentioned.
- "minPrice" / "maxPrice": Numeric ranges. "Under 30k" -> maxPrice 30000. "Between 10k and 20k" -> minPrice 10000, maxPrice 20000.
- "type": "rent" | "sale" | "all". Infer logically (e.g. "apartment for rent" -> rent, "buy a home" -> sale). Default "all".
- "parking": true if explicitly mentioned.
- "furnished": true if mentioned.
- "offer": true if user asks for "discount" or "offer".
- "bedrooms": Extract exact number if mentioned (e.g. "2BHK" -> 2, "3 bedrooms" -> 3).
- "bathrooms": Extract exact number if mentioned.`,
              },
              {
                role: 'user',
                content: `User query: "${query}"`,
              },
            ],
          }),
        },
      )

      const groqData = await groqRes.json()
      console.log('[AI Search] Groq status:', groqRes.status)

      if (!groqRes.ok) {
        throw new Error(groqData?.error?.message || 'Groq API Error')
      }

      const rawText = groqData.choices?.[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(rawText)
      filters = { ...filters, ...parsed }
      console.log('[AI Search] Parsed via AI (Groq):', filters)
    } catch (apiError) {
      console.warn(
        '[AI Search] Groq failed. Using Local Fallback!',
        apiError.message,
      )

      // --- LOCAL FALLBACK PARSER ---
      const lowerQuery = query.toLowerCase()
      if (lowerQuery.includes('rent') || lowerQuery.includes('month')) filters.type = 'rent'
      if (lowerQuery.includes('sale') || lowerQuery.includes('buy')) filters.type = 'sale'
      if (lowerQuery.includes('parking')) filters.parking = true
      if (lowerQuery.includes('furnished')) filters.furnished = true
      if (lowerQuery.includes('offer') || lowerQuery.includes('discount')) filters.offer = true

      const priceMatch = lowerQuery.match(/(?:under|below|<)\s*(\d+)(k)?/i)
      if (priceMatch) filters.maxPrice = parseInt(priceMatch[1]) * (priceMatch[2] ? 1000 : 1)

      const bedMatch = lowerQuery.match(/(\d+)\s*(?:bhk|bed|bedroom)/i)
      if (bedMatch) filters.bedrooms = parseInt(bedMatch[1])

      const locations = ['btm', 'koramangala', 'hsr', 'marathahalli', 'whitefield', 'indiranagar', 'electronic city', 'sarjapur']
      const foundLoc = locations.find((loc) => lowerQuery.includes(loc))
      if (foundLoc) filters.searchTerm = foundLoc
      
      console.log('[AI Search] Parsed via Local Fallback:', filters)
    }

    // ── STEP 3: Build query params for the existing /api/listing/get endpoint ─
    const params = new URLSearchParams()
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm)
    if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice))
    if (filters.type && filters.type !== 'all') params.set('type', filters.type)
    if (filters.parking === true) params.set('parking', 'true')
    if (filters.furnished === true) params.set('furnished', 'true')
    if (filters.offer === true) params.set('offer', 'true')
    if (filters.bedrooms != null) params.set('bedrooms', String(filters.bedrooms))
    if (filters.bathrooms != null) params.set('bathrooms', String(filters.bathrooms))
    params.set('limit', '9')

    // ── STEP 4: Query the existing listing search endpoint ───────────────────
    const port = process.env.PORT || 3000
    const listingRes = await fetch(
      `http://localhost:${port}/api/listing/get?${params.toString()}`,
    )
    const listings = await listingRes.json()
    console.log('[AI Search] Found listings:', listings.length)

    return res.status(200).json({ listings, filters })
  } catch (err) {
    console.error('[AI Search] Unexpected error:', err)
    res.status(500).json({ message: 'AI search failed', error: err.message })
  }
}
