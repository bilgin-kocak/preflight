export type Fetcher=typeof fetch;
export async function getJson(url:string,fetcher:Fetcher=fetch):Promise<unknown> {
  const response=await fetcher(url,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
  if(!response.ok) throw new Error(`Explorer returned HTTP ${response.status}`);
  return response.json();
}
