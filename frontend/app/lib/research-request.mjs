/** Shared request boundary: never turn transport failures into AI answers. */
export async function requestResearch(question, baseUrl, fetcher = fetch) {
  const trimmed = question.trim();
  if (trimmed.length < 3 || trimmed.length > 500) {
    throw new Error('Enter a question between 3 and 500 characters.');
  }
  let response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/$/, '')}/ai/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: trimmed }),
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error('Research timed out. Please try again.');
    }
    throw new Error('Cannot reach the AI service. Check that it is running and try again.');
  }
  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'Too many requests. Please wait a moment and try again.'
      : 'The AI service could not complete this request. Please try again.');
  }
  let data;
  try { data = await response.json(); } catch {
    throw new Error('The AI service returned an unreadable response. Please try again.');
  }
  if (!data || typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('The AI service returned no answer. Please try again.');
  }
  const label = data.mode === 'demo' ? 'Demo response — not evidence-backed'
    : data.status === 'insufficient_evidence' ? 'Insufficient evidence — source context is needed'
    : 'AI response — evidence has not been verified';
  return { answer: data.answer.trim(), label };
}
