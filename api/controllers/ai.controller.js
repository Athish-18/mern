import Listing from '../models/listing.model.js'

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
- Accumulate and maintain constraints! If the user previously asked for 'BTM' and now says 'make it under 20k', your searchFilters must include BOTH 'BTM' and maxPrice 20000.
- If the user asks to remove or clear a filter (e.g. "remove budget", "any price", "not furnished"), explicitly revert that field to its default value (null, false, or '').
- Ensure your conversational 'reply' acknowledges what filters you added, changed, or removed (e.g., "I updated the search to show furnished properties only.").
- Do NOT include adjectives like 'beautiful' or 'cheap' in the searchTerm.
- Intelligent Budget Inference: If the user provides a budget (maxPrice or minPrice) below 200000 (2 lakh) without explicitly stating the property type, you MUST default 'type' to "rent". If the budget is 200000 or above, default 'type' to "sale".
- Explicit user intent (e.g., "buy", "sale", "purchase", "rent") ALWAYS overrides the budget inference.`,
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
      
      let explicitType = false
      if (fullHistoryStr.includes('rent') || fullHistoryStr.includes('month') || fullHistoryStr.includes('lease')) {
         aiDecision.searchFilters.type = 'rent'
         explicitType = true
      }
      if (fullHistoryStr.includes('sale') || fullHistoryStr.includes('buy') || fullHistoryStr.includes('purchase') || fullHistoryStr.includes('investment') || fullHistoryStr.includes('ownership')) {
         aiDecision.searchFilters.type = 'sale'
         explicitType = true
      }
      
      if (fullHistoryStr.includes('parking')) aiDecision.searchFilters.parking = true
      if (fullHistoryStr.includes('furnished')) aiDecision.searchFilters.furnished = true
      if (fullHistoryStr.includes('offer') || fullHistoryStr.includes('discount')) aiDecision.searchFilters.offer = true

      // Regex applied to the latest message logic mostly, or just last numbers
      const priceMatch = fullHistoryStr.match(/(?:under|below|<|within)\s*(\d+)\s*(k|l|lakh|lakhs|cr|crore|crores)?/gi)
      if (priceMatch) {
         const lastMatch = priceMatch[priceMatch.length - 1]
         const nums = lastMatch.match(/(?:under|below|<|within)\s*(\d+)\s*(k|l|lakh|lakhs|cr|crore|crores)?/i)
         if (nums) {
             let multiplier = 1
             const suffix = (nums[2] || '').toLowerCase()
             if (suffix.startsWith('k')) multiplier = 1000
             if (suffix.startsWith('l')) multiplier = 100000
             if (suffix.startsWith('c')) multiplier = 10000000
             aiDecision.searchFilters.maxPrice = parseInt(nums[1]) * multiplier
         }
      }
      
      // Apply budget inference if type was not explicitly stated
      if (!explicitType && aiDecision.searchFilters.maxPrice !== null) {
          if (aiDecision.searchFilters.maxPrice < 200000) {
              aiDecision.searchFilters.type = 'rent'
          } else {
              aiDecision.searchFilters.type = 'sale'
          }
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

    let explanation = []
    if (aiDecision.isSearch && aiDecision.searchFilters) {
      const f = aiDecision.searchFilters
      if (f.searchTerm) explanation.push(`Location: ${f.searchTerm}`)
      if (f.type && f.type !== 'all') explanation.push(f.type === 'rent' ? 'For Rent' : 'For Sale')
      if (f.bedrooms) explanation.push(`${f.bedrooms} Bedrooms`)
      if (f.bathrooms) explanation.push(`${f.bathrooms} Bathrooms`)
      if (f.furnished) explanation.push('Furnished properties')
      if (f.parking) explanation.push('Parking available')
      if (f.offer) explanation.push('Special Offers')
      
      if (f.minPrice && f.maxPrice) {
        explanation.push(`Budget: ₹${f.minPrice.toLocaleString('en-IN')} - ₹${f.maxPrice.toLocaleString('en-IN')}`)
      } else if (f.minPrice) {
        explanation.push(`Budget above ₹${f.minPrice.toLocaleString('en-IN')}`)
      } else if (f.maxPrice) {
        explanation.push(`Budget under ₹${f.maxPrice.toLocaleString('en-IN')}`)
      }
    }

    return res.status(200).json({
      reply: aiDecision.reply,
      isSearch: aiDecision.isSearch,
      listings: aiDecision.isSearch ? listings : null,
      filters: aiDecision.searchFilters,
      explanation: aiDecision.isSearch ? explanation : null,
    })
  } catch (err) {
    console.error('[AI Chat] Unexpected error:', err)
    res.status(500).json({ message: 'AI chat failed', error: err.message })
  }
}

export const aiInsight = async (req, res) => {
  try {
    const propertyData = req.body

    if (!propertyData || !propertyData.name) {
      return res.status(400).json({ message: 'Property details are required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY is not configured on the server.' })
    }

    const { name, address, price, type, bedrooms, bathrooms, furnished, parking } = propertyData
    
    let descriptionStr = `Name: ${name}, Address: ${address}, Price: ₹${price}, Type: ${type}`
    if (bedrooms) descriptionStr += `, Bedrooms: ${bedrooms}`
    if (bathrooms) descriptionStr += `, Bathrooms: ${bathrooms}`
    descriptionStr += `, Furnished: ${furnished ? 'Yes' : 'No'}, Parking: ${parking ? 'Yes' : 'No'}`

    const systemPrompt = {
      role: 'system',
      content: `You are an expert real-estate agent. Provide a single, engaging sentence of insight about the following property, highlighting its target demographic or key benefits based on its features.

