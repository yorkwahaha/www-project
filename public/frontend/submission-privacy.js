export function getPublicResultPath(pollId) {
  return `/results/${encodeURIComponent(pollId)}`;
}

export function createSubmissionPrivacyController({
  fetchImpl = globalThis.fetch,
  windowObject = globalThis.window,
  resetSubmissionUi = () => {},
  navigate = (path) => windowObject.location.assign(path),
} = {}) {
  let selectedOptionId = null;
  let requestBody = null;
  let serializedRequestBody = null;
  let submissionState = 'idle';

  function clearRuntimeMemory() {
    selectedOptionId = null;
    requestBody = null;
    serializedRequestBody = null;
    submissionState = 'idle';
    resetSubmissionUi();
  }

  function selectOption(optionId) {
    selectedOptionId = optionId;
    submissionState = 'selected';
  }

  async function submit(endpoint, pollId, userId) {
    if (!selectedOptionId) {
      throw new Error('Select an option before submitting');
    }

    requestBody = { option_id: selectedOptionId };
    serializedRequestBody = JSON.stringify(requestBody);
    submissionState = 'submitting';
    let shouldNavigateToResults = false;

    try {
      const response = await fetchImpl(`/polls/${encodeURIComponent(pollId)}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: serializedRequestBody,
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      shouldNavigateToResults = endpoint === 'vote';
      return response;
    } finally {
      clearRuntimeMemory();
      if (shouldNavigateToResults) {
        navigate(getPublicResultPath(pollId));
      }
    }
  }

  windowObject.addEventListener('pagehide', clearRuntimeMemory);
  windowObject.addEventListener('pageshow', (event) => {
    if (event.persisted === true) {
      clearRuntimeMemory();
    }
  });

  return {
    selectOption,
    submitOfficialVote: (pollId, userId) => submit('vote', pollId, userId),
    submitReferenceAnswer: (pollId, userId) =>
      submit('reference-answer', pollId, userId),
    clearRuntimeMemory,
    hasSensitiveRuntimeState: () =>
      selectedOptionId !== null ||
      requestBody !== null ||
      serializedRequestBody !== null,
    getSubmissionState: () => submissionState,
  };
}
