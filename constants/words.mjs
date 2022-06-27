const splitter = "Result: ";
const skip = "Skip: ";

const commonMessage = {
  failed: "failed",
  noPossibility: (params) => {
    `${splitter}There is no possibility for ${params}`;
  },
  invalidUrl: `${splitter}Invalid URL or The Web is not found`,
  needCredential: `${splitter}You need the credential`,
};

const skipper = (params) => {
  return `${skip} ${params}`;
};

export { splitter, commonMessage, skipper };