Your ONLY allowed output is a raw JSON object (no markdown, no quotes around it, just JSON).

JSON Schema:
{
  "insight": "Your single sentence insight."
}`
    }

    const userMessage = {
      role: 'user',
      content: `Property Details: ${descriptionStr}`
    }

    try {
      const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [systemPrompt, userMessage],
        }),
      })

      const groqData = await groqRes.json()
      
      if (!groqRes.ok) {
        throw new Error(groqData?.error?.message || 'Groq API Error')
      }

      const rawText = groqData.choices?.[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(rawText)
      
      return res.status(200).json({ insight: parsed.insight || 'This property offers a great blend of value and convenience.' })
    } catch (apiError) {
      console.warn('[AI Insight] Groq failed. Using generic fallback!', apiError.message)
      return res.status(200).json({ insight: 'A fantastic property offering excellent value in a prime location.' })
    }
  } catch (err) {
    console.error('[AI Insight] Unexpected error:', err)
    res.status(500).json({ message: 'AI insight failed', error: err.message })
  }
}

export const aiCompare = async (req, res) => {
  try {
    const { propertyA, propertyB } = req.body

    if (!propertyA || !propertyB) {
      return res.status(400).json({ message: 'Both properties are required for comparison' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY is not configured on the server.' })
    }

    const formatProp = (p) => `Name: ${p.name}, Price: ₹${p.offer ? p.discountPrice : p.regularPrice}, Location: ${p.address}, Type: ${p.type}, Beds: ${p.bedrooms}, Baths: ${p.bathrooms}, Furnished: ${p.furnished ? 'Yes' : 'No'}, Parking: ${p.parking ? 'Yes' : 'No'}`

    const systemPrompt = {
      role: 'system',
      content: `You are an expert real-estate advisor. Analyze and compare the following two properties.
      
Your ONLY allowed output is a raw JSON object (no markdown, no quotes around it, just JSON).

JSON Schema:
{
  "propertyAStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "propertyBStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "recommendation": {
    "chooseAIf": ["Reason 1", "Reason 2"],
    "chooseBIf": ["Reason 1", "Reason 2"]
  }
}

Keep strengths and reasons concise (max 1 sentence each). Base your comparison on price, location, size, and amenities.`
    }

    const userMessage = {
      role: 'user',
      content: `Property A: ${formatProp(propertyA)}\n\nProperty B: ${formatProp(propertyB)}`
    }

    try {
      const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [systemPrompt, userMessage],
        }),
      })

      const groqData = await groqRes.json()
      
      if (!groqRes.ok) {
        throw new Error(groqData?.error?.message || 'Groq API Error')
      }

      const rawText = groqData.choices?.[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(rawText)
      
      return res.status(200).json(parsed)
    } catch (apiError) {
      console.warn('[AI Compare] Groq failed. Using generic fallback!', apiError.message)
      return res.status(200).json({
        propertyAStrengths: ['Great value for the price', 'Excellent layout'],
        propertyBStrengths: ['Premium location', 'Better amenities'],
        recommendation: {
          chooseAIf: ['Budget is a priority', 'You prefer this specific layout'],
          chooseBIf: ['Location is your main priority', 'You want premium amenities']
        }
      })
    }
  } catch (err) {
    console.error('[AI Compare] Unexpected error:', err)
    res.status(500).json({ message: 'AI comparison failed', error: err.message })
  }
}

export const aiAdvisor = async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ message: 'A query describing your situation is required' })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY is not configured on the server.' })
    }

    // Fetch available locations to ground the AI
    const rawAddresses = await Listing.distinct('address')
    // Extract unique main areas (usually the last part of a comma separated address, or the whole address if no commas)
    const availableLocations = [...new Set(rawAddresses.map(a => {
       const parts = a.split(',')
       // Get the first part of the address (the locality) instead of the last part (the city)
       return parts[0].trim()
    }))].filter(Boolean).join(', ')

    const systemPrompt = {
      role: 'system',
      content: `You are an expert real-estate advisor. Based on the user's situation, recommend a suitable locality and property types.
      
