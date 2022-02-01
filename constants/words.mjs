const splitter = "Result: ";

const commonMessage = {
  failed: "failed",
  noPossibility: (params) => {
    `${splitter}There is no possibility for ${params}`;
  },
  invalidUrl: `${splitter}Invalid URL or The Web is not found`,
  needCredential: `${splitter}You need the credential`,
};

export { splitter, commonMessage };
