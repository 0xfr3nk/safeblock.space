
(function initTypewriter(){
  const el = document.getElementById('typewriter-text');
  if(!el) return;
  const frasi = [
    "You are Delegating to Safe Block...",
    "Secure. Reliable. Automated.",
    "Restake Included, Gas on Us.",
    "BitSong & Planq: Validated with Style."
  ];
  let pi = 0, ci = 0, dir = 1;
  function tick(){
    const p = frasi[pi];
    ci += dir;
    el.textContent = p.slice(0, ci);
    if(ci === p.length){ dir = -1; setTimeout(tick, 1200); return; }
    if(ci === 0){ dir = 1; pi = (pi+1) % frasi.length; }
    setTimeout(tick, 45);
  }
  tick();
})();

function formatTokens2(raw, decimals){
  if(raw == null) return "-";
  let s = String(raw).replace(/\D/g,"");
  s = s.padStart(decimals+1, "0");
  const int = s.slice(0, -decimals);
  let frac = s.slice(-decimals);
  frac = (frac.length >= 2) ? frac.slice(0,2) : frac.padEnd(2,"0");
  const intFmt = Number(int).toLocaleString('it-IT');
  return `${intFmt},${frac}`;
}

function statusText(status, jailed){
  const online = !jailed && status === "BOND_STATUS_BONDED";
  return online ? 'Online ✅' : 'Offline ⛔';
}

function itDate(dateStrOrDate){
  const d = (dateStrOrDate instanceof Date) ? dateStrOrDate : new Date(dateStrOrDate);
  if(isNaN(d)) return "-";
  const mesi = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
  const gg = String(d.getDate()).padStart(2,"0");
  const mm = mesi[d.getMonth()];
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const min = String(d.getMinutes()).padStart(2,"0");
  return `${gg} ${mm} ${yyyy}, ${hh}:${min}`;
}

async function getJSON(url){
  const r = await fetch(url, { cache:"no-store" });
  if(!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}

const CHAINS = [
  { name:"BitSong", symbol:"$BTSG", elementId:"bitsong-data", apiBase:"https://api.bitsong.safeblock.space", valoper:"bitsongvaloper1fgmzy5rtvvnxzy0vn54mz9k5xndzt2afepyye3", decimals:6 },
  { name:"Planq", symbol:"$PLQ", elementId:"planq-data", apiBase:"https://api.planq.safeblock.space", valoper:"plqvaloper1r3j34ch40555kgukc7xy8u45jnr3rnpapslpk7", decimals:18 },
];

async function renderChain(cfg){
  const el = document.getElementById(cfg.elementId);
  if(!el) return;
  try{
    const vUrl = `${cfg.apiBase}/cosmos/staking/v1beta1/validators/${cfg.valoper}`;
    const vData = await getJSON(vUrl);
    const v = vData?.validator || {};

    const operator = v?.operator_address || cfg.valoper;
    const jailed = Boolean(v?.jailed);
    const status = v?.status || "";
    const tokens = formatTokens2(v?.tokens || "0", cfg.decimals);
    const rate = (Number(v?.commission?.commission_rates?.rate || "0")*100).toFixed(2) + "%";
    const maxRate = (Number(v?.commission?.commission_rates?.max_rate || "0")*100).toFixed(2) + "%";
    const maxChange = (Number(v?.commission?.commission_rates?.max_change_rate || "0")*100).toFixed(2) + "%";
    const lastUpdate = v?.commission?.update_time ? itDate(v.commission.update_time) : "-";

    el.innerHTML = `
      <div class="validator-data">
        <div class="kv">
          <span class="k">Operator:</span>
          <span class="v addr">${operator}</span>
          <button class="copy-icon" data-copy="${operator}" aria-label="Copia operator">
            <span class="ico">📋</span><span>Copy</span>
          </button>
        </div>
        <div class="kv"><span class="k">Jailed:</span> <span class="v">${jailed}</span></div>
        <div class="kv"><span class="k">Status:</span> <span class="v ${statusText(status, jailed).startsWith('Online')?'ok':'bad'}">${statusText(status, jailed)}</span></div>
        <div class="kv"><span class="k">Tokens:</span> <span class="v">${tokens} Delegated</span></div>
        <div class="kv"><span class="k">Commission:</span> <span class="v">${rate}</span></div>
        <div class="kv"><span class="k">Max Commission:</span> <span class="v">${maxRate}</span></div>
        <div class="kv"><span class="k">Max Change (24h):</span> <span class="v">${maxChange}</span></div>
        <div class="kv"><span class="k">Last Update:</span> <span class="v small">${lastUpdate}</span></div>
      </div>
    `;

    const btn = el.querySelector(".copy-icon");
    if(btn){
      btn.addEventListener("click", async () => {
        try{
          await navigator.clipboard.writeText(btn.getAttribute("data-copy"));
          const prev = btn.innerHTML;
          btn.innerHTML = "<span class='ico'>✅</span><span>Copied</span>";
          setTimeout(()=> btn.innerHTML = prev, 1200);
        }catch(e){
          const prev = btn.innerHTML;
          btn.innerHTML = "<span class='ico'>⚠️</span><span>errore</span>";
          setTimeout(()=> btn.innerHTML = prev, 1200);
        }
      });
    }

  }catch(e){
    el.innerHTML = `<span class="small">Errore: ${e.message}</span>`;
  }
}

function init(){
  CHAINS.forEach(renderChain);
  setInterval(()=> CHAINS.forEach(renderChain), 60000);
}
document.addEventListener("DOMContentLoaded", init);
