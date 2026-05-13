async function generateBrief() {
  const keyword  = document.getElementById('keyword').value.trim();
  const industry = document.getElementById('industry').value.trim();
  const goal     = document.getElementById('goal').value;
  const type     = document.getElementById('type').value;
  const apiKey   = document.getElementById('apikey').value.trim();

  if (!keyword || !industry || !apiKey) {
    alert('Please fill in keyword, industry, and your API key.');
    return;
  }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('loading').textContent = '⟳ Researching keyword and competitors...';
  document.getElementById('output').classList.add('hidden');
  document.getElementById('generate').disabled = true;

  const prompt = `You are an expert SEO strategist and content planner.

Search the web for current information about this keyword: "${keyword}"

Look for:
- What the top ranking pages cover for this keyword
- What questions people are asking about this topic
- What search intent looks like for this keyword
- Who is currently ranking and what angles they use
- Related keywords and topics

Then use everything you find to create a detailed SEO content brief.

Brief details:
- Target Keyword: ${keyword}
- Industry/Niche: ${industry}
- Content Goal: ${goal}
- Content Type: ${type}

You MUST return your response using EXACTLY these section headers in all caps followed by a colon:

RESEARCH SUMMARY:
[2-3 sentences on what you found about this keyword and competitive landscape]

SEARCH INTENT:
[One paragraph describing exactly what the searcher wants when they type this keyword]

TARGET AUDIENCE:
[2-3 sentences describing who is searching this keyword, their pain points and goals]

RECOMMENDED TITLE / H1:
[One compelling title that includes the target keyword naturally]

META DESCRIPTION:
[One meta description under 160 characters that includes the keyword and a clear value proposition]

H2 STRUCTURE:
[List 5-6 H2 subheadings with a one sentence note on what each section should cover]

CONTENT ANGLE:
[2-3 sentences describing what unique angle this piece should take to stand out from competitors]

INTERNAL LINK SUGGESTIONS:
[3-4 suggestions for related content topics this piece could link to]

ESTIMATED WORD COUNT:
[Recommended word count range based on search intent and competitor analysis with brief reasoning]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    console.log('RAW API RESPONSE:', data);

    if (data.error) {
      alert('API Error: ' + data.error.message);
      return;
    }

    const text = data.content
      .map(block => block.type === 'text' ? block.text : '')
      .filter(Boolean)
      .join('\n');

    console.log('FULL RESPONSE TEXT:', text);

    if (!text) {
      alert('No text response received. Check console for details.');
      return;
    }

    const extract = (label, nextLabel) => {
      const upperText = text.toUpperCase();
      const upperLabel = label.toUpperCase();
      const start = upperText.indexOf(upperLabel);
      if (start === -1) return '(not found)';
      const content = text.slice(start + label.length).replace(/^[\s:]+/, '');
      if (!nextLabel) return content.trim();
      const upperContent = content.toUpperCase();
      const end = upperContent.indexOf(nextLabel.toUpperCase());
      return content.slice(0, end === -1 ? content.length : end).trim();
    };

    document.getElementById('research').textContent   = extract('RESEARCH SUMMARY:', 'SEARCH INTENT:');
    document.getElementById('intent').textContent     = extract('SEARCH INTENT:', 'TARGET AUDIENCE:');
    document.getElementById('audience').textContent   = extract('TARGET AUDIENCE:', 'RECOMMENDED TITLE / H1:');
    document.getElementById('title').textContent      = extract('RECOMMENDED TITLE / H1:', 'META DESCRIPTION:');
    document.getElementById('meta').textContent       = extract('META DESCRIPTION:', 'H2 STRUCTURE:');
    document.getElementById('h2s').textContent        = extract('H2 STRUCTURE:', 'CONTENT ANGLE:');
    document.getElementById('angle').textContent      = extract('CONTENT ANGLE:', 'INTERNAL LINK SUGGESTIONS:');
    document.getElementById('links').textContent      = extract('INTERNAL LINK SUGGESTIONS:', 'ESTIMATED WORD COUNT:');
    document.getElementById('wordcount').textContent  = extract('ESTIMATED WORD COUNT:', null);

    document.getElementById('output').classList.remove('hidden');

  } catch (err) {
    alert('Error: ' + err.message);
    console.error(err);
  } finally {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('generate').disabled = false;
  }
}

function copyAll() {
  const fields = {
    'RESEARCH SUMMARY':        document.getElementById('research').textContent,
    'SEARCH INTENT':           document.getElementById('intent').textContent,
    'TARGET AUDIENCE':         document.getElementById('audience').textContent,
    'RECOMMENDED TITLE / H1':  document.getElementById('title').textContent,
    'META DESCRIPTION':        document.getElementById('meta').textContent,
    'H2 STRUCTURE':            document.getElementById('h2s').textContent,
    'CONTENT ANGLE':           document.getElementById('angle').textContent,
    'INTERNAL LINK SUGGESTIONS': document.getElementById('links').textContent,
    'ESTIMATED WORD COUNT':    document.getElementById('wordcount').textContent,
  };

  const full = Object.entries(fields)
    .map(([label, value]) => `${label}:\n${value}`)
    .join('\n\n');

  navigator.clipboard.writeText(full).then(() => alert('Brief copied to clipboard!'));
}