CRITICAL RULE: You MUST ONLY recommend a locality from this exact list of available areas: [${availableLocations}].
DO NOT recommend any locality that is not in this list under any circumstances. If the user's preferred area is not in the list, you must recommend the closest geographical match or best alternative FROM THE LIST.
DO NOT invent hyper-specific sub-localities (e.g., avoid 'Katha, Sarjapur Road', just use 'Sarjapur').

Your ONLY allowed output is a raw JSON object (no markdown, no quotes around it, just JSON).

JSON Schema:
{
  "recommendedArea": "The specific neighborhood/area (e.g., 'Sarjapur')",
  "reasoning": [
    "Reason 1",
    "Reason 2"
  ],
  "suggestedPropertyTypes": ["2BHK Apartments", "Furnished Homes"],
  "filters": {
    "searchTerm": "The exact name of the broad locality to search in DB (e.g., 'Sarjapur', 'Whitefield').",
    "type": "rent" | "sale" | "all",
    "minPrice": number or null,
    "maxPrice": number or null,
    "bedrooms": number or null,
    "furnished": boolean or null
  }
}

Keep reasoning concise. CRITICAL: If the user mentions 'sale', 'buy', or 'investment', ensure type is 'sale' or 'all'.`
    }

    const userMessage = {
      role: 'user',
      content: query
    }

    // Determine preference-preservation sorting and keyword regex
    const userQueryStr = query.toLowerCase();
    let tierSort = null;
    let tierKeywordRegex = null;

    if (userQueryStr.includes('luxury') || userQueryStr.includes('premium') || userQueryStr.includes('villa') || userQueryStr.includes('high-end') || userQueryStr.includes('expensive')) {
      tierSort = { regularPrice: -1 };
      tierKeywordRegex = 'luxury|premium|villa|high-end|exclusive';
    } else if (userQueryStr.includes('affordable') || userQueryStr.includes('budget') || userQueryStr.includes('cheap') || userQueryStr.includes('low cost') || userQueryStr.includes('lowest price')) {
      tierSort = { regularPrice: 1 };
      tierKeywordRegex = 'affordable|budget|cheap|deal|value';
    } else if (userQueryStr.includes('new') || userQueryStr.includes('modern')) {
      tierSort = { createdAt: -1 };
      tierKeywordRegex = 'new|modern|recently|latest';
    }

    let parsed
    try {
      const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [systemPrompt, userMessage],
        }),
      })

      const groqData = await groqRes.json()
      
      if (!groqRes.ok) {
        throw new Error(groqData?.error?.message || 'Groq API Error')
      }

      const rawText = groqData.choices?.[0]?.message?.content ?? '{}'
      parsed = JSON.parse(rawText)
      
    } catch (apiError) {
      console.warn('[AI Advisor] Groq failed. Using generic fallback!', apiError.message)
      parsed = {
        recommendedArea: "Bengaluru",
        reasoning: ["Great IT hub", "Multiple options in budget"],
        suggestedPropertyTypes: ["Apartments"],
        filters: {
          searchTerm: "",
          type: "all"
        }
      }
    }

    // Now query MongoDB using the filters extracted by the AI
    let dbQuery = {}
    const filters = parsed.filters || {}
    
    console.log('\n[AI Advisor] AI Extracted Filters:', filters);
    console.log('[AI Advisor] Recommended Locality:', parsed.recommendedArea);

    if (filters.searchTerm) {
      dbQuery.address = { $regex: filters.searchTerm, $options: 'i' }
    }
    if (filters.type && filters.type !== 'all') {
      dbQuery.type = filters.type
    }
    if (filters.minPrice || filters.maxPrice) {
      dbQuery.regularPrice = {}
      if (filters.minPrice) dbQuery.regularPrice.$gte = filters.minPrice
      if (filters.maxPrice) dbQuery.regularPrice.$lte = filters.maxPrice
    }
    if (filters.bedrooms) {
      dbQuery.bedrooms = filters.bedrooms
    }
    if (filters.furnished !== null && filters.furnished !== undefined) {
      dbQuery.furnished = filters.furnished
    }

    let listings = []
    let isFallbackLocation = false

    // Helper to incrementally fill the listings array up to 4
    const fillListings = async (queryToRun, limit) => {
      if (listings.length >= limit) return false
      
      const ids = listings.map(l => l._id)
      const baseQuery = { ...queryToRun, _id: { $nin: ids } }
      
      let more = [];
      
      // Attempt to prefer keyword matches first
      if (tierKeywordRegex) {
        const keywordQuery = {
          ...baseQuery,
          $or: [
            { name: { $regex: tierKeywordRegex, $options: 'i' } },
            { description: { $regex: tierKeywordRegex, $options: 'i' } }
          ]
        };
        console.log(`[AI Advisor] Running Keyword-Preferred Query:`, JSON.stringify(keywordQuery));
        let builder = Listing.find(keywordQuery);
        if (tierSort) builder = builder.sort(tierSort);
        more = await builder.limit(limit - listings.length);
        console.log(`[AI Advisor] Keyword Query returned ${more.length} properties.`);
      }
      
      if (more.length < (limit - listings.length)) {
        const existingMoreIds = more.map(l => l._id);
        const remainderQuery = { ...baseQuery, _id: { $nin: [...ids, ...existingMoreIds] } };
        
        console.log(`[AI Advisor] Running Standard Query:`, JSON.stringify(remainderQuery));
        let builder = Listing.find(remainderQuery);
        if (tierSort) builder = builder.sort(tierSort);
        const remainder = await builder.limit(limit - listings.length - more.length);
        console.log(`[AI Advisor] Standard Query returned ${remainder.length} properties.`);
        
        more = [...more, ...remainder];
      }
      
      listings = [...listings, ...more]
      return true
    }
    
    // Base constrained query object
    const baseQuery = {}
    if (filters.type && filters.type !== 'all') baseQuery.type = filters.type
    if (filters.minPrice || filters.maxPrice) {
      baseQuery.regularPrice = {}
      if (filters.minPrice) baseQuery.regularPrice.$gte = filters.minPrice
      if (filters.maxPrice) baseQuery.regularPrice.$lte = filters.maxPrice
    }
    
    // Location constrained query object
    const locQuery = { ...baseQuery }
    if (filters.searchTerm) {
      locQuery.address = { $regex: filters.searchTerm, $options: 'i' }
    }
    
    // Rank 1: Exact Matches (Location + Intent + Budget + Beds + Furnished)
    const exactQuery = { ...locQuery }
    if (filters.bedrooms) exactQuery.bedrooms = filters.bedrooms
    if (filters.furnished !== null && filters.furnished !== undefined) exactQuery.furnished = filters.furnished
    console.log('[AI Advisor] Stage 1: Exact Matches');
    await fillListings(exactQuery, 4)
    
    // Rank 2: Near Matches - Relax Amenities (Location + Intent + Budget)
    if (listings.length < 4) {
       console.log('[AI Advisor] Stage 2: Near Matches (Relax Amenities)');
       await fillListings(locQuery, 4)
    }
    
    // Rank 3: Near Matches - Relax Budget (Location + Intent + Budget+20%)
    if (listings.length < 4) {
       console.log('[AI Advisor] Stage 3: Near Matches (Relax Budget +20%)');
       const relaxedLocQuery = { ...locQuery }
       if (filters.maxPrice) {
          relaxedLocQuery.regularPrice = { ...relaxedLocQuery.regularPrice, $lte: filters.maxPrice * 1.2 }
       }
       await fillListings(relaxedLocQuery, 4)
    }
    
    // Rank 4: Fallback - Drop Location (Any Location + Intent + Budget)
    if (listings.length < 4) {
       console.log('[AI Advisor] Stage 4: Fallback Location (Drop Location)');
       const beforeCount = listings.length;
       await fillListings(baseQuery, 4)
       if (listings.length > beforeCount) {
         isFallbackLocation = true; // We sourced listings from outside the recommended area
       }
    }
    
    // Rank 5: Last Resort - Relax Budget and Drop Location (Any Location + Intent + Budget+20%)
    if (listings.length < 4) {
       console.log('[AI Advisor] Stage 5: Last Resort (Drop Location, Relax Budget +20%)');
       const beforeCount = listings.length;
       const relaxedBaseQuery = { ...baseQuery }
       if (filters.maxPrice) {
          relaxedBaseQuery.regularPrice = { ...relaxedBaseQuery.regularPrice, $lte: filters.maxPrice * 1.2 }
       }
       await fillListings(relaxedBaseQuery, 4)
       if (listings.length > beforeCount) {
         isFallbackLocation = true;
       }
    }
    
    console.log(`[AI Advisor] Final Returned Properties: ${listings.length}\n`);

    return res.status(200).json({
      recommendedArea: parsed.recommendedArea,
      reasoning: parsed.reasoning,
      suggestedPropertyTypes: parsed.suggestedPropertyTypes,
      listings,
      isFallbackLocation
    })

  } catch (err) {
    console.error('[AI Advisor] Unexpected error:', err)
    res.status(500).json({ message: 'AI advisor failed', error: err.message })
  }
}

export const aiMarketSnapshot = async (req, res) => {
  try {
    const { listing } = req.body;
    if (!listing) return res.status(400).json({ message: 'Listing data is required' });

    // 1. Calculate Backend Metrics
    // Extract main locality from address
    const addressParts = listing.address.split(',');
    const locality = addressParts[addressParts.length - 1].trim();

    // Find similar properties in the database (same locality, type, and +/- 1 bedroom)
    const similarListings = await Listing.find({
      address: { $regex: locality, $options: 'i' },
      type: listing.type,
      bedrooms: { $gte: Math.max(1, listing.bedrooms - 1), $lte: listing.bedrooms + 1 },
      _id: { $ne: listing._id }
    }).limit(50);

    const listingPrice = listing.offer ? listing.discountPrice : listing.regularPrice;

    let localityAveragePrice = null;
    let pricePositionText = "N/A";
    let pricePositionPercentage = 0;
    
    if (similarListings.length > 0) {
      const sum = similarListings.reduce((acc, curr) => acc + (curr.offer ? curr.discountPrice : curr.regularPrice), 0);
      localityAveragePrice = Math.round(sum / similarListings.length);
      
      const diff = listingPrice - localityAveragePrice;
      pricePositionPercentage = Math.round((Math.abs(diff) / localityAveragePrice) * 100);
      
      if (diff > 0) {
        pricePositionText = `${pricePositionPercentage}% Above Average`;
      } else if (diff < 0) {
        pricePositionText = `${pricePositionPercentage}% Below Average`;
      } else {
        pricePositionText = "Exactly at Market Average";
      }
    } else {
       // Not enough DB data, provide generic placeholder based on listing price
       localityAveragePrice = listingPrice;
       pricePositionText = "Insufficient comparable data";
    }

    // 2. Query Groq for AI Assessment
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY is not configured.' });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are an expert real-estate market analyst. Analyze the provided property metrics and generate a concise market snapshot.
      
Your ONLY allowed output is a raw JSON object.

JSON Schema:
{
  "demandLevel": "High" | "Medium" | "Low",
  "rentalAppeal": "Strong" | "Moderate" | "Weak",
  "investmentPotential": "Excellent" | "Good" | "Fair" | "Poor",
  "recommendation": "One concise sentence summarizing the overall assessment of this property.",
  "summaryBullets": [
    "A concise point about the price positioning.",
    "A concise point about the demand/location.",
    "A concise point about rental/investment appeal.",
    "A concise point about the property type."
  ]
}

Keep bullet points very short and punchy.`
    };

    const userMessage = {
      role: 'user',
      content: JSON.stringify({
        propertyType: `${listing.bedrooms}BHK ${listing.furnished ? 'Furnished' : 'Unfurnished'} for ${listing.type}`,
        location: locality,
        listingPrice: listingPrice,
        localityAveragePrice: localityAveragePrice,
        pricePosition: pricePositionText,
        hasParking: listing.parking,
        isDiscounted: listing.offer
      })
    };

    let aiData;
    try {
      const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          messages: [systemPrompt, userMessage],
        }),
      });

      const rawData = await groqRes.json();
      if (!groqRes.ok) throw new Error(rawData?.error?.message || 'Groq API Error');
      
      aiData = JSON.parse(rawData.choices[0].message.content);
    } catch (apiError) {
      console.warn('[AI Market Snapshot] Groq failed. Using fallback!', apiError.message);
      aiData = {
        demandLevel: "Medium",
        rentalAppeal: "Moderate",
        investmentPotential: "Good",
        recommendation: "A solid property that aligns with general market trends.",
        summaryBullets: [
          `Priced at ₹${listingPrice.toLocaleString('en-IN')}.`,
          "Located in an established area.",
          "Standard rental appeal for this configuration.",
          "Good overall investment potential."
        ]
      };
    }

    // 3. Return Combined Payload
    return res.status(200).json({
      localityAveragePrice,
      listingPrice,
      pricePosition: pricePositionText,
      ...aiData
    });

  } catch (err) {
    console.error('[AI Market Snapshot] Unexpected error:', err);
    res.status(500).json({ message: 'AI Market Snapshot failed', error: err.message });
  }
}
