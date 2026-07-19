/* Forge Lesson — application logic
   Generated from source; edit this file directly, then run build-standalone.py. */
/* ---------- tiny helpers ---------- */
const $ = s => document.querySelector(s);
const store = {
  get k(){ try{return JSON.parse(localStorage.getItem("spark_ai")||"null")}catch(e){return null} },
  set k(v){ v? localStorage.setItem("spark_ai",JSON.stringify(v)) : localStorage.removeItem("spark_ai") },
  get saved(){ try{return JSON.parse(localStorage.getItem("forge_saved")||"[]")}catch(e){return []} },
  set saved(v){ try{localStorage.setItem("forge_saved",JSON.stringify(v||[]))}catch(e){} }
};
function toast(msg,isErr){
  const t=$("#toast"); t.textContent=msg; t.className="toast show"+(isErr?" err":"");
  clearTimeout(t._t); t._t=setTimeout(()=>t.className="toast",4200);
}
function ageBand(s){
  s=s||""; let n=null;
  const ageM=s.match(/age\s*(\d+)/i);
  const gradeM=s.match(/grade\s*(\d+)/i);
  if(ageM){ n=parseInt(ageM[1],10); }              // explicit age wins
  else if(gradeM){ n=parseInt(gradeM[1],10)+5; }   // grade -> approx age
  else { const m=s.match(/\d+/); if(m){ let x=parseInt(m[0],10); n=(x<=12? x+5 : x); } } // bare number: assume grade if <=12
  if(n==null) return {key:"mid",label:"Ages 11–14"};
  if(n<=7) return {key:"early",label:"Ages 4–7"};
  if(n<=11) return {key:"elem",label:"Ages 8–11"};
  if(n<=14) return {key:"mid",label:"Ages 12–14"};
  return {key:"high",label:"Ages 15+"};
}

