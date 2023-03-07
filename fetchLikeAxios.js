class ErrorLikeAxios extends Error {
  constructor(message, response) {
    super(message);
    this.response = {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      statusText: response.statusText,
      url: response.url,
    };
  }
}

async function fetchLikeAxios(path, options = {}) {
  const defaultOptions = {
    method: "GET",
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const response = await fetch(path, mergedOptions);

  if (!response.ok) {
    // native fetch does not throw Errors for any HTTP statuses (4xx and 5xx) so here we mimic axios
    // by throwing an error for anything that is not a 2xx status, and adding more data to the Error
    const errorMessage = await response.text().catch(console.error);
    const msg = errorMessage || `${response.status} ${response.statusText}`;
    throw new ErrorLikeAxios(msg, response);
  }

  return response;
}

module.exports = {
  fetchLikeAxios,
};
