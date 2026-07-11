export async function apiRequest<T>(path:string,init?:RequestInit):Promise<T> {
  const response=await fetch(path,{credentials:"include",headers:{Accept:"application/json","Content-Type":"application/json",...(init?.headers??{})},...init});
  if(!response.ok){
    const raw=await response.text();
    try{
      const parsed=JSON.parse(raw) as {error?:string;message?:string};
      throw new Error(parsed.error||parsed.message||`API request failed: ${response.status}`);
    }catch(error){
      if(error instanceof Error&&error.message&&error.message!==raw)throw error;
      throw new Error(raw||`API request failed: ${response.status}`);
    }
  }
  return await response.json() as T;
}