/* ---------- 5E phase chrome ---------- */
const PHASE_META=[
  {key:"engage",step:"1 · Engage",desc:"Hook & surface the question",color:"var(--engage)",icon:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>'},
  {key:"explore",step:"2 · Explore",desc:"Hands-on investigation",color:"var(--explore)",icon:'<path d="M10 2v7.31"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/>'},
  {key:"explain",step:"3 · Explain",desc:"Articulate & formalize",color:"var(--explain)",icon:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'},
  {key:"elaborate",step:"4 · Elaborate",desc:"Extend & apply",color:"var(--elaborate)",icon:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>'},
  {key:"evaluate",step:"5 · Evaluate",desc:"Check for understanding",color:"var(--evaluate)",icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'}
];
const THRESHOLD_PHASE_META=[
  {key:"engage",step:"Construct · Immerse",desc:"Meet the phenomenon — engagement lives here",color:"var(--engage)",icon:PHASE_META[0].icon},
  {key:"explore",step:"Construct · Invent",desc:"Coin words or build the pattern",color:"var(--explore)",icon:PHASE_META[1].icon},
  {key:"explain",step:"Formalise",desc:"Map to real terms & state the rule",color:"var(--explain)",icon:PHASE_META[2].icon},
  {key:"elaborate",step:"Transfer · later lesson",desc:"Apply to a new context — deferred",color:"var(--elaborate)",icon:PHASE_META[3].icon},
  {key:"evaluate",step:"Check",desc:"Show understanding two ways",color:"var(--evaluate)",icon:PHASE_META[4].icon}
];
const MOVES=[
  {k:"words",label:"Invent the words",gerund:"word-inventing",note:"Students coin their own made-up word for each part before any formal term is introduced.",icon:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'},
  {k:"rule",label:"Generate the rule",gerund:"rule-forming",note:"Students gather evidence and write their own generalisation before the formal rule is revealed.",icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},
  {k:"sort",label:"Sort and classify",gerund:"category-building",note:"Students build the categories themselves from a set of cases, and must defend where the boundary falls.",icon:'<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>'},
  {k:"poe",label:"Predict–observe–explain",gerund:"predicting and testing",note:"Students commit a prediction to writing first, so the surprise does the teaching when observation contradicts it.",icon:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'},
  {k:"counter",label:"Find the counter-example",gerund:"counter-example hunting",note:"Students are handed an almost-right claim — often their own misconception — and must break it with a real case.",icon:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>'},
  {k:"model",label:"Build a model",gerund:"model-building",note:"Students build a physical or drawn model of the mechanism, then deliberately find where it breaks.",icon:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>'}
];
const ico=(p,w=16)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

/* ---------- render an activity object ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}
/* ---------- STUDENT HANDOUT — deliberately withholds every reveal ---------- */
function renderHandout(a,isThr,move){
  const MV=MOVES.find(m=>m.k===move)||MOVES[0];
  const line=(l,n)=>`<div class="hw"><span class="hw-l">${l}</span>${Array.from({length:n||1},()=>'<div class="hw-b"></div>').join("")}</div>`;
  const say=t=>`<p class="hs-p">${esc(t)}</p>`;
  let task="";
  if(isThr&&move==="words"&&a.lexicon&&a.lexicon.length){
    task=`<div class="hs-box"><h3>Make up your own words</h3>${say("Your group invents a brand-new word for each thing below. Do not use the real word — you may not know it yet. From now on, use only your own words when you explain what is happening.")}<table class="hs-t"><thead><tr><th>Invent a name for…</th><th>Our made-up word</th></tr></thead><tbody>${a.lexicon.map(l=>`<tr><td>${esc(l.slot)}</td><td class="hs-blank"></td></tr>`).join("")}</tbody></table></div>`;
  } else if(isThr&&move==="rule"){
    task=`<div class="hs-box"><h3>Work out the rule yourself</h3>${say("Gather your evidence first. Then write the rule you think is always true — in your own words, before anyone tells you the answer.")}${line("What we noticed",3)}${line("Our rule — what we think is ALWAYS true",2)}${line("A case we tested it on",1)}</div>`;
  } else if(isThr&&move==="sort"){
    const S=a.sort||{};
    task=`<div class="hs-box"><h3>Sort them into your own groups</h3>${say(S.task||"Sort the cases into groups of your own making, name each group, then write the rule that decides which group something belongs to.")}${(S.items&&S.items.length)?`<div class="hs-chips">${S.items.map(i=>`<span>${esc(i)}</span>`).join("")}</div>`:""}${line("Our groups, and what we called them",3)}${line("The rule that decides which group something goes in",2)}</div>`;
  } else if(isThr&&move==="poe"){
    const P=a.poe||{};
    task=`<div class="hs-box"><h3>Predict, observe, explain</h3>${P.scenario?say("What you will see: "+P.scenario):""}${say("Write your prediction BEFORE you watch. Do not change it afterwards — a wrong prediction is useful.")}${line("We predict… and why",2)}${line("What actually happened",2)}${line("How we explain it now",2)}</div>`;
  } else if(isThr&&move==="counter"){
    const C=a.counter||{};
    task=`<div class="hs-box"><h3>Break the claim</h3>${say("Here is a claim that sounds right. Your job is to prove it wrong.")}${C.claim?`<p class="hs-claim">&ldquo;${esc(C.claim)}&rdquo;</p>`:""}${C.hunt?say(C.hunt):""}${line("The case that breaks it",2)}${line("What the claim should have said instead",2)}</div>`;
  } else if(isThr&&move==="model"){
    const D=a.model||{};
    task=`<div class="hs-box"><h3>Build a model</h3>${D.build?say("Build: "+D.build):""}${D.test?say("Then test it: "+D.test):""}${line("What our model shows",2)}${line("Where our model breaks down",2)}</div>`;
  } else {
    task=`<div class="hs-box"><h3>Our investigation</h3>${line("What we are trying to find out",1)}${line("What we did",3)}${line("What we found",3)}${line("What we think this means",2)}</div>`;
  }
  $("#handoutBody").innerHTML=`
    <section class="hs-head">
      <div class="hs-meta"><span>Name / group ____________________</span><span>Date ____________</span></div>
      <div class="hs-kicker">Our question</div>
      <h1>${esc(a.drivingQuestion)}</h1>
    </section>
    ${task}
    <div class="hs-box hs-final"><h3>Explain it to someone else</h3>${say("Explain what you worked out to a person who was not here. Use your own words.")}${line("",3)}</div>
    <p class="hs-foot">${esc(a.activityTitle)} · ${esc(a.ageBand)}</p>`;
}
function renderActivity(a){
  lastActivity=a;
  const isThr=!!(a.lexicon||a.troublesome||a.rule);
  const move=(typeof thresholdMove!=='undefined')?thresholdMove:'words';
  const meta=isThr?THRESHOLD_PHASE_META:PHASE_META;
  const facts=`
    <div class="facts">
      <span class="title">${esc(a.activityTitle)}</span>
      <span class="f">${ico('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',15)} ${esc(a.ageBand)}</span>
      <span class="f">${ico('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',15)} ~${esc(a.totalMinutes)} min</span>
    </div>`;
  const vocab=(a.keyVocabulary&&a.keyVocabulary.length)
    ? `<ul class="vocab">${a.keyVocabulary.map(v=>`<li>${esc(v)}</li>`).join("")}</ul>`
    : `<p style="color:var(--muted);font-style:italic;font-size:14px">Age-appropriate — no formal terms.</p>`;
  const mats=(a.materialsList&&a.materialsList.length)
    ? `<ul class="mats">${a.materialsList.map(m=>`<li>${esc(m)}</li>`).join("")}</ul>`
    : `<p style="color:var(--muted);font-style:italic;font-size:14px">No materials needed.</p>`;
  const phases=meta.map(pm=>{
    const p=a[pm.key]||{}; const pmats=(p.materials&&p.materials.length)
      ? `<div class="pm"><span class="t">Materials:</span>${p.materials.map(m=>`<span class="m">${esc(m)}</span>`).join("")}</div>`:"";
    return `<div class="phase">
      <div class="top">
        <div class="pico" style="background:${pm.color}">${ico(pm.icon,20)}</div>
        <div class="body">
          <div class="head">
            <div><div class="step">${pm.step} · ${pm.desc}</div><h3>${esc(p.title||"")}</h3></div>
            <span class="time">${ico('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',14)} ${esc(p.estimatedMinutes||"—")} min</span>
          </div>
          <p class="instr">${esc(p.teacherInstructions||"")}</p>
          ${pmats}
        </div>
      </div></div>`;
  }).join("");
  const lexHtml=(a.lexicon&&a.lexicon.length)?`<section class="lexicon print-break"><div class="lx-h">${ico('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',15)} Invent the words — students coin their own names first</div><p class="lx-sub">Before any formal term is given, each group makes up its OWN word for every part below and uses only those words during Explore. In Explain, reveal the real term beside the word students already invented.</p><table class="lx-t"><thead><tr><th>Students invent a name for…</th><th>Their made-up word</th><th>Formal term (reveal in Explain)</th></tr></thead><tbody>${a.lexicon.map(l=>`<tr><td>${esc(l.slot)}</td><td class="lx-blank">${esc(l.coin||"")}</td><td class="lx-real">${esc(l.reveal)}</td></tr>`).join("")}</tbody></table></section>`:"";
  const troubleHtml=(isThr&&a.troublesome)?`<section class="trouble"><div class="tr-h">${ico('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',14)} Troublesome knowledge — the idea that trips learners up</div><p>${esc(a.troublesome)}</p></section>`:"";
  const ruleHtml=(isThr&&a.rule)?`<section class="rulebox print-break"><div class="lx-h">${ico('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',15)} Generate the rule — students form the generalisation first</div><p class="lx-sub">Before the teacher states any rule, each group writes its OWN general statement of what always happens, drawn from their evidence. Then compare it with the formal generalisation below.</p><div class="rule-write"><span class="rw-l">Our rule (students write)</span><div class="rw-blank"></div></div><div class="rule-real"><span class="rr-l">The formal generalisation — reveal after</span><p>${esc(a.rule)}</p></div></section>`:"";
  const MV=MOVES.find(m=>m.k===move)||MOVES[0];
  const cbRow=(l,t)=>`<div class="cb-row"><span class="cb-l">${l}</span><p>${esc(t)}</p></div>`;
  const cbTeach=(l,t)=>`<div class="cb-row cb-teach"><span class="cb-l">${l}</span><p>${esc(t)}</p></div>`;
  const cbWrite=l=>`<div class="cb-row"><span class="cb-l">${l}</span><div class="cb-blank"></div></div>`;
  const cbox=(title,sub,inner)=>`<section class="cbox print-break cb-${move}"><div class="cb-h">${ico(MV.icon,15)} ${title}</div><p class="cb-sub">${sub}</p>${inner}</section>`;
  let constructHtml="";
  if(isThr){
    if(move==="rule") constructHtml=ruleHtml;
    else if(move==="sort"){const S=a.sort||{};
      constructHtml=cbox("Sort and classify — students build the categories","Do not hand over the categories. Students group the cases themselves, name each group, then defend where the boundary falls — the boundary IS the concept.",
        (S.items&&S.items.length?`<div class="cb-row"><span class="cb-l">Cases to sort</span><div class="cb-chips">${S.items.map(i=>`<span>${esc(i)}</span>`).join("")}</div></div>`:"")
        +cbRow("The task",S.task||"Sort the cases into groups of your own making, name each group, then state the rule that decides which group something belongs to.")
        +cbWrite("Our groups, and the rule for the boundary"));}
    else if(move==="poe"){const P=a.poe||{};
      constructHtml=cbox("Predict – observe – explain","Students must commit a prediction to writing BEFORE observing. The surprise is what does the teaching, and it only works if the prediction is already on record.",
        cbRow("The situation",P.scenario||"Set up the situation the concept explains, and show it to students without commentary.")
        +(P.tempting?cbTeach("Expect this prediction — teacher note",P.tempting):"")
        +cbWrite("We predict… (write this before observing)")+cbWrite("We observed…")+cbWrite("We explain…"));}
    else if(move==="counter"){const C=a.counter||{};
      constructHtml=cbox("Find the counter-example","Hand students a claim that is almost right — often the very misconception they already hold. Their job is to break it with a real case, then repair it.",
        cbRow("The claim to attack",C.claim||"State the intuitive claim most learners believe about this concept.")
        +cbRow("The hunt",C.hunt||"Find a real case where the claim fails, then say what it should have said instead.")
        +cbWrite("The case that breaks it")+cbWrite("What the claim should have said"));}
    else if(move==="model"){const D=a.model||{};
      constructHtml=cbox("Build a model","Students build a physical or drawn model of the mechanism, then deliberately find where it breaks. The limits of the model are where the understanding sharpens.",
        cbRow("Build",D.build||"Build a physical or drawn model showing how the concept works.")
        +cbRow("Test",D.test||"Test the model against a case it was not built for.")
        +cbWrite("Where our model breaks down"));}
    else constructHtml=lexHtml;
  }
  const L=a.liminal||null;
  const liminalHtml=(isThr&&L)?`<section class="liminal print-break"><div class="lm-h">${ico('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',15)} The liminal space — where students get stuck (and should)</div><p class="lm-sub">Being stuck here is not a failure of the lesson; it is the lesson. Recognise it, then hold students in it long enough for the idea to reorganise.</p><div class="lm-cols"><div class="lm-col"><div class="lm-l">Looks like</div><ul>${(L.looks||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><div class="lm-col"><div class="lm-l">Sounds like</div><ul class="lm-say">${(L.sounds||[]).map(x=>`<li>&ldquo;${esc(x)}&rdquo;</li>`).join("")}</ul></div></div><div class="lm-hold"><div class="lm-l">Teacher moves that hold, not rescue</div><ol>${(L.hold||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div></section>`:"";
  const TF=a.transfer||null;
  const transferHtml=(isThr&&TF)?`<section class="transferbox print-break"><div class="tf-h">${ico('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',15)} Transfer — the later lesson</div><p class="tf-sub">Deliberately deferred. Run this once the core meaning is secure, not in the same session.</p><div class="tf-row"><span class="tf-l">When</span><p>${esc(TF.when)}</p></div><div class="tf-row"><span class="tf-l">The task</span><p>${esc(TF.task)}</p></div><div class="tf-row"><span class="tf-l">What to look for</span><p>${esc(TF.lookFor)}</p></div></section>`:"";
  const PROG=[{k:"preliminal",n:"Pre-liminal",d:"Has not yet met the trouble"},{k:"liminal",n:"Liminal",d:"In the stuck, in-between state"},{k:"crossed",n:"Crossed",d:"Has passed through the threshold"},{k:"integrated",n:"Integrated",d:"Uses it without being prompted"}];
  const PR=a.progression||null;
  const progHtml=(isThr&&PR)?`<section class="progression print-break"><div class="pr-h">${ico('<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',15)} Has the student crossed? — threshold progression</div><p class="pr-sub">Use this in place of a generic rubric. Progress through a threshold is not linear — students can sit in the liminal band for some time, and often move back before moving on.</p><table class="pr-t"><thead><tr><th>Stage</th><th>What that looks like in this concept</th></tr></thead><tbody>${PROG.map(g=>`<tr><td class="pr-s"><b>${g.n}</b><span>${g.d}</span></td><td>${esc(PR[g.k]||"")}</td></tr>`).join("")}</tbody></table></section>`:"";
  const pedagogyHtml=isThr?`<section class="pedagogy"><div class="pg-h">How this threshold lesson is sequenced</div><p><b>Engagement sits inside the construction.</b> There is no separate hook — curiosity comes from meeting the phenomenon while students build meaning, so the ${MV.gerund} IS the engagement. <b>The liminal space is planned for, not designed away.</b> Students are expected to get stuck; the teacher's job is to hold them there productively rather than rescue them with the answer. <b>Transfer comes later.</b> Applying the idea to new contexts is deliberately deferred to a follow-up lesson, once the core meaning is secure.</p></section>`:"";
  $("#activityBody").innerHTML=`
    <section class="hero-q">
      <div class="kicker">${ico('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>',14)} Driving Question</div>
      <h1>${esc(a.drivingQuestion)}</h1>${facts}
    </section>
    ${troubleHtml}
    ${constructHtml}
    ${liminalHtml}
    <div class="info-grid">
      <div class="block"><div class="h">${ico('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',14)} Learning objective</div><p>${esc(a.learningObjective)}</p></div>
      <div class="block"><div class="h">${ico('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',14)} Key vocabulary</div>${vocab}</div>
      <div class="block"><div class="h">${ico('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',14)} Materials</div>${mats}</div>
    </div>
    <div class="phases"><h2>${isThr?"Construct → Formalise → Transfer":"The 5E Lesson"}</h2>${phases}</div>${transferHtml}${progHtml}${pedagogyHtml}`;
  renderHandout(a,isThr,move);
  applyView();
  $("#landing").classList.add("hidden");
  $("#activity").classList.remove("hidden");
  $("#newBtn").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

/* =====================================================================
   CURATED LIBRARY — fully authored, ready-to-run activities
   ===================================================================== */

function libLookup(concept,style){
  const c=(concept||"").toLowerCase(); style=(style==="threshold")?"threshold":"5e";
  let best=null,bestScore=0;
  for(const a of LIBRARY){
    if((a.style||"5e")!==style) continue;
    let s=0; for(const m of a.match){ if(c.includes(m)) s=Math.max(s,m.length); }
    if(s>bestScore){bestScore=s;best=a;}
  }
  return bestScore>0?best:null;
}

/* =====================================================================
   TEMPLATE GENERATOR — for concepts not in the library (offline, no key)
   Produces a genuine 5E scaffold adapted to the age band.
   ===================================================================== */
function titleCase(s){return (s||"").trim().replace(/\s+/g," ")}
function templateActivity(concept,ageStr,subject,style){
  if(style==="threshold") return thresholdTemplate(concept,ageStr,subject);
  const band=ageBand(ageStr);
  const C=titleCase(concept);
  const cShort=C.length>60?C.slice(0,57)+"…":C;
  const byBand={
    early:{verbs:"touch, sort, act out, and draw",record:"draw pictures or place real objects",think:"tell a partner what they noticed",tools:"real objects, pictures, movement, and story",lang:"very simple words, no symbols",tmin:[6,12,9,6,3],obj:"explore and talk about"},
    elem:{verbs:"build, test, and record in a simple table",record:"fill in a picture-and-words table",think:"look for a pattern across their results",tools:"hands-on materials and a recording sheet",lang:"everyday words with one or two new terms",tmin:[7,16,12,7,4],obj:"discover a pattern in"},
    mid:{verbs:"measure, collect data, and look for a rule",record:"organize measurements in a data table",think:"state a rule in their own words and test it",tools:"measurement tools, data tables, and diagrams",lang:"proper vocabulary and early symbols",tmin:[8,18,13,8,5],obj:"investigate and generalize"},
    high:{verbs:"investigate, model, and justify",record:"organize evidence and reasoning",think:"form and defend a general claim or proof",tools:"data, models, notation, and structured argument",lang:"formal vocabulary, notation, and justification",tmin:[8,20,15,8,5],obj:"reason formally about"}
  }[band.key];
  const t=byBand.tmin, total=t.reduce((a,b)=>a+b,0);
  const subj=subject?` (${titleCase(subject)})`:"";
  const dq=`What is really going on with ${cShort.toLowerCase().replace(/\.$/,"")} — and how could we find out for ourselves?`;
  return {
    activityTitle:`Investigating: ${cShort}`,
    drivingQuestion:dq,
    ageBand:`${ageStr} · ${band.label}`,
    totalMinutes:total,
    learningObjective:`Students will be able to ${byBand.obj} ${cShort.toLowerCase().replace(/\.$/,"")}${subj} by constructing their own understanding through hands-on inquiry.`,
    keyVocabulary: band.key==="early"?[]:["(add the 2–4 key terms for this concept)","evidence","pattern / rule"],
    materialsList:["Materials suited to the concept","Recording sheet or chart","Whiteboard for shared ideas"],
    engage:{title:"Engage — surface the question",estimatedMinutes:t[0],materials:["A surprising example or demonstration"],
      teacherInstructions:`Open with something puzzling about "${cShort}" that challenges what students expect — a demonstration, image, quick vote, or "what would happen if…?" that has no obvious answer. Draw out prior ideas (including wrong ones) and post the driving question: "${dq}" Tell students they will figure it out themselves, using ${byBand.tools}.`},
    explore:{title:"Explore — hands-on investigation",estimatedMinutes:t[1],materials:["Hands-on materials","Recording sheet"],
      teacherInstructions:`In pairs or small groups, students ${byBand.verbs} to investigate "${cShort}". Give them varied cases to try (some that work as expected and some that don't) and have them ${byBand.record}. Circulate and ask probing questions — do NOT tell them the answer yet. This is where students construct the idea from evidence.`},
    explain:{title:"Explain — articulate & formalize",estimatedMinutes:t[2],materials:["Class chart / board"],
      teacherInstructions:`Bring the class together. Have students ${byBand.think} FIRST, in their own words. Then formalize: introduce the correct concept, ${byBand.lang}, connecting each new term directly to what students observed. Address any misconceptions that surfaced in Explore.`},
    elaborate:{title:"Elaborate — extend & apply",estimatedMinutes:t[3],materials:[],
      teacherInstructions:`Give a new situation, harder case, or real-world example where students apply their new understanding of "${cShort}". Ask them to predict first, then check. This tests whether the idea transfers beyond the original activity.`},
    evaluate:{title:"Evaluate — check for understanding",estimatedMinutes:t[4],materials:["Exit slip"],
      teacherInstructions:`Quick check: an exit ticket or short performance where each student shows they can use the concept independently — e.g. explain it to a peer, solve one new problem, or predict-and-justify. Use it to see who is ready to move on.`}
  };
}

function thresholdTemplate(concept,ageStr,subject){
  const band=ageBand(ageStr);
  const C=titleCase(concept); const cShort=C.length>60?C.slice(0,57)+"…":C;
  const cl=cShort.toLowerCase().replace(/\.$/,"");
  const t=[8,18,14,8,5], total=t.reduce((a,b)=>a+b,0);
  const dq=`What is really going on inside ${cl} — and what should we even call its parts?`;
  return {
    activityTitle:`Name It Yourself: ${cShort}`,
    troublesome:`${C} is a threshold idea: part of how it really works clashes with what students first assume, so they must rebuild their mental model rather than just add a fact.`,
    rule:`After investigating, students state the generalisation for ${cl} in their own words, then match it to the formal rule.`,
    liminal:{
      looks:["Reaching for the teacher instead of the evidence","Repeating an explanation that has already failed, more loudly","Going quiet, or declaring the task a trick question","Getting a right answer once, then being unable to repeat it"],
      sounds:["Can you just tell us the answer?","But that doesn't make sense.","We had it right before, I don't know what changed.","Is this a trick?"],
      hold:[`Do not supply the formal term or rule. Put the contradiction back to them: 'Both of these seem true at once — what has to change in your idea?'`,`Ask them to write down the explanation that is currently failing before they write a new one.`,`Say out loud that being stuck here is expected, and that you are not going to rescue them yet.`,`Give a second example that their current idea predicts wrongly, and ask them to test it.`]
    },
    transfer:{
      when:"A later lesson — deliberately not the same session. Run it once the core meaning has held for a few days.",
      task:`Give two or three unfamiliar situations that need ${cl} but look nothing like the original investigation, and ask students to explain all of them with the same single idea.`,
      lookFor:"Whether students reach for the idea unprompted in a new context, rather than only when told which topic it is."
    },
    progression:{
      preliminal:`Explains ${cl} with the everyday intuition the concept contradicts, and does not yet see a problem.`,
      liminal:`Knows the old explanation fails and can say why, but flips between accounts and cannot yet predict a new case reliably.`,
      crossed:`Uses the idea to predict and explain new cases within the context it was learnt in.`,
      integrated:`Applies the idea unprompted in unfamiliar contexts and uses it to judge other explanations.`
    },
    drivingQuestion:dq,
    ageBand:`${ageStr} · ${band.label}`,
    totalMinutes:total,
    learningObjective:`Students will be able to explain ${cl} and its key behaviours by first inventing their own names for its parts, then mapping those invented words onto the formal terms.`,
    keyVocabulary:["(the 2–5 real terms this concept normally uses)"],
    materialsList:["Materials that let students observe the concept first-hand","'Our invented words' recording sheet","Whiteboard for the class lexicon"],
    lexicon:[
      {slot:"The first main part / thing involved",reveal:"(formal term 1)"},
      {slot:"The second main part / thing involved",reveal:"(formal term 2)"},
      {slot:"The whole thing / result they form together",reveal:"(formal term 3)"},
      {slot:"A key property that can change (more / less)",reveal:"(formal term 4)"}
    ],
    engage:{title:"Engage — a phenomenon with no words yet",estimatedMinutes:t[0],materials:["A demonstration of the concept"],
      teacherInstructions:`Show ${cl} happening in front of the class with NO vocabulary — just the phenomenon. Ask: "We don't have words for what's going on here yet. What are the different parts we can see?" Let students point at and describe the parts loosely. Post the driving question: "${dq}"`},
    explore:{title:"Explore — invent your own words",estimatedMinutes:t[1],materials:["Hands-on materials","'Our invented words' sheet"],
      teacherInstructions:`Groups investigate ${cl} hands-on. Their job: for each part in the lexicon table, INVENT a brand-new made-up word of their own (not the real term, not its etymology) and record it. From now on they may use ONLY their own words. Have them describe what happens — especially when a property gets bigger or smaller — using only their invented language. Do NOT give the real terms yet.`},
    explain:{title:"Explain — reveal & map the real terms",estimatedMinutes:t[2],materials:["Class lexicon chart"],
      teacherInstructions:`Each group shares its invented words and explains the phenomenon with them. Build a class chart. THEN reveal the formal term for each part and write it beside the students' invented word, so every new term is anchored to a word they already own. Students restate the idea using the real vocabulary.`},
    elaborate:{title:"Elaborate — push the key behaviour",estimatedMinutes:t[3],materials:[],
      teacherInstructions:`Introduce a change that tests the concept's key behaviour (make the property much bigger, or add heat / energy). Students predict, then check, explaining with BOTH their invented words and the formal terms. This reveals whether their model actually works.`},
    evaluate:{title:"Evaluate — explain it two ways",estimatedMinutes:t[4],materials:["Exit slip"],
      teacherInstructions:`Exit ticket: each student explains ${cl} and its key behaviour once in their invented words and once in the formal terms, showing the two match.`}
  };
}

/* =====================================================================
   AI GENERATION (bring-your-own-key) — direct client-side call
   ===================================================================== */
function buildPrompt(concept,ageStr,subject,duration,style,move){
  const subjectLine=subject?`Subject area: ${subject}.`:"";
  const durationLine=duration?`Target class duration: ${duration}. Distribute time across the 5 phases so the total is close to this.`:"Total lesson roughly 45–60 minutes; distribute across the phases.";
  const thrCommon=` THRESHOLD MODE (very important). This is a threshold concept: it contains "troublesome knowledge" that clashes with students' intuition and, once grasped, transforms how they see the topic. You MUST include: "troublesome" (one sentence naming the counter-intuitive idea learners get stuck on) and "rule" (one sentence stating the generalisation students should end up with, in plain language).  You MUST also include: "liminal" — an object with "looks" (3-4 observable behaviours of a student who is stuck on THIS concept), "sounds" (3-4 things such a student actually says, written as plain sentences without quotation marks) and "hold" (3-4 specific teacher moves that keep students productively stuck rather than rescuing them with the answer — each must say what NOT to give away); "progression" — an object with "preliminal", "liminal", "crossed" and "integrated", each one sentence describing what a student at that stage looks like FOR THIS CONCEPT (not generic); and "transfer" — an object with "when" (why it is deferred and how much later), "task" (2-3 unfamiliar situations needing the same idea but looking nothing like the original investigation) and "lookFor" (what tells you the idea has genuinely transferred). SEQUENCING RULE: do NOT treat ENGAGE as a separate hook — engagement must sit INSIDE the construction, i.e. curiosity arises from meeting the phenomenon while students build meaning. Keep TRANSFER for later: ELABORATE should be framed as a follow-up/later-lesson application, not crammed in immediately.`;
  const MOVESPEC={
    words:{ins:` CONSTRUCTION MOVE = INVENT-THE-WORDS. During EXPLORE students INVENT their OWN brand-new made-up names for each core part (not the real words, not etymology) and reason using ONLY their invented words. In EXPLAIN, reveal the formal term for each and map it onto the word students already invented. Include a "lexicon" array (2-5 items) of objects with "slot" and "reveal".`,schema:`"lexicon":[{"slot":"","reveal":""}],`},
    rule:{ins:` CONSTRUCTION MOVE = GENERATE-THE-RULE. During EXPLORE students gather evidence and, before any rule is told to them, WRITE THEIR OWN general statement of what always happens. In EXPLAIN they compare their generalisation with the formal "rule" and refine it.`,schema:``},
    sort:{ins:` CONSTRUCTION MOVE = SORT AND CLASSIFY. During EXPLORE students receive a set of cases and must build the CATEGORIES THEMSELVES — the teacher must not supply them. Include "sort" with "items" (5-8 short concrete cases, deliberately chosen so the intuitive sort and the conceptually correct sort DISAGREE) and "task" (one sentence telling students to group, name their groups, and state the rule for the boundary).`,schema:`"sort":{"items":[],"task":""},`},
    poe:{ins:` CONSTRUCTION MOVE = PREDICT-OBSERVE-EXPLAIN. During EXPLORE students must commit a prediction to writing BEFORE observing. Include "poe" with "scenario" (one specific, demonstrable situation whose outcome contradicts intuition) and "tempting" (the wrong prediction most students will make, and why it feels right — this is a teacher note).`,schema:`"poe":{"scenario":"","tempting":""},`},
    counter:{ins:` CONSTRUCTION MOVE = FIND THE COUNTER-EXAMPLE. Students are handed an almost-right claim — ideally the very misconception named in "troublesome" — and must break it. Include "counter" with "claim" (the plausible but wrong generalisation, in students' own likely words) and "hunt" (the case they must find, and the repair they must then make to the claim).`,schema:`"counter":{"claim":"","hunt":""},`},
    model:{ins:` CONSTRUCTION MOVE = BUILD A MODEL. Students build a physical or drawn model of the mechanism, then deliberately find where it breaks. Include "model" with "build" (what concrete thing they construct, from simple classroom materials) and "test" (the case that probes the model's limits).`,schema:`"model":{"build":"","test":""},`}
  };
  const MS=MOVESPEC[move]||MOVESPEC.words;
  const thr=(style==="threshold")?(thrCommon+MS.ins):"";
  const lexSchema=(style==="threshold")?(`"troublesome":"","rule":"","liminal":{"looks":[],"sounds":[],"hold":[]},"progression":{"preliminal":"","liminal":"","crossed":"","integrated":""},"transfer":{"when":"","task":"","lookFor":""},`+MS.schema):"";
  return `You are an expert instructional designer creating a CONSTRUCTIVIST, INQUIRY-BASED classroom activity for a teacher.

Concept to teach: "${concept}"
Learner age/grade: ${ageStr}
${subjectLine}
${durationLine}

The activity MUST combine two frameworks:
1) ONE compelling DRIVING QUESTION at the core. It must provoke genuine investigation and not have an obvious answer (e.g. for triangle inequality: "Can any three side lengths make a triangle?").
2) A full 5E lesson built around it: ENGAGE (hook that surfaces the question), EXPLORE (hands-on investigation where students CONSTRUCT understanding via manipulatives/experiments/data — teacher does not tell), EXPLAIN (students articulate findings first, then teacher formalizes concept + vocabulary), ELABORATE (extend/apply to a new context), EVALUATE (concrete check for understanding).${thr}

AGE-APPROPRIATENESS IS CRITICAL — scale concrete→abstract:
- Ages ~4–7: entirely physical, playful, sensory; no symbolic notation.
- Ages ~8–11: manipulatives + simple recording; beginning generalizations in words.
- Ages ~12–14: structured investigation, measurement, data tables, early symbolic reasoning.
- Ages ~15+: formal reasoning, proof-like justification, notation, generalization.
Materials, language, task complexity, and vocabulary MUST match the given age.

For each 5E phase give: title (keep the E-name in the title), estimatedMinutes (integer), teacherInstructions (a specific runnable script of what the teacher does and says, and what students do — concrete, not vague), materials (array; [] if none).
Also: activityTitle (short, evocative), ageBand (echo the age you designed for), totalMinutes (sum of phase minutes), learningObjective (one "Students will be able to…" sentence), keyVocabulary (array, 2–6 terms; near-empty for very young), materialsList (consolidated unique list).

Return ONLY a single minified JSON object, no markdown, no preamble, matching exactly:
{"activityTitle":"","drivingQuestion":"","ageBand":"","totalMinutes":0,"learningObjective":"","keyVocabulary":[],"materialsList":[],${lexSchema}"engage":{"title":"","estimatedMinutes":0,"teacherInstructions":"","materials":[]},"explore":{...},"explain":{...},"elaborate":{...},"evaluate":{...}}`;
}
function extractJson(raw){
  let s=(raw||"").trim();
  const fence=s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); if(fence) s=fence[1].trim();
  if(!s.startsWith("{")){const i=s.indexOf("{"); if(i<0) throw new Error("No JSON in response"); s=s.slice(i);}
  const e=s.lastIndexOf("}"); if(e<0) throw new Error("Unterminated JSON"); return s.slice(0,e+1);
}
async function aiGenerate(cfg,concept,ageStr,subject,duration,style,move){
  const prompt=buildPrompt(concept,ageStr,subject,duration,style,move);
  let text="";
  if(cfg.provider==="anthropic"){
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"content-type":"application/json","x-api-key":cfg.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-3-5-sonnet-20241022",max_tokens:4000,messages:[{role:"user",content:prompt}]})
    });
    if(!r.ok){throw new Error("Anthropic API "+r.status+": "+(await r.text()).slice(0,140));}
    const j=await r.json(); text=(j.content||[]).map(b=>b.text||"").join("");
  }else{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"content-type":"application/json","authorization":"Bearer "+cfg.key},
      body:JSON.stringify({model:"gpt-4o-mini",max_tokens:4000,response_format:{type:"json_object"},messages:[{role:"user",content:prompt}]})
    });
    if(!r.ok){throw new Error("OpenAI API "+r.status+": "+(await r.text()).slice(0,140));}
    const j=await r.json(); text=j.choices?.[0]?.message?.content||"";
  }
  return JSON.parse(extractJson(text));
}

/* =====================================================================
   ORCHESTRATION
   ===================================================================== */
let lastInput=null, busy=false, activityStyle="5e", thresholdMove="words", lastActivity=null, activityView="teacher";
async function generate(concept,ageStr,subject,duration){
  if(busy) return;
  if(!concept.trim()||!ageStr.trim()){toast("Please enter both a concept and an age or grade.",true);return;}
  const style=activityStyle;
  const move=(style==="threshold")?thresholdMove:"words";
  lastInput={concept,ageStr,subject,duration,style,move};
  const cfg=store.k;
  setBusy(true);
  try{
    if(cfg&&cfg.key){
      // full AI, with one retry
      let a=null,err=null;
      for(let i=0;i<2&&!a;i++){ try{ a=await aiGenerate(cfg,concept,ageStr,subject,duration,style,move); }catch(e){err=e;} }
      if(!a){ toast("AI generation failed ("+(err?.message||"error")+"). Showing a built-in activity instead.",true);
        a=libLookup(concept,style)||templateActivity(concept,ageStr,subject,style); }
      renderActivity(a);
    }else{
      const lib=libLookup(concept,style);
      renderActivity(lib||templateActivity(concept,ageStr,subject,style));
      if(!lib) toast(style==="threshold"?"Built from Forge Lesson's threshold template. Add an API key (AI settings) for a fully tailored invent-the-words activity.":"Built from Forge Lesson's template. Add an API key (AI settings) for a fully tailored activity.");
    }
  }catch(e){ toast(e.message||"Something went wrong.",true); }
  finally{ setBusy(false); }
}
function setBusy(b){
  busy=b;
  $("#genBtn").disabled=b; $("#regenBtn").disabled=b; $("#adjustBtn").disabled=b;
  $("#genLabel").textContent=b?"Designing your activity…":"Generate activity";
  $("#regenIcon").classList.toggle("spin",b);
}

/* ---------- key-mode badge ---------- */
function refreshKeybar(){
  const cfg=store.k; const bar=$("#keybar");
  if(cfg&&cfg.key){
    bar.innerHTML=`<span class="badge-mode ai">✦ Full AI generation on — any concept (${cfg.provider==="anthropic"?"Claude":"OpenAI"})</span>`;
  }else{
    bar.innerHTML=`<span class="badge-mode">Library + template mode</span> <span>Add an API key in <b>AI settings</b> to generate any concept with AI.</span>`;
  }
}

/* ---------- examples ---------- */
const EXAMPLES=[
  {c:"Solutions — name the liquid, the solute, and the mixture yourself",a:"Grade 7 (age 12)",s:"Science",st:"threshold",mv:"words"},
  {c:"Fractions — whose half is bigger?",a:"Grade 4 (age 9)",s:"Math",st:"threshold",mv:"counter"},
  {c:"Forces — the tug-of-war that goes nowhere",a:"Grade 5 (age 10)",s:"Science",st:"threshold",mv:"poe"},
  {c:"Photosynthesis — where does a tree come from?",a:"Grade 7 (age 12)",s:"Science",st:"threshold",mv:"sort"},
  {c:"Metaphor — how is the classroom a zoo?",a:"Grade 6 (age 11)",s:"English",st:"threshold",mv:"model"},
  {c:"Adjectives — the words that change the picture",a:"Grade 3 (age 8)",s:"English",st:"threshold",mv:"rule"},
  {c:"Triangle inequality — can any 3 side lengths form a triangle?",a:"Grade 6 (age 11)",s:"Math"},
  {c:"Why do we have seasons?",a:"Grade 4 (age 9)",s:"Science"},
  {c:"What makes an experiment a fair test?",a:"Grade 5 (age 10)",s:"Science"},
  {c:"How does supply and demand set prices?",a:"Grade 10 (age 15)",s:"Economics"},
  {c:"What makes a poem feel like a poem?",a:"Grade 3 (age 8)",s:"Language Arts"}
];
function buildChips(){
  $("#chips").innerHTML=EXAMPLES.map((e,i)=>{
    const tag=e.st==="threshold"?`<span class="chip-tag">Threshold</span> `:"";
    return `<button class="chip" data-i="${i}">${tag}<span>${esc(e.c)}</span> <span class="age">· ${esc(e.a)}</span></button>`;
  }).join("");
  document.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{
    const e=EXAMPLES[+ch.dataset.i];
    $("#concept").value=e.c; $("#age").value=e.a; $("#subject").value=e.s;
    setStyle(e.st||"5e");
    if(e.st==="threshold") setMove(e.mv||"words");
    generate(e.c,e.a,e.s,"");
  });
}

/* ---------- wiring ---------- */
$("#genForm").addEventListener("submit",ev=>{ev.preventDefault();
  generate($("#concept").value,$("#age").value,$("#subject").value,$("#duration").value);});
$("#newBtn").onclick=()=>{ setView("teacher"); $("#activity").classList.add("hidden"); $("#newBtn").classList.add("hidden");
  $("#landing").classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"});};
$("#regenBtn").onclick=()=>{ if(lastInput){ setStyle(lastInput.style||"5e"); if(lastInput.move) setMove(lastInput.move); generate(lastInput.concept,lastInput.ageStr,lastInput.subject,lastInput.duration);} };
$("#printBtn").onclick=()=>window.print();
$("#adjustBtn").onclick=()=>{ if(!lastInput)return;
  const next=prompt("New age or grade (e.g. 'Grade 8' or 'age 7'):",lastInput.ageStr);
  if(next){ $("#age").value=next; setStyle(lastInput.style||"5e"); generate(lastInput.concept,next,lastInput.subject,lastInput.duration);} };

/* settings modal */
let provider="anthropic";
function openModal(){
  const cfg=store.k; provider=cfg?.provider||"anthropic";
  document.querySelectorAll("#providerSeg button").forEach(b=>b.classList.toggle("on",b.dataset.p===provider));
  $("#apiKey").value=cfg?.key||"";
  updKeyNote();
  $("#modalBg").classList.add("show");
}
function updKeyNote(){
  $("#keyNote").innerHTML= provider==="anthropic"
    ? "Uses Claude 3.5 Sonnet. Get a key at console.anthropic.com. Calls go directly from your browser to Anthropic."
    : "Uses GPT-4o mini. Get a key at platform.openai.com. Calls go directly from your browser to OpenAI.";
}
$("#settingsBtn").onclick=openModal;
$("#modalBg").onclick=e=>{ if(e.target.id==="modalBg") $("#modalBg").classList.remove("show"); };
document.querySelectorAll("#providerSeg button").forEach(b=>b.onclick=()=>{
  provider=b.dataset.p;
  document.querySelectorAll("#providerSeg button").forEach(x=>x.classList.toggle("on",x===b));
  updKeyNote();
});
$("#saveKey").onclick=()=>{
  const key=$("#apiKey").value.trim();
  if(!key){ store.k=null; } else { store.k={provider,key}; }
  refreshKeybar(); $("#modalBg").classList.remove("show");
  toast(key?"API key saved — full AI generation is on.":"Key cleared.");
};
$("#clearKey").onclick=()=>{ store.k=null; $("#apiKey").value=""; refreshKeybar();
  toast("Key removed. Back to library + template mode."); };

/* ---------- teacher / student view ---------- */
function applyView(){
  const st=activityView==="student";
  $("#activityBody").classList.toggle("hidden",st);
  $("#handoutBody").classList.toggle("hidden",!st);
  document.querySelectorAll("#viewSeg button").forEach(b=>b.classList.toggle("on",(b.dataset.view==="student")===st));
  const pb=$("#printBtn"); if(pb) pb.lastChild.textContent=st?"Print handout":"Print / PDF";
}
function setView(v){ activityView=(v==="student")?"student":"teacher"; applyView(); }
document.querySelectorAll("#viewSeg button").forEach(b=>b.onclick=()=>setView(b.dataset.view));

/* ---------- saved lessons ---------- */
function refreshLib(){
  const n=store.saved.length; const c=$("#libCount");
  if(c) c.textContent=n?`(${n})`:"";
}
function saveCurrent(){
  if(!lastActivity){ toast("Generate an activity first.",true); return; }
  const list=store.saved;
  const rec={id:Date.now()+"", savedAt:new Date().toISOString(), style:activityStyle, move:thresholdMove,
             input:lastInput?{concept:lastInput.concept,ageStr:lastInput.ageStr,subject:lastInput.subject,duration:lastInput.duration}:null,
             activity:lastActivity};
  list.unshift(rec);
  store.saved=list.slice(0,60);
  refreshLib(); toast("Saved. Open it any time from Saved in the header.");
}
function openLib(){
  const list=store.saved; const el=$("#libList");
  el.innerHTML=list.length?list.map(r=>{
    const mv=MOVES.find(m=>m.k===r.move);
    const badge=r.style==="threshold"?`Threshold · ${esc(mv?mv.label:r.move)}`:"5E Inquiry";
    const d=new Date(r.savedAt);
    return `<div class="lib-row"><div class="lib-i"><b>${esc(r.activity.activityTitle||"Untitled")}</b><span>${esc(r.activity.ageBand||"")} · ${badge}</span><span class="lib-d">${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span></div><div class="lib-a"><button class="btn" data-open="${r.id}">Open</button><button class="btn lib-del" data-del="${r.id}">Delete</button></div></div>`;
  }).join(""):`<p class="note-sm">Nothing saved yet. Generate an activity and press <b>Save</b>.</p>`;
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{
    const r=store.saved.find(x=>x.id===b.dataset.open); if(!r) return;
    setStyle(r.style||"5e"); if(r.style==="threshold") setMove(r.move||"words");
    if(r.input){ $("#concept").value=r.input.concept||""; $("#age").value=r.input.ageStr||""; $("#subject").value=r.input.subject||""; lastInput={...r.input,style:r.style,move:r.move}; }
    $("#libBg").classList.remove("show");
    renderActivity(r.activity);
  });
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{
    store.saved=store.saved.filter(x=>x.id!==b.dataset.del); refreshLib(); openLib();
  });
  $("#libBg").classList.add("show");
}
$("#saveBtn").onclick=saveCurrent;
$("#libBtn").onclick=openLib;
$("#libClose").onclick=()=>$("#libBg").classList.remove("show");
$("#libBg").onclick=e=>{ if(e.target.id==="libBg") $("#libBg").classList.remove("show"); };

/* init */
function setStyle(s){
  activityStyle=(s==="threshold")?"threshold":"5e";
  document.querySelectorAll("#styleSeg button").forEach(b=>b.classList.toggle("on",b.dataset.style===activityStyle));
  const n=$("#styleNote"); if(n) n.textContent=activityStyle==="threshold"?"Names the troublesome knowledge, then students construct meaning first — either inventing their own words or forming the rule. Engagement lives inside the construction; transfer comes in a later lesson.":"A driving question with a hands-on 5E investigation.";
  const ms=$("#moveSeg"); if(ms) ms.classList.toggle("hidden",activityStyle!=="threshold");
  const mn=$("#moveNote"); if(mn) mn.textContent=(activityStyle!=="threshold")?"":((MOVES.find(x=>x.k===thresholdMove)||MOVES[0]).note);
}
function buildMoves(){
  const ms=$("#moveSeg"); if(!ms) return;
  ms.innerHTML=MOVES.map(m=>`<button type="button" data-move="${m.k}"${m.k===thresholdMove?' class="on"':''}>${esc(m.label)}</button>`).join("");
  ms.querySelectorAll("button").forEach(b=>b.onclick=()=>setMove(b.dataset.move));
}
function setMove(m){
  const mv=MOVES.find(x=>x.k===m)||MOVES[0];
  thresholdMove=mv.k;
  document.querySelectorAll("#moveSeg button").forEach(b=>b.classList.toggle("on",b.dataset.move===thresholdMove));
  const mn=$("#moveNote"); if(mn) mn.textContent=mv.note;
  if(lastActivity&&activityStyle==="threshold") renderActivity(lastActivity);
}

document.querySelectorAll("#styleSeg button").forEach(b=>b.onclick=()=>setStyle(b.dataset.style));
buildMoves();
buildChips(); refreshKeybar(); setStyle("5e");
