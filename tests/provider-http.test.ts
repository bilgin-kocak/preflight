import {afterEach,expect,it,vi} from 'vitest';
import {getJson,pacedFetch} from '../src/providers/http.js';
afterEach(()=>vi.useRealTimers());
it('paces explorer starts across concurrent calls',async()=>{
 vi.useFakeTimers();const times:number[]=[];
 const request=pacedFetch(async()=>{times.push(Date.now());return new Response('{}');},250);
 const pending=Promise.all([request('https://example.com'),request('https://example.com'),request('https://example.com')]);
 await vi.runAllTimersAsync();await pending;
 expect(times[1]!-times[0]!).toBeGreaterThanOrEqual(250);expect(times[2]!-times[1]!).toBeGreaterThanOrEqual(250);
});
it('retries one rate-limited read and stops after a second rejection',async()=>{
 vi.useFakeTimers();const request=vi.fn().mockResolvedValueOnce(new Response('{}',{status:429,headers:{'Retry-After':'1'}})).mockResolvedValueOnce(new Response('{"ok":true}'));
 const result=expect(getJson('https://example.com',request)).resolves.toEqual({ok:true});await vi.runAllTimersAsync();await result;expect(request).toHaveBeenCalledTimes(2);
 const failed=vi.fn(async()=>new Response('{}',{status:429}));const promise=getJson('https://example.com',failed);const assertion=expect(promise).rejects.toThrow('429');await vi.runAllTimersAsync();await assertion;expect(failed).toHaveBeenCalledTimes(2);
});
