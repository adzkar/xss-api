function formatter(params) {
  const { payload, message } = params;
  return {
    payload,
    data: message,
  };
}

export { formatter };
