import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  _request,
  context,
) => {
  const errorType = error instanceof Error ? error.name : "UnknownError";
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  console.error(
    JSON.stringify({
      event: "web.unhandled_request_error",
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
      errorType,
      ...(digest === undefined ? {} : { digest }),
    }),
  );
};
