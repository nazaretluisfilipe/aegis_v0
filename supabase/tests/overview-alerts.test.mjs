import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
test('painel destaca aulas vencidas e retornos comerciais pendentes',async()=>{
 const source=await readFile(new URL('../../src/admin/pages/Overview.tsx',import.meta.url),'utf8')
 assert.match(source,/\.eq\('status','scheduled'\)\.lt\('starts_at',now\)/)
 assert.match(source,/\.in\('status',\['new','contacted','qualified','proposal'\]\)\.lt\('follow_up_at',now\)/)
 assert.match(source,/to:'\/aulas'/)
 assert.match(source,/to:'\/interessados'/)
 assert.doesNotMatch(source,/\.delete\(/)
})
