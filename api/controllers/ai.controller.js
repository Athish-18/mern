export const aiSearch = async (req, res) => {
  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'A conversational messages array is required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res
        .status(500)
        .json({ message: 'GROQ_API_KEY is not configured on the server.' })
    }

    const latestMessage = messages[messages.length - 1].content
    console.log('[AI Chat] Latest Query:', latestMessage)

    let aiDecision = {
      reply: 'Sorry, I ran into an issue.',
      isSearch: false,
      searchFilters: {
        searchTerm: '',
        minPrice: null,
        maxPrice: null,
        type: 'all',
        parking: false,
        furnished: false,
        offer: false,
        bedrooms: null,
        bathrooms: null,
      },
    }

    try {
      // ── Build Chat History for Groq ──
      const systemPrompt = {
        role: 'system',
        content: `You are a real-estate conversational search assistant. You must analyze the context of the conversation and determine whether the user is asking you to search for properties or refine a search.

Your ONLY allowed output is a raw JSON object (no markdown, no quotes around it, just JSON).

JSON Schema:
{
  "reply": "Your natural language conversational response giving them an answer or confirming you are fetching their results.",
  "isSearch": boolean (Set to true ONLY if you need to fetch/search listings based on the latest prompt and history. Set to false for general chat, greetings, or questions not requiring a DB search).
  "searchFilters": {
    "searchTerm": "Location/Neighborhood only (e.g. 'Whitefield'). Empty string if not mentioned.",
    "minPrice": number or null,
    "maxPrice": number or null,
    "type": "rent" | "sale" | "all",
    "parking": boolean,
    "furnished": boolean,
    "offer": boolean,
    "bedrooms": number or null,
    "bathrooms": number or null
  }
}

Rules for searchFilters (Only output if isSearch is true):
- Maintain previous constraints! If the user previously asked for 'BTM' and now says 'make it under 20k', your searchFilters must include BOTH 'BTM' and maxPrice 20000.
- Do NOT include adjectives like 'beautiful' or 'cheap' in the searchTerm.`,
      }

      // Map incoming messages to just role/content filtering out any extra data
      const groqMessages = [systemPrompt, ...messages.map((m) => ({ role: m.role, content: m.content }))]

      const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: groqMessages,
        }),
      })

      const groqData = await groqRes.json()
      console.log('[AI Chat] Groq status:', groqRes.status)

      if (!groqRes.ok) {
        throw new Error(groqData?.error?.message || 'Groq API Error')
      }

      const rawText = groqData.choices?.[0]?.message?.content ?? '{}'
      aiDecision = { ...aiDecision, ...JSON.parse(rawText) }

      console.log('[AI Chat] AI Decision:', {
        isSearch: aiDecision.isSearch,
        filters: aiDecision.searchFilters,
      })
    } catch (apiError) {
      console.warn('[AI Chat] Groq failed. Using Local Fallback!', apiError.message)

      // --- LOCAL FALLBACK PARSER ---
      aiDecision.reply = "I'm having trouble reaching the AI servers right now, but I've done my best to understand your request locally."
      aiDecision.isSearch = true
      
      // We'll analyze the whole conversation to construct the fallback filters
      const fullHistoryStr = messages.map((m) => m.content).join(' ').toLowerCase()
      
      if (fullHistoryStr.includes('rent') || fullHistoryStr.includes('month')) aiDecision.searchFilters.type = 'rent'
      if (fullHistoryStr.includes('sale') || fullHistoryStr.includes('buy')) aiDecision.searchFilters.type = 'sale'
      if (fullHistoryStr.includes('parking')) aiDecision.searchFilters.parking = true
      if (fullHistoryStr.includes('furnished')) aiDecision.searchFilters.furnished = true
      if (fullHistoryStr.includes('offer') || fullHistoryStr.includes('discount')) aiDecision.searchFilters.offer = true

      // Regex applied to the latest message logic mostly, or just last numbers
      const priceMatch = fullHistoryStr.match(/(?:under|below|<)\s*(\d+)(k)?/gi)
      if (priceMatch) {
         const lastMatch = priceMatch[priceMatch.length - 1]
         const nums = lastMatch.match(/(?:under|below|<)\s*(\d+)(k)?/i)
         if (nums) aiDecision.searchFilters.maxPrice = parseInt(nums[1]) * (nums[2] ? 1000 : 1)
      }

      const bedMatch = fullHistoryStr.match(/(\d+)\s*(?:bhk|bed|bedroom)/gi)
      if (bedMatch) {
         const lastMatch = bedMatch[bedMatch.length - 1]
         const nums = lastMatch.match(/(\d+)\s*(?:bhk|bed|bedroom)/i)
         if(nums) aiDecision.searchFilters.bedrooms = parseInt(nums[1])
      }

      const locations = ['btm', 'koramangala', 'hsr', 'marathahalli', 'whitefield', 'indiranagar', 'electronic city', 'sarjapur']
      const foundLoc = locations.find((loc) => fullHistoryStr.includes(loc))
      if (foundLoc) aiDecision.searchFilters.searchTerm = foundLoc
      
      console.log('[AI Chat] Parsed via Local Fallback:', aiDecision.searchFilters)
    }

    // ── STEP 3: Handle Search Execution ──────────────────────────────────────
    let listings = []
    if (aiDecision.isSearch && aiDecision.searchFilters) {
      const filters = aiDecision.searchFilters
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

      const port = process.env.PORT || 3000
      const listingRes = await fetch(`http://localhost:${port}/api/listing/get?${params.toString()}`)
      listings = await listingRes.json()
      console.log('[AI Chat] Search executed. Found listings:', listings.length)
      
      // Make the AI reply dynamic if it didn't generate a specific one
      if(aiDecision.reply === '') {
         aiDecision.reply = `I found ${listings.length} properties matching your criteria.`
      }
    }

    return res.status(200).json({
      reply: aiDecision.reply,
      isSearch: aiDecision.isSearch,
      listings: aiDecision.isSearch ? listings : null,
      filters: aiDecision.searchFilters,
    })
  } catch (err) {
    console.error('[AI Chat] Unexpected error:', err)
    res.status(500).json({ message: 'AI chat failed', error: err.message })
  }
}
