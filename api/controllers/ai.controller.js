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
       return parts[parts.length - 1].trim()
    }))].filter(Boolean).join(', ')

    const systemPrompt = {
      role: 'system',
      content: `You are an expert real-estate advisor. Based on the user's situation, recommend a suitable locality and property types.
      
IMPORTANT: Try to recommend one of these available database locations if applicable: ${availableLocations}
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

    let listings = await Listing.find(dbQuery).limit(4)

    // Helper to incrementally fill the listings array up to 4
    const fillListings = async (queryToRelax, limit) => {
      if (listings.length >= limit) return
      const ids = listings.map(l => l._id)
      const relaxedQuery = { ...queryToRelax, _id: { $nin: ids } }
      const more = await Listing.find(relaxedQuery).limit(limit - listings.length)
      listings = [...listings, ...more]
    }

    // Fallback 1: Broaden location search to just the first word
    if (filters.searchTerm) {
      const firstWord = filters.searchTerm.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      if (firstWord.length > 2) {
        dbQuery.address = { $regex: firstWord, $options: 'i' }
        await fillListings(dbQuery, 4)
      }
    }

    // Fallback 2: Drop price constraints
    if (filters.minPrice || filters.maxPrice) {
      delete dbQuery.regularPrice
      await fillListings(dbQuery, 4)
    }
    
    // Fallback 3: Drop bedrooms and furnished constraints
    delete dbQuery.bedrooms
    delete dbQuery.furnished
    await fillListings(dbQuery, 4)

    // Fallback 4: Drop property type (rent vs sale)
    delete dbQuery.type
    await fillListings(dbQuery, 4)

    return res.status(200).json({
      recommendedArea: parsed.recommendedArea,
      reasoning: parsed.reasoning,
      suggestedPropertyTypes: parsed.suggestedPropertyTypes,
      listings
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
