export async function apiRequest<T>(path:string,init?:RequestInit):Promise<T> {
  const response=await fetch(path,{credentials:"include",headers:{Accept:"application/json","Content-Type":"application/json",...(init?.headers??{})},...init});
  if(!response.ok){
    const message=await response.text();
    throw new Error(message||`API request failed: ${response.status}`);
  }
  return await response.json() as T;
}
