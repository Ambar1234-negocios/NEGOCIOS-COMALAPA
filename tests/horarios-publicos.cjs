const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');
const hours=source.slice(source.indexOf('const ZONA_HORARIA_EXHIBICION'),source.indexOf('// NAVEGACIÓN / HISTORIAL'));
const ctx=vm.createContext({Intl,Date,escaparTarjetaCategoria:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});vm.runInContext(hours,ctx);
const closed={modo:'cerrado'},day=(...turnos)=>({modo:'abierto',turnos:turnos.map(([inicio,fin])=>({inicio,fin}))});
const schedule={domingo:closed,lunes:day(['07:30','17:00']),martes:day(['07:30','17:00']),miercoles:day(['07:30','12:00'],['15:00','17:00']),jueves:day(['07:30','17:00']),viernes:day(['07:30','17:00']),sabado:day(['07:30','14:00'])};
function run(d,m,horarios=schedule){ctx.clock={indiceDia:d,minutosActuales:m};ctx.business={horarios};vm.runInContext('obtenerFechaLocalExhibicion=()=>clock',ctx);return vm.runInContext('({estado:obtenerEstadoHorario(business),html:renderizarHorarioPublico(business)})',ctx);}
assert.match(run(1,600).estado.texto,/Abierto hoy · cierra 5:00 p. m./);
assert.match(run(1,360).estado.texto,/abre hoy 7:30 a. m./);
assert.match(run(1,1100).estado.texto,/abre mañana/);
assert.match(run(6,900).html,/Mañana · Cerrado/);
assert.match(run(0,600).estado.texto,/Cerrado hoy · abre mañana/);
assert.match(run(3,800).estado.texto,/abre hoy 3:00 p. m./);
assert.match(run(3,960).estado.texto,/Abierto hoy/);
assert.match(run(3,800).html,/7:30 a. m. – 12:00 p. m. · 3:00 p. m. – 5:00 p. m./);
assert.match(run(2,60,{lunes:day(['22:00','02:00']),martes:closed}).estado.texto,/cierra 2:00 a. m./);
assert.match(run(1,600,{lunes:{modo:'24h'}}).estado.texto,/24 horas/);
const before=JSON.stringify(schedule);run(1,600);assert.equal(JSON.stringify(schedule),before);
ctx.business={horario:'Previa cita'};assert.equal(vm.runInContext('renderizarHorarioPublico(business)',ctx),'<p><strong>Previa cita</strong></p>');
console.log('OK: six requested scenarios, overnight, 24h, legacy text, no data mutation');
(async()=>{const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage();await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><div class="detalle-card">'+run(3,800).html+'</div>');await page.addStyleTag({path:path.join(__dirname,'../style.css')});const button=page.locator('.horario-toggle');assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.horario-semana').isVisible(),false);await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.horario-dia').count(),7);assert.equal(await page.locator('.horario-dia-hoy').count(),1);assert.match(await page.locator('.horario-dia').first().textContent(),/^Lunes/);assert.match(await page.locator('.horario-dia').last().textContent(),/^DomingoCerrado/);for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}await page.keyboard.press('Space');assert.equal(await button.getAttribute('aria-expanded'),'false');console.log('OK: keyboard toggle, aria-expanded, seven ordered days, today highlight, widths 320/390/768/1280');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

