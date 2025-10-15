export const errorHandler = ({
  error,
  functionName,
  message,
  req,
  res,
}: {
  error: any;
  functionName: string;
  message: string;
  req?: any;
  res?: any;
}) => {
  try {
    const reqQueryParams = req?.query;
    if (reqQueryParams?.interactiveNonce) delete reqQueryParams.interactiveNonce;

    // Prepare error information for logging
    let errorDetails = {};

    // Try to extract more detailed information from the error object
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // Check for originalError property that might have been added
        originalError: (error as any).originalError
          ? JSON.stringify((error as any).originalError, Object.getOwnPropertyNames((error as any).originalError))
          : undefined,
      };
    } else if (typeof error === "object" && error !== null) {
      // For object errors that aren't Error instances
      errorDetails = {
        type: "object",
        stringified: JSON.stringify(error),
        properties: Object.keys(error).reduce(
          (acc, key) => {
            acc[key] = typeof error[key] === "object" ? JSON.stringify(error[key]) : error[key];
            return acc;
          },
          {} as Record<string, any>,
        ),
      };
    } else {
      // For primitive error types
      errorDetails = {
        type: typeof error,
        value: String(error),
      };
    }

    console.error(
      JSON.stringify(
        {
          errorContext: {
            message,
            functionName,
          },
          requestContext: {
            requestId: req?.id,
            reqQueryParams,
            reqBody: req?.body,
          },
          error: errorDetails,
        },
        null,
        2,
      ),
    );

    if (res) return res.status(error.status || 500).send({ error, message, success: false });
    return { error };
  } catch (e) {
    console.error("❌ Error printing the logs", e);
    return res.status(500).send({ error: e, message, success: false });
  }
};
