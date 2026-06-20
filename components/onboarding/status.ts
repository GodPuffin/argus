/** A chat is "busy" while a request is in flight or a response is streaming. */
export function isBusy(status: string): boolean {
  return status === "streaming" || status === "submitted";
}
